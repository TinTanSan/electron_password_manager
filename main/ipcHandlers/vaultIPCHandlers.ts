import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { IPCResponse } from "#main/interfaces/IPCCHannelInterface";

ipcMain.handle('vault:getNumEntries', async()=>vaultService.entryService.getNumEntries())

ipcMain.handle('vault:getPaginatedEntries', (_,page:number)=>vaultService.getPaginatedEntries(page));

ipcMain.handle('vault:open', (_,filePath:string):IPCResponse<string>=>{
    try{
        const response = vaultService.openVault(filePath);
        if (response !== "OK"){
            return {
                status:"CLIENT_ERROR",
                response,
                message:response ==="VAULT_NOT_FOUND" ? "Client error, vault not found. " : "Client error, vault is already open" 
            }
        }
        return {status: "OK", response:vaultService.vault.fileContents.length >0? "PASS_SET":"SET_PASS"};
    }catch(e:any){
        return {status: "INTERNAL_ERROR",message:e, response:""}
    }
})

ipcMain.handle('vault:unlock',(_, password)=>vaultService.unlockVault(password))


ipcMain.on('vault:close', ()=>vaultService.closeVault())

ipcMain.handle('vault:setPass', async (_,password):Promise<IPCResponse<boolean>>=>{
    await vaultService.setMasterPassword(password);
    return {
        status:"OK",
        response:true
    }
})

ipcMain.handle('vault:getEntriesWithSamePass', async(_):Promise<IPCResponse<Array<string>>>=>{
    
    return {
        status:"OK",
        response: await vaultService.getEntriesWithSamePass()
    }
})
