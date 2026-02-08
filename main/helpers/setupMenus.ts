import { BrowserWindow, Menu, MenuItem } from "electron"
import { createNextronWindow } from "../background";


const handleGlobOpenVault = ()=>{
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  console.log('vault:open handler called')
  win.webContents.send('vault:open')
}
const handleCloseWindow = ()=>{
  const win = BrowserWindow.getFocusedWindow();
  win.webContents.send("vault:close")
  // if (!win) return;
  // win.close();
}

const handleCreateVaultOrWindow = ()=>{
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0){
    // create new vault;
  }else{
    createNextronWindow();
  }
}


export const setupMenus = ()=>{
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
      accelerator: 'CommandOrControl+Shift+N'
    }
  ])

  const editSubmenu = Menu.buildFromTemplate([
    {label:
        'Create new Entry',
        accelerator: 'Command+N'
    }
    ])
  menu.append(new MenuItem({ label: 'File', submenu:fileSubmenu }))

  Menu.setApplicationMenu(menu)
}