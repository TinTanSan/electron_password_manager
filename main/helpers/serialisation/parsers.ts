import { parse } from "path";
import { entryConstituents, entryMDVersionConstituents, vaultConstituents, vaultMDVersionConstituents } from "./rules";
import { serialisers } from "./serialisers";
import { EntryMetaData, ExtraField, Vault } from "../../services/vaultService";
import { assert } from "console";
import { Entry } from "../../../renderer/interfaces/Entry";


export const parsers = {
    // primitive parsers
    'string':(s:string|Buffer):string=>typeof s === 'string'? s : s.toString(),
    'buffer':(s:string):Buffer=>Buffer.from(s),
    'date': (d:string):Date=>new Date(d),
    'isFavToBool': (str:string):boolean=>str==="1",

    // constituent parsers
    'entryMD': (md:string):any | undefined=>{
        const version = md.split("$")[0];
        const split = md.split(entryMDVersionConstituents[version][0][1]).slice(0,-1);
        let ret:EntryMetaData = {
            version: '',
            createDate: new Date(),
            uuid: '',
            lastEditDate: new Date(),
            lastRotateDate: new Date(),
        };
        const parsersToUse = entryMDVersionConstituents[version];
        assert(split.length === parsersToUse.length-1, 'split did not split entry metadata to the number of items expected, expected '+parsersToUse.length+" but got "+split.length);
        for (let i = 1; i<parsersToUse.length; i++){
            ret[parsersToUse[i][0]] = parsers[parsersToUse[i][1]](split[i-1]);
        }
        return ret;
    },
    // all extrafields
    'extraFields': (efs:string)=>{
        return efs ? efs.split('`').map((ef:string)=>{
            const split = ef.split("_");
            return {
                name: split[0], 
                data: parsers.buffer(split[1]), 
                isProtected: parsers.isFavToBool(split[2])
            };
        }) : []
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
        let res = {}
        for(let i = 1; i< constituents.length; i++){
            const constituent = constituents[i];
            res[constituent[0]] = parsers[constituent[1]](split[i-1]);
        }
        return res;
    },
    'entries':(entriesStr:string)=>{
        const split = entriesStr.split("#");
        return split.map((entry)=>parsers.entry(entry))
    },

    'vault': (vaultStr: Buffer)=>{
        const vs = vaultStr.toString();
        // char code of $ is 36
        const version = vaultStr.subarray(0, vaultStr.findIndex((char)=>char === 36)).toString();
        const constituents = vaultConstituents[version];
        const split = vs.split(constituents[0][1]);
        let counter = 1;
        let res:Vault = {
            filePath: '',
            fileContents: vaultStr,
            isUnlocked: false,
            kek: Buffer.from(""),
            entries:[],
            vaultMetadata:{
                createDate: new Date(),
                lastEditDate: new Date(),
                version: '1.0.0'
            }
            
        }
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