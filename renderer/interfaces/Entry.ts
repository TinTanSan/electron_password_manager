import { makeNewDEK, wrapDEK } from "../utils/keyFunctions";

type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export class Entry{
    dek: Buffer;
    title    : string;
    username : string;
    password : Buffer;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    metadata : MetaData;

    constructor(init: PartialWithRequired<Entry, "title"|"password"|"username">, kek?:KEKParts){
        
        Object.assign(this, init);
        if (init.dek === undefined){
            makeNewDEK().then((dek)=>{
                wrapDEK(dek, kek).then((wrappedDEK)=>{
                    this.dek = wrappedDEK;
                })
            })
        }
        if (!init.metadata){
            const now = new Date();
            this.metadata = {
                createDate: now,
                lastEditedDate: now,
                uuid: Entry.createUUID()
            }
        }
    }
    // used when you want lastEditDate to change i.e. permanent changes in fields 
    update(field: string, value: any) {
        return new Entry({...this, [field]: value, metadata:{...this.metadata, lastEditedDate:new Date()}})
    }
    // used when you don't want lastEditDate to change i.e. decrrypting a pass then setting a state
    cloneMutate(field:string, value:any){
        return new Entry({...this, [field]: value})
    }


    serialise(){

    }
    static convertToKey(id:string){
        let testEntry = new Entry(undefined, undefined);
        const k = Object.keys(testEntry).find((x)=>x===id);
        if (k === undefined){
            throw new Error('key not found in Entry object, make sure it is correctly spelt')
        }
        return k;
    }
    static createUUID(){
        if (typeof window !== undefined){
            return window.crypto.randomUUID()
        }
        throw new Error("Window object was undefined when calling createUUID for Entry")
    }


    async decryptEntryPass(kek:KEKParts){
        if (typeof window !== 'undefined'){
            const iv = Buffer.from(this.password.subarray(this.password.length-12))
            const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek.kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
            return new TextDecoder().decode(await window.crypto.subtle.decrypt({name:'AES-GCM', iv}, dek , Buffer.from(this.password.subarray(0,this.password.length-12))))
        }
        throw new Error("Window is not defined, cannot decrypt entry pass")
    }

    // encrypt only pass of an entry given the pass, wrappedDEK, and kek
    async encryptPass({kek}:KEKParts):Promise<Buffer>{
        if (typeof window !== 'undefined'){
            const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const enc = await window.crypto.subtle.encrypt(
                {name:'AES-GCM',
                    iv
                },
                dek,
                Buffer.from(this.password)
            )
            return Buffer.concat([Buffer.from(enc), iv]);

        }
        throw new Error("window is not defined, cannot encrypt entry pass")
    }
}

interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
    uuid: string
} 