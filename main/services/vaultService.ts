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
import assert from "assert";
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
export interface DataEncryptionKey{
    wrappedKey: Buffer;
    iv: Buffer;
    tag: Buffer;


}
export interface Entry {
    metadata : EntryMetaData;
    title    : string;
    username : string;
    dek: DataEncryptionKey;
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
    vaultMetadata: vaultMetaData,
    filePath:string, 
    fileContents:Buffer
    isUnlocked:boolean,
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
    entryGroups: Array<EntryGroup>
    
}


class VaultService extends EventEmitter{
    vault:Vault | undefined = undefined;
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
        if (this.vault.fileContents.length === 0){
            throw   new Error("Cannot unlock vault without any contents in the vault, are you sure you initialised it correctly?");
        }
        const idx = this.vault.fileContents.findIndex((charcode)=>charcode === 10) //124 is the vertical pipe symbol `|`
        if (idx === -1){
            throw new Error("CRITICAL ERROR could not find end of argon hash string, unable to verify password");
        }
        const b64saltLength = (4*Math.ceil(preferenceStore.get('saltLength')/3));
        const hash = Buffer.from(this.vault.fileContents.subarray(0,idx-b64saltLength)).toString();
        // incorrect password
        const salt = Buffer.from(hash.substring(hash.length-b64saltLength),'base64')
        const results = await argon2.verify(hash, password,{
        });    
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
            entriesToDisplay : this.getPaginatedEntries(0),
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
        const toWrite = Buffer.concat([Buffer.from(KEKParts.passHash), Buffer.from(KEKParts.salt.toString('base64')),Buffer.from("\n"),Buffer.from(serialisers.vault(this.vault))]);
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


    async addEntry(title:string, username:string, password:string, notes:string = '', extraFields:Array<ExtraField> = [] ){
        let dek = randomBytes(32);
        try{
        const encryptedPass = encrypt(Buffer.from(password), dek);
        const encBuffConcated = Buffer.concat([encryptedPass.iv, encryptedPass.tag, encryptedPass.encrypted]);
        const  {iv, tag, encrypted} = encrypt(dek, this.vault.kek.kek);
        this.vault.entries.push({
            title,
            username,
            passHash: shaHash(password),
            dek : {iv, tag, wrappedKey:encrypted},
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
        }finally{
            dek.fill(0);
            dek = undefined;
        }
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
        const fc = this.vault.fileContents;
        const idx = fc.findIndex(x=>x===10);
        if (idx ===-1){
            throw new Error('attempted to use syncToFile without having set Master password, please first use setMasterPassword to set the master password the first time')
        }
        const passwordComponents = this.vault.fileContents.subarray(0, idx).toString()
        const toWrite = passwordComponents + "\n"+  serialisers.vault(this.vault);
        this.vault.fileContents = Buffer.from(toWrite);
        return writeToFile({filePath:fp, toWrite});
    }
    
    async decryptPassword(uuid:string) {
        const entry = this.vault.entries.find(entry=>entry.metadata.uuid === uuid);
        try{
            const dek = entry.dek;
            // if the entry's password is empty then we do not attempt to decrypt
            if (entry.password.length ===0 ){
                return "";
            }
            const iv = entry.password.subarray(0,12);
            const tag = entry.password.subarray(12,28);
            const encryptedPass = entry.password.subarray(-28);

            let unwrappedDEK = decrypt(dek.wrappedKey, this.vault.kek.kek, dek.tag, dek.iv);
            
            const password = decrypt(encryptedPass, unwrappedDEK, tag,iv);
            unwrappedDEK.fill(0);
            unwrappedDEK = undefined;
            return password;
        }finally{

        }
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