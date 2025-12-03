import { ipcMain } from "electron";
import { vaultService } from "../services/vaultService";
import { openFile } from "./fileIPCHandlers";

ipcMain.handle('vault:open', (_,filePath)=>{
    try{
        let fileContents;
        if (typeof filePath === 'string'){
            fileContents = openFile(filePath);
        }else{
            if (filePath.filePath){
                fileContents = openFile(filePath.filePath)
            }else{
                fileContents = openFile(filePath[0]);
            }
        }
        if (fileContents.status === "OK"){
            vaultService.setInitialVaultState(filePath, fileContents.filecontents);
            return {message:fileContents.length > 0? "PASS_SET":"SET_PASS"};
        }else{
            return {message:"NOT_OK"};
        }
    }catch(e:any){
        console.log('could not handle vault:open ipc channel, filepath given was not in the format expected, please give only filepath in args to the channel');
    }
})
ipcMain.handle('vault:unlock',(_, password)=>{
    return vaultService.unlockVault(password);
})
ipcMain.on('vault:lock', ()=>{
    vaultService.lockVault();
})

ipcMain.on('vault:close', ()=>{
    vaultService.closeVault();
})



