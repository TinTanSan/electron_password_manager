export function isStrongPassword(password:string):string{
    let passwordMessage = []
    if (password.length <8){
        passwordMessage.push("must be atleast 8 characters in length");
    }
    if (password.match(/[A-Z]+/g) === null){
        passwordMessage.push( "must contain an upper case letter");
    }
    if (password.match(/[0-9]+/g) === null){
        passwordMessage.push("must contain at least 1 number");
    }
    if (password.match(/[^\w\s]/g) === null){
        passwordMessage.push("must contain a special character");
    }
    return passwordMessage.length > 0? "The password "+passwordMessage.join(", ") : "";
}

export async function decrypt(content:Buffer| string, key: CryptoKey, iv?:Buffer):Promise<{data:Buffer, status:"OK"| "ERROR"}>{
    if (typeof window !== "undefined"){
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
                data: Buffer.from(await window.crypto.subtle.decrypt({ name:"AES-GCM", iv:Buffer.from(iv)}, key, Buffer.from(c))),   
                status: "OK"
            }
        } catch (error) {
            return{
                data:Buffer.from(error),
                status:"ERROR"
            }
        }
    }
    throw new Error("Window object was not defined when trying to decrypt")

}

export async function encrypt(content:Buffer | string, key:CryptoKey){
    if (typeof window !== 'undefined'){
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const data = content instanceof Buffer? content : Buffer.from(content);
        const encryptedText = await window.crypto.subtle.encrypt({name:"AES-GCM", iv}, key, Buffer.from(data));
        return Buffer.concat([Buffer.from(encryptedText), iv])
    }
    throw new Error('Window object was undefined when trying to encrypt')
}

export const lowerCaseLetters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
export const upperCaseLetters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
export const digits = ["0","1","2","3","4","5","6","7","8","9"];
export const asciiSafeSpecialChars = ["!","\"","#","$","%","&","'","(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"];