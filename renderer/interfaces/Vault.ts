import { decrypt, encrypt } from "../utils/commons";
import { makeNewDEK } from "../utils/keyFunctions";
import { Entry } from "./Entry"
type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type VaultType = {
    filePath:string, 
    fileContents:Buffer
    isUnlocked:boolean,
    wrappedVK: Buffer,
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
    vaultMetadata: vaultMetaData
}

type vaultMetaData = {
    lastRotateDate: Date,   
    createDate: Date,
    lastEditDate:Date,
    version: string
}

export interface EntryGroup{
    groupName: string;
    entries: Array<String>
}


export interface Vault{
    filePath:string;
    isUnlocked:boolean;
    entries: Array<Entry>;
    vaultMetadata: vaultMetaData;
    entryGroups: Array<EntryGroup>;
}
