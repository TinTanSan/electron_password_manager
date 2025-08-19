import React, { useContext, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { Entry } from '../interfaces/Entry';
import { decryptEntryPass } from '../utils/entryFunctions';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
}

export default function EditEntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);

    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    const handleCopyPass = ()=>{
        decryptEntryPass(entry, vault.kek).then((pass)=>{
            navigator.clipboard.writeText(pass).then(()=>{
                setTimeout(() => {
                    // set clipboard to be empty after 10 seconds
                    navigator.clipboard.writeText("")
                }, 10000);
                addBanner(bannerContext, 'password copied to clipboard', 'success');
            }).catch((reason)=>{
                addBanner(
                    bannerContext, 'password decrypted, but could not copy, please click show pass and manually copy over the password', 'error'
                )
            });
            
        }).catch((error)=>{
            addBanner(bannerContext, 'failed to decrypt password '+error, 'error' )
        })
    }


    return (
        
        <div onClick={()=>{setShowModal(false)}} className='fixed top-0 left-0 z-20 w-screen h-screen flex justify-center items-center backdrop-blur-lg'>
        
            <div className='flex bg-base-100 border-2 border-base-300 shadow-base-300 w-1/2 h-3/4 rounded-xl shadow-lg'>
            {(entry!==undefined)?
            <div className='flex flex-col w-full h-full'>
                <div className='flex'>
                </div>
            </div>
            :
            <div className='flex w-full h-full text-4xl'>
                This entry does not exist
            </div>}
            </div>
            
        </div>
    
      )
}
