import { createNextronWindow } from "#main/background";
import { app, ipcMain } from "electron";

ipcMain.on("shortcut:quit", ()=>{
    app.quit();
})
