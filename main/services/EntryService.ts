import { createUUID, decrypt, encrypt, shaHash } from "@main/crypto/commons";
import { KEKParts } from "@main/crypto/keyFunctions";
import { EntryUpdateCallback } from "@main/interfaces/EntryServiceInterfaces";
import { IPCResponse } from "@main/interfaces/IPCCHannelInterface";
import { Entry, ExtraField, RendererSafeEntry } from "@main/interfaces/VaultServiceInterfaces";
import { randomBytes } from "crypto";
import { EventEmitter } from "events";

export class EntryService extends EventEmitter{
    entries:Map<string, Entry>;
    vaultUnlocked:boolean = false;
    // memoised search results
    searchResults: Array<string> = [];
    searchedTitle:string = "";
    searchedUsername:string = "";
    searchedNotes:string = "";
    private onEntryUpdated: EntryUpdateCallback | null = null;

    constructor(entriesMap:Map<string, Entry> = new Map([])){
        super();
        this.entries = entriesMap;
    }

    setOnEntryUpdatedCallback(callback: EntryUpdateCallback) {
        this.onEntryUpdated = callback;
    }
    private notifyUpdate(uuid: string) {
        if (this.onEntryUpdated) {
            this.onEntryUpdated(uuid);
        }
    }

    getNumEntries(){
        return this.entries.size;
    }

    updateEntry<K extends keyof Entry>(uuid:string, fieldToUpdate:K, newVal: Entry[K]){
        let entry = this.entries.get(uuid);
        if (!entry){
            return false;
        }
        entry[fieldToUpdate] = newVal;
        const now = new Date();
        entry.metadata.lastEditDate = now;
        this.notifyUpdate(uuid);
        return true;
    }

    searchEntries(title:string, username:string, notes:string){
        // if we got the same exact params as the last search, serve the requested page of results 
        if(title === this.searchedTitle && username == this.searchedUsername && notes === this.searchedNotes){
            return {entries: this.searchResults, numEntries: this.searchResults.length}
        }
        // new search query
        if (title) this.searchedTitle = title;
        if (username) this.searchedUsername= username;      
        if (notes) this.searchedNotes = notes;
            
        let filteredEntries = [];
        this.entries.forEach((entry, uuid)=>{
            if(title && entry.title.toLowerCase().includes(title.toLowerCase())) filteredEntries.push(uuid)
            if(username && entry.username.toLowerCase().includes(username.toLowerCase())) filteredEntries.push(uuid)
            if(notes && entry.notes.toLowerCase().includes(notes.toLowerCase())) filteredEntries.push(uuid)
        })
        this.searchResults = filteredEntries;
        
        return {entries: filteredEntries, numEntries: filteredEntries.length}
    }

    getEntry(uuid:string): Entry | undefined{
        return this.entries.get(uuid)
    }

