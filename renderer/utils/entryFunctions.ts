// encrypt and decrypt functions here

import {Entry } from "../interfaces/Entry"
import { makeNewDEK } from "./keyFunctions"

export async function decryptEntryPass(encryptedEntry:Entry, kek:KEKParts){
    if (typeof window !== 'undefined'){
        const iv = Buffer.from(encryptedEntry.password.subarray(encryptedEntry.password.length-12))
        const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(encryptedEntry.dek), kek.kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
        return  new TextDecoder().decode(await window.crypto.subtle.decrypt({name:'AES-GCM', iv}, dek , Buffer.from(encryptedEntry.password.subarray(0,encryptedEntry.password.length-12))))
    }
    throw new Error("Window is not defined, cannot decrypt")
}


export async function createEntry(title:string, username:string, password:string, notes:string="", kek:KEKParts):Promise<Entry>{
    const encoder = new TextEncoder();
    
    const dek = await makeNewDEK();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedPass = await window.crypto.subtle.encrypt({name:'AES-GCM', iv}, dek, encoder.encode(password))
    const encryptedStoredPassword = Buffer.concat([Buffer.from(encryptedPass), iv]);
    const dek_buf = Buffer.from(await window.crypto.subtle.wrapKey('raw', dek, kek.kek, {name:"AES-KW"}));
    return {
        title,
        username,
        password: encryptedStoredPassword,
        notes,
        dek:dek_buf ,
        metadata:{
            createDate: new Date(),
            lastEditedDate : new Date()
        }
    }
}