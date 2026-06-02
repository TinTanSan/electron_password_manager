import { writeFileSync } from "fs";
import { writeToFile, writeToFileAsync } from "../ipcHandlers/fileIPCHandlers";
export class SyncService{
    filePath:string;
    stopSync:boolean;
    writeBuffer: Buffer;
    isFlushing: boolean = false;
    aborter:AbortController;
    constructor(filePath:string){
        this.aborter = new AbortController();
        this.filePath = filePath;
        this.stopSync = false;
        this.writeBuffer = Buffer.from("");
        if (filePath !== ""){
            this.startSyncLoop();
        }
    }

    async startSyncLoop(){ 
        while (!this.stopSync && this.filePath !==""){
            if(this.writeBuffer.length  > 0 && !this.isFlushing){
                writeToFileAsync(this.filePath, this.writeBuffer);
                this.writeBuffer = Buffer.from("");
            }
            if (!this.stopSync){
                
                await this.delay(3000, this.aborter.signal).catch(()=>{})
                
            }
        }
    }
    private delay(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
            }

            const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
            }, ms);

            const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
            };

            signal?.addEventListener("abort", onAbort);
        });
    }
    updateBuffer(content:Buffer){
        this.writeBuffer = content;
    }
    stopSyncLoop(){
        // on the final stop sync loop we want to get in the way of the program stopping to ensure that we finish writing to file
        this.stopSync = true;
        this.aborter.abort('sync loop stopped');
        this.forceUpdateSync();
    }
    /**
     * synchronously forces an update using given buffer, or implied buffer. Use this only when you want to block main thread such as when closing the vault.
     * @param toWrite Buffer to write to the file, if not provided, the syncService's writeBuffer is used instead
     * @returns the result from writeToFile call
     */
    forceUpdateSync(toWrite?:Buffer){
        if (toWrite ===undefined){
            toWrite = this.writeBuffer;
        }
        if (toWrite.length > 0 && !this.isFlushing){
            this.isFlushing = true;
            const res = writeToFile(this.filePath,this.writeBuffer);
            if (res === "NOTFOUND"){
                console.error("could not commit last Buffer to file, file was not found!")
            }
            this.isFlushing = false;
            return "OK";
        }else if(this.isFlushing) {
            return "FLUSH_COLLISION"
        }
        else{
            return "NO_FLUSH_BUFF"
        }
    }
    
    
    /**
     * Use this function for pre-emptively syncing without waiting
     * This function is not responsible for stopping the sync loop!
     * @param toWrite : buffer to write to the file (this buffer overwrites all content)
     * 
     * @returns 
     */

    

    async forceUpdate(toWrite:Buffer){
        // clear the existing buffer to ensure that it doesn't eventually overwrite
        this.writeBuffer = Buffer.from('');
        
        const res = await writeToFileAsync(this.filePath, toWrite);
        return res;
    }

    async flushSyncBuffer(){
        if(this.writeBuffer.length> 0 && !this.isFlushing){
            this.isFlushing = true;
            const result = await writeToFileAsync(this.filePath, this.writeBuffer)
            // writeFileSync(this.filePath, this.writeBuffer);
            this.writeBuffer = Buffer.from("");
            this.isFlushing = false;
            return result;
        }
    }

}