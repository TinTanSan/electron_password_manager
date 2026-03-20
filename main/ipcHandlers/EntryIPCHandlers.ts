import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { Entry, RendererSafeEntry } from "../interfaces/VaultServiceInterfaces";
import { trustedIDS } from "@main/background";
import { IPCResponse } from "@main/interfaces/IPCCHannelInterface";




ipcMain.handle('entry:getEntry', async(_, uuid)=>vaultService.getEntry(uuid))

ipcMain.handle('entry:addEntry', async (_,entry)=>vaultService.addEntry(entry))

ipcMain.handle('vault:searchEntries', (_,title:string, username:string, notes:string)=>vaultService.searchEntries(title, username, notes))

ipcMain.handle('entry:addExtraField', async (_, uuid:string, extraField:{name:string, data:Buffer, isProtected:boolean} ):Promise<IPCResponse<boolean>>=>{
    
    try {
        const response = vaultService.addExtraField(uuid, extraField);
        if (response === "OK"){
            return {
                status:"OK",
                response: true
            }
        }

        return{
            status:"CLIENT_ERROR",
            message: response==="ALREADY_EXISTS"? "extra field already exists" : "entry with uuid"+uuid+"not found",
            response: false
        }        
    } catch (error) {
        return{
            status:"INTERNAL_ERROR",
            message:error,
            response:false
        }
    }
    
});

ipcMain.handle('entry:removeExtraField', async (_, uuid, name)=>vaultService.removeExtraField(uuid,name))

ipcMain.handle('entry:decryptPass', async(_,uuid)=>vaultService.decryptPassword(uuid))

ipcMain.handle('entry:updateEntry', async (_, uuid:string,fieldToUpdate:string, newValue:any )=> vaultService.updateEntry(uuid, fieldToUpdate, newValue))

ipcMain.handle('entry:mutateEntry', (_, uuid:string, newState:RendererSafeEntry)=>vaultService.mutateEntry(uuid, newState))

ipcMain.handle('entry:removeEntry', async(_, uuid:string)=>vaultService.removeEntry(uuid))

ipcMain.handle(
    'entry:getPassword', 
    
    async (event ,uuid:string):Promise<IPCResponse<string>>=>{
        if (trustedIDS.has(event.frameId)){
            return {
                status: "OK",
                response: await vaultService.decryptPassword(uuid)
            }
        }
        return {
            status: "CLIENT_ERROR",
            message:"Error: You are not allowed to invoke this method",
            response: ""
        }
        
    }
)

