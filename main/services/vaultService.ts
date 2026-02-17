import EventEmitter from "events";
import * as argon2 from 'argon2';
import { decrypt, encrypt, shaHash } from "../crypto/commons";
import { preferenceStore } from "../helpers/store/preferencesStore";
import {   makeNewKEK } from "../crypto/keyFunctions";
import {KEKParts} from '../crypto/keyFunctions';
import { openFile, writeToFile } from "../ipcHandlers/fileIPCHandlers";
import { parsers } from "../helpers/serialisation/parsers";
import { serialisers } from "../helpers/serialisation/serialisers";
import { createUUID } from "../crypto/commons";
import { randomBytes } from "crypto";
import { SyncService } from "./SyncService";
import {Entry, ExtraField, Vault} from "../interfaces/VaultServiceInterfaces";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";


class VaultService extends EventEmitter{
    vault:Vault | undefined = undefined;
    vaultInitialised: boolean = false;
    syncService:SyncService | undefined = undefined;
    searchResults: Array<string> = [];
    searchedTitle:string = "";
    searchedUsername:string = "";
    searchedNotes:string = "";
    constructor(){
        super();
        
    }

    setInitialVaultState(filePath:string, fileContents:Buffer){
        this.vault = {
            filePath ,
            fileContents ,
            isUnlocked: false,
            kek : undefined,
            entries: new Map(),
            vaultMetadata: {
                lastEditDate: new Date(),
                createDate: new Date(),
                version: '1.0.0'
            },
            entryGroups : []
        }   
        this.syncService = new SyncService(filePath);
        this.vaultInitialised = true;
    }

    async unlockVault(password:string){
        if (this.vault.fileContents.length === 0){
            throw new Error("Cannot unlock vault without any contents in the vault, are you sure you initialised it correctly?");
        }
        const idx = this.vault.fileContents.findIndex((charcode)=>charcode === 10) //124 is the vertical pipe symbol `|`
        if (idx === -1){
            throw new Error("CRITICAL ERROR could not find end of argon hash string, unable to verify password");
        }
        const b64saltLength = (4*Math.ceil(preferenceStore.get('saltLength')/3));
        const hash = Buffer.from(this.vault.fileContents.subarray(0,idx-b64saltLength)).toString();
        
        const salt = Buffer.from(this.vault.fileContents.subarray(idx-b64saltLength,idx).toString(),'base64')
        const results = await argon2.verify(hash, password,{
        });    
        // incorrect password
        if (results === false){
            return {
                entriesToDisplay: [],
                status: "INVALID_PASSWORD"
            };
        }
        const kek=  await argon2.hash(password, {
            timeCost: preferenceStore.get('timeCost'),
            parallelism: preferenceStore.get('parallelism'),
            memoryCost: preferenceStore.get('memoryCost'),
            hashLength: preferenceStore.get('hashLength'),
            salt,
            raw:true
        })
        
        this.vault = parsers.vault(this.vault.fileContents);

        this.vault.kek = {passHash: hash, salt, kek}
        return {
            entriesToDisplay : this.getPaginatedEntries(0),
            status: "OK"
        };
    }
    getNumEntries(){
        return this.vault.entries.size ?? -1;
    }

    openVault(filePath:string){
        const results = openFile(filePath);
        if (results.status === "OK"){
            this.setInitialVaultState(filePath, results.fileContents);
            this.vaultInitialised = results.fileContents.length > 0;
            return "OK";
        }else{
            console.error("could not find vault")
            return "VAULT_NOT_FOUND";
        }
    }

    async closeVault(){
        console.log("vault closing")
        
        this.lockVault().then((_)=>{
            this.vault = undefined;
            this.vaultInitialised = false;
        })
        
        console.log("vault closed");
    }

