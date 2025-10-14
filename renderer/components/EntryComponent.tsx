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
        // <div className='flex w-full bg-base-200 rounded-lg text-base-content h-14 py-2'>
        //     {showEditModal && <EntryModal setShowModal={setShowEditModal} uuid={entry.metadata.uuid}/>}
        //     <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center'>{entry.title? entry.title: <i>No Title</i>}</div>
        //     <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center'>{entry.username? entry.username: <i>No username</i>}</div>
        //     <div className='flex w-full h-full items-center border-r-2 border-base-100 justify-center px-1'>
        //         <div className='flex w-full h-full items-center p-1'>
        //             {showPass? 
        //                 decryptedPass?
        //                     decryptedPass
        //                     :
        //                     <i>No Password</i> 
        //                 : 
        //                     "*".repeat(8)
        //             }
        //         </div>
        //         <Image onClick={()=>{handleCopy()}} src={'/images/copy.svg'} alt='copy' width={25} height={25} className='w-auto h-auto flex items-center justify-center' />
        //         <Image onClick={()=>{setShowPass(prev=>!prev);handleShowPass();}} src={showPass?'/images/hidePass.svg':'/images/showPass.svg'} alt={showPass?'hide':'show'} width={15} height={15} className='w-auto h-auto flex items-center justify-center' />
        //     </div>
        //     <div className='flex w-full h-full items-center justify-center text-nowrap text-ellipsis overflow-hidden'>
        //         {entry.notes ? entry.notes :<i>No Notes</i>
        //         }
        //     </div>
        //     {/* details/edit and delete buttons */}
        //     <div className='flex w-full max-w-80 h-full items-center gap-2'>
        //         <button onClick={()=>{setShowEditModal(prev=>!prev)}} type='button' className='flex w-full h-full  items-center justify-center rounded-lg bg-primary text-primary-content'>Details/Edit</button>
        //         <button onClick={()=>{handleDelete()}} type='button' className='flex w-10 justify-center rounded-lg h-full items-center bg-error'>
        //             <Image src={'/images/delete.svg'} alt='del' width={25} height={25} className='flex w-auto bg-error'/>
        //         </button>
        //     </div>
        // </div>
        <div className='flex w-full h-14 border-2 items-center justify-between px-2 gap-4 rounded-lg border-base-300 bg-base-100'>
            <Image src={"/images/defaultGroup.svg"} alt="entry" width={0} height={0} className='flex w-8 h-auto shrink-0 grow-0' />
            <div className='flex w-full grow shrink text-nowrap overflow-hidden overflow-ellipsis items-center text-xl'>{entry.username}</div>
            <div className='flex w-fit justify-end'>
                <Image src={'/images/expand.svg'} alt='expand' width={0} height={0} className='flex w-6 h-auto  shrink-0 grow-0'/>
            </div>
        </div>
    )
}
