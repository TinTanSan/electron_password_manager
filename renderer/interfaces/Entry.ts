import { makeNewDEK, wrapDEK } from "../utils/keyFunctions";

type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
interface ExtraField{
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
        

        return this.title+"|" + 
        this.username + "|" + 
        this.dek.toString('base64')+ "|" +
        this.password.toString('base64')+ "|" + //we base64 encode the DEK and password because they can possibly contain the '|' symbol which would
                                                //  improperly delimit the encrypted text, which would have serious implications when decrypting
        this.notes + "|"+ 
        this.metadata.createDate.toISOString()+ "|" + 
        this.metadata.lastEditedDate.toISOString()+ "|"+
        this.metadata.uuid +"|"+
        this.extraFields.map((ef)=>
            ef.isSensitive? ef.name+"_T_"+ef.data.toString('base64') :ef.name+"_F_"+ef.data
        ).join("|");
    }
    
    static deserialise(content:string){
        const fields = content.split("|");
        if (fields.length < 6){
            throw new Error("Incorrect number of fields recovered from content string when trying to deserialise the entry, expected at least 6 required fields, got"+fields.length)
        }
        const [title, username, dek, password, notes, createDate, lastEditedDate, uuid, ...exfields] = fields;
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
        return new Entry({title, username, dek:Buffer.from(dek, 'base64'), password:Buffer.from(password, 'base64'), notes, metadata:{createDate:new Date(createDate), lastEditedDate:new Date(lastEditedDate), uuid},extraFields})
        
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

    async encryptField(kek:KEKParts, fieldName:string){
        
    }

    async addExtraField(kek:KEKParts,name:string, data:string| Buffer, isSensitive:boolean){
        if (this.extraFields.find(x=>x.name === name)){
            return undefined;
        }
        
        const d = data instanceof Buffer? data : Buffer.from(data);
        
        const extraField = {name, data:d, isSensitive};

        return this.update('extraFields', [...this.extraFields, extraField])
    }
    
    async removeExtraField(name:string){
        return this.update('extraFields', this.extraFields.filter((x)=>x.name !== name))
    }
}

interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
    uuid: string
} 