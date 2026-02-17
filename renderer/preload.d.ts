// import { IpcHandler } from '../main/preload'
import {ClipBoardIPCHandler, FileIpcHandler, VaultIpcHandler,} from "../main/preload";
declare global {
  interface Window {
    vaultIPC: VaultIpcHandler,
    fileIPC: FileIpcHandler,
    clipBoardIPC: clipBoardIPCHandler
  }
}
