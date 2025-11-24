import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  openFilePicker: ()=>ipcRenderer.invoke('fileDialog:open'),
  openCreateFile: ()=>ipcRenderer.invoke('fileDialog:create'),
  openFile: (filePath:string)=>ipcRenderer.invoke('openFile', filePath),
  handleHome: ()=>ipcRenderer.send('home'),
  getRecents: ()=>ipcRenderer.invoke('recents:get'),
  addRecent: (filePath:string)=>ipcRenderer.send('recents:add', filePath),
  writeFile: (filePath:string, toWrite:Buffer)=>ipcRenderer.invoke('writeFile', ({filePath, toWrite})),
  clearClipboard: ()=>ipcRenderer.invoke('clipboard:clear'),
  getPreference: ()=>ipcRenderer.invoke('getPreferences'),
  updatePreference: (prefName:string, newValue:any)=>ipcRenderer.invoke('updatePreference', ({prefName, newValue})),
  addPreference: (prefName:string, newValue:any)=>ipcRenderer.invoke('addPreference', ({prefName, newValue})),
  delete: (prefName:string)=>ipcRenderer.invoke('deletePreference', ({prefName})),
  vaultOpen:(cb:Function)=>{ipcRenderer.on('vault:open', (_, payload)=>cb(payload))}
}



contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