    async lockVault(){
        try{
            if (this.vaultInitialised){
                this.syncService.flushSyncBuffer().then((_)=>{
                    console.log("sync complete")
                    this.vault.kek = {
                        kek: Buffer.from(""),
                        passHash: "",
                        salt: Buffer.from("")
                    }
                    this.syncService.stopSyncLoop();
                })
            }else{
                console.log("no vault to close")
            }
        }catch(error){
            console.log("error occured whilst flushing sync buffer when locking the vault");
        }
    }
    
    async setMasterPassword(password:string){
        const KEKParts = await makeNewKEK(password);
        this.vault.kek = KEKParts;
    
        const toWrite = Buffer.concat([Buffer.from(KEKParts.passHash), Buffer.from(KEKParts.salt.toString('base64')),Buffer.from("\n"),Buffer.from(serialisers.vault(this.vault))]);
        const response = await this.syncService.forceUpdate(toWrite);
        return response === "OK";
    }


    addEntryToGroup(entryUUID:string, groupName:string){
        let entry = this.vault.entries.get(entryUUID);
        if (entry.group === groupName){
            return "ENTRY_ALREADY_IN_SPECIFIED_GROUP"
        }
        if(!entry){
            return "ENTRY_NOT_FOUND"
        }   

        if (entry.group){
            // the entry has a group so we have to first destroy that link
            let group = this.vault.entryGroups.findIndex(x=>x.groupName === entry.group);
            if (group < 0){
                entry.group = "";
            }else{
                this.vault.entryGroups[group].entries = this.vault.entryGroups[group].entries.filter(x=>x!==entry.metadata.uuid);
            }
        }
        // get index of new group
        let newGroupIdx = this.vault.entryGroups.findIndex(x=>x.groupName === groupName);
        if (newGroupIdx >= 0){
            // new group already exists
            if(this.vault.entryGroups[newGroupIdx].entries.findIndex(x=>x === entryUUID) >= 0) {
                // entry is already a member of the new group
                return 'ENTRY_ALREADY_IN_GROUP';
            }
            // new group exists, entry is not a member of said group, add it
            this.vault.entryGroups[newGroupIdx].entries.push(entryUUID);
        }else{
            // new group does not exist, create and add entry as it's field
                this.vault.entryGroups.push({
                    groupName,
                    entries:[entryUUID]
                })     
        }
        this.sync();
        return "OK"
    }

    removeEntryFromGroup(entryUUID:string){
        let entry = this.vault.entries.get(entryUUID);
        if (!entry) return "ENTRY_NOT_FOUND";
        
        if (!entry.group) return "ENTRY_NOT_IN_A_GROUP";
        
        let group = this.vault.entryGroups.find(x=>x.groupName===entry.group);
        
        if(!group) return "GROUP_NOT_FOUND"

        group.entries = group.entries.filter(x=>x!==entryUUID);
        entry.group = "";
        this.sync();
        return "OK"
    }


    searchGroups(query:string){
        let results = [];
        this.vault.entryGroups.forEach((group)=>{
            if (group.groupName.toLowerCase().includes(query.toLowerCase())){
                results.push(group);
            }
        })
        return results;
    }

    deleteGroup(groupName:string){
        let group  = this.vault.entryGroups.find(x=>x.groupName===groupName);
        group.entries.forEach((x)=>{
            this.vault.entries.get(x).group = "";
        })
        this.vault.entryGroups = this.vault.entryGroups.filter(x=>x.groupName!== groupName);
        this.sync();
    }

    getGroup(groupName:string){
        return this.vault.entryGroups.find(x=>x.groupName===groupName);
    }

    getAllGroups(){
        return this.vault.entryGroups;
    }


