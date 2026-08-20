import {ipcRenderer } from 'electron';

export const shortcutIPCChannels = {
  quitApp: () => ipcRenderer.send('shortcut:quit'),
};