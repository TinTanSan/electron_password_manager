const entryMDVersionConstituents:Record<string, Array<Array<string>>>= {    
    '1.0.0':[
        ['split'          , '$'],
        ["version"        , 'string'],
        ["createDate"     , 'date'],
        ['lastEditDate'   , 'date'],
        ["lastRotateDate" , 'date'],
        ["uuid"           , 'string'],
    ]
    // example : 1.0.0.0$25-06-2025T00:00:00Z000$25-06-2025T00:00:00Z000$25-06-2025T00:00:00Z000$ab12-cd34-ef56-gh78

}

const vaultMDVersionConstituents:Record<string, Array<Array<string>>> = {
    '1.0.0':[
        ['split',"$"],
        ["version"        , 'string'],
        ["createDate"     , 'date'],
        ['lastEditDate'   , 'date'],
    ]
}


const entryConstituents = {
    '1.0.0':[
        ['split'      , "|"],
        ['entryMD'    , 'entryMD'],
        ['username'   , "string"],
        ['dek'        , 'bufferToStrFromB64'],
        ['password'   , 'bufferToStrFromB64'],
        ['passHash'   , 'buffer'],
        ['notes'      , "string"],
        ['isFavourite', "isFavToBool"],
        ['entryGroup', 'string'],
        ['extraFields', 'extraFields']
    ]
    ,

}

const vaultConstituents  = {
    '1.0.0' : [
        ['split',"|"],
        ['vaultMetadata', "vaultMD"],
        ['entries','entries'],
        ['entryGroups', 'entryGroup']
    ]
}

export const parsers = {
    // primitive parsers
    'string':(s:string|Buffer):string=>s.toString(),
    'date': (d:string):Date=>new Date(d),
    'bufferToStrFromB64': (str:Buffer):string=>str.toString('base64'),
    'isFavToBool': (str:string):boolean=>str==="1",

    // constituent parsers
    'entryMD': (md:string, version: string):any | undefined=>{
        const split = md.split(entryMDVersionConstituents[version][0][1]);
        let ret:any;
        const parsersToUse = entryMDVersionConstituents[version];
        
        for (let i = 1; i<parsersToUse.length; i++){
            ret.parsersToUse[i][0] = parsers[parsersToUse[i][1]](split[i-1]);
        }
        return ret;
    },

    'vaultMD': (md:String, version:string)=>{
        const split = md.split(vaultMDVersionConstituents[version][0][1]);
        let ret:any;
        const parsersToUse = vaultMDVersionConstituents[version];
        
        for (let i = 1; i<parsersToUse.length; i++){
            ret.parsersToUse[i][0] = parsers[parsersToUse[i][1]](split[i-1]);
        }
        return ret;
    },
    
    'entryGroup':(str:string)=>{
        const [groupName, entriesStr]=str.split("|")
        return {
            groupName,
            entries: entriesStr? entriesStr.split(",") : []
        }
    },
    
    
    
    // entry/vault level parsers
    'entry':(entryStr:string)=>{
        // since we will be re-using the same symbol to split all entries regardless of version, we can simply grab the first version we see
        // and look at it's split marker
        const version = entryStr.substring(0,entryStr.indexOf("$"));
        const constituents = entryConstituents[version];
        const split = entryStr.split(constituents[0][1]);
        let counter = 1;
        let res = {}
        for(let str of split){
            try {
                res[constituents[counter]] = parsers[constituents[counter][1]](str)    
            } catch (error) {
                throw new Error('Error occured whilst parsing entry: ',error);
                
            }
        }
        return res;
    },

    'vault': (vaultStr: string)=>{
        const version = vaultStr.substring(0, vaultStr.indexOf("$"));
        const constituents = vaultConstituents[version];
        const split = vaultStr.split(constituents[0][1]);
        let counter = 1;
        let res = {}
        for(let str of split){
            try {
                res[constituents[counter]] = parsers[constituents[counter][1]](str)    
            } catch (error) {
                throw new Error('Error occured whilst parsing entry: ',error);
                
            }
            
        }
        return res;
    }
}