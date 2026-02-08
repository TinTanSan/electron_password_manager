import React, { ChangeEvent, useContext, useEffect, useState } from 'react'
import { Entry, ExtraField } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import { addBanner } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext'
import Image from 'next/image'
import RandomPassModal from './RandomPassModal'
import ExtraFieldComponent from './ExtraField'
type props ={
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}

export default function NewEntryForm({setShowForm}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const {banners, setBanners} = useContext(BannerContext)
    //  tab is whether we are looking at the main fields or the additional fields
    const [tab, setTab] = useState(true);

    // extra field state
    const [extraField, setExtraField] = useState<ExtraField>({name:"", data: Buffer.from(""), isProtected: false});

    const handleEFieldChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>{
        if (e.target.id === 'name'){
            setExtraField(prev=>({...prev, name: e.target.value}));
        }else if (e.target.id === "data"){
            setExtraField(prev=>({...prev, data:Buffer.from(e.target.value)}))
        }else if (e.target.id === "protected" && e.target.type === "checkbox"){
            setExtraField(prev=>({...prev, isProtected: (e.target as HTMLInputElement).checked}))
        }
    }


    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);

    const [entry, setEntry] = useState<Entry>({
        title:"",
        username:"",
        password:Buffer.from(""),
        notes:"",
        extraFields: [],
        isFavourite: false,
        passHash: Buffer.from(""),
        metadata: {
            createDate: new Date(),
            lastEditedDate: new Date(),
            version: '1.0.0',
            lastRotate: new Date(),
            uuid: ''
        },
        group:''
    })
    
    
    
    const handleChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        setEntry((prev)=>({...prev, [e.target.id]: e.target.id==='password'?  Buffer.from(e.target.value): e.target.value}));
    }

    const handleAddExtraField = ()=>{
        setEntry(prev=>({
            ...prev,
            extraFields: [...prev.extraFields, extraField]
        }))
    }

    const handleRemoveExtraField = (name:string)=>{
        setEntry(prev=>({
            ...prev,
            extraFields: prev.extraFields.filter(x=>x.name !== name)
        }))
    }
    

    const handleAdd = (e:React.FormEvent)=>{
        e.preventDefault()
        if (vault !== undefined){
            // go ahead
            window.vaultIPC.addEntry(entry).then((x)=>{
                if (x.status === "OK"){
                    addBanner(setBanners, 'Entry Added','success');
                    window.vaultIPC.getPaginatedEntries(0).then((response)=>{
                        setVault(prev=>({...prev, 
                            entries:response,
                            vaultMetadata: {
                                ...prev.vaultMetadata,
                                lastEditDate: new Date(),
                            }
                        }))
                        
                    }).catch((error)=>{
                        addBanner(setBanners, 'unable to get paginated entries', 'error');
                    })                
                    setShowForm(false);
                }else{
                    addBanner(setBanners, 'Unable to add entry: '+x.result, 'error')
                }
            })
        }else{
            addBanner(setBanners, 'vault was undefined but you were able to open the new Entry form', 'error');
            setShowForm(false);
        }
    }

    const escapeHandler = (e:KeyboardEvent) => {
        if (e.key === "Escape") {
        setShowForm(false);
        }
    };
    useEffect(() => {
        document.addEventListener("keydown", (escapeHandler), false);
        return () => {
          document.removeEventListener("keydown", escapeHandler, false);
        };
      }, []);
  
    return (
        <div className='backdrop-blur-lg z-20 fixed w-screen h-screen top-0 left-0 flex flex-col justify-center items-center'>
            <form onSubmit={handleAdd} className='flex flex-col relative w-1/2 h-[80vh] border-2 border-base-300 bg-base-200 z-10 shadow-lg rounded-xl p-2 items-center'>
                {/* tab selector */}
                <div className='flex w-full h-14 items-center'>
                    <div className='flex items-center h-full'>
                        <button onClick={()=>{setTab(true)}} type='button' className={`h-full ${tab? "bg-base-100 border-t-2 border-base-300 border-r-2 border-l-2 top-0.5 relative": "bg-base-200"}  rounded-t-lg w-20 items-center justify-center shrink-0 flex`}>Main</button>
                        <button onClick={()=>{setTab(false)}} type='button' className={`h-full ${!tab? "bg-base-100 border-t-2 border-base-300 border-r-2 border-l-2 top-0.5 relative ": "bg-base-200"} rounded-t-lg w-20 items-center justify-center shrink-0 flex`}>Extra</button>
                    </div>
                    {/* title */}
                    <div className='flex w-full items-center h-8 justify-center text-xl'>Create New Entry</div>
                    {/* close button */}
                    <button type='button' onClick={()=>{setShowForm(false)}} className='flex justify-center items-center rounded-lg bg-neutral font-bold text-xl text-accent-content h-8 w-14 hover:rounded-xl duration-500 transition-all'>&#x2715;</button>
                </div>

                {tab ? 
                <div className='flex flex-col w-full h-full gap-5 p-2 bg-base-100 border-2 border-base-300 rounded-b-lg rounded-tr-lg'>
                   
                   <div className='text-xl w-full h-14'>Set Main fields</div>
                   <div className='flex w-full border-2 h-10 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/100 focus-within:shadow-zinc-300 transition-all duration-700 shrink-0 grow-0'>
                        <div className='flex text-nowrap w-18 shrink md:w-20 lg:w-24 items-center text-lg'>Title</div>
                        <input value={entry.title} placeholder='enter a title here' id='title' className='flex w-full px-2 outline-none bg-base-200 focus:bg-base-300 z-0 rounded-r-md' onChange={handleChange} />
                    </div>
                   <div className='flex w-full border-2 h-10 shrink-0 grow-0 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/100 focus-within:shadow-zinc-300 transition-colors duration-700'>
                        <div className='flex text-nowrap w-18 shrink md:w-20 lg:w-24 items-center text-md'>Username</div>
                        <input value={entry.username} placeholder='enter a username here' id='username' className='flex w-full px-2 outline-none focus:bg-base-300 z-0 rounded-r-md bg-base-200' onChange={handleChange} />
                    </div>
                    <div className='flex gap-2 items-center w-full h-10 shrink-0 grow-0 border-2 rounded-lg pl-2 focus-within:border-primary focus-within:shadow-lg/100 focus-within:shadow-zinc-300 transition-all duration-700'>
                        <div className='flex w-18 text-md items-center'>Password</div>
                        <div className=" flex w-full rounded-r-md h-full items-center gap-1 px-1 focus-within:bg-base-300 bg-base-200">
                            <input type={showPass?'text':'password'} value={entry.password.toString() } placeholder='enter a password here or click randomise icon to create one' id='password' className='flex w-full outline-none' onChange={handleChange} />
                            <Image onClick={()=>{setShowRandomPassModal(true)}} src={'/images/randomise.svg'} alt='randomise' width={25} height={25} className='h-auto flex' />
                            <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='w-auto h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 items-start w-full h-full grow shrink'>
                        <div className='flex text-nowrap w-full'>Notes:</div>
                        <textarea placeholder='Enter any notes here, for sensitive data (like security questions) head over to the extra tab and add an extra field with the sensitive marker checked.' value={entry.notes} id='notes' className='flex w-full h-full resize-none px-1 border-2 focus:bg-base-300 outline-none rounded-lg focus:border-primary transition-all duration-700 focus:shadow-lg/100 shadow-zinc-300' onChange={handleChange} />
                    </div>
                </div>
                :
                <div className='flex flex-col w-full h-full gap-5 p-2 bg-base-100 border-2 border-base-300 rounded-lg overflow-y-hidden'>
                    <div className='flex flex-col w-full h-fit shrink-0'>
                        <div className='flex w-full h-fit justify-center text-lg'>New Extra field</div>
                        <div className='flex flex-col gap-5'>
                            <div className='flex border-2 rounded-lg focus-within:shadow-lg duration-700 h-8 focus-within:border-primary'>
                                <label className='flex w-24 justify-center h-full items-center' title='the name of this extra field or what it is used for'>Name</label>
                                <input onChange={handleEFieldChange} id='name' value={extraField.name} className='px-1 outline-none w-full bg-base-200 focus:bg-base-300 rounded-r-md'/>
                            </div>
                            <div className='flex border-2 rounded-lg focus-within:shadow-lg duration-700 h-8 focus-within:border-primary'>
                                <label className='flex w-24 justify-center h-full items-center' title='the name of this extra field or what it is used for'>Data</label>
                                <input onChange={handleEFieldChange} id='data' value={extraField.data.toString()} className='px-1 outline-none w-full focus:bg-base-200 rounded-r-md'/>
                            </div>
                            <div className='flex rounded-lg duration-700 h-8 items-center gap-5'>
                                <div className='flex w-full items-center '>
                                    <label className='flex w-fit px-2 text-nowrap justify-center h-full items-center' title='the name of this extra field or what it is used for'>Protect Field</label>
                                    <input type='checkbox' onChange={handleEFieldChange} checked={extraField.isProtected}  className='px-1 outline-none w-4 h-4 rounded-r-md'/>
                                </div>
                                <div className='flex w-full h-full justify-end'>
                                    <button type='button' onClick={handleAddExtraField} className='flex w-fit px-5  md:px-10 shrink bg-primary hover:bg-primary-darken text-primary-content items-center justify-center rounded-lg h-full'>Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                        <div className='flex flex-col w-full h-full gap-2 overflow-y-auto'>
                            {entry.extraFields.map((ef, i)=>
                                <ExtraFieldComponent extraField={ef} entry={entry} key={i} onDelete={handleRemoveExtraField}/>
                            )}
                        </div>
                    
                </div>    
            
            }
                <button type='submit' className='bg-primary mt-2 shrink-0 hover:bg-primary-darken rounded-lg text-primary-content w-1/3 h-12 flex justify-center items-center'>Create</button>
            </form>
            {
                showRandomPassModal &&
                <RandomPassModal setEntry={setEntry} setShowRandomPassModal={setShowRandomPassModal} />
            }
        </div>
    )
}
