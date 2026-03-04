// import { IpcHandler } from '../main/preload'
import {ClipBoardIPCHandler, FileIpcHandler, PreferenceIPCHandlers, VaultIpcHandler,} from "../main/preload";
declare global {
  interface Window {
    vaultIPC: VaultIpcHandler,
    fileIPC: FileIpcHandler,
    clipBoardIPC: clipBoardIPCHandler,
    preferenceIPC: PreferenceIPCHandlers
  }
}
