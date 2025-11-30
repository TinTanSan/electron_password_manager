import { EntryGroup } from "../interfaces/Vault"


const entryMDVersionConstituents:Record<string, Record<string,string>[]>= {    
    '1.0.0':[{'split':'|'},{"createDate":'date'},{'lastEditDate':'date'},{"lastRotateDate":'date'},{"uuid":'string'},{"version":'string'}]
}

const vaultMDVersionConstituents:Record<string, string[]> = {
    '1.0.0':['string','date','date','date']
}

const vaultVersionConstituents:Record<string, string[]> ={
    '1.0.0':['']    
}


const entryConstituents = {
    '1.0.0':[
        {'split':"|"},
        {'username':"string"},
        {'dek':'bufferToStrFromB64'},
        {'password':'bufferToStrFromB64'},
        {'notes':"string"},
        {'isFavourite':"isFavToBool"},
        {
            'createDate':'date'
        },
        {
            'lastEditDate':'date'
        },
        {'lastRotateDate':'date'},
        {'uuid':'string'},
        {'version':'string'},
        {'extraFields':'extraFields'}
    ]

}


export const parsers = {
    // primitive parsers
    'string':(s:string):String=>s,
    'date': (d:string):Date=>new Date(d),
    'bufferToStrFromB64': (str:Buffer):String=>str.toString('base64'),
    'isFavToBool': (str:string)=>str==="1",

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
    
    'entryGroup':(str:string):EntryGroup=>{
        const [groupName, entriesStr]=str.split("|")
        return {
            groupName,
            entries: entriesStr? entriesStr.split(",") : []
        }
    }
    
    
    
    // entry/vault level parsers
}