import { ipcRenderer } from "electron";

export const preferenceIPCChannels = {
  setPreference: (preferenceName:string, newValue:any)=>ipcRenderer.invoke('preference:set', preferenceName, newValue),
  getAllPreferences: ()=>ipcRenderer.invoke('preference:getAll'),
  getPreference: (preferenceName:string)=>ipcRenderer.invoke('preference:get', preferenceName)
};