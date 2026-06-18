import { VaultContext } from '@contexts/vaultContext';
import { IPCResponse } from '@utils/commons';
import React, { useContext, useEffect, useMemo, useState } from 'react'
// parent component of file picker

type props = {
    setShowFilePicker: React.Dispatch<React.SetStateAction<boolean>>,

}


export default function FilePicker({setShowFilePicker}:props) {
    const [filePath, setFilePath] = useState("");
    const [files, setFiles] = useState<Array<{name:string, path:string}>>([]);
    const dirSplits = filePath.split("/");
    const {setVault} = useContext(VaultContext);
    useEffect(()=>{
        window.fileIPC.getHomeDir().then((response:IPCResponse<string>)=>{
            setFilePath(response.response);
        })
    },[])

    useEffect(()=>{
        if (filePath.endsWith(".vlt")){
            window.vaultIPC.openVault(filePath).then(()=>{
                setVault(prev=>({...prev, filePath:filePath}));
            });
            return;
        }
        window.fileIPC.getFiles(filePath).then((response:IPCResponse<Array<{fileName:string, isDir:boolean, filePath:string}>>)=>{
            if (response.status === "OK"){
                const calculated = response.response.filter(x=>(x.fileName.endsWith('.vlt') || x.isDir && x.fileName.at(0)!='.'));
                setFiles(calculated.map(x=>({name:x.fileName, path:x.filePath})));
            }
        })
    }, [filePath])

    const handleGoBackDir = ()=>{
        setFilePath(filePath.substring(0,filePath.lastIndexOf("/")))

    }
    return (
        <div className='flex w-screen absolute top-0 h-screen overflow-hidden backdrop-blur-sm z-20 text-base-content justify-center items-center'>
            <div className='flex absolute w-screen top-0 left-0  h-screen bg-black opacity-60' />
            <div className='flex flex-col z-10 bg-base-100 w-4/5 gap-3 h-3/4 p-2 border-2 border-base-300 rounded-lg shadow-lg top-10'>
                <div className='flex w-full items-center justify-center h-fit text-subheading'>
                    Load a vault
                </div>

                <div className='flex w-full h-10 gap-5'>
                    <button onClick={handleGoBackDir} className='flex w-fit px-5 bg-base-300 h-8 rounded-lg items-center justify-center'>Back</button>
                    <div className='flex w-full h-full items-center'>{dirSplits.map((dir:string, i)=>
                        <div className='flex'>
                            <button onClick={()=>{setFilePath(dirSplits.slice(0,i+1).join("/"))}} className='flex cursor-pointer hover:text-primary hover:underline'>{dir}</button>/
                        </div>)}
                    </div>
                </div>


                <div className='flex flex-col gap-2 w-full h-full overflow-y-auto border-base-300 border-2 p-1 rounded-lg'>
                    {files.length === 0 && 
                    <div className='flex w-full h-full items-center justify-center'>
                        No files in here, create a new vault here?
                    </div>}
                    {
                        files.map((file, i)=>
                            <div key={i} className='flex w-full h-8 bg-base-100 cursor-pointer items-center border-2 rounded-md px-2 border-base-200 hover:bg-base-200' onClick={()=>{setFilePath(file.path)}}>
                                {file.name}
                            </div>
                        )
                    }
                </div>
                <div className='flex w-full h-10 items-center justify-between'>
                    <button className='flex bg-base-300 p-2 rounded-lg hover:bg-base-darken ' onClick={()=>{setShowFilePicker(false)}}>Cancel</button>
                </div>
            </div>
        </div>
    )
}
