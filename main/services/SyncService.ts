import { writeToFileAsync } from "../ipcHandlers/fileIPCHandlers";

export class SyncService{
    filePath:string;
    stopSync:boolean;
    writeBuffer: Buffer;
    isFlushing: boolean = false;
    constructor(filePath:string){
        this.filePath = filePath;
        this.stopSync = false;
        this.writeBuffer = Buffer.from("");
        this.startSyncLoop();
    }

    async startSyncLoop(){
        let result = "";
        while (!this.stopSync){
            if(this.writeBuffer.length  > 0 && !this.isFlushing){
                result = await writeToFileAsync({filePath:this.filePath, toWrite: this.writeBuffer})
                if (result !== "OK"){
                    this.stopSync = true;
                    throw new Error("Failed backup in syncLoop, reason: "+result);
                }
                this.writeBuffer = Buffer.from("");
            }
            await this.delay(3000);
        }
        console.log('sync loop stopped')
    }
    private delay(ms:number){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    updateBuffer(content:Buffer){
        this.writeBuffer = content;
    }
    stopSyncLoop(){
        this.stopSync = true;
        console.log('stopping syncloop')
    }
    /**
     * Use this function for pre-emptively syncing without waiting
     * This function is not responsible for stopping the sync loop!
     * @param toWrite : buffer to write to the file (this buffer overwrites all content)
     * 
     * @returns 
     */
    async forceUpdate(toWrite:Buffer){
        return await  writeToFileAsync({filePath:this.filePath, toWrite})
    }

    async flushSyncBuffer(){
        if(this.writeBuffer.length> 0 && !this.isFlushing){
            this.isFlushing = true;
            const result = await writeToFileAsync({filePath:this.filePath, toWrite:this.writeBuffer})
            this.writeBuffer = Buffer.from("");
            this.isFlushing = false;
            return result;
        }else{
            "OK"
        }
    }

}