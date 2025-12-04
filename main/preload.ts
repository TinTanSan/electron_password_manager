import { contextBridge, ipcRenderer } from 'electron'

const handler = {
  openFilePicker: ()=>ipcRenderer.invoke('fileDialog:open'),
  openCreateFile: ()=>ipcRenderer.invoke('fileDialog:create'),
  // openFile: (filePath:string)=>ipcRenderer.invoke('openFile', filePath),
  openVault: (filePath:string)=>ipcRenderer.invoke('vault:open', filePath),
  setVaultMasterPass: (password:string)=>ipcRenderer.invoke('vault:setPass', password),
  unlockVault: (password:string)=>ipcRenderer.invoke('vault:unlock', password),

  handleHome: ()=>ipcRenderer.send('home'),
  getRecents: ()=>ipcRenderer.invoke('recents:get'),
  addRecent: (filePath:string)=>ipcRenderer.send('recents:add', filePath),
  writeFile: (filePath:string, toWrite:Buffer)=>ipcRenderer.invoke('writeFile', ({filePath, toWrite})),
  clearClipboard: ()=>ipcRenderer.invoke('clipboard:clear'),
}



contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
