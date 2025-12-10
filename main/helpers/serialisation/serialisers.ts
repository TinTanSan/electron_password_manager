import { EntryMetaData, vaultMetaData } from "../../services/vaultService";
import { entryMDVersionConstituents, vaultMDVersionConstituents } from "./rules";

export const serialisers = {
    'date': (d:Date)=>d.toISOString(),
    'string':(s:string|Buffer):string=>s.toString(),
    'buffer':(b:Buffer):string=>b.toString(),
    'isFavToBool': (bool:boolean) => bool ? '1' : '0',

    'entryMD': (entryMetadata:EntryMetaData)=>{
        const consitituents = entryMDVersionConstituents[entryMetadata.version];
        let res = "";
        const joiner = entryMDVersionConstituents[0][1];
        for (let constituent of consitituents){
            if (constituent[0] === "split") continue;   
            res += serialisers[constituent[1]](entryMetadata[constituent[0]]) + joiner;
        }
        return res;
    },

    'vaultMD': (md:vaultMetaData)=>{
            // const split = md.split(vaultMDVersionConstituents[version][0][1]);
            let ret:any;
            const parsersToUse = vaultMDVersionConstituents[md.version];
            const joiner = vaultMDVersionConstituents[0][1];
            for (let i = 1; i<parsersToUse.length; i++){
                ret.parsersToUse[i][0] = serialisers[parsersToUse[i][1]](md[parsersToUse[i][0]]) + joiner ;
            }
            return ret;
        },
}