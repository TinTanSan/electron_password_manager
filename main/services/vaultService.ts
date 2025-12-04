import EventEmitter from "events";
import * as argon2 from 'argon2';
import { encrypt } from "../crypto/commons";
import ElectronStore from 'electron-store';
import { preferenceStore } from "../helpers/store/preferencesStore";
import {  makeNewKEK } from "../crypto/keyFunctions";
import { openFile, writeToFile } from "../ipcHandlers/fileIPCHandlers";
import { ipcMain } from "electron";
interface EntryMetaData{
    createDate:Date,
    lastEditedDate:Date,
    lastRotate:Date,
    uuid: string;
    version: string; 
} 
export interface ExtraField{
    isProtected: boolean,
    name: string,
    data: Buffer
}

interface Entry {
    dek: Buffer;
    title    : string;
    username : string;
    password : Buffer;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    isFavourite: boolean;
    metadata : EntryMetaData;
    extraFields: Array<ExtraField>;
    group: string;
}

type vaultMetaData = {
    lastRotateDate: Date,
    createDate: Date,
    lastEditDate:Date,
    version: string
}


interface Vault {
    filePath:string, 
    fileContents:Buffer
    isUnlocked:boolean,
    wrappedVK: Buffer,
    kek:Buffer | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
    vaultMetadata: vaultMetaData
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
            wrappedVK: Buffer.from(""),
            entries: [],
            vaultMetadata: {
                lastRotateDate: new Date(),
                lastEditDate: new Date(),
                createDate: new Date(),
                version: '0.1.0'
            }
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
        const hash = this.vault.fileContents.subarray(0,idx);
        console.log("got hash: ",hash.toString())
        // incorrect password
        const results = await argon2.verify(hash.toString(), password);
        console.log(results)
        if (results === false){
            return {
                entriesToDisplay: [],
                status: "INVALID_PASSWORD"
            };
        }
        const saltLength = preferenceStore.get('saltLength');
        const salt = this.vault.fileContents.subarray(idx, idx+saltLength);
        
        this.vault.kek = await argon2.hash(password, {
            timeCost: preferenceStore.get('timeCost'),
            parallelism: preferenceStore.get('parallelism'),
            memoryCost: preferenceStore.get('memoryCost'),
            hashLength: 32,
            salt: salt,
            raw:true
        });

        this.deserialiseEntries();

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
        const [passHash,kek, salt] = await makeNewKEK(password);
        
        this.vault.kek = kek;
        const toWrite = Buffer.from(passHash+"|"+salt);
        const response = writeToFile({filePath: this.vault.filePath, toWrite});
        if (response === "OK"){
            this.vault.fileContents = toWrite;
            this.deserialiseEntries();

            return {
                entriesToDisplay : this.getPaginatedEntries(1),
                status: "OK"
            };
        }else{
            return {entriesToDisplay: [], status:"ERROR_ON_WRITE"}
        }
    }


    addEntry(title:string, username:string, password:string, notes:string, extraFields:Array<ExtraField> ){
        const encryptedPass = encrypt(Buffer.from(password), this.vault.kek);

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

    private deserialiseEntries(){

    }
}


export const vaultService = new VaultService();