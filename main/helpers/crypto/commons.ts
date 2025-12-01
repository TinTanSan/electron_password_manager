import * as crypto from 'node:crypto';



export async function decrypt(content:Buffer| string, key: CryptoKey, iv?:Buffer):Promise<{data:Buffer, status:"OK"| "ERROR"}>{
        let c = content instanceof Buffer? content : Buffer.from(content);
        if (c.length < 12){
            return {
                data: Buffer.from("unsafe decrypt, expected at least 12 bytes of data, got "+c.length),
                status :'ERROR'
            }
        }
        if (iv === undefined){
            iv = c.subarray(c.length-12);
            c = c.subarray(0, c.length-12);
        }
        try {
            return {
                data: Buffer.from(await crypto.subtle.decrypt({ name:"AES-GCM", iv:Buffer.from(iv)}, key, Buffer.from(c))),   
                status: "OK"
            }
        } catch (error) {
            return{
                data:Buffer.from(error.toString()),
                status:"ERROR"
            }
        }
}

export async function encrypt(content:Buffer | string, key:CryptoKey){
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = content instanceof Buffer? content : Buffer.from(content);
        const encryptedText = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, Buffer.from(data));
        return Buffer.concat([Buffer.from(encryptedText), iv])
}
