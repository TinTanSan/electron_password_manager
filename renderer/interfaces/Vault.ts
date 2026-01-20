
import { Entry } from "./Entry"


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
