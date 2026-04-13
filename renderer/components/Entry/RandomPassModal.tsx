import Image from 'next/image';
import React, { useContext, useEffect, useState } from 'react'
import { Entry } from '@interfaces/Entry';
import { asciiSafeSpecialChars, digits, lowerCaseLetters, shaHash, upperCaseLetters } from '@utils/commons';
import zxcvbn from 'zxcvbn';
import Slider from '@components/Slider';
import ToggleSwitch from '@components/toggleSwitch';
import { PreferenceContext } from '@contexts/preferencesContext';

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
export function handleGetFeedback( entrypass:string, passwordScore:{score:number, feedback}) {
    if (passwordScore.feedback.warning){
        return passwordScore.feedback.warning
    }else{
        if (entrypass.length === 0){
            return "Please enter a password to get feedback"
        }
        if (passwordScore.score === 4){
            return "Strong pass"
        }else{
            return "Try using a longer password with random characters"
        }
    }
}

export const generateRandomPass = (settings:RandomPassGeneratorSettings):string =>{
    let settingsUsed = 1; //default is 1, for just lower case letters
    if (settings.allowCapitals) settingsUsed +=1;
    if (settings.allowNumbers) settingsUsed+=1;
    if (settings.allowSpecChars) settingsUsed +=1;

    let upperCaseLettersToUse = settings.allowCapitals? Math.ceil(Math.random()*settings.length/settingsUsed) : 0;
    let digitsToUse = settings.allowNumbers? Math.ceil(Math.random()*settings.length/settingsUsed) : 0;
    let specCharsToUse = settings.allowSpecChars? Math.ceil(Math.random()*settings.length/settingsUsed) : 0;
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

const passwordScoreStyle = [
    'bg-error w-1 h-1 duration-300 transition-all',
    'bg-error w-1/20 h-1 duration-300 transition-all',
    'bg-warning w-2/4 h-1 duration-300 transition-all',
    'bg-info w-3/4 h-1 duration-300 transition-all',
    'bg-success w-full h-1 duration-300 transition-all'
]
export default function RandomPassModal({setShowRandomPassModal, setEntry}:props) {
    const {preference} = useContext(PreferenceContext);
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:12,allowCapitals:true, allowNumbers:true, allowSpecChars:true, excludedChars:""});
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
    const {score, feedback} = zxcvbn(randomPass);
    
    const handleConfirm = ()=>{
        shaHash(randomPass).then((digest)=>{
            setEntry(prev=>({...prev, passHash:Buffer.from(digest), password:Buffer.from(randomPass)}))
        })
        setShowRandomPassModal(false);
    }

    useEffect(()=>{
        if (!Number.isNaN(length)){
            setRandomPass(generateRandomPass(randomSettings))
        }
    },[randomSettings])
    return (

    <div className='flex flex-col w-[30%] h-1/2 absolute border-2 justify-between text-normal bg-base-100 items-center z-20 rounded-lg shadow-lg p-2'>
        <div className='flex text-subheading'> Generate random password </div>
        {/* password preview and strength meter */}
        <div className='flex flex-col gap-2 w-full h-fit'>
            <div className='flex w-full h-8 border-2 rounded-lg px-1 gap-1 focus-within:border-primary'>
                <input type={showPass?"text":"password"}  className=' w-full h-full text-nowrap overflow-scroll outline-none' value={randomPass} onChange={(e)=>{setRandomPass(e.target.value)}}/>
                <Image onClick={()=>{setShowPass(prev=>!prev)}} src={showPass? "/images/hidePass.svg":"/images/showPass.svg"} alt={showPass?"hide": "show"} width={25} height={10} className='flex h-auto' />
            </div>
            {/* strength meter */}
            <div className='flex flex-col w-full h-fit'>
                <div className='relative flex flex-col w-full h-fit min-h-1 inset-shadow-2xs'> 
                    <div className={passwordScoreStyle[score]} />
                    <p className='text-subnotes'>{handleGetFeedback(randomPass, {score, feedback})}</p>
                </div>
                
            </div>
        </div>


        {/* settings */}
        <div className='flex flex-col justify-between w-full h-1/2'>
            <div className="flex w-full h-8 gap-3 items-center">
                <label className="flex">Length</label>
                <Slider thumbDimensions='h-4 w-4 border-2' selectedHeight='h-4' value={randomSettings.length} bgStyle='h-3 bg-base-300 rounded-lg' setValue={(newVal:number)=>{setRandomSettings(prev=>({...prev, length:newVal}))}} minimum={8} maximum={preference.maxGeneratedPassLength} />
            </div>
            <div className="flex w-full h-8 justify-between items-center">
                <label className="flex">Allow capitals</label>
                <ToggleSwitch value={randomSettings.allowCapitals} setValue={()=>{setRandomSettings(prev=>({...prev, allowCapitals: !prev.allowCapitals}))}} />
            </div>
            <div className="flex w-full h-8 justify-between items-center">
                <label className="flex">Allow Numbers</label>
                <ToggleSwitch value={randomSettings.allowNumbers} setValue={()=>{setRandomSettings(prev=>({...prev, allowNumbers: !prev.allowNumbers}))}} />
            </div>
            <div className="flex w-full h-8 justify-between items-center">
                <label className="flex">Allow Symbols</label>
                <ToggleSwitch value={randomSettings.allowSpecChars} setValue={()=>{setRandomSettings(prev=>({...prev, allowSpecChars: !prev.allowSpecChars}))}} />
            </div>
        </div>

        {/* bottom section with cancel and confirm buttons */}
        <div className='flex w-full gap-5'>
            <button onClick={()=>{setRandomPass(""); setShowRandomPassModal(false)}} className="flex w-1/2 items-center justify-center bg-base-300 hover:bg-base-darken h-8 rounded-lg">Cancel</button>
            <button onClick={handleConfirm} className="flex w-1/2 items-center justify-center bg-primary text-primary-content hover:bg-primary-darken h-8 rounded-lg">Confirm</button>
        </div>
    </div>

  )
}
