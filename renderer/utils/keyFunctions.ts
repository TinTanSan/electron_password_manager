// a file to hold all the crypto key related functions

import { Entry } from "../interfaces/Entry";

/*
    user chooses password
    - Key Encryption Key (KEK) is generated using password
    - KEK is used to encrypt and decrypt Data encryption keys (DEKs)
    - DEKs are assigned per entry to minimise exposure damage i.e. if the DEK for one of the entries is compromised it will not 
        have any effect on other entries
    - DEKs are encrypted at rest and are decrypted when required
    
*/

// Create entirely new KEK based on a password, this can be used for key rotation and initial set up
export async function makeNewKEK(password:string):Promise<KEKParts>{
    if (typeof window !== 'undefined'){
        const crypto = window.crypto;
        const encoder = new TextEncoder();

        const salt = new Uint8Array(16);
        crypto.getRandomValues(salt);
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        const kek = await window.crypto.subtle.deriveKey({
                name:"PBKDF2", 
                salt,   
                iterations: 1_000_000,
                hash : 'SHA-256'
            },
            passwordKey,
            {
                name: "AES-KW",
                length: 256
            },
            false,
            ['wrapKey', 'unwrapKey']
        )
        return {kek, salt:Buffer.from(salt)};
    }
    throw new Error("Unable to generate a new key, browser mode not detected")
}

// derive the KEK from a password and test wrapped DEK
async function deriveKEK(password:string, salt:Buffer,digest:Buffer):Promise<{kek:KEKParts | undefined, status:string}>{ 
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const kek = await crypto.subtle.deriveKey(
        {
        name: 'PBKDF2',
        salt: Buffer.from(salt),
        iterations: 1_000_000,
        hash: 'SHA-256',
        },
        passwordKey,
        {
        name: 'AES-KW',
        length: 256,
        },
        false,
        ['wrapKey', 'unwrapKey']
    );
    try{
        await crypto.subtle.unwrapKey('raw',Buffer.from(digest), kek, {name:'AES-KW'}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
        return {kek:{kek, salt}, status:"OK"};
    }catch(error){
        return {kek:undefined, status:"INCORRECTPASSASS"}
    }
    

    
}


// given filecontents of a vault that is being opened, and a password, validate and return kek
export async function validateKEK(fileContents:Buffer, password:string): Promise<KEKParts | undefined>{
    const salt = fileContents.subarray(0,16);
    const kekDigest = fileContents.subarray(16,56);
    const kek = await deriveKEK(password, salt, kekDigest);
    return kek.status === "OK"? kek.kek: undefined
}

// create entirely new DEK, this is to be used per entry can also be used to generate a VK 
export async function makeNewDEK():Promise<CryptoKey>{
    if (typeof window !=='undefined'){
        return await window.crypto.subtle.generateKey(
            {
                name:"AES-GCM",
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        )
    }
    throw new Error ("Unable to make new DEK, browser window not detected")
}

// unwrap an existing DEK for decrypting a text
export async function unwrapDEK(kek:KEKParts, wrappedKey:Buffer){
    return await crypto.subtle.unwrapKey(
            'raw',         // format of the wrapped key
            Buffer.from(wrappedKey),    // wrapped key (ArrayBuffer)
            kek.kek,           // KEK used for unwrapping
            'AES-KW',      // algorithm used for wrapping
            { name: 'AES-GCM', length: 256 }, // expected algorithm of unwrapped key
            false,          // extractable should not be true this time because we have already stored the key
            ['encrypt', 'decrypt']
        );
}

// wrap existing DEK for rest and storage
export async function wrapDEK(dek:CryptoKey, kek:KEKParts):Promise<Buffer>{
    return Buffer.from(await crypto.subtle.wrapKey(
        'raw',
        dek,
        kek.kek,
        'AES-KW',
    ))
}




export async function rotateDEK(entry:Entry, kek:KEKParts){
    const decryptedPass = await entry.decryptEntryPass(kek);
    const decryptedExtraFields = await entry.decryptExtraFields(kek);
    const newDek = await makeNewDEK();
    const wrappedDek = await wrapDEK(newDek, kek);
    let e = new Entry({
        ...entry,
        dek: wrappedDek
    })
    e.extraFields = [];
    e.password = Buffer.from(decryptedPass);
    e.password = await e.encryptPass(kek);
    console.log(e.dek)
    await Promise.all(decryptedExtraFields.map(async (x)=>{
        e = await e.addExtraField(kek, x.name, x.data, x.isSensitive);
    })).catch((error)=>{
        console.error(error)
    })
    return e;
}