import { Entry, EntryMetaData, Vault, vaultMetaData } from "../../services/vaultService";
import { entryConstituents, entryMDVersionConstituents, vaultMDVersionConstituents } from "./rules";

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

    'entry' : (entry:Entry)=>{
        const serialiserToUse = entryConstituents[entry.metadata.version];
        const joiner = serialiserToUse[0][1];
        let ret = "";
        for (let i = 1; i<serialiserToUse.length; i++){
            ret += serialiserToUse[serialiserToUse[i][1]](entry[serialiserToUse[i][0]]) + joiner;
        }
    },
    'vault': (vault:Vault)=>{
        const serialiserToUse = entryConstituents[vault.vaultMetadata.version];
        const joiner = serialiserToUse[0][1];
        let ret = "";
        for (let i = 1; i<serialiserToUse.length; i++){
            ret += serialiserToUse[serialiserToUse[i][1]](vault[serialiserToUse[i][0]]) + joiner;
        }
    }
}