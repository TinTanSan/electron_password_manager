
import { app } from "electron";
import { existsSync, readFileSync, unlinkSync, writeFile, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import path, { resolve } from "path";

export async function openFile(filePath:string):Promise<Buffer>{
    if (!existsSync(filePath)){
        throw new Error("file does not exist");
    }
    return await readFile(filePath);

}
export function openFileSync(filePath:string):Buffer{
    if (!existsSync(filePath)){
        throw new Error("file does not exist");
    }
    return readFileSync(filePath);
}
export async function deleteFile(filePath:string){
    if (!existsSync(filePath)){
        return "NOTFOUND";
    }
    unlinkSync(filePath);
    return "OK"
}

export const writeToFileAsync = async (filePath:string, toWrite: Buffer | string)=>{
    if (!existsSync(filePath)){
      
      return "NOTFOUND"
    }
    writeFile(filePath, toWrite, (err)=>{
        if (err){
            return "NOT OK - "+ err
        }
        console.error(err);
    });
    return "OK";
}

export const data_path = app.getPath('userData');

export const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  const recentsFilePath = path.join(data_path, "/recents.json");
  if(!existsSync(recentsFilePath)){
    writeFileSync(recentsFilePath, "[]");
    content = [];
  }else{
    // ensure no duplicates are in the recents
    const absoluteFilePath = resolve(filePath);
    
    const fileContents = readFileSync(data_path+"/recents.json").toString();
    const recentVaults = JSON.parse(fileContents);
    content = recentVaults.filter((x:string)=>x!==absoluteFilePath)
  }
  // only allow 10 entries
  if (content.length >= 10){
    content.pop();
  }
  
  content.unshift(filePath);
  writeFileSync(path.join(data_path+"/recents.json"), JSON.stringify(content));
}

export const handleRemoveRecent = (filePath:string)=>{
    const recentsFilePath = path.join(data_path, "/recents.json");
    if (!existsSync(recentsFilePath)){
        writeFileSync(path.join(data_path,"/recents.json"), "[]")
    }
    else{
        const content = JSON.parse(readFileSync(data_path+"/recents.json").toString())
        writeFileSync(path.join(data_path, "/recents.json"), JSON.stringify(content.filter((x:string)=>x!==filePath)))
    }
}

export const getRecents = ()=>{
    
    const recentsFilePath = path.join(data_path, "/recents.json");
    if (!existsSync(recentsFilePath)){
        writeFileSync(data_path + "/recents.json", "[]");
        return [];
    }
    return JSON.parse(readFileSync(recentsFilePath).toString())
}

// export const writeToFile = (filePath:string, toWrite: Buffer | string)=>{
//     if (!existsSync(filePath)){
//       return "NOTFOUND"
//     }
//     writeFileSync(filePath, toWrite);
//     return "OK";
// }