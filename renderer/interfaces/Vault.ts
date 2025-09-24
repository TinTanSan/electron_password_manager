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


class Vault{
    filePath:string;
    fileContents:string;
    isUnlocked:boolean;
    wrappedVK: Buffer;
    kek: KEKParts | undefined;
    entries: Array<Entry>;
    vaultMetadata: vaultMetaData;
    entryGroups: Array<string>;

    constructor(init:PartialWithRequired<Vault, "filePath"| "fileContents" | "isUnlocked" | "wrappedVK">){
        Object.assign(this, init);
        if (!init.vaultMetadata){
            this.vaultMetadata = {
                lastEditDate: new Date(),
                createDate: new Date(),
                lastRotateDate: new Date(),
                version: "0.1.0"
            }
        }
    }

    mutate(field:string, value:any, inPlace:boolean = false){
        return new Vault({
            ...this, 
            [field] : value, 
            vaultMetadata:{
                ...this.vaultMetadata, 
                // inplace boolean will dictate whether we edit the last edit date or not
                lastEditDate: inPlace? 
                    this.vaultMetadata.lastEditDate
                    :
                    new Date()
                    
            }
        })
    }


    
    




}
