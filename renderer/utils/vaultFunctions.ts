// this file contains functions to do with vault to file transitions i.e. opening a file and converting
// to a vault, type and handling splitting of file contents into entries etc. and vice versa

import { Entry } from "../interfaces/Entry";
import { makeNewDEK } from "./keyFunctions";

// this function is to do with commiting a KEK whenever the master password changes, it will commit a salt,
// and a sanity check value to the first line of the vault file
export async function commitKEK(fileContents:string,kek:KEKParts){
    
    const content = fileContents.split("\n").splice(0,1);
    const dek = await makeNewDEK();
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

export async function vaultLevelDecrypt(fileContents:string){

}