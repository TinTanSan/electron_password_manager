import React, { useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import EditEntryModal from './editEntryModal';
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
    <div className='flex relative flex-col basis-md items-center grow max-w-md h-90 gap-2 shrink-0 border-2 border-base-300 bg-base-100 shadow-xl/20 w-full  rounded-xl p-2'>
        {showEditModal && <EditEntryModal uuid={entry.metadata.uuid} setShowModal={setShowEditModal}/>}
        <div className="justify-center flex w-full font-bold text-xl">{entry.title}</div>
        <div className="flex flex-col w-full h-full gap-2 px-2">        
            <div className='flex w-full h-10 gap-2'>
                <div>Username:</div>
                <div>{entry.username}</div>
            </div>
            <div className='flex w-full h-10 gap-2 items-center'>
                <div className='flex'>Password:</div>
                <div className='flex w-full rounded-md px-1 pt-1 items-end border-2 align-text-bottom overflow-x-auto'>{decryptedPass===undefined?'*'.repeat(Math.max(8,Math.floor(Math.random()*15))): decryptedPass}</div>
                <Image src={decryptedPass===undefined?"/images/showPass.svg":"/images/hidePass.svg"} alt={decryptedPass===undefined?"show":"hide"} width={20} height={30} className='flex h-auto cursor-pointer' onClick={()=>{handleShowPass()}} />
                <Image onClick={()=>{handleCopy()}} src={"/images/copy.svg"} alt='copy' height={20} width={20} className='flex h-auto cursor-pointer' />
            </div>
            <div className='flex h-full rounded-lg p-1 border-2 shrink w-full'>{entry.notes}</div>
        </div>
        <div className='flex w-full gap-2 px-2'>
            <button type='button' onClick={handleDelete} className='flex w-1/3 items-center justify-center rounded-lg bg-error text-error-content hover:bg-error-darken hover:text-white'>Delete</button>
            <button onClick={()=>{setShowEditModal(true)}} className='flex w-full rounded-lg justify-center h-10 items-center bg-primary hover:bg-primary-darken text-primary-content'>Edit Entry</button>
            
        </div>
    </div>
  )
}
