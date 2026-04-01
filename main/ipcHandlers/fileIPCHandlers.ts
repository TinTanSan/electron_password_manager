import { app, dialog, ipcMain } from 'electron';
import fs, { unlinkSync } from 'fs';
import path, { resolve } from 'path'
import { IPCResponse } from '../interfaces/IPCCHannelInterface';


const data_path = app.getPath('userData');
const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  const recentsFilePath = path.join(data_path, "/recents.json");
  if(!fs.existsSync(recentsFilePath)){
    fs.writeFileSync(recentsFilePath, "[]");
    content = [];
  }else{
    // ensure no duplicates are in the recents
    const absoluteFilePath = resolve(filePath);
    
    const fileContents = fs.readFileSync(data_path+"/recents.json").toString();
    const recentVaults = JSON.parse(fileContents);
    content = recentVaults.filter((x:string)=>x!==absoluteFilePath)
  }
  // only allow 10 entries
  if (content.length >= 10){
    content.pop();
  }
  
  content.unshift(filePath);
  fs.writeFileSync(path.join(data_path+"/recents.json"), JSON.stringify(content));
}



export const openFile  = (filePath)=>{
   if (fs.existsSync(filePath)){
    handleAddRecent(filePath);
    return {fileContents:Buffer.from(fs.readFileSync(filePath)), filePath: filePath, status:"OK"};
  }else{
    return {fileContents:undefined, filePath:filePath, status:"NOTFOUND"};
  }

}

export const writeToFile = (args:{filePath:string, toWrite: Buffer | string})=>{
  const {filePath, toWrite} = args;
    if (fs.existsSync(filePath)){
      fs.writeFileSync(filePath, toWrite);
      return "OK";
    }else{
      return "NOTFOUND"
    }
}

export const writeToFileAsync = async (args:{filePath:string, toWrite: Buffer | string})=>{
  const {filePath, toWrite} = args;
    if (fs.existsSync(filePath)){
      fs.writeFile(filePath, toWrite, (err)=>{
        console.error(err);
        return "NOT OK - "+ err
      });
      return "OK";
    }else{
      return "NOTFOUND"
    }
}

ipcMain.handle('fileDialog:create', async():Promise<IPCResponse<string>>=>{
  try {
    const fileDialog = await dialog.showSaveDialog({title:"Create new file"
      ,filters:[{
        name:'vault', extensions:['.vlt']
      }]
    });
    if (!fileDialog.canceled){
      const filePath = fileDialog.filePath;
      handleAddRecent(filePath);
      fs.open(filePath,'w+', (_)=>{
      })
      
      return {status:"OK", response:filePath};
    }
    return {status:"CLIENT_ERROR", message:"user did not open a vault", response:""};  
  } catch (error) {
      return {
        status:"INTERNAL_ERROR",
        message:error,
        response:""
      }
  }
  
})

ipcMain.handle('fileDialog:open', async():Promise<IPCResponse<{fileContents:string, filePath:string}>>=>{
  const fileDialog = await dialog.showOpenDialog({properties:['openFile']});
  const fileOpened = ( fileDialog).filePaths[0];
  console.log(fileDialog, fileOpened);
  if (!fileDialog.canceled){    
    if (!fileOpened.endsWith(".vlt")){

      return {
        status:"CLIENT_ERROR",
        message:"invalid file extension",
        response:{fileContents:"", filePath:""}
      }
    }
    const fileContents =await fs.promises.readFile(fileOpened, 'utf-8');
    handleAddRecent(fileOpened);
    return {
      status:"OK",
      response:{fileContents,filePath:fileOpened}
    }
  }
  return {
    status:"CLIENT_ERROR",
    message:"user did not open a vault",
    response:{fileContents:undefined, filePath:fileOpened}
  }
  
})  

ipcMain.handle('file:delete', async (_,filePath:string):Promise<IPCResponse<string>>=>{
  unlinkSync(filePath);
  return {
    status:"OK",
    response:"deleted vault"
  }
})


ipcMain.handle('recents:get', ():IPCResponse<Array<string>>=>{
  const recentsPath = path.join(data_path , "/recents.json");
    if (fs.existsSync(recentsPath)){
      // read file 
      const recentVaults = JSON.parse(fs.readFileSync(recentsPath).toString());
      const existingVaults = recentVaults.filter((x:string)=>fs.existsSync(x))
      // make sure that if for some reason the vaults were deleted in between sessions, then we are able to 
      // update recents to exlude those vaults
      if (existingVaults.length != existingVaults ){
        
        fs.writeFileSync(path.join(data_path + "/recents.json"), JSON.stringify(existingVaults));
      }

      return {
        status:"OK",
        response:
        existingVaults};
      
    }else{
      // create the file and return empty array
      fs.writeFileSync(data_path + "/recents.json", "[]");
      return {
        status:"OK",
        response:[]
      };
    }
})

ipcMain.on('recents:add', (_,filepath):IPCResponse<string>=>{
  
  handleAddRecent(filepath);
  return {
    status:"OK",
    response:"OK"
  }
})

ipcMain.handle('recents:remove', (_, filePath:string): IPCResponse<string>=>{
  let content:Array<string> = [];
  if(!fs.existsSync(path.join(data_path,"/recents.json"))){
    fs.writeFileSync(path.join(data_path,"/recents.json"), "[]");
    return {
      status: "INTERNAL_ERROR", 
      message:"recents file not found",
      response: "NO_RECENTS_FILE"
      }
  }else{
    content = JSON.parse(fs.readFileSync(data_path+"/recents.json").toString());
    fs.writeFileSync(path.join(data_path, "/recents.json"), JSON.stringify(content.filter(x=>x!==filePath)));
    return {
      status:"OK",
      response:"removed"
    }
  }
})