import path from 'path'
import { app, clipboard, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow} from './helpers'
import {setupMenus} from './helpers/setupMenus';

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

app.whenReady().then(()=>{
  import('./ipcHandlers/fileIPCHandlers');
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('message', async (_, arg) => {
  return "hello "+arg
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



