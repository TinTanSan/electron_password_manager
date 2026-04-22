import { ExtraField, RendererSafeEntry } from "@main/interfaces/VaultServiceInterfaces";
import { ipcRenderer } from "electron";

export const entryIPCChannels = {
  getEntry:(uuid:string)=>ipcRenderer.invoke('entry:getEntry', uuid),
  decryptPass: (uuid:string)=>ipcRenderer.invoke("entry:decryptPass", uuid),
  deleteEntry:(uuid:string)=>ipcRenderer.invoke('entry:removeEntry', uuid),
  addEntry:(entry:{title:string,username:string, password:Buffer,notes:string, extraFields:Array<ExtraField>, group:string})=>ipcRenderer.invoke('entry:addEntry', entry),
  updateEntryField:(uuid:string, fieldToUpdate:string, newValue:any)=>ipcRenderer.invoke('entry:updateEntry', uuid, fieldToUpdate, newValue ),
  mutateEntry: (uuid:string, newState:RendererSafeEntry)=>ipcRenderer.invoke('entry:mutateEntry', uuid, newState),
  // extra field IPC Channels
  addExtraField: (uuid:string, extraField:{name:string, data:Buffer, isProtected:boolean})=>ipcRenderer.invoke('entry:addExtraField', uuid,extraField),
  decryptExtraField: (uuid:string, name:string)=>ipcRenderer.invoke('entry:decryptExtrafield', uuid, name),
  removeExtraField: (uuid:string, name:string)=>ipcRenderer.invoke('entry:removeExtraField', uuid, name),
  encryptExtraField: (uuid:string, name:string)=>ipcRenderer.invoke('entry:encryptExtraField', uuid, name),

}