import { ipcMain } from "electron";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";
import { Preferences, preferenceStore } from "@main/helpers/store/preferencesStore";

ipcMain.handle('preference:getAll', (_):IPCResponse<Preferences>=>{
    return {
        status:"OK",
        response: preferenceStore.store
    }
})
ipcMain.handle('preference:set', (_, preferenceName, newVaule):IPCResponse<boolean>=>{
    if(preferenceStore.has(preferenceName)){
        preferenceStore.set(preferenceName,newVaule)
        return {
            status:"OK",
            response:true
        }
    }
    return {
        status:"CLIENT_ERROR",
        message:"Preference key not found: "+preferenceName,
        response:false
    }
})

ipcMain.handle('preference:get', (_, key:string):IPCResponse<any>=>{
    if (!preferenceStore.has(key)){
        return {
            status:"CLIENT_ERROR",
            message:"Key "+key+" does not exist in preferences",
            response: undefined
        }
    }
    return {
        status:"OK",
        response: preferenceStore.get(key)
    }
})