import path from 'path'
import { app, clipboard, dialog, ipcMain, Menu } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production'
const data_path = app.getPath('userData');


if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
};


(async () => {
  await app.whenReady()
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    minWidth:800,
    minHeight:600
  })

  mainWindow.maximize();
  if (isProd) {
    await mainWindow.loadURL('app://loadFile')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/loadFile`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('message', async (event, arg) => {
  return "hello "+arg
})

ipcMain.handle('openFileDialog', async()=>{
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

ipcMain.handle('openFile', async(event, args)=>{
  if (fs.existsSync(args)){
    handleAddRecent(args);
    
    return {fileContents:Buffer.from(fs.readFileSync(args)), filePath: args, status:"OK"};
  }else{
    return {fileContents:undefined, filePath:args, status:"NOTFOUND"};
  }
  
  
})

ipcMain.handle('writeFile', async(event, args)=>{
  const {filePath, toWrite} = args;
  if (fs.existsSync(filePath)){
    fs.writeFileSync(filePath, toWrite);
    return "OK";
  }else{
    return "NOTFOUND"
  }

})


ipcMain.handle('createFileDialog', async()=>{
  const fileDialog = await dialog.showSaveDialog({title:"Create new file"
    ,filters:[{
      name:'vault', extensions:['.vlt']
    }]
  });
  if (!fileDialog.canceled){
    const filePath = fileDialog.filePath;
    // we expect this to error because the file doesn't exist yet, so this call will actually only cerate the file
    fs.open(filePath,'w+', (_)=>{
    })
    return filePath;
  }
  return undefined;
})

ipcMain.handle("getRecent", ()=>{
    if (fs.existsSync(data_path + "/recents.json")){
      // read file 
      const recentVaults = JSON.parse(fs.readFileSync(data_path + "/recents.json").toString());
      const existingVaults = recentVaults.filter((x:string)=>fs.existsSync(x))
      // make sure that if for some reason the vaults were deleted in between sessions, then we are able to 
      // update recents to exlude those vaults
      if (existingVaults.length != existingVaults ){
        fs.writeFileSync(data_path + "/recents.json", JSON.stringify(existingVaults));
      }
      return existingVaults;
      
    }else{
      // create the file and return empty array
      fs.writeFileSync(data_path + "/recents.json", "[]");
      return [];
    }
})

ipcMain.on('addRecent', (event,filepath)=>{
    handleAddRecent(filepath);
})

ipcMain.handle('removeClipboard', ()=>{
  console.log(clipboard.read('ascii'))
  clipboard.clear();
  console.log('clipboard cleared')
})


const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  if(!fs.existsSync(data_path+"/recents.json")){
    fs.writeFileSync(data_path+"/recents.json", "[]");
    content = [];
  }else{
    // ensure no duplicates are in the recents
    content = JSON.parse(fs.readFileSync(data_path+"/recents.json").toString()).filter((x:string)=>x!==filePath)
  }
  // only allow 10 entries
  if (content.length >= 10){
    content.pop();
  }
  // only add file if we can't find it
  content.unshift(filePath);
  fs.writeFileSync(data_path+"/recents.json", JSON.stringify(content));
}