    async addEntry(entry:{title:string, username:string, password:Buffer, notes:string, extraFields:Array<ExtraField> , group:string}, kek:KEKParts){
        let dek = randomBytes(32);
        let response = {
            status : "NOT FULFILLED",
            result: "Did not fulfill the task"
        }
        try{
            const {title, username, password, notes, extraFields, group} = entry;
            const encryptedPass = encrypt(password, dek);
            const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
            const  {iv, tag, encrypted} = encrypt(dek, kek.kek);
            const uuid = createUUID();
            this.entries.set(uuid,{
                title,
                username,
                passHash: shaHash(password.toString()),
                dek : {iv, tag, wrappedKey:encrypted},
                password: encBuffConcated,
                isFavourite: false,
                notes,
                extraFields: [],
                group,
                metadata:{
                    uuid,
                    createDate: new Date(),
                    lastRotateDate: new Date(),
                    lastEditDate: new Date(),
                    version: '1.0.0'
                }   
                
            })
            // TODO
            // if(group){
            //     let gIdx = this.vault.entryGroups.findIndex(x=>x.groupName === group);
            //     if(gIdx === -1){
            //         this.vault.entryGroups.push({groupName:group, entries:[uuid]});
            //     }else{
            //         this.vault.entryGroups.at(gIdx).entries.push(uuid)
            //     }
            // }
            
            this.addExtraFields(uuid, extraFields, kek);
            // calling update vault actually adds complexity here as we would need to create a new map
            this.notifyUpdate(uuid);
            response =  {
                status:"OK",
                result: uuid
            };   
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


    
    addExtraField(entryUUID:string, extraField:ExtraField, kek:KEKParts){
            const entry = this.entries.get(entryUUID);
            if (entry){
                const wrappedDEK = entry.dek;
                let dek = decrypt(wrappedDEK.wrappedKey, kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
                try{
                    let ef = entry.extraFields.find(x=>x.name === extraField.name);
                    if (ef) return "ALREADY_EXISTS";
                    extraField.data = Buffer.from(extraField.data)
                    if (extraField.isProtected){
                        // expect the extraField to be plaintext on first request and encrypt
                        
                        const encrypted = encrypt(extraField.data, dek);
                        extraField.data = Buffer.concat([encrypted.encrypted, encrypted.iv, encrypted.tag])
                    }
                    entry.extraFields.push(extraField);
                    this.notifyUpdate(entryUUID);
                    return "OK";
                }finally{
                    dek.fill(0);
                    
                }
            }
            return "ENTRY_NOT_FOUND"
        
    }

    addExtraFields(entryUUID:string, extraFields:Array<ExtraField>, kek:KEKParts){
        let entry = this.entries.get(entryUUID);
        if (entry){
            const wrappedDEK = entry.dek;
            let dek = decrypt(wrappedDEK.wrappedKey, kek.kek, wrappedDEK.tag, wrappedDEK.iv);
            try {
                let retVal = "OK";
                
                
                extraFields.forEach((extraField)=>{
                    // only add new extrafield if we can't already find it
                    if (entry.extraFields.findIndex(x=>x.name===extraField.name)  ===-1){
                        extraField.data = Buffer.from(extraField.data)
                        if (extraField.isProtected){
                            // expect the extraField to be plaintext on first request and encrypt
                            const encrypted = encrypt(extraField.data, dek);
                            extraField.data = Buffer.concat([encrypted.encrypted, encrypted.iv, encrypted.tag])
                        }
                        entry.extraFields.push(extraField);
                    }else{
                        retVal= "EF_ALREADY_EXISTS";
                    }
                })
                return retVal;    
            } catch (error) {
                return error;
            }finally{
                dek.fill(0);
            }
            
        }
        return "ENTRY_NOT_FOUND";
    }

    decryptExtraField(entryUUID:string, extraFieldName:string, kek:KEKParts){
        if (!this.entries.has(entryUUID))return {status:"ENT_NOT_FOUND", data:""};

        let extraField =this.getExtraFieldByName(entryUUID, extraFieldName);
        if(!extraField){
            return {status:"EF_NOT_FOUND", data:""};
        }
        const entry = this.entries.get(entryUUID);
        const wrappedDEK = entry.dek;
        let dek = decrypt(wrappedDEK.wrappedKey, kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
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


    private getExtraFieldByName(entryUUID:string, extraFieldName:string):ExtraField{
        const entry = this.entries.get(entryUUID);
        let extraField = entry.extraFields.find(x=>x.name===extraFieldName);
        return extraField;
    }


    extraFieldChangeIsProtected(entryUUID:string, extraFieldName:string, protectedness:boolean, kek:KEKParts){
        const entry = this.entries.get(entryUUID);
        let extraField= this.getExtraFieldByName(entryUUID, extraFieldName);
        if(!extraField) return status;
        try {
            extraField.isProtected = protectedness;
            // if the user wants to protect the extraField and it is not already protected
            if(protectedness && !extraField.isProtected){
                const wrappedDEK = entry.dek;
                let dek = decrypt(wrappedDEK.wrappedKey, kek.kek, wrappedDEK.tag, wrappedDEK.iv);    
                try{
                        // expect the extraField to be plaintext on first request and encrypt
                        
                    const encrypted = encrypt(extraField.data, dek);
                    extraField.data = Buffer.concat([encrypted.encrypted, encrypted.iv, encrypted.tag])
                }finally{
                    dek.fill(0);
                    this.notifyUpdate(entryUUID);
                }
            }
            // if the user wants to unprotect the extraField and it is protected
            else if (!protectedness && extraField.isProtected){
                extraField.isProtected = false;
                const {status, data} = this.decryptExtraField(entryUUID, extraFieldName, kek);
                if(status === "OK"){
                    extraField.data = data;
                }
                this.notifyUpdate(entryUUID);
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
        let entry = this.entries.get(entryUUID);
        entry.extraFields = entry.extraFields.filter(x=>x.name !== extraFieldName);
        this.notifyUpdate(entryUUID);
    }


        /**
     * Use this function as an alternative to UpdateEntry when you don't know what has changed in an entry. Allows the caller to mutate the entry
     * given a uuid and an Entry object. This function will return ENTRY_NOT_FOUND if the entry does not exist as to prevent this functions usage as a 
     * addEntry alternative
     * @param uuid 
     * @param newState 
     * @returns string
     */
    async mutateEntry(uuid:string, newState:RendererSafeEntry){
        let entry = this.entries.get(uuid);
        // explicitly dictate this this function is not to be used as an alternative to addEntry
        if (!entry){
            undefined;
        }
        // ensure last edit date is correctly set
        entry = {...newState, password: Buffer.from(newState.password), dek:{...entry.dek},}
        this.entries.set(uuid, entry);
        this.notifyUpdate(uuid);
        return  entry
    }

    private async updatePassword(uuid:string, newPass:string, kek:KEKParts){
        let entry = this.entries.get(uuid);
        if (!entry){
            return {
                status:"CLIENT_ERROR",
                message:'Entry does not exist with uuid: '+uuid,
                response: undefined
            }
        }
        const wrappedDEK = entry.dek;
        let dek = decrypt(wrappedDEK.wrappedKey, kek.kek, wrappedDEK.tag, wrappedDEK.iv);
        try{
            const encryptedPass = encrypt(Buffer.from(newPass), dek);
            const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
            this.updateEntry(uuid, 'password', encBuffConcated);
            this.notifyUpdate(uuid);
            return entry;
        }catch (error){
            throw new Error(error);
        }finally{
            dek.fill(0);
        }
    }
}