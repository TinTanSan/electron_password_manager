import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { Entry, RendererSafeEntry } from "../interfaces/VaultServiceInterfaces";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";

ipcMain.handle("vault:addEntryToGroup", async (_, entryUUID, groupName)=>vaultService.addEntryToGroup(entryUUID, groupName))

ipcMain.handle('vault:removeEntryFromGroup', async(_, entryUUID:string)=>vaultService.removeEntryFromGroup(entryUUID))
ipcMain.handle("vault:deleteGroup", async(_, groupName:string)=>vaultService.deleteGroup(groupName))


ipcMain.handle('vault:getGroups', ():IPCResponse<Array<string>>=>{
    return {
        status: "OK",
        response: vaultService.getAllGroups()
    }

})

ipcMain.handle('vault:searchGroups', (_,searchString:string):IPCResponse<Array<string>>=>{
    return {
        status: "OK",
        response: vaultService.searchGroups(searchString)
    }
})