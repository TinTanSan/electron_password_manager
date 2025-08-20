import React, { ChangeEvent, useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import { addBanner } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext'
import Image from 'next/image'
import { makeNewDEK, wrapDEK } from '../utils/keyFunctions';
import { asciiSafeSpecialChars, digits, lowerCaseLetters, upperCaseLetters } from '../utils/commons'
import { writeEntriesToFile } from '../utils/vaultFunctions'
import RandomPassModal from './RandomPassModal'
type props ={
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}

export default function NewEntryForm({setShowForm}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext)

    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    
    
    
    const [entry, setEntry] = useState<Entry>(new Entry({
        title:"",
        username:"",
        password:Buffer.from(""),
        notes:"",
    }, vault.kek))
    
    
    
    const handleChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{

        setEntry((prev)=>prev.update(e.target.id, e.target.value));
        if (e.target.id === "password"){
            setEntry((prev)=>prev.update('password',Buffer.from(e.target.value)));
            return;
        }

    }

    

    const handleAdd = (e:React.FormEvent)=>{
        e.preventDefault()
        if (vault !== undefined){
            // go ahead
            entry.encryptPass(vault.kek).then((encryptedPass)=>{
                const newEntries = [...vault.entries, entry.update('password', encryptedPass)];    
                writeEntriesToFile(newEntries, vault.filePath, vault.wrappedVK, vault.kek).then(({content, status})=>{
                    if (status === "OK"){
                        setVault((prev)=>({...prev, entries:newEntries, fileContents:content}))
                    }else{
                        addBanner(bannerContext, 'unable to add entry, writing to file failed', 'error');
                    }
                })
                setShowForm(false)
            })
            


            
        }else{
            addBanner(bannerContext, 'vault was undefined but you were able to open the new Entry form', 'error');
        }
    }
  
    return (
        <div className='backdrop-blur-lg z-20 fixed w-screen h-screen top-0 left-0 flex flex-col justify-center items-center'>
            <form onSubmit={handleAdd} className='flex flex-col relative w-1/2 h-[80vh] border-2 gap-5 border-base-300 bg-base-100 z-10 shadow-lg rounded-xl p-2 items-center'>
                <div className='flex relative w-full h-fit justify-end items-center'>
                    <div className='flex w-full justify-center absolute text-xl'>
                        Create new entry
                    </div>
                    <div onClick={()=>{setShowForm(false)}} className=' z-10 flex cursor-pointer font-bold justify-center items-center px-2 rounded-lg h-8 tex-4xl text-nowrap bg-accent text-accent-content hover:bg-accent-darken'>
                        <Image src={'/images/close.svg'} alt='x' width={30} height={30} className='border-2 h-auto cursor-pointer text-white fill-accent' />
                    </div>
                </div>
                <div className='flex flex-col w-[95%] h-full gap-2'>
                   <div className='flex flex-col md:flex-row basis-1/5 md:items-center gap-2'>
                    <div className='flex text-nowrap w-24 shrink-0 grow-0'>Title</div>
                    <input onChange={handleChange} id='title' className='border-2 flex w-full h-8 rounded-lg shrink px-1'/>
                   </div>
                   <div className='flex flex-col md:flex-row basis-1/5 md:items-center gap-'>
                    <div className='flex text-nowrap w-24 shrink-0 grow-0'>Username</div>
                    <input onChange={handleChange} id='username' className='border-2 flex w-full h-8 rounded-lg shrink px-1'/>
                   </div>
                   <div className='flex basis-1/5 h-full items-center gap-2'>
                    <div className='flex text-nowrap w-24 shrink-0 grow-0'>Password</div>
                    <div className='flex w-full border-2 px-1 rounded-lg gap-2'>
                        <input onChange={handleChange} value={Buffer.from(entry.password).toString('utf8')} id='password' type={showPass?'text':'password'} className=' flex w-full h-8 rounded-lg shrink outline-0'/>
                        <Image onClick={()=>{setShowRandomPassModal(true)}} src={"/images/randomise.svg"} alt='random' width={25} height={25} className='h-auto flex cursor-pointer' title='generate random password' />
                        <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                    </div>
                   </div>
                   <div className='flex flex-col w-full h-full gap-2'>
                    <div className='flex text-nowrap w-28 shrink-0 grow-0'>Notes</div>
                    <textarea onChange={handleChange} id='notes' maxLength={512} placeholder='a note, can be something like directions on the website, warning: you should not put security questions here. max length 512 characters.' className='flex w-full h-full border-2 rounded-lg resize-none shrink p-1 text-sm'/>
                   </div>
                </div>
                <button type='submit' className='bg-primary hover:bg-primary-darken rounded-lg text-primary-content w-1/3 h-12 flex justify-center items-center'>Create</button>
            </form>
            {
                showRandomPassModal &&
                <RandomPassModal setEntry={setEntry} setShowRandomPassModal={setShowRandomPassModal} />
            }
        </div>
    )
}
