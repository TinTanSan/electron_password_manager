import { encrypt } from "../utils/commons";
import { makeNewDEK, unwrapDEK, wrapDEK } from "../utils/keyFunctions";

type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export interface ExtraField{
    isSensitive: boolean,
    name: string,
    data: Buffer
}


export class Entry{
    dek: Buffer;
    title    : string;
    username : string;
    password : Buffer;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    metadata : MetaData;
    extraFields: Array<ExtraField>

    constructor(init: PartialWithRequired<Entry, "title"|"password"|"username">, kek?:KEKParts){
        
        Object.assign(this, init);
        if (init.dek === undefined){
            makeNewDEK().then((dek)=>{
                wrapDEK(dek, kek).then((wrappedDEK)=>{
                    this.dek = wrappedDEK;
                })
            })
        }
        if (!init.extraFields){
            this.extraFields = [];
        }
        if (!init.metadata){
            const now = new Date();
            this.metadata = {
                createDate: now,
                lastEditedDate: now,
                lastRotate:now,
                uuid: Entry.createUUID()
            }
        }
    }

    static async build(init:PartialWithRequired<Entry,'title'|'password'|'username'>,kek:KEKParts){
        if (init.dek !== undefined){
            console.warn("you've called build even when you have already initialised the dek field");
        }
        
        
        const dek = await makeNewDEK();
        init.dek = await wrapDEK(dek, kek)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const enc = await window.crypto.subtle.encrypt(
                {name:'AES-GCM',
                    iv
                },
                dek,
            Buffer.from(init.password)
        )
        init.password = Buffer.concat([Buffer.from(enc), iv]);
        return new Entry(init);
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
        

        return this.title+"|" + 
            this.username + "|" + 
            this.dek.toString('base64')+ "|" +
            this.password.toString('base64')+ "|" + //we base64 encode the DEK and password because they can possibly contain the '|' symbol which would
                                                 //  improperly delimit the encrypted text, which would have serious implications when decrypting
            this.notes + "|"+ 
            this.metadata.createDate.toISOString()+ "|" + 
            this.metadata.lastEditedDate.toISOString()+ "|"+
            this.metadata.lastRotate.toISOString()+ "|"+
            this.metadata.uuid + "|"+
            this.extraFields.map((ef)=>(ef.name+"_"+ef.data.toString('base64')+"_" + (ef.isSensitive?'1':'0'))).join("|");
    }
    
    static deserialise(content:string){
        const fields = content.split("|");
        if (fields.length < 6){
            throw new Error("Incorrect number of fields recovered from content string when trying to deserialise the entry, expected at least 6 required fields, got"+fields.length)
        }
        const [title, username, dek, password, notes, createDate, lastEditedDate, lastRotate, uuid, ...exfields] = fields;
        let extraFields:Array<ExtraField> | undefined = undefined;
        // ensure the length is greater than 1 and ensure first exfield element is a truthy string i.e. not an empty string
        if (exfields.length > 0 && exfields[0]){
            console.log(exfields)
            extraFields = exfields.map((field):ExtraField=>{
                const [name, iss, data] = field.split("_");
                const isSensitive = iss === "T"
                return {name, isSensitive, data:isSensitive? Buffer.from(data,'base64') : Buffer.from(data)}
            })
        }
        return new Entry({
            title, 
            username, 
            dek:Buffer.from(dek, 'base64'), 
            password:Buffer.from(password, 'base64'), 
            notes, 
            metadata:{createDate:new Date(createDate), lastEditedDate:new Date(lastEditedDate), lastRotate:new Date(lastRotate), uuid},extraFields})
        
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

    // encrypt only pass of an entry
    async encryptPass({kek}:KEKParts):Promise<Buffer>{
        if (typeof window !== 'undefined'){
            const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
            return await encrypt(this.password, dek);

        }
        throw new Error("window is not defined, cannot encrypt entry pass")
    }

    async encryptField(kek:KEKParts, name:string, data:string | Buffer):Promise<ExtraField>{
        if (typeof window !== 'undefined'){
            var unwrappedDEK = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek.kek, {name:'AES-KW'}, {name:'AES-GCM'}, false, ['encrypt', 'decrypt']);
            const d = data instanceof Buffer? data : Buffer.from(data);
            return {name, data:await encrypt(d, unwrappedDEK), isSensitive:true};
        }
        throw new Error('Window object was undefined when trying to encrypt field')
    }

    async addExtraField(kek:KEKParts,name:string, data:string| Buffer, isSensitive:boolean): Promise<Entry>{
        if (this.extraFields.find(x=>x.name === name)){
            return undefined;
        }
        let d = data instanceof Buffer? data : Buffer.from(data);
        return this.update(
            'extraFields', 
            [...this.extraFields, 
                isSensitive? 
                await this.encryptField(kek, name, data) : 
                {name, data:d, isSensitive}
            ]
        )
    }
    
    async removeExtraField(name:string):Promise<Entry>{
        return this.update('extraFields', this.extraFields.filter((x)=>x.name !== name))
    }


    async decryptExtraFields(kek:KEKParts){
        if (typeof window !== 'undefined'){
            if (this.dek === undefined){
                throw new Error("dek was undefined, cannot call decryptExtraFields without DEK being defined")
            }
            const dek = await unwrapDEK(kek, this.dek);

            return Promise.all(this.extraFields.map(async (x)=>{
                let data = x.data;
                console.log(x.isSensitive)
                if (x.isSensitive){
                    data = x.data.subarray(0,x.data.length-12);
                    const iv = x.data.subarray(x.data.length-12)
                    data = Buffer.from(await window.crypto.subtle.decrypt({name:'AES-GCM', iv:Buffer.from(iv)}, dek,Buffer.from(data)))
                    console.log("data:",data)
                }  
                return {
                    name:x.name,
                    data,
                    isSensitive:x.isSensitive
                }
            }))
        }
    }

    async decryptExtraField(name:string, kek:KEKParts){
        
        if (typeof window !== 'undefined'){
            const ef = this.extraFields.find((x=>x.name === name));
            
        }
        throw new Error("Window is not defined")
    }
}

interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
    lastRotate:Date,
    uuid: string
} 