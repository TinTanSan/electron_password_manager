import { app, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path, { resolve } from 'path'
import { IPCResponse } from '../interfaces/IPCCHannelInterface';
import os from 'os';
import { deleteFile, getRecents, handleAddRecent, handleRemoveRecent } from '#main/helpers/fsFunctions';



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
type FileType = {
  fileName:string;
  filePath:string;
  isDir:boolean
}
ipcMain.handle('file:get', async (_, filePath:string):Promise<IPCResponse<Array<FileType>>>=>{
  if (!fs.existsSync(filePath)){
    return {
      status: "CLIENT_ERROR",
      message:"Filepath does not exist",
      response: []
    }
  }
  const isDir = fs.statSync(filePath).isDirectory();
  if (isDir){
    return {
      status:"OK",
      response: fs.readdirSync(filePath, {withFileTypes:true}).map((x)=>({fileName:x.name, isDir:x.isDirectory(), filePath:path.join(x.parentPath, x.name)}))
    }
  }
  return {
    status:"CLIENT_ERROR",
    message:"filepath was not a directory, use file:open instead",
    response:[],
  }
})

ipcMain.handle('file:delete', async (_,filePath:string):Promise<IPCResponse<string>>=>{
  const res = await deleteFile(filePath);

  if (res === "OK"){
    return {
      status: "OK",
      response:"deleted vault"
    }
  }else{
    return {
      status: "CLIENT_ERROR",
      response:"file does not exist"
    }
  }
})

ipcMain.handle('file:homeDir', ():IPCResponse<string>=>{
  return {
    status:"OK",
    response:os.homedir(),
  }
})


ipcMain.handle('recents:get', ():IPCResponse<Array<string>>=>{
  return {
    status:"OK",
    response: getRecents()
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
  handleRemoveRecent(filePath);
  return {
    status:"OK",
    response:"removed"
  }
})