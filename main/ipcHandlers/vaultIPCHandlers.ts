import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";

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
        return {message:"NOT_OK"}
    }
})

ipcMain.handle('vault:unlock',(_, password)=>vaultService.unlockVault(password))

ipcMain.on('vault:lock', ()=>vaultService.lockVault())

ipcMain.on('vault:close', ()=>vaultService.closeVault())

ipcMain.handle('vault:setPass', async (_,password)=>vaultService.setMasterPassword(password))
