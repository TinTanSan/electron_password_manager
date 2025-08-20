import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { Entry } from '../interfaces/Entry';
import { decryptEntryPass, encryptPass } from '../utils/entryFunctions';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import Image from 'next/image';
import RandomPassModal from './RandomPassModal';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
}

export default function EditEntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    useEffect(()=>{
        decryptEntryPass(entry, vault.kek).then((x)=>{
            setEntry((prev)=>({...prev, password:Buffer.from(x)}))
        })
    },[])

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'password'){
            setEntry((prev)=>({...prev, password:Buffer.from(e.target.value)}))
            return;
        }
        setEntry((prev)=>({...prev, [e.target.id]:e.target.value}))
    }

    const handleConfirm = (e:FormEvent)=>{
        e.preventDefault();
        encryptPass(entry.password.toString('utf-8'), entry.dek, vault.kek).then((passBuf)=>{
            setEntry((prev)=>({...prev, password:passBuf, metadata:{...prev.metadata,  lastEditedDate: new Date()}}))
        })
    }


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
                <form onSubmit={handleConfirm} className='flex flex-col gap-5 w-[80%] h-full items-end '>
                    <div className='flex flex-col gap-5 items-center h-full '>
                        <div className='flex gap-2 items-center w-full'>
                            <div className='flex text-nowrap w-34 justify-end'>Title:</div>
                            <input value={entry.title} id='title' className='flex w-full px-1 border-2 outline-none rounded-lg' onChange={handleChange} />
                        </div>

                        <div className='flex gap-2 items-center w-full'>
                            <div className='flex text-nowrap w-34 justify-end'>Username:</div>
                            <input value={entry.username} id='username' className='flex w-full px-1 border-2 outline-none rounded-lg' onChange={handleChange} />
                        </div>

                        <div className='flex gap-2 items-center w-full'>
                            <div className='flex text-nowrap w-34 justify-end'>Password:</div>
                            <div className="border-2 flex w-full rounded-lg items-center gap-1 px-1">
                                <input value={showPass ? entry.password.toString() : "*".repeat(entry.password.length)} id='password' className='flex w-full px-1 outline-none' onChange={handleChange} />
                                <Image src={'/images/randomise.svg'} alt='randomise' width={25} height={25} className='h-auto flex' />
                                <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                            </div>
                        </div>
                        {showRandomPassModal && <RandomPassModal setShowRandomPassModal={setShowRandomPassModal}  setEntry={setEntry}/>}
                        <div className='flex gap-2 items-center w-full h-full'>
                            <div className='flex text-nowrap w-34 justify-end'>Notes:</div>
                            <input value={entry.notes} id='notes' className='flex w-full px-1 border-2 outline-none rounded-lg' onChange={handleChange} />
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
