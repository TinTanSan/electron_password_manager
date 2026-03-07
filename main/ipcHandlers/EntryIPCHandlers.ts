import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { Entry, RendererSafeEntry } from "../interfaces/VaultServiceInterfaces";

ipcMain.handle('vault:getNumEntries', async()=>vaultService.getNumEntries())

ipcMain.handle('vault:getPaginatedEntries', (_,page:number)=>vaultService.getPaginatedEntries(page));


ipcMain.handle('entry:getEntry', async(_, uuid)=>vaultService.getEntry(uuid))

ipcMain.handle('entry:addEntry', async (_,entry)=>vaultService.addEntry(entry))

ipcMain.handle('vault:searchEntries', (_,title:string, username:string, notes:string)=>vaultService.searchEntries(title, username, notes))

ipcMain.handle('entry:addExtraField', async (_, uuid:string, extraField:{name:string, data:Buffer, isProtected:boolean} )=>vaultService.addExtraField(uuid, extraField));

ipcMain.handle('vault:removeExtraField', async (_, uuid, name)=>vaultService.removeExtraField(uuid,name))

ipcMain.handle('entry:decryptPass', async(_,uuid)=>vaultService.decryptPassword(uuid))

ipcMain.handle('entry:updateEntry', async (_, uuid:string,fieldToUpdate:string, newValue:any )=> vaultService.updateEntry(uuid, fieldToUpdate, newValue))

ipcMain.handle('entry:mutateEntry', (_, uuid:string, newState:RendererSafeEntry)=>vaultService.mutateEntry(uuid, newState))

ipcMain.handle('entry:removeEntry', async(_, uuid:string)=>vaultService.removeEntry(uuid))

ipcMain.handle('vault:getPassword', async (_, uuid:string)=>vaultService.decryptPassword(uuid))

