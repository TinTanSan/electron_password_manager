import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  openFilePicker: ()=>ipcRenderer.invoke('fileDialog:open'),
  openCreateFile: ()=>ipcRenderer.invoke('fileDialog:create'),
  // openFile: (filePath:string)=>ipcRenderer.invoke('openFile', filePath),
  openVault: (filePath:string)=>ipcRenderer.invoke('vault:open', filePath),
  handleHome: ()=>ipcRenderer.send('home'),
  getRecents: ()=>ipcRenderer.invoke('recents:get'),
  addRecent: (filePath:string)=>ipcRenderer.send('recents:add', filePath),
  writeFile: (filePath:string, toWrite:Buffer)=>ipcRenderer.invoke('writeFile', ({filePath, toWrite})),
  clearClipboard: ()=>ipcRenderer.invoke('clipboard:clear'),
  vaultOpen:(cb:Function)=>{ipcRenderer.on('vault:open', (_, payload)=>cb(payload))}
}



contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
