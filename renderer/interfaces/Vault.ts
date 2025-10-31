import { createUUID, decrypt, encrypt } from "../utils/commons";
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
    groupID: string;
    groupName: string;
    entries: Array<String>
}


export class Vault{
    filePath:string;
    fileContents:Buffer;
    isUnlocked:boolean;
    wrappedVK: Buffer;
    kek: KEKParts | undefined;
    entries: Array<Entry>;
    vaultMetadata: vaultMetaData;
    entryGroups: Array<EntryGroup>;

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
        if (!init.entryGroups){
            this.entryGroups = [];
        }
        if (!init.entries){
            this.entries = [];
        }
    }

    mutate(field:string, value:any, inPlace:boolean = false):Vault{
        
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
        if (!inPlace){
            newState.writeEntriesToFile();
        }
        return newState
    }

    addEntryToGroup(uuid:string,groupName: string, groupId:string | undefined ){
        // try and find entrygroup first, if not found then create
        if (groupId){
            const group = this.entryGroups.find((x)=>x.groupID === groupId);
            if (group){
                this.mutate("entryGroups",[...this.entryGroups.filter(x=>x.groupID !== groupId), {groupName, groupID: createUUID(), entries: [uuid]}])
            }else{
                console.warn("group not found, creating group");
                this.mutate("entryGroups",[...this.entryGroups, {groupName, groupID: createUUID(), entries: [uuid]}])
            }
        }else{
            // just add new entry group
            this.mutate("entryGroups", [...this.entryGroups,{groupName, groupID: createUUID(), entries: [uuid]}]);
        }
    }

    async commitKEK(){
        
        if (typeof window !== "undefined"){
            const VK = await makeNewDEK();
            const wrappedVK = Buffer.from(await window.crypto.subtle.wrapKey('raw', VK, this.kek.kek, {name:'AES-KW'}));
            const content = this.fileContents.subarray(56);
            const allContent = Buffer.concat([this.kek.salt,wrappedVK,content]);
            window.ipc.writeFile(this.filePath,allContent);
            return wrappedVK
        }else{
            throw new Error('window object was undefined')
        }
    }


    serialiseMetadata(){
        return  "MD"+this.vaultMetadata.version +"_"
            + this.vaultMetadata.createDate.toISOString()
            + this.vaultMetadata.lastEditDate.toISOString() 
            + this.vaultMetadata.lastRotateDate.toISOString()
        ;
    }

    deserialiseMetadata(content:string):vaultMetaData{
        const [version, datesString] = content.split("_");
        const [createDate, lastEditDate, lastRotateDate] = datesString.split("Z").map((x)=>new Date(x));
        return {
            version,
            createDate,
            lastEditDate,
            lastRotateDate
        }
    }


    serialiseGroups(){
        const content = this.entryGroups.map((group)=>{
            return group.groupID.toString() + "|" + group.groupName +"|"+ group.entries.join(",")
        }).join("_")+"_GROUPS"
        return "GROUPS_"+content
    }
    
    deserialiseGroups(content:string):Array<EntryGroup>{
        if (content.length === 14){
            return [];
        }
        const groups = content.substring(7).split("_");
        return groups.map((group)=>{
            const [groupID, groupName, entries] = group.split("|")
            console.log(groupID, groupName, entries);
            return {
                groupID,
                groupName, 
                entries: entries.split(",")
            }
        })
    }

    async vaultLevelEncrypt(){
        if (typeof window !=="undefined"){
            const VK = await window.crypto.subtle.unwrapKey(
                'raw', 
                Buffer.from(this.wrappedVK), 
                this.kek.kek,
                {name:"AES-KW"},
                {name:"AES-GCM"},
                false, 
                ['encrypt', 'decrypt']
            )
            const enc = Buffer.concat([
                    this.kek.salt,
                    this.wrappedVK,
                    Buffer.from(this.serialiseGroups()),
                    Buffer.from(await encrypt(Buffer.from(this.entries.map((x)=>x.serialise()).join("$")+this.serialiseMetadata()), VK)), // actual ciphertext
            ]);
            return enc
        }else{
            throw new Error("Window object was undefined")
        }
    }

    async writeEntriesToFile(){
        if (typeof window !=="undefined"){
            try {
                const content = Buffer.from(await this.vaultLevelEncrypt());    
                const result = await window.ipc.writeFile(this.filePath, content);
                return result === "OK" ? {content, status:result} : {content:undefined, status:result};
            } catch (error) {
                console.warn(error)
            }   
        }
        
    }

    async vaultLevelDecrypt(encryptedText:Buffer = undefined){
        
        if (typeof window !== "undefined"){
            const toDecrypt = encryptedText ? encryptedText : this.fileContents;
            const wrappedVK = toDecrypt.subarray(16,56);
            const vk = await window.crypto.subtle.unwrapKey(
                'raw',
                Buffer.from(wrappedVK),
                this.kek.kek,
                {name:"AES-KW"},
                {name:"AES-GCM", length:256}, 
                false, 
                ['encrypt', 'decrypt']
            );

            let idx = toDecrypt.findIndex((_,i)=>{
                // skip over the wrapped kek salt, vk and the first instance of GROUPS_ which delimits the starting of the groups string
                return (i > (56+7) && Buffer.from(toDecrypt.subarray(i, i+6)).toString('utf8') === "GROUPS");
            })
            let groups:Array<EntryGroup> = [{groupID:createUUID(), groupName:"default", entries:[]}];
            if (idx === -1){
                console.warn("groups not found in vault content, this may be a vault version mismatch, trying to auto-update to latest")
            }else{
                idx +=6;
                groups = this.deserialiseGroups(Buffer.from(toDecrypt.subarray(56, idx)).toString('utf8'));
            }
            const dataIdx = idx !== -1? idx : 56;
            const {data, status} = await decrypt(toDecrypt.subarray(dataIdx),vk);
            if (status === "OK"){
                const [decryptedItems, metadata] = data.toString().split("MD");
                let entries_raw = decryptedItems.split("$").filter(x=>x!=="");
                let vaultMetadata = undefined;
                if (metadata){
                    vaultMetadata = this.deserialiseMetadata(metadata);
                }
                
                const entries = entries_raw.map(
                    (x)=>Entry.deserialise(x)
                );

                const newState = new Vault({
                    ...this,
                    entries,
                    entryGroups: groups,
                    vaultMetadata:vaultMetadata? vaultMetadata : undefined
                });
                if (idx === -1){
                    const updateStatus = await newState.writeEntriesToFile();
                    if (updateStatus.status === "Error"){
                        console.error("Unable to update vault to latest version")
                    }else{
                        console.info("Auto-updated vault to new version")
                    }
                    
                }
                
                return  newState;
            }
            else{
                throw new Error("Soemthing went wrong when decrypting the vault, possible KEK mismatch")
            }
            
        }
        throw new Error("Window object was undefined")
    }

}
