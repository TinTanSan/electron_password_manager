export interface Entry{
    dek: Buffer,
    title    : string,
    username : string,
    password : Buffer,
    notes    : string //notes field is optional for user to enter, but otherwise it will be an empty string 
    metadata : MetaData
}

interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
}