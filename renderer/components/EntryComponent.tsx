import React, { useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import EntryModal from './EntryModal';
import Image from 'next/image';
import { VaultContext } from '../contexts/vaultContext';
import { addBanner } from '../interfaces/Banner';
import { BannerContext } from '../contexts/bannerContext';
import { Vault } from '../interfaces/Vault';
type props={
    entry: Entry,
}

export default function EntryComponent({entry}:props) {
    const [showEditModal, setShowEditModal] = useState(false);
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [decryptedPass, setDecryptedPass] = useState<string>("");
    const [showPass, setShowPass] = useState(false);
    const [extend, setExtend] = useState(false);
    const handleShowPass = ()=>{
        if (!showPass)
        {   
            setShowPass(true);
            // throw new Error('implement with IPC channels');
            window.vaultIPC.decryptPass(entry.metadata.uuid).then((response)=>{
                setDecryptedPass(response);
                setTimeout(() => {
                    handleShowPass()
                }, 10000);
            })
        }else{
            setShowPass(false);
            setDecryptedPass("")
        }
    }
    
    const handleCopy = ()=>{
        if (decryptedPass){
            // if we have already decrypted the pass
            navigator.clipboard.writeText(decryptedPass.toString()).then(()=>{
                // set clipboard to be empty after 10 seconds
                addBanner(bannerContext, 'password copied to clipboard', 'success')
                setTimeout(() => {
                    window.clipBoardIPC.clearClipboard();
                    addBanner(bannerContext, 'password removed from clipboard','info');
                }, 5000);
            })
        }else{
            // throw new Error("implement with IPC channels")
            window.vaultIPC.decryptPass(entry.metadata.uuid).then((pass)=>{
                navigator.clipboard.writeText(pass).then(()=>{
                    addBanner(bannerContext, 'password copied to clipboard', 'success')
                    setTimeout(() => {
                        window.clipBoardIPC.clearClipboard();
                        addBanner(bannerContext, 'password removed from clipboard','info');
                    }, 5000)
                })
            }).catch((error)=>{
                addBanner(bannerContext, 'unable to copy password to clipboard', 'error');
                console.error(error);
            })
        }

    }
    
    const handleDelete = ()=>{
        window.vaultIPC.deleteEntry(entry.metadata.uuid);
        setVault((prev)=>({...prev, entries:prev.entries.filter(x=>x.metadata.uuid !== entry.metadata.uuid)}))
    }
    return (
            <div className={`flex flex-col w-full transition-all duration-500 ${extend?'h-56':"h-14 items-center"} overflow-hidden border-2 px-2 gap-2 rounded-lg border-base-300 bg-base-100 `}>
                {showEditModal && <EntryModal setShowModal={setShowEditModal} uuid={entry.metadata.uuid}/>}
                <div onClick={()=>{setExtend(prev=>!prev)}} className='flex w-full h-12 grow-0 shrink-0 items-center px2 gap-2 relative'>
                    <Image src={"/images/defaultGroup.svg"} alt="entry" width={0} height={0} className='flex w-8 h-auto shrink-0 grow-0' />
                    <div className='flex h-full w-full px-2 justify-start text-nowrap overflow-hidden overflow-ellipsis items-center text-lg font-medium'>
                        {entry.title? entry.title : <i>No title</i>}
                    </div>
                    <div className='flex w-fit justify-end'>
                        <Image src={`/images/${extend?'collapse':'expand'}.svg`} alt='expand' width={0} height={0} className='flex w-6 h-auto  shrink-0 grow-0'/>
                    </div>
                </div>
                <div className={`flex text-md font-normal flex-col w-full text-base-content p-2 overflow-hidden ${extend ? 'h-full visible': 'collapse'}`}>
                    <div className='flex flex-col w-fit h-full gap-2 overflow-hidden overflow-ellipsis'>
                        <div className='flex w-full h-6 gap-2'>
                            <div className='flex w-32 h-full'>Username</div>
                            <div className='flex w-full h-full'>{entry.username}</div>

                        </div>
                        <div className='flex w-full h-6 gap-2'>
                            <div className='flex w-32 h-full'>Password</div>
                            <div className={` flex w-full h-full ${(showPass && !decryptedPass) && "italic"}`}>{showPass? decryptedPass?decryptedPass : "no pass to show" : "*".repeat(8)}</div>
                            <Image onClick={handleCopy} src={"/images/copy.svg"} alt='copy' width={0} height={0} className='flex w-6 h-6 ' />
                            <Image onClick={handleShowPass} src={showPass?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={0} height={0} className='flex w-6 h-6'/>
                        </div>
                        <div className='flex w-full h-6 gap-2'>
                            <div className='flex w-32 h-full'>URL</div>
                            <div className='flex w-full h-full'>This feature to come soon</div>
                        </div>
                    </div>
                    <div className='flex flex-row w-full h-14 gap-2'>
                        <button onClick={()=>{handleDelete()}} className='flex items-center justify-center text-xl rounded-lg border-error text-error hover:text-error-content hover:bg-error transition-all duration-300 border-2 w-full h-full'>Delete</button>
                        <button onClick={()=>{setShowEditModal(true)}} className='flex items-center justify-center text-xl rounded-lg hover:text-info-content hover:bg-info outline-none duration-300 transition-all border-info border-2 w-full h-full'>Details &amp; Edit</button>                    </div>
                </div>
            </div>
    )
}
