import { ipcRenderer } from "electron"

export const vaultIPCChannels = {
  // Vault level IPC channels
  openVault: (filePath:string)=>ipcRenderer.invoke('vault:open', filePath),
  setMasterPassword: (password:string)=>ipcRenderer.invoke('vault:setPass', password),
  unlockVault:(password:string)=>ipcRenderer.invoke('vault:unlock', password),
  lockVault:()=>ipcRenderer.send('vault:lock'),
  closeVault:()=>ipcRenderer.send('vault:close'),
  mainCloseVault: (callback:any)=>ipcRenderer.on('vault:close', ()=>{return callback()}),

  getPaginatedEntries: (page:number)=>ipcRenderer.invoke('vault:getPaginatedEntries', page),
  searchEntries: (title:string, username:string, notes:string)=>ipcRenderer.invoke('vault:searchEntries',title, username, notes),
  getNumEntries: ()=>ipcRenderer.invoke('vault:getNumEntries'),

  
}