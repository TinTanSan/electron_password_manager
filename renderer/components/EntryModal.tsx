import React, { FormEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { Entry, ExtraField } from '../interfaces/Entry';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import { asciiSafeSpecialChars, digits, lowerCaseLetters, upperCaseLetters } from '../utils/commons';
import Image from 'next/image';
import zxcvbn from 'zxcvbn';
import Slider from './Slider';
import ExtraFieldComponent from './ExtraField';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
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

const scoreToColor = {0:'bg-error',1:'bg-error', 2:'bg-warning', 4:'bg-success', 3:'bg-info'}
const scoreToText = {0:'text-error',1:'text-error', 2:'text-warning', 4:'text-success', 3:'text-info'}
const scoreWidth = ['w-2','w-1/4', 'w-1/2', 'w-3/4', 'w-full'];
function handleGetFeedback( entrypass:string, passwordScore:{score:number, feedback:string}) {
    if (passwordScore.feedback){
        return passwordScore.feedback
    }else{
        if (entrypass.length === 0){
            return "Please enter a password to get feedback"
        }
        if (passwordScore.score === 4){
            return "Strong pass"
        }else{
            return "Could be better"
        }
    }
}

export type RandomPassGeneratorSettings={
    length:number,
    allowCapitals:boolean, 
    allowNumbers:boolean, 
    allowSpecChars:boolean,
    excludedChars: string,
}
export default function EntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [submit, setSubmit] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const vaultEntry = useRef(vault.entries.find(x=>x.metadata.uuid === uuid));
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    const [entryPass, setEntryPass]= useState<string>("");
    const [vEntPass, setVEntPass] = useState("");
    const areEqual = vaultEntry.current.isEqual(entry) && entryPass=== vEntPass;
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:8,allowCapitals:false, allowNumbers:false, allowSpecChars:false, excludedChars:""});
    const [extraFeild, setExtraFeild] = useState<ExtraField>({name:"", data:Buffer.from(''), isProtected:false});
    const [collapseLoginDetails, setCollapseLoginDetails] = useState(false);
    const [collapseExtraFeilds, setCollapseExtraFields] = useState(true);
    const [passwordScore, setpasswordScore] = useState({score:0, feedback:""});    
    const [collapseNewEf, setCollapseNewEf] = useState(true);
    const [groupSearch, setGroupSearch] = useState(() => {return vault.entryGroups.find(g => g.entries.includes(uuid))?.groupName ?? "";});

    const existingGroupName = useMemo(()=>{
        console.log('memo existgroup run',vault.entryGroups)
        const foundValue = vault.entryGroups.find((x)=>x.entries.find((x)=>x === uuid))?.groupName ?? "";
        setGroupSearch(foundValue);
        return foundValue;
    }, [vault.entryGroups, uuid])

    

    const filteredGroups = useMemo(()=>{
        return vault.entryGroups.filter((group)=>group.groupName.toLocaleLowerCase().includes(groupSearch.toLowerCase())).map((x)=>x.groupName);
    }, [vault.entryGroups, groupSearch])

    
    useEffect(()=>{
        if (submit){
            entry.decryptEntryPass(vault.kek).then((x)=>{
                setVEntPass(x.toString());
                setEntryPass(x.toString());
            }).catch((_)=>{
                // consume the error
                addBanner(bannerContext, "An Error occured when decrypting password", 'error')
            })
            
            setSubmit(false)
        }
    },[submit])

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'password'){
            setEntryPass(e.target.value);
            return;
        }
        setEntry(prev=>prev.cloneMutate(e.target.id, e.target.value));
        
    }

    const handleCopy = ()=>{
        if (entryPass === undefined){
            entry.decryptEntryPass(vault.kek).then((x)=>{
                navigator.clipboard.writeText(x.toString());
            }).catch(error => {
                addBanner(bannerContext, 'unable to copy password', 'error');
                console.error(error);
                return;
            })
        }else{
            navigator.clipboard.writeText(entryPass.toString());
        }
        addBanner(bannerContext, 'password copied successfully', 'success')
        setTimeout(() => {
            window.ipc.clearClipboard();
        }, 10000);
    }

    const handleConfirm = (e:FormEvent)=>{
        e.preventDefault();
        entry.updatePass(vault.kek, entryPass).then((newEntryState)=>{
            try {
                setEntry(newEntryState)
                const newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? newEntryState : x)
                setVault((prev)=>prev.mutate('entries', newEntries));
                vaultEntry.current = newEntryState;
                addBanner(bannerContext, 'entry updated successfully', 'success')
                setShowModal(false);    
            } catch (error) {
                addBanner(bannerContext, 'unable to update entry '+error, 'error');
            }
        })
    }

    const changeFavourite = ()=>{
        const newState = entry.update('isFavourite', !entry.isFavourite);
        setEntry(newState);
        const newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? newState : x)
        setVault((prev)=>prev.mutate('entries', newEntries));
        vaultEntry.current = newState;
        addBanner(bannerContext, 'entry updated successfully', 'success')
    }

    const handleAddExtraField = ()=>{
        if (extraFeild.name){
            entry.addExtraField(vault.kek,extraFeild).then((e:Entry)=>{
                if (!e){
                    addBanner(bannerContext, 'Could not add Extra field, another one with that name already exists', 'error')
                }else{
                    setEntry(e);
                    setExtraFeild({name:"", data:Buffer.from(''), isProtected:false})
                    setVault(prev=>{
                        let newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? e : x);
                        return prev.mutate('entries', newEntries);
                    })
                }
                
            })
        }else{
            addBanner(bannerContext, 'Banner not added, no name provided','info')
        }
        
    }

    const handleDeleteExtraField = (name:string)=>{
        setEntry(prev=>{
            const newState = prev.removeExtraField(name);
            setVault(prev=>prev.mutate('entries',prev.entries.map((x)=>x.metadata.uuid !== uuid? x : newState)))
            return newState;
        })
        
        
    }

    const handleClearFields = ()=>{
        setExtraFeild({name:"", data:Buffer.from(''), isProtected:false})
    }

    const handleChangeExtraField = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        e.target.id !== 'data'?
            setExtraFeild(prev=>({...prev, [e.target.id]:e.target.value}))
        :
            setExtraFeild(prev=>({...prev, [e.target.id]:Buffer.from(e.target.value)}))
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
    
    const handleGroupChange=(groupName: string)=>{
        const newVaultState = vault.addEntryToGroup(uuid, groupName);
        setVault(newVaultState);
    }   
    const handleRemoveFromGroup = ()=>{
        setVault(vault.removeEntryFromGroup(uuid));
    }

    useEffect(() => {
        console.log(vault.entryGroups, uuid)


        document.addEventListener("keydown", (escapeHandler), false);
        addEventListener("keydown", (copyHandler), false);
        return () => {
            document.removeEventListener("keydown", escapeHandler, false);
            removeEventListener("keydown", (copyHandler), false);
        };
        
    }, []);

    useEffect(()=>{
        const pscore = zxcvbn(entryPass);
        setpasswordScore({score:pscore.score, feedback:pscore.feedback.warning});
    },[entryPass]);

    useEffect(()=>{
        if (!Number.isNaN(randomSettings.length) && showRandomPassModal){
            setEntryPass(generateRandomPass(randomSettings))
        }
    },[randomSettings])

    return (
        <div className='flex flex-col w-screen gap-2 py-2 px-1 h-screen top-0 left-0 justify-center z-10 items-end backdrop-brightness-50 absolute' onClick={()=>{setShowModal(false)}}>
            <div className='flex flex-col text-base-content w-[40%] h-full bg-base-100 rounded-xl z-10 ' onClick={(e)=>{e.stopPropagation()}}>
                <div className='flex w-full h-10 justify-end shrink-0 px-2'>
                        <div className='flex w-full justify-center text-2xl  text-base-content font-bold'>
                            {entry.title}
                            {!areEqual && <span className='flex w-fit h-full items-center text-[0.75rem]'>[unsaved]</span>}
                        </div>
                        <Image onClick={()=>{setShowModal(false)}} src={'/images/close_black.svg'} alt='x' width={0} height={0} className='flex w-5 h-auto'/>
                    </div>
                <div className='flex flex-col w-full h-full text-base-content overflow-y-auto p-2'>
                    {/* header */}
                    <div className="flex flex-col w-full h-fit gap-3">
                        {/* title section */}
                        <div className={`flex group shrink-0 w-full h-8 items-center border-base-content gap-2 border-2 rounded-lg focus-within:border-primary duration-300 transition-all`}>
                            <label className='flex group w-fit text-lg border-r-2 px-2 h-full items-center group-focus-within:border-primary'>Title</label>
                            <input id='title' value={entry.title} onChange={handleChange}  className='flex w-full rounded-lg text-md h-full outline-none pr-1' />
                        </div>

                        {/* Group section */}
                        <div className='flex flex-col items-center text-md'>
                            <div className='flex w-full'>Group</div>
                            <div className='flex flex-col w-full h-fit group relative rounded-lg '>
                                <div className='flex w-full h-8 gap-2'>
                                    <input value={groupSearch} id='groupSearchInput' onBlur={()=>{setGroupSearch(existingGroupName??"")}} onChange={(e)=>{setGroupSearch(e.target.value)}} className='group border-2 outline-none rounded-lg w-full h-8 px-1 items-start flex appearance-none' />
                                    <div className='flex w-fit h-full relative'>
                                        <Image onClick={handleRemoveFromGroup} className='peer' src={"/images/close_black.svg"} alt='X' width={14} height={14}/>
                                        <span className='peer collapse border-base-300 rounded-md px-2 peer-hover:visible absolute top-10 z-10 w-50 border-2 right-2 text-nowrap bg-slate-200'>remove entry from group</span>
                                    </div>
                                </div>
                                <div className={`flex flex-col gap-2 w-full collapse h-0 overflow-hidden z-10 top-1 relative bg-base-100 group-focus-within:visible group-focus-within:h-fit group-focus-within:mb-1`}>
                                    {filteredGroups.map((group, i)=>
                                        <button onClick={()=>{console.log(group);handleGroupChange(group)}} className='flex w-full items-center justify-start px-5 h-6 bg-base-300' key={i} >{group}</button>
                                    )}
                                    {
                                        (filteredGroups.length === 0 && groupSearch.length> 0 ) && 
                                        <button onClick={()=>{handleGroupChange(groupSearch)}} className='flex group w-full items-center justify-start px-5 bg-base-300'>
                                            Create new Group '{groupSearch}'
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* main login details section */}
                        <div className={`flex shrink-0 flex-col bg-base-200 border-base-300 l w-full duration-100 transition-all  ${collapseLoginDetails?'h-12   delay-300 ': showRandomPassModal? "h-145 " : 'h-120'} gap-2 p-2 border-2 rounded-lg `}>
                            <div  onClick={()=>{setCollapseLoginDetails(prev=>!prev)}} className={`flex flex-row w-full h-fit justify-between items-center`}>
                                <h1 className='flex w-fit text-nowrap shrink text-lg font-[500]'>Login Details</h1>
                                <Image src={"/images/up_arrow.svg"} alt='^' width={0} height={0} className={`flex w-auto h-7 transition-all duration-300 ${collapseLoginDetails? "rotate-180" : "rotate-0"}`} />
                            </div>
                            <div className={`duration-300 transition-all ${collapseLoginDetails?"w-0 h-0 collapse opacity-0":"w-full h-full visible flex flex-col gap-2 delay-100"} `}>
                                {/* username input */}
                                <div className='flex flex-col text-md'>
                                    <label className='flex w-full'>Username</label>
                                    <input id='username' value={entry.username} onChange={handleChange} className='flex w-full border-2 rounded-lg px-1 h-9 border-base-300 bg-base-100 outline-none focus:border-primary duration-300 transition-all' />
                                </div>
                                {/* password input */}
                                <div className='flex flex-col text-md'>
                                    <label className='flex w-full'>Password</label>
                                    <div className='flex border-2 border-base-300  bg-base-100 rounded-lg items-center px-2 gap-1 focus-within:border-primary duration-300 transition-all'>
                                        <input id='password' value={entryPass} placeholder='No password set' type={showPass? "text": "password"} onChange={handleChange} className='flex w-full h-9 outline-none' />
                                        <Image onClick={handleCopy} src={"/images/copy.svg"} alt='copy' width={0} height={0} className='flex w-6 h-6 cursor-pointer' />
                                        <Image onClick={()=>{setShowPass(prev=>!prev)}} src={showPass?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={0} height={0} className='flex w-6 h-6 cursor-pointer'/>
                                        <div className={`h-6 w-6 shrink-0 flex transition-all duration-100  rounded-lg bg-base-100 ${showRandomPassModal && " invert"}`}>
                                            <Image onClick={()=>{setShowRandomPassModal(prev=>!prev); setEntry(vaultEntry.current); setSubmit(true)}} src={"/images/randomise.svg"} alt='copy' width={0} height={0} className={`flex w-full h-full cursor-pointer`}/>
                                        </div>
                                    </div>
                                    {/* password strength meter */}
                                    <div className='flex flex-col w-full h-fit shrink-0 px-1 mt-1'>
                                        <div className='gap-1 flex w-full h-1 bg-base-300  rounded-lg overflow-hidden'>
                                            <div className={`flex ${scoreWidth[passwordScore.score]} transition-all duration-300 h-full shrink-0 rounded-full ${scoreToColor[passwordScore.score]}`} />
                                        </div>
                                        <div className={`flex w-full h-full ${scoreToText[passwordScore.score]}`}>{handleGetFeedback(entryPass, passwordScore)}</div>
                                    </div>
                                    {showRandomPassModal && 
                                        <div className='flex flex-col w-full gap-2 h-fit border-2 border-base-darken rounded-lg p-2'>
                                            <div className='flex flex-row w-full gap-2 items-center '>
                                                <Slider bgStyle='bg-base-300 h-3.5 rounded-full ' selectedHeight='h-5' thumbDimensions='w-5 h-5 border-[3px]' minimum={8} maximum={50} value={randomSettings.length} setValue={(value)=>{handleRandomPassSettingChange('length', value.toString())}}  />
                                            </div>
                                            <div className='flex lg:flex-row flex-col w-full h-full lg:h-fit gap-2 lg:gap-5 items-center justify-center text-md'>
                                                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowCapitals')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap border-neutral  border-2 h-8 ${randomSettings.allowCapitals&& 'bg-neutral border-none text-neutral-content'}`}>
                                                    capital letters
                                                </button>
                                                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowNumbers')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap  border-neutral border-2 h-8 ${randomSettings.allowNumbers&& 'bg-neutral border-none text-neutral-content'}`}>
                                                    numbers
                                                </button>
                                                <button type='button' onClick={()=>{handleRandomPassSettingChange('allowSpecChars')}} className={`flex justify-center items-center cursor-pointer w-36 rounded-lg text-nowrap  border-neutral border-2 h-8 ${randomSettings.allowSpecChars&& 'bg-neutral border-none text-neutral-content'}`}>
                                                    special chars
                                                </button>
                                            </div>
                                        </div>
                                    }
                                </div>
                                {/* notes input */}
                                <div className='flex flex-col text-md'>
                                    <label className='flex w-full'>Notes</label>
                                    <textarea id='notes' value={entry.notes} onChange={handleChange} className='flex w-full  bg-base-100 border-2 rounded-lg px-1 h-40 resize-none outline-none border-base-300 focus:border-primary duration-300 transition-all' />
                                </div>
                                {/* URL input to come */}
                                <div className='flex flex-col text-md'>
                                    <label className='flex w-full'>Website</label>
                                    <input value={"This feature coming"} readOnly className='flex w-full border-2 rounded-lg px-1 h-9  bg-base-100 border-base-300 outline-none focus:border-primary duration-300 transition-all' />
                                </div>
                            </div>
                        </div>
                        {/* extra Fields section */}
                        <div className={`flex flex-col w-full duration-100 transition-height  ${collapseExtraFeilds?'h-12  delay-300 ':"h-160 "} border-base-300 bg-base-200 gap-2 p-2 border-2 rounded-lg `}>
                            <div onClick={()=>{setCollapseExtraFields(prev=>!prev)}} className={`flex flex-row w-full h-fit justify-between items-center`}>
                                <h1 className='flex w-fit text-nowrap shrink text-lg font-[500]'>Extra Fields</h1>
                                <Image src={"/images/up_arrow.svg"}  alt='^' width={0} height={0} className={`flex w-auto h-7 transition-all duration-300 ${collapseExtraFeilds? "rotate-180" : "rotate-0"}`} />
                            </div>
                            <div className={`duration-300 transition-all ${collapseExtraFeilds?"w-0 h-0 collapse opacity-0":"w-full h-full visible flex flex-col gap-2 delay-100"} `}>
                                <div className='flex flex-col w-full h-full border-2 border-base-300 overflow-y-auto'>
                                    <div className='flex flex-col w-full h-fit p-1'>
                                        {entry.extraFields.map((x,i)=>
                                            <ExtraFieldComponent key={i} extraField={x} entry={entry} onDelete={handleDeleteExtraField}/>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* New extra Field section */}
                        <div className={`flex flex-col text-base-content  w-full duration-100 transition-all bg-base-200  ${collapseNewEf?'h-12 delay-300 ':"h-100 "} border-base-300 gap-2 p-2 border-2 rounded-lg `}>
                            <div onClick={()=>{setCollapseNewEf(prev=>!prev)}} className={`flex flex-row w-full h-fit justify-between items-center`}>
                                <h1 className='flex w-fit text-nowrap shrink text-lg font-[500]'>Create Extra Field</h1>
                                <Image src={"/images/up_arrow.svg"}  alt='^' width={0} height={0} className={`flex w-auto h-7 transition-all duration-300 ${collapseNewEf? "rotate-180" : "rotate-0"}`} />
                            </div>
                            <div className={`duration-300 transition-all ${collapseNewEf?"w-0 h-0 collapse opacity-0":"w-full h-full visible flex flex-col gap-4 delay-100"} `}>
                                <div className="flex flex-row w-full items-center h-fit gap-2">
                                    <div className='flex w-fit text-nowrap'>Name of field</div>
                                    <input id='name' value={extraFeild.name} onChange={handleChangeExtraField} className='flex border-2 w-full outline-none bg-base-100 border-base-300 rounded-lg h-8 focus:border-primary px-1' />
                                </div>
                                <div>
                                    <div>Data</div>
                                    <textarea id='data' value={extraFeild.data.toString()} onChange={handleChangeExtraField}  className='flex border-2 bg-base-100 outline-none border-base-300 rounded-lg  w-full h-40 resize-none focus:border-primary p-1' />
                                </div>
                                <div className='flex w-full gap-2 items-center'>
                                    <div>Protect field</div>
                                    <button className={`flex border-neutral border-2 w-1/2 justify-center items-center rounded-lg h-8 ${extraFeild.isProtected && "bg-neutral text-neutral-content"}`} onClick={()=>{setExtraFeild(prev=>({...prev, isProtected:!prev.isProtected}))}}>Protect</button>
                                </div>
                                <div className='flex flex-row w-full h-10 gap-2'>
                                    <button onClick={handleClearFields} className='flex w-full h-full items-center justify-center bg-base-100 border-info border-2 rounded-lg hover:bg-info hover:text-info-content'>Reset Fields</button>
                                    <button onClick={handleAddExtraField} className='flex w-full h-full items-center justify-center bg-base-100 border-primary  border-2 rounded-lg hover:bg-primary hover:text-primary-content'>Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* bottom bar with delete, cancel and save buttons */}
                <div className='flex flex-row w-full  h-14 border-t-2 border-base-300 p-2'>
                    <div className='flex w-full h-full gap-2'>
                        <div className='flex w-fit h-fit border-2 border-error rounded-lg hover:bg-error hover:[&_*]:brightness-[25%]'>
                            <Image src={"/images/delete_red.svg"} alt='del' width={0} height={0} className='flex w-8 h-8' />
                        </div>
                        <div className='flex items-center w-12 h-10 justify-center'>
                            <Image onClick={changeFavourite} title='favourite this entry to have it shown at the top of the list everytime' src={entry.isFavourite?"/images/starFill.svg": "/images/starNoFill.svg"} alt='nofav' width={50} height={50} className={`flex ${entry.isFavourite && "w-10 h-10"}`}/>
                        </div>
                    </div>
                    {!areEqual && <div className='flex w-full justify-end h-full gap-2'>
                        <button onClick={()=>{setEntry(vaultEntry.current); setSubmit(true)}} className='flex bg-base-300 items-center justify-center w-24 rounded-lg hover:bg-base-darken'>Discard</button>
                        <button onClick={handleConfirm} className='flex bg-primary hover:bg-primary-darken text-primary-content w-24 rounded-lg items-center justify-center'>Save</button>
                    </div>}
                </div>
            </div>
            
        </div>
    )
}
