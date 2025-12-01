import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
// Create entirely new KEK based on a password, this can be used for key rotation and initial set up
export async function makeNewKEK(password:string, timeCost:number=3, memoryCost:number=65536, parallelism:number=4, hashLength:number=32):Promise<KEKParts>{
        const salt = crypto.randomBytes(16);
        const passHash = await argon2.hash(password, {
            type: argon2.argon2id,
            timeCost,
            memoryCost,
            parallelism,
            hashLength,
        });

        const kekHash = await argon2.hash(password, {
            type: argon2.argon2id,
            salt:Buffer.from(salt),
            timeCost,
            memoryCost,
            parallelism,
            hashLength,
            raw:true
        });


        console.log(passHash);

        const kek = await window.crypto.subtle.importKey(
            'raw',
            Buffer.from(kekHash),
            { name: "AES-KW" },
            true,
            ["wrapKey", "unwrapKey"]
        );

        return {kek, salt:Buffer.from(salt)};
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
export async function validateKEK(password:string,passHash:string, salt:Buffer, timeCost:number=3, memoryCost:number=65536, parallelism:number=4, hashLength:number=32): Promise<KEKParts | undefined>{
    
    // const salt = fileContents.subarray(0,16);
    // const kekDigest = fileContents.subarray(16,56);
    
    if (argon2.verify(passHash, password)){
        const kekHash = await argon2.hash(password, {
            type: argon2.argon2id,
            salt,
            timeCost,
            memoryCost,
            parallelism,
            hashLength,
            raw:true
        });
        const kek = await window.crypto.subtle.importKey(
            'raw',
            Buffer.from(kekHash),
            { name: "AES-KW" },
            true,
            ["wrapKey", "unwrapKey"]
        );
        return {kek, salt};
    }
    return undefined;
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