import React, { useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import EntryModal from './EntryModal';
import Image from 'next/image';
import { VaultContext } from '../contexts/vaultContext';
import { addBanner } from '../interfaces/Banner';
import { BannerContext } from '../contexts/bannerContext';
type props={
    entry: Entry
}

export default function EntryComponent({entry}:props) {
    const [showEditModal, setShowEditModal] = useState(false);
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [decryptedPass, setDecryptedPass] = useState<string | undefined>(undefined);
    const [ctrlPressed, setCtrlPressed] = useState(false);
    const handleShowPass = ()=>{
        decryptedPass === undefined?
        entry.decryptEntryPass(vault.kek).then((pass)=>{
            setDecryptedPass(pass);
            setTimeout(() => {
                setDecryptedPass(undefined);
            }, 10000);
        })
        :
        setDecryptedPass(undefined);
    }
    const handleCopy = ()=>{
        entry.decryptEntryPass(vault.kek).then((pass)=>{
            navigator.clipboard.writeText(pass).then(()=>{
                // set clipboard to be empty after 10 seconds
                addBanner(bannerContext, 'password copied to clipboard', 'success')
                setTimeout(() => {
                    window.ipc.clearClipboard();
                    addBanner(bannerContext, 'password removed from clipboard','info');
                }, 5000);
            })
        })
    }
    const handleDelete = ()=>{
        setVault((prev)=>({...prev, entries:prev.entries.filter(x=>x.metadata.uuid !== entry.metadata.uuid)}))
    }
    



    
  return (
    <div className='flex w-full odd:bg-base-200 even:bg-base-300 rounded-lg text-base-content h-14 py-2'>
        {showEditModal && <EntryModal setShowModal={setShowEditModal} uuid={entry.metadata.uuid}/>}
        <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center'>{entry.title? entry.title: <i>No Title</i>}</div>
        <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center'>{entry.username? entry.username: <i>No username</i>}</div>
        <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center'>
            <div className='flex w-full h-full items-center p-1'>
                {decryptedPass? decryptedPass? decryptedPass:<i>No Password</i> : "*".repeat(Math.max(8, Math.random()*15))}
            </div>
            <Image onClick={()=>{handleCopy()}} src={'/images/copy.svg'} alt='copy' width={25} height={25} className='w-auto h-auto flex items-center justify-center' />
            <Image onClick={()=>{handleShowPass()}} src={decryptedPass?'/images/hidePass.svg':'/images/showPass.svg'} alt={decryptedPass?'hide':'show'} width={15} height={15} className='w-auto h-auto flex items-center justify-center' />
        </div>
        <div className='flex w-full h-full items-center justify-center text-nowrap text-ellipsis overflow-hidden'>{entry.notes ? entry.notes :<i>No Notes</i>}</div>
        {/* details/edit and delete buttons */}
        <div className='flex w-full h-full items-center gap-2'>
            <button onClick={()=>{setShowEditModal(prev=>!prev)}} type='button' className='flex w-full h-full  items-center justify-center border-2 rounded-lg bg-primary text-primary-content'>Details/Edit</button>
            <button onClick={()=>{handleDelete()}} type='button' className='flex w-10 justify-center rounded-lg h-full items-center bg-error'>
                <Image src={'/images/delete.svg'} alt='del' width={25} height={25} className='flex w-auto bg-error'/>
            </button>
        </div>
    </div>
  )
}
