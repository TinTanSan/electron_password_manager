import path from 'path'
import { app, clipboard, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import {vaultService } from './services/vaultService';
import { setupMenus } from './helpers/setupMenus';
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
};

// track the trusted window ids, so that if someone tries to send a message to the backend to perform 
export const trustedIDS = new Set();

export const createNextronWindow = async () => {
  await app.whenReady()
  
  

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
  });


  // setupMenus();

  trustedIDS.add(mainWindow.webContents.id);

  mainWindow.maximize();
  if (isProd) {
    await mainWindow.loadURL('app://./loadFile/index.html')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/loadFile`)
    mainWindow.webContents.openDevTools();
    mainWindow.focus();
  }
  mainWindow.on('close',()=>{
    trustedIDS.delete(mainWindow.webContents.id);
  })
}

createNextronWindow()

app.whenReady().then(()=>{
  import('./ipcHandlers/VaultIPCHandlers');
  import('./ipcHandlers/fileIPCHandlers');
  import('./ipcHandlers/GroupIPCHandlers');
  import('./ipcHandlers/EntryIPCHandlers');
  import("./helpers/store/preferencesStore");
  import("./ipcHandlers/PreferenceIPCHandlers")
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    trustedIDS.clear();
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
    trustedIDS.clear();
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



