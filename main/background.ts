import path from 'path'
import { app, BrowserWindow, clipboard, dialog, globalShortcut, ipcMain, Menu } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import fs from 'fs';
import { MenuItem } from 'electron';

const isProd = process.env.NODE_ENV === 'production'
const data_path = app.getPath('userData');


if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
};


const handleGlobOpenVault = ()=>{
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  console.log('vault:open handler called')
  win.webContents.send('vault:open')
}
const handleCloseWindow = ()=>{
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.close();
}

const handleCreateVaultOrWindow = ()=>{
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0){
    // create new vault;
  }else{
    createNextronWindow();
  }
}


const setupMenus = ()=>{
  const menu = new Menu()

  if (process.platform === 'darwin') {
    const appMenu = new MenuItem({ role: 'appMenu' })
    menu.append(appMenu)
  }

  const fileSubmenu = Menu.buildFromTemplate([
    {
      label: 'Open a Vault',
      click: handleGlobOpenVault,
      accelerator: 'CommandOrControl+O'
    },
    {
      label:"Close window",
      click:  handleCloseWindow,
      accelerator: 'CommandOrControl+W'
    },
    {
      label:"New Vault",
      click : handleCreateVaultOrWindow,
      accelerator: 'CommandOrControl+N'
    }


  ])
  menu.append(new MenuItem({ label: 'File', submenu:fileSubmenu }))

  Menu.setApplicationMenu(menu)
}

const createNextronWindow = async () => {
  await app.whenReady()

  setupMenus();
  
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: '/renderer/public/images/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    minWidth:800,
    minHeight:600
  })

  mainWindow.maximize();
  if (isProd) {
    await mainWindow.loadURL('app://./loadFile/index.html')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/loadFile`)
    mainWindow.webContents.openDevTools()
  }
}

createNextronWindow()


ipcMain.handle('message', async (_, arg) => {
  return "hello "+arg
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

ipcMain.handle('fileDialog:create', async()=>{
  const fileDialog = await dialog.showSaveDialog({title:"Create new file"
    ,filters:[{
      name:'vault', extensions:['.vlt']
    }]
  });
  if (!fileDialog.canceled){
    const filePath = fileDialog.filePath;
    // we expect this to error because the file doesn't exist yet, so this call will actually only cerate the file
    handleAddRecent(filePath);
    fs.open(filePath,'w+', (_)=>{
    })
    
    return filePath;
  }
  return undefined;
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});


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

ipcMain.on('updatePreference', (_,args)=>{

})

ipcMain.on('addPreference', (_,args)=>{})

ipcMain.on('deletePreference', (_,args)=>{})

ipcMain.on('getPreferences', ()=>{

})

ipcMain.handle('clipboard:clear', ()=>{
  console.log(clipboard.read('ascii'))
  clipboard.clear();
  console.log('clipboard cleared')
})


const handleAddRecent = (filePath:string)=>{
  let content:Array<string> = [];
  if(!fs.existsSync(path.join(data_path,"/recents.json"))){
    fs.writeFileSync(path.join(data_path,"/recents.json"), "[]");
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
  fs.writeFileSync(path.join(data_path+"/recents.json"), JSON.stringify(content));
}

