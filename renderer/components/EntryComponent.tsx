import React, { useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import EntryModal from './EntryModal';
import Image from 'next/image';
import { VaultContext } from '../contexts/vaultContext';
import { addBanner } from '../interfaces/Banner';
import { BannerContext } from '../contexts/bannerContext';
import { writeEntriesToFile } from '../utils/vaultFunctions';
import { Vault } from '../interfaces/Vault';
type props={
    entry: Entry
}

export default function EntryComponent({entry}:props) {
    const [showEditModal, setShowEditModal] = useState(false);
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [decryptedPass, setDecryptedPass] = useState<string>("");
    const [showPass, setShowPass] = useState(false);
    const [extend, setExtend] = useState(false);
    const handleShowPass = ()=>{
        entry.decryptEntryPass(vault.kek).then((pass)=>{
            setDecryptedPass(pass.toString());
            setTimeout(() => {
                setDecryptedPass("");
                setShowPass(false);
            }, 10000);
        })
    }
    
    const handleCopy = ()=>{
        if (decryptedPass){
            navigator.clipboard.writeText(decryptedPass.toString()).then(()=>{
                // set clipboard to be empty after 10 seconds
                addBanner(bannerContext, 'password copied to clipboard', 'success')
                setTimeout(() => {
                    window.ipc.clearClipboard();
                    addBanner(bannerContext, 'password removed from clipboard','info');
                }, 5000);
            })
        }else{
            entry.decryptEntryPass(vault.kek).then((pass)=>{
                navigator.clipboard.writeText(pass.toString()).then(()=>{
                    // set clipboard to be empty after 10 seconds
                    addBanner(bannerContext, 'password copied to clipboard', 'success')
                    setTimeout(() => {
                        window.ipc.clearClipboard();
                        addBanner(bannerContext, 'password removed from clipboard','info');
                    }, 5000);
                })
            }).catch(error=>{
            navigator.clipboard.writeText(entry.password.toString()).then(()=>{
                // set clipboard to be empty after 10 seconds
                addBanner(bannerContext, 'password copied to clipboard', 'success')
                setTimeout(() => {
                    window.ipc.clearClipboard();
                    addBanner(bannerContext, 'password removed from clipboard','info');
                }, 5000);
            })
        })
        }
        
    }
    
    const handleDelete = ()=>{
        setVault((prev)=>
            {
                const newState =new Vault({...prev, entries:prev.entries.filter(x=>x.metadata.uuid !== entry.metadata.uuid)})
                writeEntriesToFile(newState);
                return newState;
            })
    }
    
    return (
        <div className={`flex flex-col w-full transition-all duration-500 ${extend?'h-56':"h-14 items-center "} border-2  justify-between px-2 gap-2 rounded-lg border-base-300 bg-base-100 `}>
            <div onClick={()=>{setExtend(prev=>!prev)}} className='flex w-full h-12 grow-0 shrink-0 items-center px2 gap-5'>
                <Image src={"/images/defaultGroup.svg"} alt="entry" width={0} height={0} className='flex w-8 h-auto shrink-0 grow-0' />
                <div className='flex h-12 w-full grow shrink text-nowrap overflow-hidden overflow-ellipsis items-center text-xl'>{entry.username}</div>
                <div className='flex w-fit justify-end'>
                    <Image  src={`/images/${extend?'collapse':'expand'}.svg`} alt='expand' width={0} height={0} className='flex w-6 h-auto  shrink-0 grow-0'/>
                </div>
            </div>
            <div className={`flex flex-col w-full ${extend ? 'h-full p-2': 'h-0 collapse overflow-hidden'}`}>
                <div className='flex flex-col w-fit h-full gap-2 overflow-hidden overflow-ellipsis'>
                    <div className='flex w-full h-6 gap-2'>
                        <div className='flex w-32 h-full'>Username</div>
                        <div className='flex w-full h-full'>{entry.username}</div>

                    </div>
                    <div className='flex w-full h-6 gap-2'>
                        <div className='flex w-32 h-full'>Password</div>
                        <div className='flex w-full h-full'>{decryptedPass? decryptedPass : "*".repeat(8)}</div>

                    </div>
                    <div className='flex w-full h-6 gap-2'>
                        <div className='flex w-32 h-full'>URL</div>
                        <div className='flex w-full h-full'>This feature to come soon</div>

                    </div>
                </div>
                <div className='flex flex-row w-full h-14 gap-2'>
                    <button onClick={()=>{handleDelete()}} className='flex items-center justify-center text-xl rounded-lg border-error text-error hover:text-error-content hover:bg-error transition-all duration-300 border-2 w-full h-full'>Delete</button>
                    <button onClick={()=>{setShowEditModal(true)}} className='flex items-center justify-center text-xl rounded-lg hover:text-info-content hover:bg-info duration-300 transition-all border-info border-2 w-full h-full'>Details &amp; Edit</button>
                </div>
            </div>
        </div>
    )
}
