import { ipcRenderer } from 'electron';

export const fileIPCChannels = {
  openFilePicker: () => ipcRenderer.invoke('fileDialog:open'),
  openCreateFile: () => ipcRenderer.invoke('fileDialog:create'),
  getHomeDir: ()=>ipcRenderer.invoke('file:homeDir'),
  getFiles: (filePath:string)=>ipcRenderer.invoke('file:get', filePath),
  deleteFile: (filepath: string) => ipcRenderer.invoke('file:delete', filepath),
  getRecents: () => ipcRenderer.invoke('recents:get'),
  removeRecent: (filePath: string) => ipcRenderer.invoke('recents:remove', filePath),
  addRecent: (filePath: string) => ipcRenderer.send('recents:add', filePath),
};