    async addEntry(entry:{title:string, username:string, password:Buffer, notes:string, extraFields:Array<ExtraField> , group:string}){
        let dek = randomBytes(32);
        let response = {
            status : "NOT FULFILLED",
            result: "Did not fulfill the task"
        }
        try{
            const {title, username, password, notes, extraFields, group} = entry;
            const encryptedPass = encrypt(password, dek);
            const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
            const  {iv, tag, encrypted} = encrypt(dek, this.vault.kek.kek);
            const uuid = createUUID();
            this.vault.entries.set(uuid,{
                title,
                username,
                passHash: shaHash(password.toString()),
                dek : {iv, tag, wrappedKey:encrypted},
                password: encBuffConcated,
                isFavourite: false,
                notes,
                extraFields,
                group,
                metadata:{
                    uuid,
                    createDate: new Date(),
                    lastRotateDate: new Date(),
                    lastEditDate: new Date(),
                    version: '1.0.0'
                }   
                
            })
            if(group){
                let gIdx = this.vault.entryGroups.findIndex(x=>x.groupName === group);
                if(gIdx === -1){
                    this.vault.entryGroups.push({groupName:group, entries:[uuid]});
                }else{
                    this.vault.entryGroups.at(gIdx).entries.push(uuid)
                }
            }
            this.sync();
            response =  {
                status:"OK",
                result: uuid};   
        }
        catch (error){
            console.error('An error occured whilst adding entry: ', error);
            response =  {
                status:"Err",
                result: error
            }
        }
        finally{
            dek.fill(0);
            dek = undefined;
            return response;
        }
    }

