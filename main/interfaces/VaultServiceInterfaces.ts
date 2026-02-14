import { KEKParts } from "../crypto/keyFunctions";

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
    entries: Map<string,Entry>,
    entryGroups: Array<EntryGroup>
    
}