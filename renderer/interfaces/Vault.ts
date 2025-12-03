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


export class Vault{
    filePath:string;
    isUnlocked:boolean;
    entries: Array<Entry>;
    vaultMetadata: vaultMetaData;
    entryGroups: Array<EntryGroup>;

    constructor(init:PartialWithRequired<Vault, "filePath" | "isUnlocked">){
        Object.assign(this, init);
        if (!init.vaultMetadata){
            this.vaultMetadata = {
                lastEditDate: new Date(),
                createDate: new Date(),
                lastRotateDate: new Date(),
                version: "0.1.0"
            }
        }
        if (!init.entryGroups){
            this.entryGroups = [];
        }
        if (!init.entries){
            this.entries = [];
        }
    }

    mutate(field:string, value:any, inPlace:boolean = false):Vault{
        throw new Error("Implement with calls to IPC main")
        const newState = new Vault({
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
        return newState
    }

    addEntryToGroup(uuid:string,groupName: string){
        throw new Error("Implement with calls to IPC main")
        if (groupName === ""){
            console.warn("will not create new group without a name");
            return;
        }        
        let existingGroupFound = false;
        const updatedGroups = this.entryGroups.map((group:EntryGroup)=>{
            const existingEntry = group.entries.findIndex((entryuuid)=>entryuuid === uuid);
            if (group.groupName === groupName){
                existingGroupFound = true;
                return existingEntry!==-1? group: { ...group,  entries: [...group.entries, uuid]}
            }
            return existingEntry !==-1 ? { ...group,  entries: group.entries.toSpliced(existingEntry,1)} : group;
        })
        const finalGroups = existingGroupFound ? updatedGroups : [...updatedGroups, { groupName, entries: [uuid] }];
        return this.mutate('entryGroups', finalGroups);
    }
    removeEntryFromGroup(uuid:string){
        throw new Error("Implement with calls to IPC main")
        const updatedGroups = this.entryGroups.map((group:EntryGroup)=>{
            const existingEntry = group.entries.findIndex((entryuuid) =>entryuuid===uuid);
            return existingEntry !==-1 ? { ...group,  entries: group.entries.toSpliced(existingEntry,1)} : group;
        })
        return this.mutate('entryGroups', updatedGroups);
    }

}
