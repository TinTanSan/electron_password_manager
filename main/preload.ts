import { contextBridge, ipcRenderer } from 'electron'
import { ExtraField } from './services/vaultService'

const vaultIPCHandlers = {
  openVault: (filePath:string)=>ipcRenderer.invoke('vault:open', filePath),
  setMasterPassword: (password:string)=>ipcRenderer.invoke('vault:setPass', password),
  unlockVault:(password:string)=>ipcRenderer.invoke('vault:unlock', password),
  lockVault:()=>ipcRenderer.send('vault:lock'),
  closeVault:()=>ipcRenderer.send('vault:close'),

  getPaginatedEntries: (page:number)=>ipcRenderer.invoke('vault:getPaginatedEntries', page),
  searchEntries: (title:string, username:string, notes:string)=>ipcRenderer.invoke('vault:searchEntries',title, username, notes),
  getNumEntries: ()=>ipcRenderer.invoke('vault:getNumEntries'),


  addEntryToGroup: (entryUUID, groupName)=>{ipcRenderer.invoke('vault:addEntryToGroup', entryUUID, groupName)},

  getEntry:(uuid:string)=>ipcRenderer.invoke('vault:getEntry'),
  updateEntryField:(uuid:string, fieldToUpdate:string, newValue:any)=>ipcRenderer.invoke('vault:updateEntry', uuid, fieldToUpdate, newValue ),
  decryptPass: (uuid:string)=>ipcRenderer.invoke("vault:decryptPass", uuid),
  addExtraField: (uuid:string, extraField:{name:string, data:Buffer, isProtected:boolean})=>ipcRenderer.invoke('vault:addExtraField', uuid,extraField),
  removeExtraField: (uuid:string, name:string)=>ipcRenderer.invoke('vault:removeExtrafield', uuid, name),
  deleteEntry:(uuid:string)=>ipcRenderer.invoke('vault:removeEntry', uuid),
  addEntry:(entry:{title:string,username:string, password:Buffer,notes:string, extraFields:Array<ExtraField>, group:string})=>ipcRenderer.invoke('vault:addEntry', entry)
  
}

const fileIPCHandlers = {
  openFilePicker: ()=>ipcRenderer.invoke('fileDialog:open'),
  openCreateFile: ()=>ipcRenderer.invoke('fileDialog:create'),
  deleteFile: (filepath:string)=>ipcRenderer.invoke('file:delete', filepath),
  getRecents: ()=>ipcRenderer.invoke('recents:get'),
  addRecent: (filePath:string)=>ipcRenderer.send('recents:add', filePath),
}

const clipBoardIPCHandlers = {
  clearClipboard: ()=>ipcRenderer.invoke('clipboard:clear'),
  copyPassword: (entryUUID:string) =>{},
}



contextBridge.exposeInMainWorld('vaultIPC', vaultIPCHandlers);
contextBridge.exposeInMainWorld('fileIPC', fileIPCHandlers);
contextBridge.exposeInMainWorld('clipBoardIPC', clipBoardIPCHandlers);


export type VaultIpcHandler = typeof vaultIPCHandlers;
export type FileIpcHandler = typeof fileIPCHandlers;
export type ClipBoardIPCHandler = typeof clipBoardIPCHandlers;