    addExtraField(entryUUID:string, extraField:ExtraField){
       
            const entry = this.vault.entries.get(entryUUID);
            if (entry){
                const wrappedDEK = entry.dek;
                let dek = decrypt(wrappedDEK.wrappedKey, this.vault.kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
                try{
                    let ef = entry.extraFields.find(x=>x.name === extraField.name);
                    if (ef) return "ALREADY_EXISTS";
                    if (extraField.isProtected){
                        // expect the extraField to be plaintext on first request and encrypt
                        
                        const encrypted = encrypt(extraField.data, dek);
                        ef.data = Buffer.concat([encrypted.encrypted, encrypted.iv, encrypted.tag])
                    }
                    entry.extraFields.push(ef);
                    return "OK";
                }finally{
                    dek.fill(0);
                    this.sync();
                }
            }
            return "ENTRY_NOT_FOUND"
       
    }

    decryptExtraField(entryUUID:string, extraFieldName:string, ef:ExtraField | undefined = undefined){
        let {status, extraField} = ef? {status:"INJECTED_PARAM_OK", extraField:ef} : this.getExtraFieldByName(entryUUID, extraFieldName);
        if(!extraField){
            return {status, data:""};
        }
        const entry = this.vault.entries.get(entryUUID);
        const wrappedDEK = entry.dek;
        let dek = decrypt(wrappedDEK.wrappedKey, this.vault.kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
        try{
            const encrypted= extraField.data.subarray(0,extraField.data.length-24);
            const iv= extraField.data.subarray(extraField.data.length-24,extraField.data.length-12);
            const tag= extraField.data.subarray(extraField.data.length-12,extraField.data.length);
            const response = decrypt(encrypted, dek, tag, iv);
            return {status:"OK", data:response};
        }catch(error:any){
            return {status:"ERROR", data:error}
        }
        finally{
            dek.fill(0);
        }
    }


    private getExtraFieldByName(entryUUID:string, extraFieldName:string):{status:string, extraField:ExtraField | undefined}{
        const entry = this.vault.entries.get(entryUUID);
        if(entry === undefined) return {status:"ENTRY_NOT_FOUND", extraField:undefined}
        let extraField = entry.extraFields.find(x=>x.name===extraFieldName);
        extraField ? { status: "OK", extraField } : { status: "EXTRA_FIELD_NOT_FOUND", extraField }
    }


    extraFieldChangeIsProtected(entryUUID:string, extraFieldName:string, protectedness:boolean){
        const entry = this.vault.entries.get(entryUUID);
        let {status, extraField} = this.getExtraFieldByName(entryUUID, extraFieldName);
        if(!extraField) return status;
        try {
            extraField.isProtected = protectedness;
            // if the user wants to protect the extraField and it is not already protected
            if(protectedness && !extraField.isProtected){
                const wrappedDEK = entry.dek;
                let dek = decrypt(wrappedDEK.wrappedKey, this.vault.kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
                try{
                        // expect the extraField to be plaintext on first request and encrypt
                        
                    const encrypted = encrypt(extraField.data, dek);
                    extraField.data = Buffer.concat([encrypted.encrypted, encrypted.iv, encrypted.tag])
                }finally{
                    dek.fill(0);
                    this.sync();
                }
            }
            // if the user wants to unprotect the extraField and it is protected
            else if (!protectedness && extraField.isProtected){
                extraField.isProtected = false;
                const {status, data} = this.decryptExtraField(entryUUID, extraFieldName, extraField);
                if(status === "OK"){
                    extraField.data = data;
                }
                this.sync()
                return status
            }
            else if (protectedness && extraField.isProtected){
                return "ALREADY_PROTECTED"
            }
            else{
                return "ALREADY_UNPROTECTED"
            }
        }catch (error) {
            return error;
        }

    }

    removeExtraField(entryUUID:string, extraFieldName:string){
        let entry = this.vault.entries.get(entryUUID);
        entry.extraFields = entry.extraFields.filter(x=>x.name !== extraFieldName);
        this.sync();
    }


    getPaginatedEntries(pageNumber:number){
        const pageLen = preferenceStore.get('entriesPerPage');
        return Array.from(this.vault.entries.values()).slice(pageNumber*pageLen, pageNumber*pageLen + pageLen)
    }

    getEntry(uuid:string){
        return this.vault.entries.get(uuid);
    }

    searchEntries(title:string, username:string, notes:string, page:number = 0){
        
        const pageLen = preferenceStore.get('entriesPerPage');
        // if no search filter, just return the first page of paginated entries;
        if (!title && !username && !notes && page === 0) {
            console.warn("Please try not to call searchEntries without having any search params present, instead use getPaginatedEntries");
            return {entries: this.getPaginatedEntries(0), numEntries: this.vault.entries.size }
        }
        // when the frontend wants the same searched results but a different page from pagination
        if (!title && !username && !notes && page >0){
            
            return {entries: this.searchResults.slice(page*pageLen, page*pageLen + pageLen).map((x)=>this.vault.entries.get(x)), numEntries: this.vault.entries.size}
        }
        // if we got the same exact params as the last search, serve the requested page of results 
        if(title === this.searchedTitle && username == this.searchedUsername && notes === this.searchedNotes){
            return {entries: this.searchResults.slice(page*pageLen, page*pageLen + pageLen).map((x)=>this.vault.entries.get(x)), numEntries: this.searchResults.length}
        }
        // new search query
        if (title) this.searchedTitle = title;
        if (username) this.searchedUsername= username;     
        if (notes) this.searchedNotes = notes;
            
        let filteredEntries = [];
        this.vault.entries.forEach((entry, uuid)=>{
            if(title && entry.title.toLowerCase().includes(title.toLowerCase())) filteredEntries.push(uuid)
            if(username && entry.username.toLowerCase().includes(username.toLowerCase())) filteredEntries.push(uuid)
            if(notes && entry.notes.toLowerCase().includes(notes.toLowerCase())) filteredEntries.push(uuid)
        })
        this.searchResults = filteredEntries;
        
        return {entries: this.searchResults.slice(page*pageLen,page*pageLen+ pageLen).map((x)=>this.vault.entries.get(x)), numEntries: filteredEntries.length}
    }
    
    serialiseVault(){
        const fc = this.vault.fileContents;
        const idx = fc.findIndex(x=>x===10); //ascii 10 -> new line character
        if (idx ===-1){
            throw new Error('attempted to use serialise without having set Master password, please first use setMasterPassword to set the master password the first time')
        }
        const passwordComponents = this.vault.fileContents.subarray(0, idx).toString()
        const toWrite = passwordComponents + "\n"+  serialisers.vault(this.vault);
        return Buffer.from(toWrite);
    }
    sync(){
        this.syncService.updateBuffer(this.serialiseVault());
    }
    
    async decryptPassword(uuid:string) {
        const entry = this.vault.entries.get(uuid);
        if(!entry){
            return "";
        }
        try{
            const dek = entry.dek;
            // if the entry's password is empty then we do not attempt to decrypt
            if (entry.password.length ===0 ){
                return "";
            }
            // 12 byte iv, do not change the 12, we'll only ever use 12
            const iv = entry.password.subarray(0,12);
            // 
            const tag = entry.password.subarray(12,28);
            const encryptedPass = entry.password.subarray(28);
            console.log()
            let unwrappedDEK = decrypt(dek.wrappedKey, this.vault.kek.kek, dek.tag, dek.iv);
            const password = decrypt(encryptedPass, unwrappedDEK, tag,iv);
            unwrappedDEK.fill(0);
            unwrappedDEK = undefined;
            
            return password.toString();
        }finally{

        }
    }
    private async updatePassword(uuid:string, newPass:string): Promise<IPCResponse<Entry>>{
        let entry = this.vault.entries.get(uuid);
        if (!entry){
            return {
                status:"CLIENT_ERROR",
                message:'Entry does not exist with uuid: '+uuid,
                response: undefined
            }
        }
        const wrappedDEK = entry.dek;
        let dek = decrypt(wrappedDEK.wrappedKey, this.vault.kek.kek, wrappedDEK.tag, wrappedDEK.iv);
        try{
            const encryptedPass = encrypt(Buffer.from(newPass), dek);
            const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
            entry.passHash = shaHash(newPass)
            entry.password = encBuffConcated;
            console.log(encBuffConcated);
            this.sync();
            return {
                status:"OK",
                message:"Password updated",
                response: entry
            }
        }catch(error){
             return {
                status:"INTERNAL_ERROR",
                message:error,
                response: undefined
            }
        }finally{
            dek.fill(0);
        }



    }

    async updateEntry(uuid: string,fieldToUpdate:string, newValue:string):Promise<IPCResponse<Entry>>{
        let entry = this.vault.entries.get(uuid);
        let isFieldInEntry = false;
        for(let field in entry){
            if (field === fieldToUpdate){
                isFieldInEntry = true;
                break;
            }
        }
        if (!isFieldInEntry){
            return {
                status: "CLIENT_ERROR",
                message:"field `"+fieldToUpdate+"` not found in entry",
                response: undefined
            };
        }
        if (fieldToUpdate === "password"){
            return await this.updatePassword(uuid, newValue);
        }else{
            entry[fieldToUpdate] = newValue;
        }
        
        const now = new Date();
        entry.metadata.lastEditDate = now;
        this.vault.vaultMetadata.lastEditDate = now;
        this.sync()
        return {
            status: "OK",
            message:"entry updated",
            response: entry
        };
    }
    /**
     * Use this function as an alternative to UpdateEntry when you don't know what has changed in an entry. Allows the caller to mutate the entry
     * given a uuid and an Entry object. This function will return ENTRY_NOT_FOUND if the entry does not exist as to prevent this functions usage as a 
     * addEntry alternative
     * @param uuid 
     * @param newState 
     * @returns string
     */
    async mutateEntry(uuid:string, newState:Entry){
        let entry = this.vault.entries.get(uuid);
        // explicitly dictate this this function is not to be used as an alternative to addEntry
        if (!entry){
            return "ENTRY_NOT_FOUND";
        }
        // ensure last edit date is correctly set
        newState.metadata.lastEditDate = new Date();
        this.vault.entries.set(uuid, newState);
        return "OK"
    }

    async removeEntry(uuid:string){
        const result = this.vault.entries.delete(uuid);
        this.sync()
        return result;
    }

}


export const vaultService = new VaultService();