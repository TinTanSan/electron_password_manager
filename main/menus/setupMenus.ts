import { BrowserWindow, Menu, MenuItem } from "electron"
import { createNextronWindow } from "../background";
import { vaultService } from "#main/services/vaultService";


const handleGlobOpenVault = ()=>{
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  console.log('vault:open handler called')
  win.webContents.send('vault:open')
}
const handleCreateVaultOrWindow = ()=>{
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0){
    // create new vault;
  }else{
    createNextronWindow();
  }
}

const handleCreateNewEntry =() =>{
  console.log("creating new entry")
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
      label:"New Vault",
      click : handleCreateVaultOrWindow,
      accelerator: 'CommandOrControl+Shift+N'
    }
  ])
  const checkIsUnlocked = ()=>{
    console.log(vaultService.vault)
    return (vaultService.vault !== undefined && vaultService.vault.isUnlocked)
  }

  const editSubmenu = Menu.buildFromTemplate([
    {label:
        'Create new Entry',
        accelerator: 'Command+N',
        enabled: checkIsUnlocked(),
        click: handleCreateNewEntry
    }
    ])

  const devMenu = Menu.buildFromTemplate([
    {
      label:'Open dev tools',
      accelerator:'Command+Ctrl+I',
      role: 'toggleDevTools'
    }
  ])
  menu.append(new MenuItem({ label: 'File', submenu:fileSubmenu }))
  menu.append(new MenuItem({ label: 'Edit', submenu:editSubmenu }))
  menu.append(new MenuItem({ label: 'Dev', submenu:devMenu }))
  // Menu.on("",()=>{})
  Menu.setApplicationMenu(menu)
  
}