import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { useRouter } from 'next/router'
import { BannerContext } from '../contexts/bannerContext'
import { addBanner } from '../interfaces/Banner'
import { Vault } from '../interfaces/Vault'

export default function LoadFile() {
    const {vault, setVault} = useContext(VaultContext)
    const navigate = useRouter()
    const [recent, setRecent] = useState<Array<string>>([]);
    const banners = useContext(BannerContext);
    const handleCreateFile = ()=>{
        window.ipc.openCreateFile().then((filePath)=>{
            
            if (filePath){
                // since its a new file, the file content will be empty anyways
                setVault( new Vault({
                    filePath, 
                    fileContents:Buffer.from(""), 
                    wrappedVK:Buffer.from(""), 
                    isUnlocked:false, 
                    kek:undefined, 
                    entries:[]
                }));
                window.ipc.addRecent(filePath);
                navigate.push("/home");
            }
        })
    }

    const handleOpenFile = (filepath:string | undefined= undefined)=>{
        // filepath is undefined if the user clicked on open vault, but the filepath will be defined and a valid path
        // if they picked from the recent vaults
        if (filepath === undefined){
            window.ipc.openFilePicker().then(({fileContents, filePath, status}:{fileContents:string, filePath:string, status:string})=>{
                if (status ==="OK"){
                    window.ipc.getRecents().then((recents:Array<string>)=>{
                        setRecent(recents);
                        setVault(new Vault({fileContents:Buffer.from(fileContents), wrappedVK:Buffer.from(fileContents.substring(16,56)), filePath, isUnlocked:false, kek:undefined, entries:[]}))
                        const recent_vault = recents[0].substring(recents[0].lastIndexOf("/")+1, recents[0].length-4);
                        navigate.push('/home')
                        addBanner(banners, "Vault "+recent_vault+" Opened successfully", 'success')
                    })
                }else if (status==="CANCELLED"){
                    addBanner(banners, "No vault chosen", 'warning')
                }else{
                    addBanner(banners, "Extension not valid for a vault", "error")
                }
            })
        }else{
            window.ipc.openFile(filepath).then((content:{fileContents:Buffer, filePath:string, status:string})=>{
                // we don't handle the case where a vault is not of the correct extension because the vault will only be added into
                // the recents if the extension is okay and the vault was opened successfully.s
                if (content.status === "OK"){
                    setVault(new Vault({
                        fileContents:content.fileContents, 
                        filePath:content.filePath, 
                        wrappedVK:Buffer.from(content.fileContents.subarray(16,56)) ,
                        isUnlocked:false, 
                        kek:undefined, 
                        entries:[]
                    }));
                    addBanner(banners, "Vault Opened successfully", 'success')
                    navigate.push('/home')
                }else{
                    // this is different to the undefined in the above if branch because when we directly call openFile we are
                    // using an filesystem read to open the filepath, and undefined means something went wrong finding that file
                    addBanner(banners, "Vault Not found", 'error')
                    setVault(undefined);
                }
            });
        }
        
    }

    useEffect(()=>{
        window.ipc.getRecents().then((x)=>{setRecent(x)})
    },[])

  return (
    <div className='grid w-screen h-screen grid-flow-row p-5 grid-rows-4 bg-base-200 gap-20 text-base-content'>
        
        {/* recently opened files */}
        <div className='grid grid-flow-row-dense row-span-2 grid-rows-10 grid-cols-1 justify-center bg-base-100 rounded-lg border-2 border-base-300'>
            <div className='flex w-full row-span-1 h-full items-center text-xl justify-center row-start-1'>Recently opened vaults</div>
            <div className='grid grid-flow-row-dense grid-rows-10 grid-cols-1 row-span-full row-start-2 w-full gap-2 overflow-y-auto p-2'>
                {
                    recent.map((x,i)=>(
                        <button onClick={()=>{handleOpenFile(x)}} key={i} className='grid cursor-pointer row-span-1 rounded-md px-5 h-fit hover:bg-base-300 bg-base-200 w-full text-ellipsis'>
                            {x.substring(1)}
                        </button>
                    ))
                }
            </div>
        </div>
        
        <div className="grid grid-flow-row-dense gap-5 row-span-1 justify-center">
            <div className='grid grid-flow-row-dense row-span-1 justify-center text-wrap shrink flex-wrap'>
                To load an existing vault click Load vault, otherwise create a new vault using the create vault button.
            </div>
            <div className='grid grid-flow-row-dense lg:grid-flow-col-dense  gap-5 row-span-1 justify-center'>
                <button onClick={()=>{handleOpenFile()}} className='flex justify-center items-center bg-primary hover:bg-primary-darken text-primary-content w-32 h-10 rounded-lg transition-all duration-700 hover:rounded-xl'>
                    load Vault
                </button>
                <button onClick={()=>{handleCreateFile()}} className='flex justify-center items-center bg-primary hover:bg-primary-darken text-primary-content w-32 h-10 rounded-lg transition-all duration-700 hover:rounded-xl'>
                    Create Vault
                </button>
            </div>
        </div>
        
    </div>
  )
}
