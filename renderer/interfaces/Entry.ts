
type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export interface ExtraField{
    isProtected: boolean,
    name: string,
    data: Buffer
}

export interface MetaData{
    createDate:Date,
    lastEditDate:Date,
    lastRotateDate:Date,
    uuid: string;
    version  : string; 
} 

export interface Entry{
    title:string;
    username:string;
    password:Buffer;
    notes: string;
    isFavourite: boolean,
    passHash: Buffer,
    group:string;
    extraFields: Array<ExtraField>;
    metadata: MetaData;
    
}
