// this file contains functions to do with vault to file transitions i.e. opening a file and converting
// to a vault, type and handling splitting of file contents into entries etc. and vice versa
import { VaultType } from "../contexts/vaultContext";
import { Entry, ExtraField } from "../interfaces/Entry";
import { makeNewDEK } from "./keyFunctions";

// this function is to do with commiting a KEK whenever the master password changes, it will commit a salt,
// and a sanity check value to the first line of the vault file
export async function commitKEK(filePath:string,fileContents:Buffer,kek:KEKParts){
    // remove the first line, which contains important content retaining to the KEK
    const content = fileContents.subarray(48);
    if (typeof window !== "undefined"){
        const VK = await makeNewDEK()
        const wrappedVK = Buffer.from(await window.crypto.subtle.wrapKey('raw', VK, kek.kek, {name:'AES-KW'}));
        const allContent = Buffer.concat([kek.salt,wrappedVK,content]);
        window.ipc.writeFile(filePath,allContent);
        return wrappedVK
    }else{
        throw new Error('window object was undefined')
    }
}

export async function vaultLevelEncrypt({entries, wrappedVK, kek}:VaultType){
    if (typeof window !=="undefined"){
        const crypto = window.crypto.subtle;
        const VK = await crypto.unwrapKey(
            'raw', 
            Buffer.from(wrappedVK), 
            kek.kek,
            {name:"AES-KW"},
            {name:"AES-GCM"},
            false, 
            ['encrypt', 'decrypt']
        )
        const iv = new Uint8Array(12);
        
        window.crypto.getRandomValues(iv);
        //the extra "$" is to ensure that we wrap the end by a $ so that even if there is only 1 entry, 
        // there will be at least one $ symbol
        const content = entries.map((x)=>x.serialise()).join("$") + "$"; 
        
        const enc = Buffer.concat([
                kek.salt,
                wrappedVK,
                Buffer.from(await crypto.encrypt({name:"AES-GCM", iv: Buffer.from(iv)},  VK,  Buffer.from(content))), // actual ciphertext
                iv //  associated iv
        ]);
        return enc
    }
}

export async function writeEntriesToFile(vault:VaultType){
    if (typeof window !=="undefined"){
        const content = Buffer.from(await vaultLevelEncrypt(vault));
        const result = await window.ipc.writeFile(vault.filePath, content);
        return result === "OK" ? {content, status:result} : {content:undefined, status:result};
    }
    
}

export async function vaultLevelDecrypt(fileContents:Buffer, {kek}:KEKParts){
    
    if (typeof window !== "undefined"){
        const wrappedVK = fileContents.subarray(16,56);
        const iv = fileContents.subarray(fileContents.length-12);
        const vk = await window.crypto.subtle.unwrapKey(
            'raw',
            Buffer.from(wrappedVK),
            kek,
            {name:"AES-KW"},
            {name:"AES-GCM", length:256}, 
            false, 
            ['encrypt', 'decrypt']
        );
        const encContents = Buffer.from(fileContents.subarray(56,fileContents.length-12));
        const decryptedItems = Buffer.from(await window.crypto.subtle.decrypt({name:"AES-GCM", iv:Buffer.from(iv)},vk, encContents));
        let entries_raw = [];
        let curEntry = [];
        for (let i = 0; i<decryptedItems.length; i++){
            if(decryptedItems[i] !== 0x24){
                curEntry.push(decryptedItems[i]);
            }else{
                entries_raw.push(curEntry);
                curEntry = [];
            }
        }
        const entries = entries_raw.map((x)=>{
            const [title, username,dek, password, notes, createDate, lastEditedDate,lastRotateDate,uuid,...extraFields] = Buffer.from(x).toString('utf8').split("|");
            let efs = []
            if (extraFields[0] !== ""){
                efs = extraFields.map((x):ExtraField=>{
                    const [name, data, isSensitive] = x.split("_");
                    return {
                        name,
                        data: Buffer.from(data, 'base64'),
                        isSensitive:isSensitive === "1"
                    }
                })
            }
            
            const entry:Entry = new Entry({
                title,
                username,
                dek:Buffer.from(dek, 'base64'),
                password: Buffer.from(password, 'base64'),
                notes,
                extraFields:efs,
                metadata:{
                    createDate:new Date(createDate),
                    lastEditedDate:new Date(lastEditedDate),
                    lastRotate:new Date(lastRotateDate),
                    uuid: uuid
                }
            })
            return entry
        });
        
        return entries
    }
    throw new Error("Window object was undefined")
}