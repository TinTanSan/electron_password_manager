import { createUUID, encrypt } from "../utils/commons";
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

interface EntryGroup{
    groupID: string;
    groupName: string;
    entries: Array<String>
}


class Vault{
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
    }

    mutate(field:string, value:any, inPlace:boolean = false):Vault{
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
    // remove the first line, which contains important content retaining to the KEK
        const content = this.fileContents.subarray(48);
        if (typeof window !== "undefined"){
            const VK = await makeNewDEK();
            const wrappedVK = Buffer.from(await window.crypto.subtle.wrapKey('raw', VK, this.kek.kek, {name:'AES-KW'}));
            const allContent = Buffer.concat([this.kek.salt,wrappedVK,content]);
            window.ipc.writeFile(this.filePath,allContent);
            return wrappedVK
        }else{
            throw new Error('window object was undefined')
        }
    }


    serialiseMetadata(){
        return  "|"+this.vaultMetadata.version +"_" +
            + this.vaultMetadata.createDate.toISOString()
            + this.vaultMetadata.lastEditDate.toISOString() 
            + this.vaultMetadata.lastRotateDate.toISOString()
        +"|";
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
                    //the extra "$" is to ensure that we wrap the end by a $ so that even if there is only 1 entry, there will be at least one $ symbol
                    Buffer.from(await encrypt(Buffer.from(this.entries.map((x)=>x.serialise()).join("$") + "$"+this.serialiseMetadata()), VK)), // actual ciphertext
            ]);
            return enc
        }
    }

    async writeEntriesToFile(){
        if (typeof window !=="undefined"){
            const content = Buffer.from(await this.vaultLevelEncrypt());
            const result = await window.ipc.writeFile(this.filePath, content);
            return result === "OK" ? {content, status:result} : {content:undefined, status:result};
        }
        
    }

    async vaultLevelDecrypt(){
        
        if (typeof window !== "undefined"){
            const wrappedVK = this.fileContents.subarray(16,56);
            const iv = this.fileContents.subarray(this.fileContents.length-12);
            const vk = await window.crypto.subtle.unwrapKey(
                'raw',
                Buffer.from(wrappedVK),
                this.kek.kek,
                {name:"AES-KW"},
                {name:"AES-GCM", length:256}, 
                false, 
                ['encrypt', 'decrypt']
            );
            const encContents = Buffer.from(this.fileContents.subarray(56,this.fileContents.length-12));
            const decryptedItems = Buffer.from(await window.crypto.subtle.decrypt({name:"AES-GCM", iv:Buffer.from(iv)},vk, encContents));
            let entries_raw = [];
            let curEntry = [];
            for (let i = 0; i<decryptedItems.length; i++){
                // 0x24 is the '$' symbol
                if(decryptedItems[i] !== 0x24){
                    curEntry.push(decryptedItems[i]);
                }else{
                    entries_raw.push(curEntry);
                    curEntry = [];
                }
            }
            const entries = entries_raw.map((x)=>Entry.deserialise(x));
             
            this.mutate('entries',entries, true);
        }
        throw new Error("Window object was undefined")
    }

}
