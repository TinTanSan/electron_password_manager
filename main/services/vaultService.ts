import EventEmitter from "events";
import * as argon2 from 'argon2';
import { decrypt, encrypt, shaHash } from "../crypto/commons";
import { preferenceStore } from "../helpers/store/preferencesStore";
import {  makeNewKEK } from "../crypto/keyFunctions";
import {KEKParts} from '../crypto/keyFunctions';
import { openFile, writeToFile } from "../ipcHandlers/fileIPCHandlers";
import { parsers } from "../helpers/serialisation/parsers";
import { serialisers } from "../helpers/serialisation/serialisers";
import { createUUID } from "../crypto/commons";
export interface EntryMetaData{
    createDate:Date,
    lastEditDate:Date,
    lastRotateDate:Date,
    uuid: string;
    version: string; 
} 
export interface ExtraField{
    isProtected: boolean,
    name: string,
    data: Buffer
}

export interface Entry {
    metadata : EntryMetaData;
    title    : string;
    username : string;
    password : Buffer;
    passHash : Buffer;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    isFavourite: boolean;
    extraFields: Array<ExtraField>;
    group: string;
}

export type vaultMetaData = {
    createDate: Date,
    lastEditDate:Date,
    version: string
}
export type EntryGroup = {
    groupName: string,
    entries: Array<string>
}


export interface Vault {
    vaultMetadata: vaultMetaData
    filePath:string, 
    fileContents:Buffer
    isUnlocked:boolean,
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
    entryGroups: Array<EntryGroup>
    
}


class VaultService extends EventEmitter{
    private vault:Vault | undefined = undefined;
    vaultInitialised = false;

    constructor(){
        super();

    }

    setInitialVaultState(filePath:string, fileContents:Buffer){
        this.vault = {
            filePath ,
            fileContents ,
            isUnlocked: false,
            kek : undefined,
            entries: [],
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
        const idx = this.vault.fileContents.findIndex((charcode)=>{
            return charcode === 124
        })
        if (idx === -1){
            throw new Error("CRITICAL ERROR could not find end of argon hash string, unable to verify password");
        }
        const hash = this.vault.fileContents.subarray(0,idx).toString();
        // incorrect password
        const results = await argon2.verify(hash, password);
        console.log(results)
        if (results === false){
            return {
                entriesToDisplay: [],
                status: "INVALID_PASSWORD"
            };
        }
        const saltLength = preferenceStore.get('saltLength');
        const salt = this.vault.fileContents.subarray(idx, idx+saltLength);
        const kek=  await argon2.hash(password, {
            timeCost: preferenceStore.get('timeCost'),
            parallelism: preferenceStore.get('parallelism'),
            memoryCost: preferenceStore.get('memoryCost'),
            hashLength: 32,
            salt: salt,
            raw:true
        })
        this.vault.kek ={ passHash: hash, salt, kek}
        this.vault = parsers.vault(this.vault.fileContents);
        this.vault.entries.sort((a,b)=>{
            if (a.metadata.uuid < b.metadata.uuid) {
                return -1;
            }
            if (a.metadata.uuid > b.metadata.uuid) {
                return 1;
            }
            return 0;
        })
        return {
            entriesToDisplay : this.getPaginatedEntries(1),
            status: "OK"
        };
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

    closeVault(){
        this.vault = undefined; 
        this.vaultInitialised = false;
    }

    lockVault(){
        this.vault.kek = undefined;
        this.vault.isUnlocked = false;
    }
    async setMasterPassword(password){
        const KEKParts = await makeNewKEK(password);
        
        this.vault.kek = KEKParts;
        const toWrite = Buffer.concat([Buffer.from(KEKParts.passHash), KEKParts.salt,Buffer.from(serialisers.vault(this.vault))]);
        const response = writeToFile({filePath: this.vault.filePath, toWrite});
        if (response === "OK"){
            this.vault.fileContents = Buffer.from(toWrite);
            return {
                entriesToDisplay : this.getPaginatedEntries(1),
                status: "OK"
            };
        }else{
            return {entriesToDisplay: [], status:"ERROR_ON_WRITE"}
        }
    }


    addEntry(title:string, username:string, password:string, notes:string = '', extraFields:Array<ExtraField> = [] ){
        const encryptedPass = encrypt(Buffer.from(password), this.vault.kek.kek);
        const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
        this.vault.entries.push({
            title,
            username,
            passHash: shaHash(password),
            password: encBuffConcated,
            isFavourite: false,
            notes,
            extraFields,
            group: '',
            metadata:{
                uuid: createUUID(),
                createDate: new Date(),
                lastRotateDate: new Date(),
                lastEditDate: new Date(),
                version: '1.0.0'
            }   
            
        })
        
        this.syncToFile();
    }

    getPaginatedEntries(pageNumber:number){
        const pageLen = preferenceStore.get('entriesPerPage');
        const paginatedEntries = this.vault.entries.slice(pageNumber*pageLen, pageNumber*pageLen + pageLen);
        return{
            paginatedEntries
        }
    }

    searchEntries(title:string, username:string, notes:string){
        return this.vault.entries.filter((x)=>{

        })
    }

    async syncToFile(filePath?:string){
        // if the filepath is given, we use that instead, otherwise default to the one provided by vault
        const fp = filePath? filePath:  this.vault.filePath;
        return writeToFile({filePath:fp, toWrite: serialisers.vault(this.vault)});
    }




    async updateEntry(uuid: string,fieldToUpdate:string, newValue:string){
        let entryIdx = this.vault.entries.findIndex(x=>x.metadata.uuid === uuid);
        let entry = this.vault.entries[entryIdx];
        let isFieldInEntry = false;
        for(let field in entry){
            if (field === fieldToUpdate){
                isFieldInEntry = true;
                break;
            }
        }
        if (!isFieldInEntry){
            return false;
        }
        entry[fieldToUpdate] = newValue;
        entry.metadata.lastEditDate = new Date();
        this.vault.vaultMetadata.lastEditDate = new Date();
        this.syncToFile()
        return true;
    }
}


export const vaultService = new VaultService();