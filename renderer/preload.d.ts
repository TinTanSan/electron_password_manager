// import { IpcHandler } from '../main/preload'
import {ClipBoardIPCChannels, EntryIPCChannels, FileIPCChannels, GroupIPCChannels, PreferenceIPCChannels, VaultIPCChannels,} from "../main/preload";
declare global {
  interface Window {
    vaultIPC: VaultIPCChannels,
    fileIPC: FileIPCChannels,
    clipBoardIPC: ClipBoardIPCChannels,
    preferenceIPC: PreferenceIPCChannels,
    entryIPC:EntryIPCChannels,
    groupIPC: GroupIPCChannels,
  }
}
