import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { Entry } from "../interfaces/VaultServiceInterfaces";
import { RendererSafeEntry } from "@main/interfaces/EntryServiceInterfaces";
import { trustedIDS } from "@main/background";
import { IPCResponse } from "@main/interfaces/IPCCHannelInterface";


const entryService = vaultService.entryService;

ipcMain.handle('entry:getEntry', async(_, uuid)=>entryService.getEntry(uuid))

ipcMain.handle('entry:addEntry', async (_,entry)=>entryService.addEntry(entry, vaultService.vault.kek))

ipcMain.handle('vault:searchEntries', (_,title:string, username:string, notes:string)=>vaultService.searchEntries(title, username, notes))

ipcMain.handle('entry:addExtraField', async (_, uuid:string, extraField:{name:string, data:Buffer, isProtected:boolean} ):Promise<IPCResponse<boolean>>=>{
    
    try {
        const response = entryService.addExtraField(uuid, extraField, vaultService.vault.kek);
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

ipcMain.handle('entry:decryptExtrafield', async (_, uuid:string, name:string):Promise<IPCResponse<Buffer>>=>{
    const response = entryService.decryptExtraField(uuid, name, vaultService.vault.kek);
    console.log('handler res: ',response)
    if (response.status === "OK"){
        return {
            status:"OK",
            response:Buffer.from(response.data),
        }
    }else if (response.status === "ENT_NOT_FOUND" || "EF_NOT_FOUND"){
        return {
            status: "CLIENT_ERROR",
            message:response.status === "ENT_NOT_FOUND"?"Entry with uuid given not found":"Extrafield with given name not found",
            response: Buffer.from([])
        }
    }else{
        return {
            status: "INTERNAL_ERROR",
            message:response.status,
            response: Buffer.from([])
        }
    }

})

ipcMain.handle('entry:changeEFProtection', async (_, uuid:string, name:string, protectedness:boolean):Promise<IPCResponse<Buffer>>=>{
    try {    
        const {data, status} = vaultService.entryService.extraFieldChangeIsProtected(uuid, name,protectedness, vaultService.vault.kek);
        if (status === "OK"){
            return {status:"OK", response:data};
        }else{
            return {
                status:"CLIENT_ERROR",
                message: status === "ENT_not_found"? "Entry not found": "ExtraField not found",
                response:undefined
            }
        }
    } catch (error) {
        return {
            status:"INTERNAL_ERROR",
            response:undefined,
            message:error
        }
    }
        
})

ipcMain.handle('entry:removeExtraField', async (_, uuid, name):Promise<IPCResponse<string>>=>{
    const res = vaultService.entryService.removeExtraField(uuid,name);
    if (res === "OK"){
        return {
            status:"OK",
            response:"OK"
        }
    }else if(res === "EF_NOT_FOUND"){
        return{
            status:"CLIENT_ERROR",
            message:"extra field not found",
            response:""
        }
    }else if (res === "ENT_NOT_FOUND"){
        return{
            status:"CLIENT_ERROR",
            message:"entry not found",
            response:""
        }
    }
    return {
        status:"INTERNAL_ERROR",
        message:"internal error, something went wrong",
        response:"internal error"
    }
})

ipcMain.handle('entry:decryptPass', async(_,uuid)=>entryService.decryptPassword(uuid, vaultService.vault.kek))

ipcMain.handle('entry:updateEntry', async<K extends keyof Entry>(_: Electron.IpcMainInvokeEvent, uuid:string,fieldToUpdate:K, newValue:Entry[K]):Promise<IPCResponse<boolean>>=>{
    if (vaultService.entryService.updateEntry(uuid, fieldToUpdate, newValue)){
        return {
            status:"OK",
            response:true
        }
    }
    return {
        status:"CLIENT_ERROR",
        message:"Entry not found",
        response:false
    }
})

ipcMain.handle('entry:mutateEntry', async (_, uuid:string, newState:RendererSafeEntry):Promise<IPCResponse<Entry>>=>{
    const entry = await vaultService.entryService.mutateEntry(uuid, newState);
    if (!entry){
        return {
            status:"CLIENT_ERROR",
            message: "entry does not exist",
            response:undefined
        }
    }
    return {
        status:"OK",
        response:entry
    }
})

ipcMain.handle('entry:removeEntry', async(_, uuid:string)=>vaultService.removeEntry(uuid))

ipcMain.handle(
    'entry:getPassword', 
    async (event ,uuid:string):Promise<IPCResponse<string>>=>{
        if (trustedIDS.has(event.frameId)){
            return {
                status: "OK",
                response: await entryService.decryptPassword(uuid, vaultService.vault.kek)
            }
        }
        return {
            status: "CLIENT_ERROR",
            message:"Error: You are not allowed to invoke this method",
            response: ""
        }
        
    }
)

