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
export async function deriveKEK(rawHash:Buffer, salt:Buffer):Promise<{kek:Buffer | undefined, status:string}>{ 
    return undefined;
}

