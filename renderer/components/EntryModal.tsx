import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { Entry } from '../interfaces/Entry';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import Image from 'next/image';
import RandomPassModal from './RandomPassModal';
import { writeEntriesToFile } from '../utils/vaultFunctions';
import ExtraFieldComponent from './ExtraField';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
}

export default function EntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [submit, setSubmit] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [tab, setTab] = useState(true);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    

    const [extraFeild, setExtraFeild] = useState({name:"", data:Buffer.from(''), isSensitive:false});


    useEffect(()=>{
        if (submit){
            entry.decryptEntryPass(vault.kek).then((x)=>{
                setEntry((prev)=>prev.cloneMutate('password',Buffer.from(x)))
            }).catch((error)=>{
                // consume the error
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

    const handleCopy = ()=>{
        entry.decryptEntryPass(vault.kek).then((x)=>{
            navigator.clipboard.writeText(x);
        }).catch(()=>{
            navigator.clipboard.writeText(entry.password.toString());    
        })
        addBanner(bannerContext, 'password copied successfully', 'success')
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

    const handleAddExtraField = ()=>{
        entry.addExtraField(vault.kek, extraFeild.name, extraFeild.data, extraFeild.isSensitive).then((e)=>{
            setEntry(e);
        })
        setExtraFeild({name:"", data:Buffer.from(''), isSensitive:false})
    }

    const escapeHandler = (e:KeyboardEvent) => {
        if (e.key === "Escape") {
        setShowModal(false);
        }
    };

    const copyHandler = (e:KeyboardEvent)=>{
        var key = e.key; // keyCode detection
        var ctrl = e.ctrlKey // ctrl detection
        var cmd_h = e.metaKey// ⌘ detection
        
        if ( key.toLowerCase() === 'c' && ctrl || key.toLowerCase() === 'c' && cmd_h ) {
            e.preventDefault();
            
            handleCopy()
            
            
        }
    }

    const handleChangeExtraField = (e:React.ChangeEvent<HTMLInputElement>)=>{
        console.log(e.target.id, e.target.value)
        e.target.id !== 'data'?
        setExtraFeild(prev=>({...prev, [e.target.id]:e.target.value}))
        :
        setExtraFeild(prev=>({...prev, [e.target.id]:Buffer.from(e.target.value)}))
    }

    useEffect(() => {
    document.addEventListener("keydown", (escapeHandler), false);
    addEventListener("keydown", (copyHandler), false);
    return () => {
      document.removeEventListener("keydown", escapeHandler, false);
      removeEventListener("keydown", (copyHandler), false);
    };
  }, []);


    return (
        // blurred bg parent div
        <div className='fixed flex flex-col top-0 left-0 w-screen h-screen justify-center items-center backdrop-blur-lg z-10'>
        
            <div onCopy={handleCopy}  className='flex flex-col bg-base-200 border-2 border-base-300 relative shadow-base-300 z-30 w-[75vw] h-[75vh] shrink-0 grow-0 rounded-xl shadow-lg p-2 text-xl'>
            {
             (entry!==undefined)?
                <div className=' h-full w-full flex flex-col'>
                    {/* top bar */}
                    <div className='flex flex-row w-full h-10 items-start'>
                        {/* tab selector */}
                        <div className='flex h-full'>
                            <button onClick={()=>{setTab(true)}} type="button" className={`flex w-18 items-center justify-center h-full text-lg ${tab?"bg-base-100 border-t-2 border-r-2 border-l-2 border-base-300 rounded-t-lg h-11 top-0.5 relative":"bg-base-200"}`}>Main</button>
                            <button onClick={()=>{setTab(false)}} type="button" className={`flex w-18 items-center justify-center h-full text-lg ${!tab?"bg-base-100 border-t-2 border-l-2 border-r-2 border-base-300 rounded-t-lg h-11 top-0.5 relative":"bg-base-200"}`}>Extra</button>
                        </div>
                        <div className='flex w-full justify-center items-center text-2xl'>
                            {entry.title}
                        </div>
                        <button onClick={()=>{setShowModal(false)}} type="button" className='flex w-10 h-8 font-bold text-2xl text-center bg-neutral hover:bg-neutral-darken text-neutral-content items-center justify-center rounded-lg hover:rounded-xl duration-500'>&#x2715;</button>
                    </div>
                    <div className={`flex w-full h-full bg-base-100 border-2 border-base-300 rounded-b-lg rounded-r-lg ${!tab && 'rounded-t-lg'}`}>
                    {
                        tab?
                        // main tab
                            <form onSubmit={handleConfirm} className='flex flex-col w-full h-full p-2 gap-2'>
                                <div className='flex flex-row w-full border-2 border-base-300 h-8 gap-1 rounded-lg focus-within:border-primary duration-500 focus-within:bg-base-200'>
                                    <label className='flex shrink-0 w-26 border-r border-base-300 pl-2 rounded-l-lg'>Title</label>
                                    <input type="text" value={entry.title} onChange={handleChange} id='title' className='flex w-full outline-none' />
                                </div>
                                <div className='flex flex-row w-full border-2 border-base-300 h-8 gap-1 rounded-lg focus-within:border-primary duration-500 focus-within:bg-base-200'>
                                    <label className='flex shrink-0 w-26 border-r border-base-300 pl-2 rounded-l-lg'>Username</label>
                                    <input type="text" value={entry.username} onChange={handleChange} id='username' className='flex w-full outline-none' />
                                </div>
                                <div className='flex flex-row w-full border-2 border-base-300 h-8 gap-1 rounded-lg focus-within:border-primary duration-500 focus-within:bg-base-200 pr-2'>
                                    <label className='flex w-26 shrink-0 border-r border-base-300 pl-2 rounded-l-lg'>Password</label>
                                    <input type={showPass?"text":'password'} value={entry.password.toString()} onChange={handleChange} id='password' className='flex w-full h-full outline-none' />
                                    <div className='flex flex-row gap-2 w-32'>
                                        <Image onClick={()=>{setShowRandomPassModal(true)}} src={'/images/randomise.svg'} alt='randomise' width={25} height={25} className='h-auto flex' />
                                        <Image onClick={()=>{handleCopy()}} src={'/images/copy.svg'} alt='copy' width={25} height={25} className='w-auto h-auto flex items-center justify-center' />
                                        <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='w-auto h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                                    </div>
                                </div>
                                <div className='flex flex-col w-full border-2 border-base-300 h-full gap-1 rounded-lg focus-within:border-primary duration-500 focus-within:bg-base-200'>
                                    <label className='flex shrink-0 w-full border-b border-base-300 pl-2 rounded-l-lg'>Username</label>
                                    <textarea value={entry.notes} onChange={handleChange} id='notes' className='flex w-full outline-none h-full resize-none px-2' />
                                </div>
                                <div className='flex w-full h-12 justify-center'>
                                    <button className='bg-primary w-32 items-center justify-center text-primary-content rounded-lg h-full hover:bg-primary-darken'>Confirm</button>
                                </div>
                            </form>
                        :
                        // extras tab
                            <div className='flex flex-col w-full h-full gap-2 p-2'>
                                {/* all extra fields */}
                                <div className='flex flex-col w-full h-full overflow-y-hidden border-2 no-repeat'>
                                    <div className='flex h-8 w-full flow-row text-md gap-2 px-3'>
                                        <div className="flex w-full h-full">Name</div>
                                        <div className="flex w-full h-full">data</div>
                                        <div className="flex w-fit h-full">sensitive</div>
                                    </div>
                                    <div className='flex flex-col w-full h-full overflow-y-auto'>
                                        <div className="flex flex-col gap-2 p-1">
                                            {entry.extraFields.map((ef,i)=>
                                                <ExtraFieldComponent extraField={ef} key={i} />
                                            )}
                                            

                                        </div>
                                    </div>
                                </div>
                                {/* new extra field */}
                                <div className='flex flex-col w-full h-2/3 gap-2'>
                                    <div className='flex w-full'>Create new extra field</div>
                                    <div className='flex flex-row w-full h-8 gap-2 items-center'>
                                        <div className="flex w-full h-full border-2 rounded-lg px-2">
                                            <label className='flex w-26 shrink-0 border-r h-full items-center'>Name</label>
                                            <input className='flex w-full h-full outline-none' id='name' onChange={handleChangeExtraField}/>
                                        </div>
                                        <div className='flex w-fit h-full gap-2 items-center justify-center'>
                                            <label className='flex w-fit'>sensitive</label>
                                            <input className='flex w-4 h-4' type='checkbox' checked={extraFeild.isSensitive} onChange={(e)=>{setExtraFeild(prev=>({...prev, isSensitive:e.target.checked}))}} />
                                        </div>
                                    </div>
                                    <div className='flex flex-row w-full h-8 border-2 rounded-lg items-center px-2 gap-1'>
                                        <label className='flex w-26 shrink-0 border-r h-full items-center '>Value</label>
                                        <input className='flex w-full h-full outline-none' id='data' onChange={handleChangeExtraField} value={extraFeild.data.toString()}/>
                                    </div>
                                    <div className='flex w-full items-center justify-center'>
                                        <button onClick={()=>{handleAddExtraField()}} className='flex w-32 bg-primary items-center justify-center text-primary-content rounded-lg h-8'>Add</button>
                                    </div>
                                </div>
                            </div>
                    }
                    </div>
                    {showRandomPassModal && <RandomPassModal  setShowRandomPassModal={setShowRandomPassModal} setEntry={setEntry}/>}
                </div>
             :
                <div className='flex w-full h-full text-4xl'>
                    This entry does not exist
                </div>
            }
            </div>
        </div>
    )
}
