import path from 'path'
import { app, clipboard, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import {setupMenus} from './helpers/setupMenus';
import { Entry, Vault, vaultService } from './services/vaultService';
import { preferenceStore } from './helpers/store/preferencesStore';
import { serialisers } from './helpers/serialisation/serialisers';
import { parsers } from './helpers/serialisation/parsers';
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
};


export const createNextronWindow = async () => {
  await app.whenReady()
  
  // setupMenus();
  
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
    mainWindow.webContents.openDevTools();
  }
}

// createNextronWindow()

app.whenReady().then(()=>{
  import('./ipcHandlers/fileIPCHandlers');
  import('./ipcHandlers/vaultIPCHandlers');
  import("./helpers/store/preferencesStore");
  

  
  if (vaultService.openVault('/Users/t/Desktop/coding/web_dev/password_manager/test.vlt') === "OK"){
    vaultService.setMasterPassword('testPass').then((_)=>{
      // vaultService.addEntry('test','test','test','test');
      console.log('adding entries')
      vaultService.addEntry(
        'test1',
        'test1',
        'test1',
        'test1', 
        [{name:"testFeild", data:Buffer.from("hello"), isProtected:false}])
      .then((response)=>{
        console.log('added ent 1');
      });
      vaultService.addEntry('test1','test1','test1','test1', [{name:"testFeild", data:Buffer.from("hello"), isProtected:false}])
      .then(()=>{
        console.log("added ent 2")
      })
      vaultService.addEntry('test1','test1','test1','test1', [{name:"testFeild", data:Buffer.from("hello"), isProtected:false}])
      .then(()=>{
        console.log("added ent 2")
      })
    })
  }

})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('before-quit',(e)=>{
  e.preventDefault();
  console.log('before quit triggered');

  gracefulShutdown('before-quit');
})

async function gracefulShutdown(source: string) {
  try {
    console.log(`[shutdown] source=${source}`);
    vaultService.closeVault();
  } catch (err) {
    console.error('[shutdown] error', err);
  } finally {
    app.exit(0); // NOT app.quit()
  }
}

['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => {
    gracefulShutdown(signal);
  });
});

ipcMain.handle('message', async (_, arg) => {
  return "hello "+arg
})

process.on("quit",()=>{
  console.log('quiting')
})



ipcMain.handle('clipboard:clear', ()=>{
  console.log(clipboard.read('ascii'))
  clipboard.clear();
  console.log('clipboard cleared')
})



