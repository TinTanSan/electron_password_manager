import path from 'path'
import { app, clipboard, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import {setupMenus} from './helpers/setupMenus';
import {preferenceStore} from './helpers/store/preferencesStore';
import { vaultService } from './services/vaultService';
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
};


export const createNextronWindow = async () => {
  await app.whenReady()

  setupMenus();
  
  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: '/renderer/public/images/icon.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
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
import * as fs from 'fs';

createNextronWindow()
app.whenReady().then(()=>{
  import('./ipcHandlers/fileIPCHandlers');
  const openVResult = vaultService.openVault('test1.vlt');
  if (openVResult === 'OK'){
    vaultService.setMasterPassword('Test123!').then((ret)=>{
      if (ret === 'OK'){
        vaultService.unlockVault('Test123!');
      }
      
    })
    
  }else{
    console.log("couldn't open vault")
  }
  
  
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('message', async (_, arg) => {
  return "hello "+arg
})



ipcMain.handle('clipboard:clear', ()=>{
  console.log(clipboard.read('ascii'))
  clipboard.clear();
  console.log('clipboard cleared')
})



