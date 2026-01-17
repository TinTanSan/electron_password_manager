import path from 'path'
import { app, clipboard, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import {vaultService } from './services/vaultService';
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
  const response = vaultService.openVault('/Users/t/Desktop/coding/web_dev/password_manager/test.vlt');
  // vaultService.setMasterPassword('testPass').then((res)=>{
  //     if (res.status === "OK"){
  if (response === "OK"){
    vaultService.unlockVault('testPass').then((response)=>{
      console.log(response);
    })
  }
  
      // vaultService.addEntry('test1','test1','test1','test1').then(()=>{
      //   vaultService.addEntry('test2','test2','test2','test2').then(()=>{
      //     vaultService.addEntry('test3','test3','test3','test3').then(()=>{
      //       vaultService.lockVault();
      //     })  
      //   })
      // })      
    // })
  // }
  

})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('before-quit',(e)=>{
  e.preventDefault();
  gracefulShutdown('before-quit');
})

async function gracefulShutdown(source: string) {
  try {
    console.log(`[shutdown] source=${source}`);
    await vaultService.closeVault();
  } catch (err) {
    console.error('[shutdown] error', err);
  } finally {
    app.exit(0);
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




ipcMain.handle('clipboard:clear', ()=>{
  clipboard.clear();
})



