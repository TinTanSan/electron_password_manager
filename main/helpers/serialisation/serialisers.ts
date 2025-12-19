import { Entry, EntryGroup, EntryMetaData, ExtraField, Vault, vaultMetaData } from "../../services/vaultService";
import { entryConstituents, entryMDVersionConstituents, vaultConstituents, vaultMDVersionConstituents } from "./rules";

export const serialisers = {
    'date': (d:Date)=>d.toISOString(),
    'string':(s:string|Buffer):string=>s.toString(),
    'buffer':(b:Buffer):string=>b.toString(),
    'isFavToBool': (bool:boolean) => bool ? '1' : '0',

    'entryMD': (entryMetadata:EntryMetaData)=>{
        const consitituents = entryMDVersionConstituents[entryMetadata.version];
        let res = "";
        const joiner = consitituents[0][1];
        for (let constituent of consitituents){
            if (constituent[0] === "split") continue; 
            res += serialisers[constituent[1]](entryMetadata[constituent[0]]) + joiner;
        }
        return res;
    },

    'vaultMD': (md:vaultMetaData)=>{
        // const split = md.split(vaultMDVersionConstituents[version][0][1]);
        let ret= "";
        const serialiserToUse = vaultMDVersionConstituents[md.version];
        const joiner = serialiserToUse[0][1];
        for (let i = 1; i<serialiserToUse.length; i++){
            ret += serialisers[serialiserToUse[i][1]](md[serialiserToUse[i][0]]) + joiner ;
        }
        return ret;
    },
    'entryGroups': (groups:Array<EntryGroup>)=>{
        if (groups.length === 0) return '';
        return groups.map(group=>serialisers['entryGroup'](group)).join("|");
    },
    'entryGroup':(group:EntryGroup)=>{
        return group.groupName + "|" + group.entries.join(",")
    },
    'extraFields': (extrafields:Array<ExtraField>)=>{
        return extrafields.map((ef)=>{
            ef.name + "_"+ serialisers.buffer(ef.data) + "_"+serialisers.isFavToBool(ef.isProtected);
        }).join('`');
    },

    'entry' : (entry:Entry)=>{
        console.log('attempting to serialise: ', entry)
        const serialiserToUse = entryConstituents[entry.metadata.version];
        const joiner = serialiserToUse[0][1];
        let ret = "";
        for (let i = 1; i<serialiserToUse.length; i++){
            ret += serialisers[serialiserToUse[i][1]](entry[serialiserToUse[i][0]]) + joiner;
        }
        return ret;
    },
    'entries': (entries:Array<Entry>)=>{
        return entries.map((entry)=>serialisers.entry(entry)).join("#");
    },
    'vault': (vault:Vault)=>{
        const serialiserToUse = vaultConstituents[vault.vaultMetadata.version];
        const joiner = serialiserToUse[0][1];
        let ret = "";
        console.log('joiner: ',joiner);
        for (let i = 1; i<serialiserToUse.length; i++){
            console.log(serialiserToUse[i])
            ret += serialisers[serialiserToUse[i][1]](vault[serialiserToUse[i][0]]) + joiner;
        }
        return ret;
    }
}