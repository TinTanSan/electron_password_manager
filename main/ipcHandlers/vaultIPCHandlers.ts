import { ipcMain } from "electron";
import { ExtraField, vaultService } from "../services/vaultService";
import { openFile } from "./fileIPCHandlers";
/*
 * use ipcMain.handle when expecting a value to be returned
   use ipcMain.on when wanting to send something to main without expecting anything back to renderer 
 */
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


// Entry CRUD operation handlers
ipcMain.handle('vault:getNumEntries', async()=>vaultService.getNumEntries())

ipcMain.handle('vault:addEntry', async (_,entry)=>vaultService.addEntry(entry))

ipcMain.handle('vault:searchEntries', (_,title:string, username:string, notes:string)=>vaultService.searchEntries(title, username, notes))

ipcMain.handle('vault:getPaginatedEntries', (_,page:number)=>vaultService.getPaginatedEntries(page));

ipcMain.handle('vault:editEntry', async (_, uuid:string,fieldToUpdate:string, newValue:any )=> vaultService.updateEntry(uuid, fieldToUpdate, newValue))

ipcMain.handle('vault:removeEntry', async(_, uuid:string)=>vaultService.removeEntry(uuid))

ipcMain.handle('vault:getPassword', async (_, uuid:string)=>vaultService.decryptPassword(uuid))

