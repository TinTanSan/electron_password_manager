// this file contains functions to do with vault to file transitions i.e. opening a file and converting
// to a vault, type and handling splitting of file contents into entries etc. and vice versa

import { error } from "console";
import { Entry } from "../interfaces/Entry";
import { makeNewDEK } from "./keyFunctions";

// this function is to do with commiting a KEK whenever the master password changes, it will commit a salt,
// and a sanity check value to the first line of the vault file
export async function commitKEK(filePath:string,fileContents:string,kek:KEKParts){
    // remove the first line, which contains important content retaining to the KEK
    const content = fileContents.split("\n").splice(0,1);
    let firstLine = kek.salt + "|"+kek.digest + "|";
    if (typeof window !== "undefined"){
        const dek = await makeNewDEK()
        window.crypto.subtle.wrapKey('raw', dek, kek.kek, {name:'AES-KW'});

        firstLine += Buffer.from(await window.crypto.subtle.exportKey("raw", dek)).toString('base64')
        window.ipc.writeFile(filePath,firstLine+"\n"+content);
    }else{
        throw new Error('window object was underfined')
    }
}

export async function vaultLevelEncrypt(entries:Array<Entry>, wrappedVK:string, kek:KEKParts ){
    if (typeof window !=="undefined"){
        const crypto = window.crypto.subtle;
        const VK = await crypto.unwrapKey('raw', Buffer.from(wrappedVK, 'base64'), kek.kek,{name:"AES-KW"},{name:"AES-GCM"},false, ['encrypt', 'decrypt'])
        const iv = new Uint8Array(12);
        window.crypto.getRandomValues(iv);
        crypto.encrypt({
            name:"AES-GCM",
            iv: Buffer.from(iv),

        }, VK, Buffer.from("entries",'ascii'))
    }
}

export async function vaultLevelDecrypt(fileContents:string, kek:KEKParts){
    const [_salt,_digest,vk_raw] = fileContents.split("\n")[0].split("|")
    const entries = fileContents.substring(fileContents.indexOf("\n") + 1);
    const iv = entries.substring(entries.lastIndexOf("\n")+1);
    if (typeof window !== "undefined"){
        const vk_bytes = Buffer.from(vk_raw, 'base64');
        const vk = await window.crypto.subtle.unwrapKey(
            'raw',
            vk_bytes,
            kek.kek, 
            {name:"AES-KW"},
            {name:"AES-GCM"}, 
            false, 
            ['encrypt', 'decrypt']
        );

        window.crypto.subtle.decrypt({name:"AES-GCM", iv:Buffer.from(iv, 'base64')},vk, Buffer.from(entries, 'base64'))
    }
    throw new Error("Window object was undefined")
}