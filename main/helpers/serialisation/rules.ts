export const entryMDSplit = "\\";
export const entryGroupsSplit = "?";
export const entrySplit = "#";
export const extraFieldsSplit = "`";
export const dekSplit = "-";
export const entryGroupSplit = "_";
export const entryMDVersionConstituents:Record<string, Array<Array<string>>>= {    
    '1.0.0':[
        ['split'          , '\\'],
        ["version"        , 'string'],
        ["createDate"     , 'date'],
        ['lastEditDate'   , 'date'],
        ["lastRotateDate" , 'date'],
        ["uuid"           , 'string'],
    ]
    // example : 1.0.0.0$25-06-2025T00:00:00Z000$25-06-2025T00:00:00Z000$25-06-2025T00:00:00Z000$ab12-cd34-ef56-gh78

}
export const entryDEKConstituents = {
 '1.0.0'  :[
    ['iv','b64Buff'],
    ['tag','b64Buff'],
    ['wrappedKey','b64Buff']
 ]
}
export const entryConstituents = {
    '1.0.0':[
        ['split'      , "$"],
        ['metadata'    , 'entryMD'],
        ['title','string'],
        ['username'   , "string"],
        ['dek','dek'],
        ['password'   , 'b64Buff'],
        ['passHash'   , 'b64Buff'],
        ['notes'      , "string"],
        ['isFavourite', "isFavToBool"],
        // ['group', 'string'],
        ['extraFields', 'extraFields']
    ]
    ,

}

export const vaultMDVersionConstituents:Record<string, Array<Array<string>>> = {
    '1.0.0':[
        ['split',"$"],
        ["version"        , 'string'],
        ["createDate"     , 'date'],
        ['lastEditDate'   , 'date'],
    ]
}
export const vaultConstituents  = {
    '1.0.0' : [
        ['split',"|"],
        ['vaultMetadata', "vaultMD"],
        ['entries','entries'],
        ['entryGroups', 'entryGroups']
    ]
}