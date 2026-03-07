import { contextBridge } from 'electron'
import {vaultIPCChannels} from './ipcChannels/vaultIPCChannels';
import { preferenceIPCChannels } from './ipcChannels/preferenceIPCChannels';
import { clipBoardIPCChannels } from './ipcChannels/clipBoardIPCChannels';
import { fileIPCChannels } from './ipcChannels/fileIPCChannels';

contextBridge.exposeInMainWorld('vaultIPC', vaultIPCChannels);
contextBridge.exposeInMainWorld('fileIPC', fileIPCChannels);
contextBridge.exposeInMainWorld('clipBoardIPC', clipBoardIPCChannels);
contextBridge.exposeInMainWorld('preferenceIPC', preferenceIPCChannels);



export type VaultIpcHandler = typeof vaultIPCChannels;
export type FileIpcHandler = typeof fileIPCChannels;
export type ClipBoardIPCHandler = typeof clipBoardIPCChannels;
export type PreferenceIPCHandlers = typeof preferenceIPCChannels;
