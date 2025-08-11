// this file contains functions to do with vault to file transitions i.e. opening a file and converting
// to a vault, type and handling splitting of file contents into entries etc. and vice versa

import { error } from "console";
import { Entry } from "../interfaces/Entry";
import { makeNewDEK } from "./keyFunctions";
import { decryptEntryPass } from "./entryFunctions";

// this function is to do with commiting a KEK whenever the master password changes, it will commit a salt,
// and a sanity check value to the first line of the vault file
export async function commitKEK(filePath:string,fileContents:Buffer,kek:KEKParts){
    // remove the first line, which contains important content retaining to the KEK
    const content = fileContents.subarray(48);
    console.log(content.length)
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

export async function vaultLevelEncrypt(entries:Array<Entry>, wrappedVK:Buffer, kek:KEKParts){
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
        const content = entries.map((x)=>
            x.title+"|" + 
            x.username + "|" + 
            x.dek.toString('base64')+ "|" +
            x.password.toString('base64')+ "|" + //we base64 encode the DEK and password because they can possibly contain the '|' symbol which would
                                                 //  improperly delimit the encrypted text, which would have serious implications when decrypting
             x.notes + "|"+ 
            x.metadata.createDate.toISOString()+ "|" + 
            x.metadata.lastEditedDate.toISOString()).join("$") 
        + "$"; //the + "$" is to ensure that we wrap the end by a $ so that even if there is only 1 entry, there will be at least one $ symbol
        
        const enc = Buffer.concat([
                kek.salt,
                wrappedVK,
                Buffer.from(await crypto.encrypt({name:"AES-GCM", iv: Buffer.from(iv)},  VK,  Buffer.from(content))), // actual ciphertext
                iv //  associated iv
        ]);
        console.log(enc)
        return enc
    }
}

export async function writeEntriesToFile(entries:Array<Entry>, filePath:string, wrappedVK:Buffer, kek:KEKParts){
    if (typeof window !=="undefined"){
        const content = Buffer.concat([kek.salt,wrappedVK, Buffer.from(await vaultLevelEncrypt(entries, wrappedVK,kek))]);
        const result = await window.ipc.writeFile(filePath, content);
        return result === "OK" ? {content, status:result} : {content:undefined, status:result};
    }
    
}

export async function vaultLevelDecrypt(fileContents:Buffer, kek:KEKParts){
    const wrappedVK = fileContents.subarray(16,56);
    const iv = fileContents.subarray(fileContents.length-12);
    if (typeof window !== "undefined"){
        const vk = await window.crypto.subtle.unwrapKey(
            'raw',
            Buffer.from(wrappedVK),
            kek.kek, 
            {name:"AES-KW"},
            {name:"AES-GCM"}, 
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
            const [title, username,dek, password, notes, createDate, lastEditedDate] = Buffer.from(x).toString('utf8').split("|");
            const entry:Entry = {
                title,
                username,
                dek:Buffer.from(dek, 'base64'),
                password: Buffer.from(password, 'base64'),
                notes,
                metadata:{
                    createDate:new Date(createDate),
                    lastEditedDate:new Date(lastEditedDate)
                }
            }
            return entry
        });



        return entries
    }
    throw new Error("Window object was undefined")
}