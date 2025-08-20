import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { Entry } from '../interfaces/Entry';
import { decryptEntryPass } from '../utils/entryFunctions';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import Image from 'next/image';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
}

export default function EditEntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [showPass, setShowPass] = useState(false);
    const [decryptedPass, setDecryptedPass] = useState<undefined | string>(undefined);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    const handleCopyPass = ()=>{
        decryptEntryPass(entry, vault.kek).then((pass)=>{
            navigator.clipboard.writeText(pass).then(()=>{
                setTimeout(() => {
                    // set clipboard to be empty after 10 seconds
                    window.ipc.clearClipboard().then((x)=>{
                        addBanner(bannerContext, 'password cleared from clipboard', 'info');
                    })
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

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        setEntry((prev)=>({...prev, [e.target.id]:e.target.value}))
    }

    const handleConfirm = (e:FormEvent)=>{
        e.preventDefault();
    }

    useEffect(()=>{
        if (showPass){
            decryptEntryPass(entry, vault.kek).then((p)=>{
                setDecryptedPass(p)

            })
        }else{
            setDecryptedPass(undefined)
        }
    },[showPass])

    return (
        
        <div className='fixed top-0 left-0 w-screen h-screen flex justify-center items-center backdrop-blur-lg'>
        
            <div className='flex bg-base-100 border-2 border-base-300 relative shadow-base-300 z-30 w-1/2 h-3/4 rounded-xl shadow-lg p-2 text-xl'>
            {(entry!==undefined)?
            <div className='flex flex-col w-full h-full items-center'>
                <div className='flex absolute right-2'>
                    <div onClick={()=>{setShowModal(false)}} className=' z-10 flex cursor-pointer font-bold justify-center items-center px-2 rounded-lg h-8 tex-4xl text-nowrap bg-accent text-accent-content hover:bg-accent-darken'>
                        <Image src={'/images/close.svg'} alt='x' width={30} height={30} className='border-2 h-auto cursor-pointer text-white fill-accent' />
                    </div>
                </div>
                <div className='flex w-full justify-center h-20 text-2xl items-center font-bold'>
                    {entry.title}
                </div>
                <form onSubmit={handleConfirm} className='flex flex-col gap-5 w-[80%] items-end '>
                    <div className='flex gap-2 items-center w-full'>
                        <div className='flex text-nowrap w-34 justify-end'>Title:</div>
                        <input value={entry.title} id='username' className='flex w-full px-1 border-2 outline-none rounded-lg' onChange={handleChange} />
                    </div>

                    <div className='flex gap-2 items-center w-full'>
                        <div className='flex text-nowrap w-34 justify-end'>Username:</div>
                        <input value={entry.username} id='username' className='flex w-full px-1 border-2 outline-none rounded-lg' onChange={handleChange} />
                    </div>

                    <div className='flex gap-2 items-center w-full'>
                        <div className='flex text-nowrap w-34 justify-end'>Password:</div>
                        <div className="border-2 flex w-full rounded-lg items-center">
                            <input value={decryptedPass !== undefined? decryptedPass :"*".repeat(Math.max(8,Math.floor(Math.random()*12)))} id='username' className='flex w-full px-1 outline-none' onChange={handleChange} />
                            <Image onClick={()=>{handleCopyPass()}} src={"/images/copy.svg"} alt='random' width={25} height={25} className='h-auto flex cursor-pointer' title='copy password' />
                            <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                        </div>
                    </div>
                    <div className='flex w-full justify-center'>
                        <button type='submit' className='flex w-28 rounded-lg items-center justify-center  bg-primary text-primary-content'>Confirm</button>
                    </div>
                    
                </form>
            </div>
            :
            <div className='flex w-full h-full text-4xl'>
                This entry does not exist
            </div>}
            </div>
            
        </div>
    
      )
}
