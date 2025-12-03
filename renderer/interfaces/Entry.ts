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
    title    : string;
    username : string;
    password : Buffer;
    passHash : string;
    notes    : string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    isFavourite: boolean;
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
    update(field: string, value: any, inplace:boolean = false) {
        throw new Error('Implement with calls to IPCMain')
        return new Entry({...this, [field]: value, metadata:{...this.metadata, lastEditedDate:inplace? this.metadata.lastEditedDate : new Date()}})
    }
    // used when you don't want lastEditDate to change i.e. decrrypting a pass then setting a state
    cloneMutate(field:string, value:any){
        return new Entry({...this, [field]: value})
    }
    
    // encrypt only pass of an entry
    async updatePass({kek}:KEKParts, newPassword:string | Buffer):Promise<Entry>{
        throw new Error('Implement with calls to IPCMain')
        if (typeof window !== 'undefined'){
        }
        throw new Error("window is not defined, cannot encrypt entry pass")
    }



    async addExtraField(kek:KEKParts,{name, data, isProtected}:ExtraField): Promise<Entry>{
        throw new Error('Implement with calls to IPCMain')
        if (this.extraFields.find(x=>x.name === name)){
            return undefined;
        }
        let d = data instanceof Buffer? data : Buffer.from(data);
        
    }
    
    removeExtraField(name:string):Entry{
        throw new Error('Implement with calls to IPCMain')
        return this.update('extraFields', this.extraFields.filter((x)=>x.name !== name))
    }




    isEqual(other:Entry){
        if (!other) false;

        if (this.title !== other.title || this.username !== other.username || this.notes !== other.notes) return false;
        
        if (this.passHash !== other.passHash) return false;
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
            if (a.name !== b.name || a.data !== b.data) return false;
        }
        return true;
    }
}
