import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import { Entry } from '../interfaces/Entry';
import { asciiSafeSpecialChars, digits, lowerCaseLetters, upperCaseLetters } from '../utils/commons';
import zxcvbn from 'zxcvbn';

export type RandomPassGeneratorSettings={
    length:number,
    allowCapitals:boolean, 
    allowNumbers:boolean, 
    allowSpecChars:boolean,
    excludedChars: string,
}

type props = {
    setShowRandomPassModal: React.Dispatch<React.SetStateAction<boolean>>,
    setEntry: React.Dispatch<React.SetStateAction<Entry>>
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
    console.log(zxcvbn(ret).score);
    return ret;

}
export default function RandomPassModal({setShowRandomPassModal, setEntry}:props) {
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:12,allowCapitals:false, allowNumbers:false, allowSpecChars:false, excludedChars:""});
    const [randomPass, setRandomPass] = useState("");
    const [showPass, setShowPass] = useState(false);
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
    useEffect(()=>{
        if (!Number.isNaN(length)){
            setRandomPass(generateRandomPass(randomSettings))
        }
    },[randomSettings])
    return (
    <div className='flex flex-col z-50 absolute border-2 text-base-content bg-base-100 border-base-300 w-[55vw] h-[45vh] gap-2 lg:h-[30vh] shadow-xl rounded-lg p-2'>
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
            <div className='flex lg:flex-row flex-col w-full h-full lg:h-fit gap-2 lg:gap-5 items-center justify-center'>
                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowCapitals')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowCapitals&& 'bg-neutral text-neutral-content'}`}>
                    capital letters
                </button>
                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowNumbers')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowNumbers&& 'bg-neutral text-neutral-content'}`}>
                    numbers
                </button>
                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowSpecChars')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-2 h-10 ${randomSettings.allowSpecChars&& 'bg-neutral text-neutral-content'}`}>
                    special chars
                </button>
            </div>
            {/* length slider + input box */}
            <div className='flex w-full h-fit gap-2 items-center'>
                <label>Length</label>
                <input id='length' type='range' step={1} min={8} max={50} value={randomSettings.length} onChange={(e)=>{handleRandomPassSettingChange('length', e.target.value)}} 
                    className='flex w-full border-2 h-4  rounded-full cursor-pointer appearance-none'/>
                <input value={randomSettings.length} type='number' onChange={(e)=>{handleRandomPassSettingChange('length', e.target.value)}} className='flex w-14 outline-none h-8 rounded-lg border-2 px-1'/>
            </div>
        </div>
        <div className='flex justify-between'>
            <button type='button' className='flex rounded-lg w-24 h-8 justify-center items-center bg-accent hover:bg-accent-darken text-accent-content' onClick={()=>{setShowRandomPassModal(false)}}>Cancel</button>
            <button type='button' className='flex rounded-lg w-24 h-8 justify-center items-center bg-primary hover:bg-primary-darken text-primary-content' onClick={()=>{setEntry((prev)=>({...prev, 'password':Buffer.from(randomPass)})); setShowRandomPassModal(false)}}>Confirm</button>
        </div>
    </div>

  )
}
