import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const handler = {
  sayHello: (name:string)=>ipcRenderer.invoke('message',name)
}

contextBridge.exposeInMainWorld('ipc', handler)

export type IpcHandler = typeof handler
