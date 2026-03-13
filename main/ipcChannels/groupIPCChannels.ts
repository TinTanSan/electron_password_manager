import { ipcRenderer } from "electron";

export const groupIPCChannels = {
    addEntryToGroup: (entryUUID:string, groupName:string)=>ipcRenderer.invoke('group:addEntry', entryUUID, groupName),
    removeEntryFromGroup: (entryUUID:string)=>ipcRenderer.invoke('group:removeEntry',entryUUID),
    deleteGroup: (groupName:string)=>ipcRenderer.invoke('group:delete', groupName),
    getGroups: ()=>ipcRenderer.invoke('group:getAll'),
    findGroup: (searchString:string)=>ipcRenderer.invoke('group:find', searchString),
}