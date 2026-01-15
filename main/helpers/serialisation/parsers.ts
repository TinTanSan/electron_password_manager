import { dekSplit, entryConstituents, entryGroupsSplit, entryMDSplit, entryMDVersionConstituents, entrySplit, extraFieldsSplit, vaultConstituents, vaultMDVersionConstituents } from "./rules";
import { Entry, EntryGroup, EntryMetaData, ExtraField, Vault } from "../../services/vaultService";
import assert from "node:assert";


export const parsers = {
    // primitive parsers
    'string':(s:string|Buffer):string=>typeof s === 'string'? s : s.toString(),
    'b64Buff':(b64:string)=>Buffer.from(b64, 'base64'),
    'buffer':(s:string):Buffer=>Buffer.from(s),
    'date': (d:string):Date=>new Date(d),
    'isFavToBool': (str:string):boolean=>str==="1",
    'dek':(dek:string)=>{
        const [iv, tag, wrappedKey] = dek.split(dekSplit);
        return {iv:parsers.b64Buff(iv), tag:parsers.b64Buff(tag), wrappedKey:parsers.b64Buff(wrappedKey)};
    },
    // constituent parsers
    'entryMD': (md:string):any | undefined=>{
        const version = md.split(entryMDSplit)[0];
        const split = md.split(entryMDSplit).slice(0,-1);
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
        return efs ? efs.split(extraFieldsSplit).map((ef:string)=>{
            const split = ef.split("_");
            return {
                name: split[0], 
                data: parsers.buffer(split[1]), 
                isProtected: parsers.isFavToBool(split[2])
            };
        }) : []
    },

    'vaultMD': (md:String)=>{
        const version = md.split("$")[0];
        const split = md.split(vaultMDVersionConstituents[version][0][1]);
        let ret:any ={};
        const parsersToUse = vaultMDVersionConstituents[version];
        for (let i = 1; i<parsersToUse.length; i++){
            ret[parsersToUse[i][0]] = parsers[parsersToUse[i][1]](split[i-1])
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
    'entryGroups':(groups:string)=>{
        groups.split(entryGroupsSplit).map((group)=>parsers['entryGroup'](group));
    },
    
    
    // entry/vault level parsers
    'entry':(entryStr:string):Entry=>{
       
        const version = entryStr.substring(0,entryStr.indexOf(entryMDSplit));
        const constituents = entryConstituents[version];
        const split = entryStr.split(constituents[0][1]);
        const now = new Date();
        let res = {
            metadata : {createDate:now,
                lastEditDate:now,
                lastRotateDate:now,
                uuid: "",
                version: "", 
            },
            title    : "",
            username : "",
            dek:{
                wrappedKey: Buffer.from(''),
                iv: Buffer.from(""),
                salt: Buffer.from(""),
                tag: Buffer.from(""),
            },
            password : Buffer.from(''),
            passHash : Buffer.from(''),
            notes    : "",
            isFavourite: false,
            extraFields: [],
            group: "",
        }
        for(let i = 1; i< constituents.length; i++){
            const constituent = constituents[i];
            res[constituent[0]] = parsers[constituent[1]](split[i-1]);
        }
        return res;
    },
    'entries':(entriesStr:string)=>{
        const split = entriesStr.split(entrySplit);
        const entryArray = split.map((entry)=>{
            const parsedEnt = parsers.entry(entry)
            console.log(parsedEnt);
            return [parsedEnt.metadata.uuid,parsedEnt]
        });
        const entries = new Map();
        
        return 
    },

    'vault': (vaultStr: Buffer)=>{
        const vs = vaultStr.toString().substring(vaultStr.findIndex(x=>x === 10)+1);
        // char code of $ is 36
        
        const version = vs.substring(0, vs.indexOf("$"));
        const constituents = vaultConstituents[version];
        const split = vs.split(constituents[0][1]);
        let counter = 1;
        let res:Vault = {
            filePath: '',
            fileContents: vaultStr,
            isUnlocked: false,
            kek: {passHash:"",salt:Buffer.from(""),kek:Buffer.from("")},
            entries:new Map(),
            vaultMetadata:{
                createDate: new Date(),
                lastEditDate: new Date(),
                version: '1.0.0'
            },
            entryGroups:[]
        }
        for(let str of split){
            if (!str) continue;
            try {
                res[constituents[counter][0]] = parsers[constituents[counter][1]](str)    
                counter +=1
            } catch (error) {
                throw new Error('Error occured whilst parsing entry: ',error);
                
            }
        }
        console.log('parsed vault with version: '+res.vaultMetadata.version)
        return res;
    }
}