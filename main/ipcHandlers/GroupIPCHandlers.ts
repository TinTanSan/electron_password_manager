import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";
import { EntryGroup } from "@main/interfaces/VaultServiceInterfaces";

ipcMain.handle("group:addEntry", async (_, entryUUID, groupName)=>vaultService.addEntryToGroup(entryUUID, groupName))

ipcMain.handle('group:removeEntry', async(_, entryUUID:string)=>vaultService.removeEntryFromGroup(entryUUID))
ipcMain.handle("group:delete", async(_, groupName:string)=>vaultService.deleteGroup(groupName))


ipcMain.handle('group:getAll', ():IPCResponse<Array<EntryGroup>>=>{
    return {
        status: "OK",
        response: vaultService.getAllGroups()
    }
})

ipcMain.handle('entry:getGroup', (_,groupName:string)=>{

})

ipcMain.handle('group:find', (_,searchString:string):IPCResponse<Array<string>>=>{
    return {
        status: "OK",
        response: vaultService.searchGroups(searchString)
    }
})