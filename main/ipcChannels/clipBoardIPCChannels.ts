import { ipcRenderer } from 'electron';

export const clipBoardIPCChannels = {
  clearClipboard: () => ipcRenderer.invoke('clipboard:clear'),
};
