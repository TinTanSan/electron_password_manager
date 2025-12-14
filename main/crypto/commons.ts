import * as crypto from 'node:crypto';

export function shaHash(content:string):Buffer{
    const hasher = crypto.createHash('sha256');
    hasher.update(content);
    return hasher.digest();
}

export function encrypt(content:Buffer,key:Buffer){
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);
    const encrypted = Buffer.concat([
        cipher.update(content),
        cipher.final()
    ])
    const tag = cipher.getAuthTag();
    return {iv,encrypted, tag};
}

export function decrypt(content:Buffer, key:Buffer, tag:Buffer,iv:Buffer){
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
        decipher.update(content),
        decipher.final()
    ])
}

export function generateUUID(){
    return crypto.randomUUID();
}