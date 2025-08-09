import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  sayHello: (name:string)=>ipcRenderer.invoke('message',name),
  openFilePicker: ()=>ipcRenderer.invoke('openFileDialog'),
  openCreateFile: ()=>ipcRenderer.invoke('createFileDialog'),
  openFile: (filePath:string)=>ipcRenderer.invoke('openFile', filePath),
  handleHome: ()=>ipcRenderer.send('home'),
  getRecents: ()=>ipcRenderer.invoke('getRecent'),
  addRecent: (filePath:string)=>ipcRenderer.send('addRecent', filePath),
  writeFile: (filePath:string, toWrite:string)=>ipcRenderer.invoke('writeFile', ({filePath, toWrite}))
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
