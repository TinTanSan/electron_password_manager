// a file to hold all the crypto key related functions

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

        const salt = new Uint8Array(16)
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
            true,
            ['wrapKey', 'unwrapKey']
        )
        const kekDigest = await window.crypto.subtle.digest('SHA-256',await crypto.subtle.exportKey('raw', kek));
        return {kek, salt:Buffer.from(salt).toString('base64'), digest: Buffer.from(kekDigest).toString('base64')};
    }
    throw new Error("Unable to generate a new key, browser mode not detected")
}

// derive the KEK from a password and hash string, password can be plain text utf-8 while salt must be base64encoded string
export async function deriveKEK(password:string, salt:string,digest:string):Promise<{kek:KEKParts | undefined, status:string}>{ 
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
        salt: Buffer.from(salt, 'base64'),
        iterations: 1_000_000,
        hash: 'SHA-256',
        },
        passwordKey,
        {
        name: 'AES-KW',
        length: 256,
        },
        true,
        ['wrapKey', 'unwrapKey']
    );
    
    const kekDigest = await window.crypto.subtle.digest('SHA-256',await crypto.subtle.exportKey('raw', kek));
    if (Buffer.from(kekDigest).toString('base64') !== digest){
        return {kek:undefined, status:"INCORRECTPASS"};
    }
    return {kek:{kek, salt, digest}, status:"OK"};
}

// create entirely new DEK, this is to be used per entry
export async function makeNewDEK():Promise<CryptoKey>{
    if (typeof window !=='undefined'){
        return await window.crypto.subtle.generateKey(
            {
                name:"AES-GCM",
                length: 256
            },
            true, // this should only be the case for only this time, 
            ['encrypt', 'decrypt']
        )
    }
    throw new Error ("Unable to make new DEK, browser window not detected")
}

// unwrap an existing DEK for decrypting a text
export async function unwrapDEK(kek:KEKParts, wrappedKey:string){
    return await crypto.subtle.unwrapKey(
            'raw',         // format of the wrapped key
            Buffer.from(wrappedKey, 'base64'),    // wrapped key (ArrayBuffer)
            kek.kek,           // KEK used for unwrapping
            'AES-KW',      // algorithm used for wrapping
            { name: 'AES-GCM', length: 256 }, // expected algorithm of unwrapped key
            false,          // extractable should not be true this time because we have already stored the key
            ['encrypt', 'decrypt']
        );
}

// wrap existing DEK for rest and storage
export async function wrapDEK(dek:CryptoKey, kek:KEKParts):Promise<string>{
    return Buffer.from(await crypto.subtle.wrapKey(
        'raw',
        dek,
        kek.kek,
        'AES-KW',
    )).toString('base64')
}