// encrypt and decrypt functions here

import {Entry } from "../interfaces/Entry"
import { makeNewDEK } from "./keyFunctions"


export async function decryptEntryPass(encryptedEntry:Entry){
    if (typeof window !== 'undefined'){
        console.log('enc len: ',encryptedEntry.password.length)
        const password = Buffer.from(encryptedEntry.password.substring(0, encryptedEntry.password.length-16),'base64')
        const iv = Buffer.from(encryptedEntry.password.substring(encryptedEntry.password.length-16), 'base64');
        console.log('decrypt',password)
        console.log('decrypt iv:', iv)
        return  new TextDecoder().decode(await window.crypto.subtle.decrypt({name:'AES-GCM', iv}, encryptedEntry.dek, password))
    }
    throw new Error("Window is not defined, cannot decrypt")
}

export async function createEntry(title:string, username:string, password:string, notes:string=""):Promise<Entry>{
    const encoder = new TextEncoder();
    
    const dek = await makeNewDEK()
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedPass = await window.crypto.subtle.encrypt({name:'AES-GCM', iv}, dek, encoder.encode(password))
    console.log('create entry: ',encryptedPass)
    console.log('create entry iv: ', iv)
    console.log('individual len' ,encryptedPass.byteLength + iv.byteLength)
    const encryptedStoredPassword = Buffer.from(encryptedPass).toString('base64') +  Buffer.from(iv).toString('base64');
    console.log(encryptedStoredPassword)
    return {
        title,
        username,
        password: encryptedStoredPassword,
        notes,
        dek,
        metadata:{
            createDate: new Date(),
            lastEditedDate : new Date()
        }
    }
}