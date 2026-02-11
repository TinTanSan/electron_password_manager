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
    const {banners, setBanners} = useContext(BannerContext);
    const [showPass, setShowPass] = useState(false);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const vaultEntry = useRef(vault.entries.find(x=>x.metadata.uuid === uuid));
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    // entryPass will be used when changing the password to update it
    const [entryPass, setEntryPass] = useState("");
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:8,allowCapitals:false, allowNumbers:false, allowSpecChars:false, excludedChars:""});
    const [extraFeild, setExtraFeild] = useState<ExtraField>({name:"", data:Buffer.from(''), isProtected:false});
    const [collapseLoginDetails, setCollapseLoginDetails] = useState(false);
    const [collapseExtraFeilds, setCollapseExtraFields] = useState(true);
    const [passwordScore, setpasswordScore] = useState({score:0, feedback:""});    
    const [collapseNewEf, setCollapseNewEf] = useState(true);
    const [groupSearch, setGroupSearch] = useState(() => {return vault.entryGroups.find(g => g.entries.includes(uuid))?.groupName ?? "";});

    useEffect(()=>{
        window.vaultIPC.decryptPass(entry.metadata.uuid).then((response)=>{
            setEntryPass(response);
        }).catch((error)=>{
            console.error(error);
            addBanner(setBanners, 'unable to decrypt password to set up the entry', 'error');
        });
        return ()=>{
            setEntryPass("");
        }
    },[])

    const [tab, setTab] = useState(false);
    

    const filteredGroups = useMemo(()=>{
        return vault.entryGroups.filter((group)=>group.groupName.toLocaleLowerCase().includes(groupSearch.toLowerCase())).map((x)=>x.groupName);
    }, [vault.entryGroups, groupSearch])

    

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'password'){
            setEntryPass(e.target.value);
            return;
        }
        setEntry(prev=>({...prev, [e.target.id]: e.target.value}));
    }

    const handleDecryptPass = ()=>{
        if (!showPass){
            window.vaultIPC.decryptPass(entry.metadata.uuid).then((response)=>{
                setEntryPass(response);
                console.log(response);
                setShowPass(true);
            }).catch((error)=>{
                addBanner(setBanners, "Something went wrong when decrypting password for display", 'error');
            })
        }else{
            setShowPass(false);
        }
        
    }

    const handleCopy = ()=>{
        navigator.clipboard.writeText(entryPass.toString());
        addBanner(setBanners, 'password copied successfully', 'success')
        setTimeout(() => {
            window.clipBoardIPC.clearClipboard();
        }, 10000);
    }

    const handleConfirm = (e:FormEvent)=>{
        e.preventDefault();
        throw new Error("Implement via IPC calls")
        // window.vaultIPC.updateEntryField()
        // entry.updatePass(vault.kek, decryptedPass).then((newEntryState)=>{
        //     try {
        //         setEntry(newEntryState)
        //         const newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? newEntryState : x)
        //         setVault((prev)=>prev.mutate('entries', newEntries));
        //         vaultEntry.current = newEntryState;
        //         addBanner(bannerContext, 'entry updated successfully', 'success')
        //         setShowModal(false);    
        //     } catch (error) {
        //         addBanner(bannerContext, 'unable to update entry '+error, 'error');
        //     }
        // })
    }

    const changeFavourite = ()=>{
        throw new Error("Implement via IPC calls");
    }

    const handleAddExtraField = ()=>{
        if (extraFeild.name){



            throw new Error("Implement via IPC calls");
            // entry.addExtraField(vault.kek,extraFeild).then((e:Entry)=>{
            //     if (!e){
            //         addBanner(bannerContext, 'Could not add Extra field, another one with that name already exists', 'error')
            //     }else{
            //         setEntry(e);
            //         setExtraFeild({name:"", data:Buffer.from(''), isProtected:false})
            //         setVault(prev=>{
            //             let newEntries = vault.entries.map(x => x.metadata.uuid === uuid ? e : x);
            //             return prev.mutate('entries', newEntries);
            //         })
            //     }
                
            // })
        }else{
            addBanner(setBanners, 'Banner not added, no name provided','info')
        }
        
    }

    const handleDeleteExtraField = (name:string)=>{
        throw new Error("Implement via IPC calls")
        // setEntry(prev=>{
            
        //     // const newState = prev.removeExtraField(name);
        //     // setVault(prev=>prev.mutate('entries',prev.entries.map((x)=>x.metadata.uuid !== uuid? x : newState)))
        //     // return newState;
        // })
        
        
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

    const handleDeleteEntry = ()=>{
        window.vaultIPC.deleteEntry(uuid).then((response)=>{
            console.log(response)
            if (response){
                addBanner(setBanners, 'Successfully deleted the entry', 'success');
                setShowModal(false);
                window.vaultIPC.getPaginatedEntries(0).then((response)=>{
                    setVault(prev=>({...prev, entries: response}))
                }).catch((error)=>{
                    addBanner(setBanners, 'unable to get paginated entries', 'error');
                })
                
            }else{
                addBanner(setBanners, 'The entry does not exist', 'error')
            }
        }).catch((error)=>{
            addBanner(setBanners, 'Unable to delete the entry, '+error, 'error')
        })
    }

    const closeModal = ()=>{
        setEntryPass("");
        setShowModal(false);
    }
    const escapeHandler = (e:KeyboardEvent) => {
        if (e.key === "Escape") closeModal()
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
        console.log(groupName)
        window.vaultIPC.addEntryToGroup(uuid, groupName).then((x)=>{
            if(x === "OK"){
                addBanner(setBanners, "Entry added to group", 'success');
            }else{
                addBanner(setBanners, x.toLowerCase(), 'info');
            }
            window.vaultIPC.getEntry(entry.metadata.uuid).then((response)=>{
                console.log(response)
                setEntry(response)
            }).catch((error)=>{
                addBanner(setBanners, 'something went wrong when tryihng to set Entry after groupChange: '+error, 'error');
            })
            
        })
    }   
    const handleRemoveFromGroup = ()=>{
        window.vaultIPC.removeEntryFromGroup(uuid).then((response)=>{
            console.log(response);
            if(response === "OK"){
                addBanner(setBanners, 'entry removed from group', 'success');
            }else{
                addBanner(setBanners, 'Unable to remove entry from group: '+response.toLowerCase(), 'error');
            }
        })
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
        <div className='flex flex-col w-screen gap-2 py-2 px-1 h-screen top-0 left-0 justify-center z-10 items-end backdrop-brightness-50 absolute' onClick={closeModal}>
            <div className='flex flex-col text-base-content w-[40%] h-full bg-base-100 rounded-xl z-10 ' onClick={(e)=>{e.stopPropagation()}}>
                <div className='flex w-full h-10 justify-end shrink-0 px-2'>
                    <div className='flex w-full justify-center text-2xl  text-base-content font-bold'>
                        {entry.title}
                        {/* {!areEqual && <span className='flex w-fit h-full items-center text-[0.75rem]'>[unsaved]</span>} */}
                    </div>
                    <Image onClick={closeModal} src={'/images/close_black.svg'} alt='x' width={0} height={0} className='flex w-5 h-auto'/>
                </div>
                {/* main section */}
                <div className='flex flex-col w-full h-full items-center pt-2 gap-2'>
                    {/* NavBar */}
                    <div className='flex flex-row w-9/10 h-10 rounded-full bg-base-300 overflow-hidden p-0.75 gap-2 justify-between'>
                        <div onClick={()=>{setTab(false)}} className={`flex w-full justify-center items-center rounded-full cursor-pointer   ${!tab? 'bg-base-100 shadow-md shadow-base-300 border-base-darken border-2': "hover:bg-base-200"}`}>
                            General Details
                        </div>

                        <div onClick={()=>{setTab(true)}} className={`flex  w-full justify-center items-center cursor-pointer  rounded-full ${tab ? 'bg-base-100 shadow-md shadow-base-300 border-base-darken border-2': "hover:bg-base-200"}`}>
                            Extra Fields
                        </div>
                    </div>
                    {
                        !tab ? 
                        <div className='flex flex-col w-full h-full rounded-lg px-4 gap-2'>
                            <div className='flex w-full text-sm items-center gap-1'>
                                <Image  src={"/images/info.svg"} alt='show' width={20} height={20} className='flex w-4 h-4 cursor-pointer rotate-180'/>
                                This entry has the same password as another entry. Change it now to increase security</div>
                            <div className='flex flex-col gap-2 text-md w-full h-full border-base-300 bg-base-200 border-2 rounded-lg p-2 '>
                                <p className='flex text-lg font-semibold mb-1'> Entry Details </p>
                                {/* Title */}
                                <div className='flex flex-col '>
                                    <label>Title</label>
                                    <input title='change title' type="text" id='title' value={entry.title} onChange={handleChange} className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                </div>
                                {/* Username */}
                                <div className='flex flex-col'>
                                    <label>Username</label>
                                    <input title='change username' type="text" id='username' value={entry.username} onChange={handleChange} className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                </div>
                                {/* Password */}
                                <div className='flex flex-col'>
                                    <label>Password</label>
                                    <div title='change password' className='flex gap-1 w-full h-7 px-1 bg-white border-2 border-base-300 focus-within:border-primary rounded-lg items-center'>
                                        <input type={showPass ? "text": "password"} id='username' value={showPass ? entryPass.toString() : "*".repeat(8)} onChange={handleChange} className='flex w-full outline-none items-center rounded-lg h-full bg-white '/>
                                        <Image onClick={()=>{setShowPass(prev=>!prev)}} title={showPass? "hide password": 'show password'} src={showPass ?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                        <Image onClick={()=>{setShowPass(prev=>!prev)}} title='copy to clipboard' src={"/images/copy.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                        <Image onClick={()=>{setShowPass(prev=>!prev)}} title='randomise password' src={"/images/randomise.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                    </div>
                                </div>
                                {/* Website */}
                                <div className='flex flex-col'>
                                    <label>Website</label>
                                    <input title='change website url' type="text" id='website' value={"This feature coming soon"} readOnly className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                </div>
                                {/* Notes */}
                                <div className='flex flex-col w-full h-full'>
                                    <label>Notes</label>
                                    <textarea title='change username' id='notes' value={entry.notes} onChange={handleChange} className='flex w-full h-full border-2 border-base-300 outline-none focus:border-primary rounded-lg resize-none px-1 bg-white '/>
                                </div>
                            </div>
                            <div className='flex flex-col w-full h-1/4 rounded-lg bg-base-200 border-2 p-2 border-base-300'>
                                <p className='flex text-md font-semibold mb-2'> Group Details </p>

                            </div>
                            
                        </div>
                        :
                        <div className='flex w-full h-full p-2'>
                            <div className='flex flex-col w-full h-full bg-base-200 p-1 rounded-lg'>
                                <div className='flex w-full h-fit'>

                                </div>
                            </div>
                            
                        </div>
                    }
                    {/* Bottom bar */}
                    <div className='flex w-full h-12 items-center border-t-2 px-4 py-1 border-base-300'>
                        <div className='flex w-1/2 h-full'>
                            <Image onClick={handleDeleteEntry} title='Delete Entry' src={"/images/delete_red.svg"} alt='show' width={20} height={20} className='flex w-8 h-7 border-2 border-error rounded-sm cursor-pointer'/>
                        </div>
                        <div className='flex w-full h-full'>


                        </div>
                    </div>

                </div>
                
            </div>
            
        </div>
    )
}
