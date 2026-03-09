// import { IpcHandler } from '../main/preload'
import {ClipBoardIPCChannels, EntryIPCChannels, FileIPCChannels, PreferenceIPCChannels, VaultIPCChannels,} from "../main/preload";
declare global {
  interface Window {
    vaultIPC: VaultIPCChannels,
    fileIPC: FileIPCChannels,
    clipBoardIPC: ClipBoardIPCChannels,
    preferenceIPC: PreferenceIPCChannels,
    entryIPC:EntryIPCChannels
  }
}
