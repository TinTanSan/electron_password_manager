import React, { ChangeEvent, useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import { addBanner } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext'
import Image from 'next/image'
import { makeNewDEK, wrapDEK } from '../utils/keyFunctions'
import { encryptPass } from '../utils/entryFunctions'
type props ={
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}

type RandomPassGeneratorSettings={
    length:number,
    allowCapitals:boolean, 
    allowNumbers:boolean, 
    allowSpecChars:boolean
}

export const generateRandomPass = (settings:RandomPassGeneratorSettings) =>{
    const lowerCaseLetters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
    const upperCaseLetters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
    const digits = ["0","1","2","3","4","5","6","7","8","9"];
    const asciiSafeSpecialChars = ["!","\"","#","$","%","&","'","(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?", "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~"];
    
    const upperCaseLettersToUse = settings.allowCapitals? Math.random()*settings.length/4 : 0;
    const digitsToUse = settings.allowNumbers? Math.random()*settings.length/4 : 0;
    const specCharsToUse = settings.allowSpecChars? Math.random()*settings.length/4 : 0;
    const normalCharsToUse = settings.length - Math.floor(upperCaseLettersToUse)- Math.floor(digitsToUse) - Math.floor(specCharsToUse)

}


export default function NewEntryForm({setShowForm}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext)

    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [randomPass, setRandomPass] = useState("");
    // settings for the random pass
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:12,allowCapitals:false, allowNumbers:false, allowSpecChars:false});
    const [entry, setEntry] = useState<Entry>({
        title:"",
        username:"",
        password:Buffer.from(""),
        dek: Buffer.from(""),
        notes:"",
        metadata:{
            createDate:new Date(),
            lastEditedDate: new Date()
        }
    })
    useEffect(()=>{
        // initailise and wrap dek
        makeNewDEK().then((val)=>{
            wrapDEK(val, vault.kek).then((dek)=>{
                // make val (the original DEK) unreadable
                val = undefined;
                setEntry(prev=>({...prev, dek:dek}))
            })    
        })
    },[])
    
    const handleChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'title'){
            setEntry((prev)=>({...prev, title:e.target.value}));
        }
        else if (e.target.id === "username"){
            setEntry((prev)=>({...prev, username:e.target.value}));
        }
        else if (e.target.id === "password"){
            setEntry((prev)=>({...prev, password:Buffer.from(e.target.value)}));
        }else if (e.target.id === "notes"){
            setEntry((prev)=>({...prev, notes:e.target.value}));
        }

    }
    const handleAdd = (e:React.FormEvent)=>{
        if (vault !== undefined){

            // go ahead
        }else{
            addBanner(bannerContext, 'vault was undefined but you were able to open the new Entry form', 'error');
        }
    }
  
    return (
        <div className='backdrop-blur-lg z-20 fixed w-screen h-screen top-0 left-0 flex flex-col justify-center items-center'>
            <form className='flex flex-col relative w-1/2 h-[80vh] border-2 gap-5 border-base-300 bg-base-100 z-10 shadow-lg rounded-xl p-2 items-center'>
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
                <button className='bg-primary hover:bg-primary-darken rounded-lg text-primary-content w-1/3 h-12 flex justify-center items-center'>Create</button>
            </form>
            {
                showRandomPassModal &&
                <div className='flex flex-col z-50 absolute border-2 text-base-content bg-base-200 border-base-300 w-[45%] h-1/3 shadow-xl rounded-lg p-2'>
                    <div className='flex w-full justify-center'>
                        Generate random password
                    </div>
                    <div className='flex w-full h-full flex-col'>
                        <div className='flex w-full border-2 px-1 rounded-lg gap-2'>
                            <input id='password' type={showPass?'text':'password'} className=' flex w-full h-8 rounded-lg shrink outline-0'/>
                            <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                        </div>
                        {/* below are the random characters choices */}
                        {/* include Capitals */}

                    </div>
                    <div>
                        <button onClick={()=>{}}>Cancel</button>
                        <button onClick={()=>{setEntry((prev)=>({...prev, password:Buffer.from(randomPass)}))}}>Confirm</button>
                    </div>
                </div>

            }
        </div>
    )
}
