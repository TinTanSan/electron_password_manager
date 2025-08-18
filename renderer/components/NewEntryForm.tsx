import React, { ChangeEvent, useContext, useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import { addBanner } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext'
import Image from 'next/image'
import { makeNewDEK, wrapDEK } from '../utils/keyFunctions'
import { createEntry, encryptPass } from '../utils/entryFunctions'
import { asciiSafeSpecialChars, digits, lowerCaseLetters, upperCaseLetters } from '../utils/commons'
import { writeEntriesToFile } from '../utils/vaultFunctions'
type props ={
    setShowForm: React.Dispatch<React.SetStateAction<boolean>>
}

type RandomPassGeneratorSettings={
    length:number,
    allowCapitals:boolean, 
    allowNumbers:boolean, 
    allowSpecChars:boolean,
    excludedChars: string,
}

export const generateRandomPass = (settings:RandomPassGeneratorSettings):string =>{
    /*

    */
    let upperCaseLettersToUse = settings.allowCapitals?Math.ceil(Math.random()*settings.length/4) : 0;
    let digitsToUse = settings.allowNumbers?Math.ceil(Math.random()*settings.length/4) : 0;
    let specCharsToUse = settings.allowSpecChars?Math.ceil(Math.random()*settings.length/4) : 0;
    let normalCharsToUse = settings.length - Math.floor(upperCaseLettersToUse)- Math.floor(digitsToUse) - Math.floor(specCharsToUse)
    let ret = "";
    const excludC = settings.excludedChars ? settings.excludedChars.split(""): [];
    const allowedLowercaseLetters = excludC.length > 0? lowerCaseLetters.filter(x=>!excludC.includes(x)) : lowerCaseLetters;
    const allowedUpperCaseLetters = excludC.length > 0? upperCaseLetters.filter(x=>!excludC.includes(x)): upperCaseLetters;
    const allowedNumbers = excludC.length > 0? digits.filter(x=>!excludC.includes(x)): digits;
    const allowedSpecChars = excludC.length > 0? asciiSafeSpecialChars.filter(x=>!excludC.includes(x)): asciiSafeSpecialChars;
    while (ret.length < settings.length){
        // decide what to use:
        let charType = Math.floor(Math.random()*4)
        if (charType == 0 && normalCharsToUse > 0){
            ret += allowedLowercaseLetters[Math.floor(Math.random()*allowedLowercaseLetters.length)];
            normalCharsToUse -=1;
        }
        if (charType == 1 && upperCaseLettersToUse > 0){
            ret += allowedUpperCaseLetters[Math.floor(Math.random()*allowedUpperCaseLetters.length)];
            upperCaseLettersToUse -=1
        }
        if (charType == 2 && digitsToUse > 0){
            ret += allowedNumbers[Math.floor(Math.random()*allowedNumbers.length)];
            digitsToUse -=1
        }
        if (charType == 3 && specCharsToUse > 0){
            ret += allowedSpecChars[Math.floor(Math.random()*allowedSpecChars.length)];
            specCharsToUse-=1
        }
    }
    return ret;

}


export default function NewEntryForm({setShowForm}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext)

    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [randomPass, setRandomPass] = useState("");
    // settings for the random pass
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:12,allowCapitals:false, allowNumbers:false, allowSpecChars:false, excludedChars:""});
    const [entry, setEntry] = useState<Entry>({
        title:"",
        username:"",
        password:Buffer.from(""),
        dek: Buffer.from(""), // not going to be used
        notes:"",
        metadata:{
            createDate:new Date(),
            lastEditedDate: new Date()
        } // not going to be used
    })
    
    useEffect(()=>{
        if (!Number.isNaN(length)){
            setRandomPass(generateRandomPass(randomSettings))
        }
    },[randomSettings])
    
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

    const handleRandomPassSettingChange =(settingtoChange:string, val?:string)=>{
        if (settingtoChange === "length"){
            let length = parseInt(val);
            if (!Number.isNaN(length)){
                if (length <= 0){
                    length = 8;
                }
                if (length >50){
                    length = 50;
                }    
            }
            setRandomSettings((prev)=>({...prev, length}))
        }else if (settingtoChange === "allowCapitals") {
            setRandomSettings((prev)=>({...prev, allowCapitals:!prev.allowCapitals}))
        }else if (settingtoChange === "allowNumbers") {
            setRandomSettings((prev)=>({...prev, allowNumbers:!prev.allowNumbers}))
        }else if (settingtoChange === "allowSpecChars") {
            setRandomSettings((prev)=>({...prev, allowSpecChars:!prev.allowSpecChars}))
        }
    }

    const handleAdd = (e:React.FormEvent)=>{
        e.preventDefault()
        if (vault !== undefined){
            // go ahead
            createEntry(entry.title, entry.username, entry.password.toString(), entry.notes, vault.kek).then((createdEntry)=>{
                const newEntries = [...vault.entries, createdEntry];
                
                writeEntriesToFile(newEntries, vault.filePath, vault.wrappedVK, vault.kek).then(({content, status})=>{
                    if (status === "OK"){
                        setVault((prev)=>({...prev, entries:newEntries, fileContents:content}))
                    }else{
                        addBanner(bannerContext, 'unable to add entry, writing to file failed', 'error');
                    }
                })
            })
            setShowForm(false)
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
                <div className='flex flex-col z-50 absolute border-2 text-base-content bg-base-200 border-base-300 w-[55%] h-1/2 lg:h-1/3 shadow-xl rounded-lg p-2'>
                    <div className='flex w-full justify-center'>
                        Generate random password
                    </div>
                    <div className='flex w-full h-full flex-col gap-5'>
                        <div className='flex w-full px-1 gap-2'>
                            <div className='flex w-full border-2 px-1 rounded-lg gap-2'>
                                <input value={randomPass} onChange={(e)=>{setRandomPass(e.target.value)}} id='password' type={showPass?'text':'password'} className=' flex w-full h-8 rounded-lg shrink outline-0'/>
                                <Image onClick={()=>{setShowPass(!showPass)}} src={showPass? "/images/hidePass.svg": "/images/showPass.svg"} alt={showPass?'hide':'show'} width={25} height={25} className='h-auto cursor-pointer' title={showPass?'hide password':'show password'} />
                            </div>
                            <Image onClick={()=>{setRandomPass(generateRandomPass(randomSettings))}} src={'/images/randomise.svg'} alt='randomise' width={25} height={25} className='h-auto' />
                        </div>
                        <div className='flex lg:flex-row flex-col w-full h-full lg:h-fit gap-5 border-2 items-center justify-center'>
                            <button onClick={()=>{handleRandomPassSettingChange('allowCapitals')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowCapitals&& 'bg-neutral text-neutral-content'}`}>
                                capital letters
                            </button>
                            <button onClick={()=>{handleRandomPassSettingChange('allowNumbers')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowNumbers&& 'bg-neutral text-neutral-content'}`}>
                                numbers
                            </button>
                            <button onClick={()=>{handleRandomPassSettingChange('allowSpecChars')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowSpecChars&& 'bg-neutral text-neutral-content'}`}>
                                special characters
                            </button>
                        </div>
                        {/* length slider + input box */}
                        <div className='flex w-full h-fit gap-2 justify-start'>
                            <input id='length' type='range' step={1} min={8} max={50} value={randomSettings.length} onChange={(e)=>{handleRandomPassSettingChange('length', e.target.value)}} className='flex w-full'/>
                            <input value={randomSettings.length} type='number' onChange={(e)=>{handleRandomPassSettingChange('length', e.target.value)}} className='flex w-12 outline-none h-8 rounded-lg border-2 px-1'/>
                        </div>
                    </div>
                    <div className='flex justify-between'>
                        <button className='flex rounded-lg w-24 h-8 justify-center items-center bg-accent hover:bg-accent-darken text-accent-content' onClick={()=>{setShowRandomPassModal(false)}}>Cancel</button>
                        <button className='flex rounded-lg w-24 h-8 justify-center items-center bg-primary hover:bg-primary-darken text-primary-content' onClick={()=>{setEntry((prev)=>({...prev, password:Buffer.from(randomPass)})); setShowRandomPassModal(false)}}>Confirm</button>
                    </div>
                </div>

            }
        </div>
    )
}
