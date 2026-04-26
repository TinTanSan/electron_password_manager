import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { IPCResponse } from "@main/interfaces/IPCCHannelInterface";

ipcMain.handle('vault:getNumEntries', async()=>vaultService.entryService.getNumEntries())

ipcMain.handle('vault:getPaginatedEntries', (_,page:number)=>vaultService.getPaginatedEntries(page));

ipcMain.handle('vault:open', (_,filePath):IPCResponse<string>=>{
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
        return {status: "OK", response:vaultService.vaultInitialised? "PASS_SET":"SET_PASS"};
    }catch(e:any){
        return {status: "INTERNAL_ERROR",message:e, response:""}
    }
})

ipcMain.handle('vault:unlock',(_, password)=>vaultService.unlockVault(password))

ipcMain.on('vault:lock', ()=>vaultService.lockVault())

ipcMain.on('vault:close', ()=>vaultService.closeVault())

ipcMain.handle('vault:setPass', async (_,password)=>vaultService.setMasterPassword(password))

ipcMain.handle('vault:getEntriesWithSamePass', async(_):Promise<IPCResponse<Array<string>>>=>{
    
    return {
        status:"OK",
        response: await vaultService.getEntriesWithSamePass()
    }
})
