import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";
import { EntryGroup } from "@main/interfaces/VaultServiceInterfaces";

ipcMain.handle("entry:addEntryToGroup", async (_, entryUUID, groupName)=>vaultService.addEntryToGroup(entryUUID, groupName))

ipcMain.handle('entry:removeEntryFromGroup', async(_, entryUUID:string)=>vaultService.removeEntryFromGroup(entryUUID))
ipcMain.handle("entry:deleteGroup", async(_, groupName:string)=>vaultService.deleteGroup(groupName))


ipcMain.handle('entry:getGroups', ():IPCResponse<Array<EntryGroup>>=>{
    return {
        status: "OK",
        response: vaultService.getAllGroups()
    }
})

ipcMain.handle('entry:getGroup', (_,groupName:string)=>{

})

ipcMain.handle('entry:searchGroups', (_,searchString:string):IPCResponse<Array<string>>=>{
    return {
        status: "OK",
        response: vaultService.searchGroups(searchString)
    }
})