import { createUUID, decrypt, encrypt } from "../utils/commons";
import { makeNewDEK, unwrapDEK, wrapDEK } from "../utils/keyFunctions";

type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export interface ExtraField{
    isProtected: boolean,
    name: string,
    data: Buffer
}


interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
    lastRotate:Date,
    uuid: string;
    version  : string; 
} 

export class Entry{
    dek: Buffer;
    title    : string;
    username : string;
    password : Buffer;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    metadata : MetaData;
    extraFields: Array<ExtraField>;
    group: string;
    

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
                uuid: createUUID(),
                version: '0.1.0'
            }
        }
        if (!init.group){
            this.group = "default";
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
            this.metadata.version + "|"+
            this.extraFields.map((ef)=>(ef.name+"_"+ef.data.toString('base64')+"_" + (ef.isProtected?'1':'0'))).join("|");
    }
    
    static deserialise(content:string){
        const [title, username,dek, password, notes, createDate, lastEditedDate,lastRotateDate,uuid,version,...extraFields] = content.split("|");
        let efs = [];
        if (extraFields[0]){
            efs = extraFields.map((x):ExtraField=>{
                const [name, data, isProtected] = x.split("_");
                return {
                    name,
                    data: Buffer.from(data, 'base64'),
                    isProtected:isProtected === "1"
                }
            })
        }
        
        const entry:Entry = new Entry({
            title,
            username,
            dek:Buffer.from(dek, 'base64'),
            password: Buffer.from(password, 'base64'),
            notes,
            extraFields:efs,
            metadata:{
                createDate:new Date(createDate),
                lastEditedDate:new Date(lastEditedDate),
                lastRotate:new Date(lastRotateDate),
                uuid: uuid,
                version: version || "0.1.0"
            }
        })
        return entry
    }

    async decryptEntryPass(kek:KEKParts){
        if (typeof window !== 'undefined'){
            const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek.kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
            const results = await decrypt(this.password, dek);
            if (results.status === "OK"){
                return results.data
            }
            throw new Error("Error decrypting password: "+results.data);
        }
        throw new Error("Window is not defined, cannot decrypt entry pass")
    }

    // encrypt only pass of an entry
    async updatePass({kek}:KEKParts, newPassword:string | Buffer):Promise<Entry>{
        if (typeof window !== 'undefined'){
            const dek = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek, {name:"AES-KW"}, {name:"AES-GCM"}, false, ['encrypt', 'decrypt']);
            
            const encPassword = await encrypt(newPassword, dek);
            return this.update('password', encPassword)
        }
        throw new Error("window is not defined, cannot encrypt entry pass")
    }

    async encryptField(kek:KEKParts, name:string, data:string | Buffer):Promise<ExtraField>{
        if (typeof window !== 'undefined'){
            var unwrappedDEK = await window.crypto.subtle.unwrapKey('raw', Buffer.from(this.dek), kek.kek, {name:'AES-KW'}, {name:'AES-GCM'}, false, ['encrypt', 'decrypt']);
            const d = data instanceof Buffer? data : Buffer.from(data);
            return {name, data:await encrypt(d, unwrappedDEK), isProtected:true};
        }
        throw new Error('Window object was undefined when trying to encrypt field')
    }

    async addExtraField(kek:KEKParts,{name, data, isProtected}:ExtraField): Promise<Entry>{
        if (this.extraFields.find(x=>x.name === name)){
            return undefined;
        }
        let d = data instanceof Buffer? data : Buffer.from(data);
        return this.update(
            'extraFields', 
            [...this.extraFields, 
                isProtected? 
                await this.encryptField(kek, name, data) : 
                {name, data:d, isProtected}
            ]
        )
    }
    
    removeExtraField(name:string):Entry{
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
                if (x.isProtected){
                    data = x.data.subarray(0,x.data.length-12);
                    const iv = x.data.subarray(x.data.length-12)
                    data = Buffer.from(await window.crypto.subtle.decrypt({name:'AES-GCM', iv:Buffer.from(iv)}, dek,Buffer.from(data)))
                }  
                return {
                    name:x.name,
                    data,
                    isProtected:x.isProtected
                }
            }))
        }
    }

    async decryptExtraField(name:string, kek:KEKParts){
        
        if (typeof window !== 'undefined'){
            const ef = this.extraFields.find((x=>x.name === name));
            if (ef.isProtected){
                return await decrypt(ef.data, await unwrapDEK(kek, this.dek));
            }else{
                console.warn("tried to decrypt a field that was not protected");
                return {
                    data:ef.data, 
                    status:"OK"
                }
            }
        }
        throw new Error("Window is not defined")
    }


    isEqual(other:Entry){
        if (!other) false;

        if (this.title !== other.title || this.username !== other.username || this.notes !== other.notes) return false;
        
        if (!this.dek.equals(other.dek) || !this.password.equals(other.password)) return false;
        const metaA = this.metadata;
        const metaB = other.metadata;

        if (
            metaA.uuid !== metaB.uuid || metaA.version !== metaB.version ||metaA.createDate.getTime() !== metaB.createDate.getTime() ||
            metaA.lastEditedDate.getTime() !== metaB.lastEditedDate.getTime() || metaA.lastRotate.getTime() !== metaB.lastRotate.getTime()
        ) return false;

        // Compare extra fields
        if (this.extraFields.length !== other.extraFields.length) return false;
        
        for (let i = 0; i < this.extraFields.length; i++) {
            const a = this.extraFields[i];
            const b = other.extraFields[i];
            // assuming ExtraField is a simple object (e.g. {key:string,value:string})
            if (a.name !== b.name || a.data !== b.data) return false;
        }

        return true;
    }
}
