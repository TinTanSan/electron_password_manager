import EventEmitter from "events";
import * as argon2 from 'argon2';
import { ARGON_SALT_LENGTH, decrypt, encrypt} from "../crypto/commons";
import { preferenceStore } from "../helpers/store/preferencesStore";
import {   KEKParts, makeNewKEK } from "../crypto/keyFunctions";
import { openFile, openFileSync } from "../helpers/fsFunctions";
import { parsers } from "../helpers/serialisation/parsers";
import { serialisers } from "../helpers/serialisation/serialisers";
import { SyncService } from "./SyncService";
import {Entry, Vault} from "../interfaces/VaultServiceInterfaces";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";
import { EntryService } from "./EntryService";


class VaultService extends EventEmitter{
    vault:Vault | undefined = undefined;
    vaultInitialised: boolean = false;

    syncService:SyncService | undefined = undefined;
    entryService: EntryService;

    constructor(){
        super();
        this.entryService =  new EntryService();
        
    }

    private onEntryUpdate = (uuid: string) => {
        if (this.vault && this.vault.isUnlocked) {
            const now = new Date();
            this.entryService.getEntry(uuid).metadata.lastEditDate = now; 
            this.sync();
        }else{
            console.log('unable to call onEntryUpdate without a vault');
        }
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
        this.vaultInitialised = true;
    }

    async unlockVault(password:string){
        if (this.vault.fileContents.length === 0){
            throw new Error("Cannot unlock vault without any contents in the vault, are you sure you initialised it correctly?");
        }
        const idx = this.vault.fileContents.findIndex((charcode)=>charcode === 10) //10 is the newline character
        if (idx === -1){
            throw new Error("CRITICAL ERROR could not find end of argon hash string, unable to verify password");
        }
        const masterKeyBuffer = this.vault.fileContents.subarray(0,idx);
        const b64saltLength = (4 * Math.ceil( ARGON_SALT_LENGTH/3 ) );
        const argonHash = masterKeyBuffer.subarray(0, masterKeyBuffer.length-b64saltLength).toString();
        
        const salt = Buffer.from(masterKeyBuffer.subarray(-b64saltLength).toString(), 'base64')
        const results = await argon2.verify(argonHash, password);
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
        this.vault.kek = {passHash: argonHash, salt, kek}
        this.entryService.entries = this.vault.entries;
        this.entryService.setOnEntryUpdatedCallback(this.onEntryUpdate);
        this.vault.isUnlocked = true;
        return {
            entriesToDisplay : this.getPaginatedEntries(0),
            status: "OK"
        };
    }


    openVault(filePath:string){
        // prevent user from opening a vault when a vault is already open
        if (this.vault !== undefined && this.vault.isUnlocked){
            return "VAULT_ALREADY_OPEN"
        }
        this.syncService = new SyncService(filePath);
        try {
            const fileContents = openFileSync(filePath);
            this.setInitialVaultState(filePath, fileContents);
            return "OK";    
        } catch (error) {
            return "FILE_NOT_FOUND"
        }
    }

    closeVault(){
        console.log("vault closing")
        try{
            if (this.vault){
                if (this.vaultInitialised && this.vault.isUnlocked){
                    const content = this.serialiseVault();
                    this.vault.kek = {
                        kek: this.vault.kek.kek.fill(0),
                        passHash: "",
                        salt: this.vault.kek.salt.fill(0)
                    }
                    this.vault.isUnlocked = false;
                    this.syncService.stopSyncLoop(content);
                }else{
                    this.syncService.stopSyncLoop();
                    console.log('no vault to close')
                }
                this.vault = undefined;
                console.log('vault closing finalised')
            }
            else{
                console.log('vault not opened')
            }
            
        }catch(error){
            console.log("error occured whilst flushing sync buffer when locking the vault", error);
        }
    }
    private replaceDEKs(newKEK:KEKParts){
        this.vault.entries.keys().forEach((uuid)=>{
            const wrappedDEK = this.entryService.getEntry(uuid).dek;
            const decryptedDEK = decrypt(wrappedDEK.wrappedKey, this.vault.kek.kek, wrappedDEK.tag, wrappedDEK.iv);
            try{
                const {encrypted, iv, tag} = encrypt(decryptedDEK, newKEK.kek);
                // we want to update all the entries DEKs AND we don't want it to show up on the sync buffer yet.
                this.vault.entries.get(uuid).dek = {wrappedKey:encrypted, iv, tag}
            }finally{
                decryptedDEK.fill(0);
            }
        })
    }

    async setMasterPassword(password:string){
        const KEKParts = await makeNewKEK(password);
        
        // we add the serialisers.vault call to allow future updates to password without overwriting the other content
        let toWrite = Buffer.from("");
        const isFirstMasterPass = this.vault.fileContents.length === 0;
        if (this.vault.fileContents.length !== 0){
            // decrypt and re-encrypt with new KEK
            this.replaceDEKs(KEKParts);
        }
        if (isFirstMasterPass) this.vault.isUnlocked = true;
        toWrite = Buffer.from(KEKParts.passHash +KEKParts.salt.toString('base64')+"\n"+serialisers.vault(this.vault))
        this.vault.kek = KEKParts;
        this.vault.fileContents = toWrite;
        this.syncService.updateBuffer(toWrite, true);
    }


