import { createWriteStream, existsSync, writeFile, writeFileSync, WriteStream } from "fs";
import { readFile } from "fs/promises";


export class FailedSyncError extends Error{
    constructor(message:string){
        super(message);
        this.name = "FailedSyncError"
    }
}


export class SyncService{
    filePath:string;
    private writeBuffer: Buffer;
    private writeTimeout:NodeJS.Timeout | undefined;
    constructor(filePath:string){
        this.filePath = filePath;
        this.writeBuffer = Buffer.from("");
    }
    
    /**
     * Useful if computing the serialised version of a vault is expensive, if a vault is large, use this value to know whether or not you should actually go 
     * through serialising the vault
     * @returns boolean
     */
    willBeDebounced(){
        return this.writeTimeout !== undefined;
    }
    
    updateBuffer(content:Buffer, overrideDebounce:boolean = false){
        this.writeBuffer = content;
        if (this.writeTimeout){
            clearTimeout(this.writeTimeout);
            this.writeTimeout = undefined;
        }
        // when we want to make sure this gets written 
        if (overrideDebounce){
            console.log('no debounce')
            this.writeBufferToFile();
            return;
        }
        // debounce for 2 seconds
        this.writeTimeout = setTimeout(()=>{
            this.writeBufferToFile();
        }, 2000)
    }

    private writeBufferToFile(){
        if (this.writeBuffer.length > 0){
            writeFile(this.filePath, this.writeBuffer, (err)=>{
                if (err){
                    throw new FailedSyncError("Unable to sync: "+ err)
                }else{
                    this.writeBuffer = Buffer.from('');
                }
            });
        }
    }
    
    stopSyncLoop(toWrite?:Buffer){
        if (this.writeTimeout){
            clearTimeout(this.writeTimeout);
            this.writeTimeout = undefined;
        }
        if (toWrite !== undefined || this.writeBuffer.length > 0) writeFileSync(this.filePath, toWrite??this.writeBuffer);
    }

    async openFile(filePath:string):Promise<Buffer>{
        if (!existsSync(filePath)){
            throw new Error("file does not exist");
        }
        return await readFile(filePath);

    }
}