export interface Entry{
    dek: CryptoKey,
    title    : string,
    username : string,
    password : string,
    notes    : string //notes field is optional for user to enter, but otherwise it will be an empty string 
    metadata : MetaData
}

interface MetaData{
    createDate:Date,
    lastEditedDate:Date,
}