    addEntryToGroup(entryUUID:string, groupName:string){
        let entry = this.vault.entries.get(entryUUID);
        if(!entry){
            return "ENTRY_NOT_FOUND"
        }   
        if (entry.group === groupName){
            return "ENTRY_ALREADY_IN_SPECIFIED_GROUP"
        }
        if (entry.group){
            // the entry has a group so we have to first destroy that link
            let group = this.vault.entryGroups.findIndex(x=>x.groupName === entry.group);
            if (group >=0){
                this.vault.entryGroups[group].entries = this.vault.entryGroups[group].entries.filter(x=>x!==entry.metadata.uuid);
            }
            entry.group = "";
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
        this.updateEntry(entryUUID, 'group', groupName);
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
        this.updateEntry(entryUUID, 'group', '');
        this.updateVault('entryGroups', [...this.vault.entryGroups, group])
        return "OK"
    }


    searchGroups(query:string):Array<string>{
        return this.vault.entryGroups.filter((g)=>g.groupName.toLowerCase().includes(query.toLowerCase())).map(x=>x.groupName);
    }

    deleteGroup(groupName:string){
        let group  = this.vault.entryGroups.find(x=>x.groupName===groupName);
        group.entries.forEach((x)=>{
            this.vault.entries.get(x).group = "";
        })
        this.updateVault('entryGroups', this.vault.entryGroups.filter(x=>x.groupName!== groupName))
    }

    getGroup(groupName:string){
        return this.vault.entryGroups.find(x=>x.groupName===groupName);
    }

    getAllGroups(){
        return this.vault.entryGroups;
    }
    
    getPaginatedEntries(pageNumber:number){
        const pageLen = preferenceStore.get('entriesPerPage');
        return Array.from(this.entryService.entries.values()).slice(pageNumber*pageLen, pageNumber*pageLen + pageLen)
    }


    searchEntries(title:string, username:string, notes:string, page:number = 0){
        if (!title && !username && !notes) {
            if (page === 0) {
                console.warn("Please try not to call searchEntries without having any search params present, instead use getPaginatedEntries");
            }
            return {
                entries: this.getPaginatedEntries(page),
                numEntries: this.entryService.getNumEntries()
            };
        }
        const pageLen = preferenceStore.get('entriesPerPage');
        const searchResults = this.entryService.searchEntries(title, username, notes);
         const paginatedUUIDs = searchResults.entries.slice(page * pageLen, page * pageLen + pageLen);
        return paginatedUUIDs.map((uuid:string)=>this.entryService.getEntry(uuid))        
    }

    async getEntriesWithSamePass():Promise<Array<string>>{
        // early return 
        if (this.vault.entries.size === 0){
            return  []
        }
        // store previously encountered hashes in the map
        let encounteredPasswordHashes = new Map<string, string>();
        let collisions = new Set<string>();
        let entriesIterator = this.vault.entries.entries();
        let entryVal = entriesIterator.next();

        while (!entryVal.done){
            const [uuid, entry]:[string, Entry]=entryVal.value;
            const passHash = entry.passHash.toString('base64');
            if (encounteredPasswordHashes.has(passHash)){
                collisions.add(uuid);
                collisions.add(encounteredPasswordHashes.get(passHash));
            }else{
                encounteredPasswordHashes.set(passHash, uuid);
            }
            entryVal = entriesIterator.next();
        }
        return Array.from(collisions);
    }
    
    serialiseVault(){
        const fc = this.vault.fileContents;
        const idx = fc.findIndex(x=>x===10); //ascii 10 -> new line character
        if (idx ===-1){
            throw new Error('attempted to use serialise without having set Master password, please first use setMasterPassword to set the master password the first time')
        }
        const passwordComponents = this.vault.fileContents.subarray(0, idx).toString();
        return Buffer.from(passwordComponents + "\n"+  serialisers.vault(this.vault));
    }
    
    sync(){
        this.vault.vaultMetadata.lastEditDate = new Date();
        const content = this.serialiseVault();
        this.syncService.updateBuffer(content);
        this.vault.fileContents = content
    }
    async updateEntry<K extends keyof Entry>(uuid: string,fieldToUpdate:K, newValue:Entry[K]):Promise<IPCResponse<Entry>>{
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
        entry[fieldToUpdate] = newValue;
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

    async updateVault<K extends keyof Vault>(fieldToUpdate:K, newValue:Vault[K]){
        if (this.vault.isUnlocked){
            this.vault[fieldToUpdate] = newValue;
            this.vault.vaultMetadata.lastEditDate = new Date();
            this.sync();

        }else{
            /*
                set master password will write to the vault independently, and will not be using this method
            */
            throw new Error("Unlock vault to make changes to it")
        }
    }

    async removeEntry(uuid:string){
        const result = this.vault.entries.delete(uuid);
        this.sync()
        return result;
    }

}


export const vaultService = new VaultService();