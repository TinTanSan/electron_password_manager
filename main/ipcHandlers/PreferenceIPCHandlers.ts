import { ipcMain } from "electron";
import { IPCResponse } from "../interfaces/IPCCHannelInterface";
import { Preferences, preferenceStore } from "@main/helpers/store/preferencesStore";

ipcMain.handle('preference:getAll', (_):IPCResponse<Preferences>=>{
    return {
        status:"OK",
        response: preferenceStore.store
    }
})
ipcMain.handle('preference:setPreference', (_, preferenceName, newVaule):IPCResponse<boolean>=>{
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