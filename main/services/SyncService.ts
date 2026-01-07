import { writeToFileAsync } from "../ipcHandlers/fileIPCHandlers";

export class SyncService{
    filePath:string;
    stopSync:boolean;
    writeBuffer: Buffer;
    constructor(filePath:string){
        this.filePath = filePath;
        this.stopSync = false;
    }

    async startSyncLoop(){
        let result = "";
        while (!this.stopSync){
            if(this.writeBuffer.length  > 0){
                result = writeToFileAsync({filePath:this.filePath, toWrite: this.writeBuffer})
                if (result !== "OK"){
                    this.stopSync = true;
                    throw new Error("Failed backup in syncLoop, reason: "+result);
                }
                this.writeBuffer = Buffer.from("");
                await this.delay(5000);
            }
        }
    }
    private delay(ms:number){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    updateBuffer(content:Buffer){
        this.writeBuffer = content;
    }
    stopSyncLoop(){
        this.stopSync = true;
    }

}