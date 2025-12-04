import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { openFile } from "./fileIPCHandlers";

ipcMain.handle('vault:open', (_,filePath)=>{
    try{
        if (typeof filePath === 'string'){
            vaultService.openVault(filePath);
        }else{
            if (filePath.filePath){
                vaultService.openVault(filePath.filePath);
            }else{
                vaultService.openVault(filePath[0]);
            }
        }
        return {message:vaultService.vaultInitialised? "PASS_SET":"SET_PASS"};
    }catch(e:any){
        console.log('could not handle vault:open ipc channel, filepath given was not in the format expected, please give only filepath in args to the channel');
    }
})
ipcMain.handle('vault:unlock',(_, password)=>{
    return vaultService.unlockVault(password);
})
ipcMain.on('vault:lock', ()=>{
    vaultService.lockVault();
})

ipcMain.on('vault:close', ()=>{
    vaultService.closeVault();
})

ipcMain.handle('vault:setPass', async (_,password)=>{
    return await vaultService.setMasterPassword(password);
})


