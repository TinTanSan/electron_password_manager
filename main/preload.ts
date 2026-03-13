import { contextBridge } from 'electron'
import {vaultIPCChannels} from './ipcChannels/vaultIPCChannels';
import { preferenceIPCChannels } from './ipcChannels/preferenceIPCChannels';
import { clipBoardIPCChannels } from './ipcChannels/clipBoardIPCChannels';
import { fileIPCChannels } from './ipcChannels/fileIPCChannels';
import {entryIPCChannels} from "./ipcChannels/EntryIPCChannels";
import { groupIPCChannels } from './ipcChannels/groupIPCChannels';

contextBridge.exposeInMainWorld('vaultIPC', vaultIPCChannels);
contextBridge.exposeInMainWorld('fileIPC', fileIPCChannels);
contextBridge.exposeInMainWorld('clipBoardIPC', clipBoardIPCChannels);
contextBridge.exposeInMainWorld('preferenceIPC', preferenceIPCChannels);
contextBridge.exposeInMainWorld('entryIPC', entryIPCChannels);
contextBridge.exposeInMainWorld('groupIPC', groupIPCChannels);

export type      EntryIPCChannels = typeof entryIPCChannels;
export type      VaultIPCChannels = typeof vaultIPCChannels;
export type       FileIPCChannels = typeof fileIPCChannels;
export type       GroupIPCChannels = typeof groupIPCChannels;
export type  ClipBoardIPCChannels = typeof clipBoardIPCChannels;
export type PreferenceIPCChannels = typeof preferenceIPCChannels;
