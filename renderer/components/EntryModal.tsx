import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { Entry } from '../interfaces/Entry';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import Image from 'next/image';
import RandomPassModal from './RandomPassModal';
import { writeEntriesToFile } from '../utils/vaultFunctions';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
}

export default function EntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [submit, setSubmit] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    
    useEffect(()=>{
        if (submit){
            entry.decryptEntryPass(vault.kek).then((x)=>{
                setEntry((prev)=>prev.cloneMutate('password',Buffer.from(x)))
            })
            setSubmit(false)
        }
    },[submit])

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'password'){
            setEntry((prev)=>prev.cloneMutate('password',Buffer.from(e.target.value)))
            return;
        }
        setEntry(prev=>prev.cloneMutate(e.target.id, e.target.value));
        
    }

    const handleConfirm = (e:FormEvent)=>{
        e.preventDefault();
         entry.encryptPass(vault.kek).then((passBuf)=>{
            try {
                const updatedEntry = new Entry({...entry, password:passBuf, metadata:{...entry.metadata, lastEditedDate: new Date()}})
                setEntry(updatedEntry)
                const newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? updatedEntry : x)
                setVault((prev)=>({
                    ...prev, 
                    entries: newEntries
                }));
                writeEntriesToFile(newEntries, vault.filePath, vault.wrappedVK, vault.kek);
                addBanner(bannerContext, 'entry updated successfully', 'success')
                setSubmit(true)
                setShowModal(false);
            } catch (error) {
                addBanner(bannerContext, 'unable to update entry '+error, 'error');
            }
        })
    }
    const escapeHandler = (e) => {
    if (e.key === "Escape") {
      setShowModal(false);
    }
  };
    useEffect(() => {
    document.addEventListener("keydown", (escapeHandler), false);
    return () => {
      document.removeEventListener("keydown", escapeHandler, false);
    };
  }, []);


    return (
        // blurred bg parent div
        <div className='fixed flex flex-col top-0 left-0 w-screen h-screen justify-center items-center backdrop-blur-lg z-10'>
        
            <div className='flex flex-col bg-base-100 border-2 border-base-300 relative shadow-base-300 z-30 w-[75vw] h-[75vh] shrink-0 grow-0 rounded-xl shadow-lg p-2 text-xl'>
            {
             (entry!==undefined)?
                <form onSubmit={handleConfirm} className='flex flex-col gap-2 grow-0 shrink-0 w-full h-full text-base-content'>
                    {/* top panel with title and close button */}
                    <div className='flex w-full justify-center h-10 text-2xl items-center font-bold '>
                        <div className='flex'>{entry.title}</div>
                        
                        <div className='flex absolute right-2'>
                            <div onClick={()=>{setShowModal(false)}} className=' z-10 flex cursor-pointer font-bold justify-center items-center px-2 rounded-lg h-8 tex-4xl text-nowrap bg-accent text-accent-content hover:bg-accent-darken'>
                                <Image src={'/images/close.svg'} alt='x' width={30} height={30} className='border-2 h-auto cursor-pointer text-white fill-accent' />
                            </div>
                        </div>
                    </div>
                    {/* entry fields */}
                    <div className="flex w-full h-full gap-5 px-1">
                        {/* left side */}
                        <div className='flex flex-col items-center h-full w-full'>
                            <div className='flex w-full h-10 justify-center items-center'>Main Fields</div>
                            <div className='flex flex-col w-full h-full gap-5'>
                                {/* title */}
                                <div className='flex w-full border-2 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/20 focus-within:drop-shadow-zinc-300 transition-all duration-700'>
                                    <div className='flex text-nowrap w-18 shrink md:w-20 lg:w-24 items-center text-lg'>Title</div>
                                    <input value={entry.title} id='title' className='flex w-full px-2 outline-none focus:bg-base-300 z-0 rounded-r-md bg-base-100' onChange={handleChange} />
                                </div>
                                {/* username */}
                                <div className='flex w-full border-2 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/20 focus-within:drop-shadow-zinc-300 transition-all duration-700'>
                                    <div className='flex text-nowrap w-18 shrink text-sm md:w-20 lg:w-24 items-center md:text-md'>Username</div>
                                    <input value={entry.username} id='username' className='flex w-full px-2 outline-none focus:bg-base-300 z-0 rounded-r-md bg-base-100' onChange={handleChange} />
                                </div>
                                {/* password */}
                                <div className='flex items-center w-full border-2 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/20 focus-within:drop-shadow-zinc-300 transition-all duration-700'>
                                    <div className='flex text-nowrap w-18 shrink text-sm md:w-20 lg:w-24 justify-start lg:text-md'>Password</div>
                                    <div className=" flex w-full rounded-r-md  items-center gap-1 px-1 focus-within:bg-base-300">
                                        <input type={showPass?'text':'password'} value={entry.password.toString() } id='password' className='flex w-full px-2 outline-none' onChange={handleChange} />
                                        <Image onClick={()=>{setShowRandomPassModal(true)}} src={'/images/randomise.svg'} alt='randomise' width={25} height={25} className='h-auto flex' />
                                        <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='w-auto h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                                    </div>
                                </div>
                                {showRandomPassModal && <RandomPassModal setShowRandomPassModal={setShowRandomPassModal}  setEntry={setEntry}/>}
                                {/* notes */}
                                <div className='flex flex-col gap-2 items-start w-full h-full'>
                                    <div className='flex text-nowrap w-34'>Notes:</div>
                                    <textarea value={entry.notes} id='notes' className='flex shrink-0 w-full h-60 resize-none px-1 border-2 focus:bg-base-300 outline-none rounded-lg focus:border-primary transition-all duration-700 focus:shadow-lg/100 shadow-zinc-300' onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                        {/* right side extra fields*/}
                        <div className='flex flex-col w-full h-full overflow-hidden'>
                            <div className='flex w-full h-10 overflow-y-auto justify-center items-center'>Extra fields</div>
                            <div className='flex flex-col w-full h-120 gap-5 overflow-y-auto border-2'>
                                {entry.extraFields.map((x)=>
                                <div>
                                    {x.name}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* confirm button */}
                    <div className='flex w-full h-fit justify-center'>
                        <button type='submit' className='flex w-1/2 hover:bg-primary-darken h-10 rounded-lg items-center justify-center  bg-primary text-primary-content'>Confirm</button>
                    </div>
                </form>

             :
                <div className='flex w-full h-full text-4xl'>
                    This entry does not exist
                </div>
            }
            </div>
        </div>
    )
}
