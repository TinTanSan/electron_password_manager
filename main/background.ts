import path from 'path'
import { app, dialog, ipcMain, Menu } from 'electron'
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
  })

  mainWindow.maximize();
  if (isProd) {
    await mainWindow.loadURL('app://./loadFile')
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
    const fileContents =await fs.promises.readFile(fileOpened, 'utf-8');
    handleAddRecent(fileOpened);
    return fileContents
  }
  return undefined
  
})  

ipcMain.handle('openFile', async(event, args)=>{
  if (fs.existsSync(args)){
    handleAddRecent(args);
    return await fs.promises.readFile(args, 'utf-8');
  }else{
    return undefined;
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
      return JSON.parse(fs.readFileSync(data_path + "/recents.json").toString());
    }else{
      // create the file and return empty array
      fs.writeFileSync(data_path + "/recents.json", "[]");
      return [];
    }
})

ipcMain.on('addRecent', (event,filepath)=>{
    handleAddRecent(filepath);
})


const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  if(!fs.existsSync(data_path+"/recents.json")){
    fs.writeFileSync(data_path+"/recents.json", "[]");
    content = [];
  }else{
    content = JSON.parse(fs.readFileSync(data_path+"/recents.json").toString())
  }
  // only allow 10 entries
  if (content.length >= 10){
    content.pop();
  }
  // only add file if we can't find it
  if (content.findIndex(x=>x === filePath) === -1){
    content.unshift(filePath);
  }
  fs.writeFileSync(data_path+"/recents.json", JSON.stringify(content));
}