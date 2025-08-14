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

// encrypt only pass of an entry given the pass, wrappedDEK, and kek
export async function encryptPass(pass:String, wrappedDEK: Buffer, {kek}:KEKParts):Promise<Buffer>{
    if (typeof window !== 'undefined'){
        const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(wrappedDEK), kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const enc = await window.crypto.subtle.encrypt(
            {name:'AES-GCM',
                iv
            },
            dek,
            Buffer.from(pass)
        )
        return Buffer.concat([Buffer.from(enc), iv]);

    }
    throw new Error("window is not defined")
}

// create entry from scratch, this function is more so for testing
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