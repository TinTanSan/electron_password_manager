import { app, dialog, ipcMain } from 'electron';
import fs, { unlinkSync } from 'fs';
import path, { resolve } from 'path'


const data_path = app.getPath('userData');
const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  if(!fs.existsSync(path.join(data_path,"/recents.json"))){
    fs.writeFileSync(path.join(data_path,"/recents.json"), "[]");
    content = [];
  }else{
    // ensure no duplicates are in the recents
    const absoluteFilePath = resolve(filePath);
    
    content = JSON.parse(fs.readFileSync(data_path+"/recents.json").toString()).filter((x:string)=>x!==absoluteFilePath)
  }
  // only allow 10 entries
  if (content.length >= 10){
    content.pop();
  }
  // only add file if we can't find it
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

ipcMain.handle('fileDialog:create', async()=>{
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
    
    return filePath;
  }
  return undefined;
})

ipcMain.handle('fileDialog:open', async()=>{
  const fileDialog = await dialog.showOpenDialog({properties:['openFile']});
  const fileOpened = ( fileDialog).filePaths[0];
  if (!fileDialog.canceled){    
    if (!fileOpened.endsWith(".vlt")){
      return {fileContents:"INVALIDFILE", filePath:fileOpened, status:"INVALIDEXT"};
    }
    const fileContents =await fs.promises.readFile(fileOpened, 'utf-8');
    handleAddRecent(fileOpened);
    return {fileContents,filePath:fileOpened, status:"OK"}
  }
  return {fileContents:undefined, filePath:fileOpened, status:"CANCELLED"}
  
})  

ipcMain.handle('file:delete', async (_,filePath:string)=>{
  unlinkSync(filePath);
})


ipcMain.handle('recents:get', ()=>{
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
      return existingVaults;
      
    }else{
      // create the file and return empty array
      fs.writeFileSync(data_path + "/recents.json", "[]");
      return [];
    }
})

ipcMain.on('recents:add', (_,filepath)=>{
  
  handleAddRecent(filepath);
})