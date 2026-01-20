
type PartialWithRequired<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export interface ExtraField{
    isProtected: boolean,
    name: string,
    data: Buffer
}

export interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
    lastRotate:Date,
    uuid: string;
    version  : string; 
} 

export interface Entry{
    title:string;
    username:string;
    password:Buffer;
    notes: string;
    extraFields: Array<ExtraField>;
    metadata: MetaData;
    group:string;
}
