export type EntryUpdateCallback = ((uuid:string)=>void)

export interface RendererSafeEntry {
    metadata: MetaData;
    title: string;
    username: string;
    password: Buffer;
    passHash: Buffer;
    notes: string; //notes field is optional for user to enter, but otherwise it will be an empty string 
    isFavourite: boolean;
    extraFields: Array<ExtraField>;
    group: string;
}
export interface MetaData {
    createDate: Date;
    lastEditDate: Date;
    lastRotateDate: Date;
    uuid: string;
    version: string;
}

export interface ExtraField {
    isProtected: boolean;
    name: string;
    data: Buffer;
}

