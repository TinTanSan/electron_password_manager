import EventEmitter from "events";
import {validateKEK} from '../helpers/crypto/keyFunctions';
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
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
    vaultMetadata: vaultMetaData
}


class VaultService extends EventEmitter{
    private vault:Vault | undefined = undefined;
    private vaultInitialised = false;

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

    unlockVault(password:string,){
        const salt = this.vault.fileContents.subarray(0,16);
        const hash = this.vault.fileContents.subarray(16,32)

        // validateKEK(this.vault.fileContents, password);

    }




    closeVault(){
        this.vault = undefined; 
        this.vaultInitialised = false;
    }

    getPaginatedEntries(pageNumber:number, pageLen:number){
        const paginatedEntries = this.vault.entries.slice(pageNumber*pageLen, pageNumber*pageLen + pageLen);
        return{
            paginatedEntries,
        }
    }
    searchEntries(title:string, username:string, notes:string){
        return this.vault.entries.filter((x)=>{

        })
    }
}


export const vaultService = new VaultService();