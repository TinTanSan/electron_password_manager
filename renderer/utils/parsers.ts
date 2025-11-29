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


export const parsers = {
    'string':(s:string):String=>s,
    'date': (d:string):Date=>new Date(d),
    'entryMD': (md:string, version: string):any | undefined=>{
        const split = md.split(entryMDVersionConstituents[version][0][1]);
        let ret:any;
        // Object.keys(EntryMetadata)
        const parsersToUse = entryMDVersionConstituents[version];
        
        for (let i = 1; i<parsersToUse.length; i++){
            ret.parsersToUse[i][0] = parsers[parsersToUse[i][1]](split[i-1]);
        }
        return ret;
    },
    'bufferToStrFromB64': (str:Buffer):String=>str.toString('base64'),
    'entryGroup':(str:string):EntryGroup=>{
        const [groupName, entriesStr]=str.split("|")
        return {
            groupName,
            entries: entriesStr? entriesStr.split(",") : []
        }
    }
}