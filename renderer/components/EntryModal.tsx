import React, { FormEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { Entry, ExtraField } from '../interfaces/Entry';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import { asciiSafeSpecialChars, cmpEntry, digits, lowerCaseLetters, upperCaseLetters } from '../utils/commons';
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

// const scoreToColor = {0:'bg-error',1:'bg-error', 2:'bg-warning', 4:'bg-success', 3:'bg-info'}
// const scoreToText = {0:'text-error',1:'text-error', 2:'text-warning', 4:'text-success', 3:'text-info'}
// const scoreWidth = ['w-2','w-1/4', 'w-1/2', 'w-3/4', 'w-full'];
const scoreStyling = {
    0: 'bg-error text-error w-2',
    1: 'bg-error text-error w-1/4',
    2: 'bg-warning text-warning w-1/2',
    3: 'bg-info text-info w-3/4',
    4: 'bg-success text-success w-full',
}
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
    
    const vaultEntry = useMemo(()=>vault.entries.find(x=>x.metadata.uuid === uuid), [uuid]);
    const [groups, setGroups] = useState([]);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    
    const isEqual = cmpEntry(vaultEntry, entry);

    // entryPass will be used when changing the password to update it
    const [entryPass, setEntryPass] = useState("");
    const [passwordScore, setpasswordScore] = useState({score:0, feedback:""});    
    // for random password
    const [randomSettings, setRandomSettings] = useState<RandomPassGeneratorSettings>({length:8,allowCapitals:false, allowNumbers:false, allowSpecChars:false, excludedChars:""});
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [showRandomPass, setShowRandomPass] = useState(false);
    const [randomPass, setRandomPass] = useState("");

    const [extraFeild, setExtraFeild] = useState<ExtraField>({name:"", data:Buffer.from(''), isProtected:false});
    
    
    
    const [collapseNewEf, setCollapseNewEf] = useState(true);

    const [groupSearch, setGroupSearch] = useState(() => {return vault.entryGroups.find(g => g.entries.includes(uuid))?.groupName ?? "";});
    const [extraFieldSearch, setEFSearch] = useState("");
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

    const [tab, setTab] = useState(0);
    
    

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === 'password'){
            if (showPass){
                setEntryPass(e.target.value);
            }else{
                if (e.target.value.length > 8){
                    // if the user typed something in after the asterisks
                    setEntryPass(prev => prev + e.target.value.substring(8))
                }else{
                    // if the user pressed backspace
                    setEntryPass(prev => prev.substring(0, prev.length-1))
                }
            }
            
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
        // easy way to check whether the password has changed
        window.crypto.subtle.digest('SHA-256', Buffer.from(entryPass)).then((digest)=>{
            if (!Buffer.from(vaultEntry.passHash).equals(Buffer.from(digest))){
                window.vaultIPC.updateEntryField(uuid, 'password', entryPass).then((response)=>{
                    console.log(response)
                    if (response.status === "OK"){
                        setEntry(response.response)
                        setVault(prev=>({...prev, entries: prev.entries.map(x=>x.metadata.uuid === uuid ? response.response : x)}))
                        addBanner(setBanners, "Updated entry successfully", 'error');
                    }else if (response.status = "CLIENT_ERROR"){
                        addBanner(setBanners, 'Unable to update entry: '+response.message, 'error')
                    }else{
                        addBanner(setBanners, "Unable to update entry INTERNAL_ERROR, check logs if you're a dev", 'error');
                        console.error(response.message)
                    }
                }).catch((error)=>{
                    console.error(error)
                    addBanner(setBanners, 'unable to update password', 'success')
                })
            }else if (!isEqual){
                
                window.vaultIPC.mutateEntry(uuid, entry).then((response)=>{
                    console.log(response)
                    if (response.status === "OK"){
                        setEntry(response.response)
                        setVault(prev=>({...prev, entries: prev.entries.map(x=>x.metadata.uuid === uuid ? response.response : x)}))
                        addBanner(setBanners, "Updated entry successfully", 'success');
                    }else if (response.status = "CLIENT_ERROR"){
                        addBanner(setBanners, 'Unable to update entry: '+response.message, 'error')
                    }else{
                        addBanner(setBanners, "Unable to update entry INTERNAL_ERROR, check logs if you're a dev", 'error');
                        console.error(response.message)
                    }
                }).catch((error)=>{
                    addBanner(setBanners, 'unable to update password', 'error')
                    console.error(error)
                })
                return;
            }
        })
        
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
    
    const handleMakeFavourite = ()=>{
        window.vaultIPC.updateEntryField(uuid, 'isFavourite', !entry.isFavourite).then((response)=>{
            if (response.status === "OK"){
                addBanner(setBanners, entry.isFavourite ? "Entry removed from favourites": 'Entry added to favourites', 'success');
                setEntry(response.response);
                setVault(prev=>({...prev, entries: prev.entries.map(x=>x.metadata.uuid !== uuid ? x : response.response)}));
                
            }else if(response.status === "CLIENT_ERROR"){
                addBanner(setBanners, 'Unable to favourite entry: '+response.message, 'error');
            }else{
                addBanner(setBanners, "internal error, check logs if you're a dev", 'error');
                console.error(response)
            }
        }).catch((error)=>{
            addBanner(setBanners, "unable to favourite entry, check logs if you're a dev", 'error');
            console.error(error)
        })
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
        
        window.vaultIPC.addEntryToGroup(uuid, groupName).then((x)=>{
            if(x === "OK"){
                addBanner(setBanners, "Entry added to group", 'success');
            }else{
                addBanner(setBanners, x.toLowerCase(), 'info');
            }
            window.vaultIPC.getEntry(entry.metadata.uuid).then((response)=>{
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

    useEffect(()=>{
        if (groupSearch.length === 0 ){
            window.vaultIPC.getGroups().then((response)=>{
                setGroups(response.response);
            }).catch((error)=>{
                addBanner(setBanners, 'Unable to get groups', 'error')
                console.error(error);
            })
        }else{
            // searchGroups does not have any values from which anything can go wrong
            window.vaultIPC.searchGroups(groupSearch).then((ipcResponse)=>{
                setGroups(ipcResponse.response);
            })
        }
        
    }, [groupSearch])

    useEffect(() => {
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
            <div className='flex flex-col text-base-content w-[40%] h-full bg-base-100 rounded-xl z-10 overflow-hidden ' onClick={(e)=>{e.stopPropagation()}}>
                <div className='flex w-full h-10 justify-end shrink-0 px-2'>
                    <div className='flex w-full justify-center text-2xl  text-base-content font-bold'>
                        {entry.title}
                        {/* {!areEqual && <span className='flex w-fit h-full items-center text-[0.75rem]'>[unsaved]</span>} */}
                    </div>
                    <Image onClick={closeModal} src={'/images/close_black.svg'} alt='x' width={0} height={0} className='flex w-5 h-auto'/>
                </div>
                {/* main section */}
                <div className='flex flex-col w-full h-full items-center justify-between overflow-hidden'>
                    {/* NavBar */}
                    <div className='flex flex-row w-9/10 h-1/20 rounded-full bg-base-300 overflow-hidden p-0.75 gap-2 justify-between'>
                        <div onClick={()=>{setTab(0)}} className={`flex w-full justify-center items-center rounded-full cursor-pointer   ${tab ===0? 'bg-base-100 shadow-md shadow-base-300 border-base-darken border-2': "hover:bg-base-200"}`}>
                            General Details
                        </div>

                        <div onClick={()=>{setTab(1)}} className={`flex  w-full justify-center items-center cursor-pointer  rounded-full ${tab === 1 ? 'bg-base-100 shadow-md shadow-base-300 border-base-darken border-2': "hover:bg-base-200"}`}>
                            Extra Fields
                        </div>
                        <div onClick={()=>{setTab(2)}} className={`flex  w-full justify-center items-center cursor-pointer  rounded-full ${tab === 2 ? 'bg-base-100 shadow-md shadow-base-300 border-base-darken border-2': "hover:bg-base-200"}`}>
                            Group Details                        
                        </div>
                    </div>
                    <div className='flex flex-col w-full h-17/20  overflow-y-hidden grow-0'>
                        {
                            // general details
                            (tab ===0) ? 
                            <div className='flex flex-col w-full h-full rounded-lg px-4 gap-2'>
                                <div className='flex w-full text-sm items-center gap-1'>
                                    <Image  src={"/images/info.svg"} alt='show' width={20} height={20} className='flex w-4 h-4 cursor-pointer rotate-180'/>
                                    This entry has the same password as another entry. Change it now to increase security</div>
                                <div className='flex flex-col gap-2 relative items-center justify-center text-sm w-full h-full border-base-300 bg-base-200 border-2 rounded-lg p-2 '>
                                    <div className='flex flex-row w-full h-fit gap-2'>
                                        <p className='flex text-md font-semibold mb-1 w-full'> Entry Details </p>
                                        <div className='flex w-10 h-10 items-center justify-center'>
                                            <Image onClick={handleMakeFavourite} src={entry.isFavourite? "/images/starFill.svg":"/images/starNoFill.svg"} alt='fav' width={0} height={0} className={`flex ${entry.isFavourite ? "w-7 h-7": "w-10 h-10"} cursor-pointer `} title='add to favourites' />
                                        </div>
                                    </div>
                                    {/* Title */}
                                    <div className='flex flex-col w-full '>
                                        <label>Title</label>
                                        <input title='change title' type="text" id='title' value={entry.title} onChange={handleChange} className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                    </div>
                                    {/* Username */}
                                    <div className='flex flex-col w-full'>
                                        <label>Username</label>
                                        <input title='change username' type="text" id='username' value={entry.username} onChange={handleChange} className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                    </div>
                                    {/* Password */}
                                    <div className='flex flex-col gap-1 w-full'>
                                        <div className='flex flex-col'>
                                            <label>Password</label>
                                            <div title='change password' className='flex gap-1 w-full h-7 px-1 bg-white border-2 border-base-300 focus-within:border-primary rounded-lg items-center'>
                                                <input type={showPass ? "text": "password"} id='password' value={showPass ? entryPass.toString() : "*".repeat(8)} onChange={handleChange} className='flex w-full outline-none items-center rounded-lg h-full bg-white '/>
                                                <Image onClick={()=>{setShowPass(prev=>!prev)}} title={showPass? "hide password": 'show password'} src={showPass ?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                                <Image onClick={handleCopy} title='copy to clipboard' src={"/images/copy.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                                <Image onClick={()=>{setShowRandomPassModal (prev=>!prev)}} title='randomise password' src={"/images/randomise.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                            </div>
                                        </div>
                                        <div className='flex flex-col p-1 w-full'>
                                            <div className='flex w-full bg-base-300 rounded-full overflow-hidden h-2'>
                                                <div className={`flex ${scoreStyling[passwordScore.score]} h-full rounded-full transition-all duration-300`} />
                                            </div>
                                            <div>{handleGetFeedback(entryPass, passwordScore)}</div>
                                        </div>
                                    </div>
                                    {/* Random password modal */}
                                    {showRandomPassModal && 
                                        <div className='flex flex-col w-9/10 p-2 bg-base-300 border-base-darken rounded-lg absolute border-2 h-1/4'>
                                            <p>New password</p>
                                            <div title='change password' className='flex gap-1 w-full h-7 px-1 bg-white border-2 border-base-300 focus-within:border-primary rounded-lg items-center'>
                                                <input type={showRandomPass ? "text": "password"} id='password' value={showRandomPass ? entryPass.toString() : "*".repeat(8)} onChange={handleChange} className='flex w-full outline-none items-center rounded-lg h-full bg-white '/>
                                                <Image onClick={()=>{setShowRandomPass(prev=>!prev)}} title={showRandomPass? "hide password": 'show password'} src={showRandomPass ?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={20} height={20} className='flex w-6 h-6 cursor-pointer'/>
                                            </div>
                                            {/*random settings */}
                                            <div className='flex flex-col w-full h-fit'>
                                                <p>Length</p>
                                                <Slider value={randomSettings.length} minimum={8} maximum={50} selectedHeight='h-2' thumbDimensions='h-4 w-4 border-2' className='h-1' bgStyle='h-2 rounded-lg' setValue={(newVal:number)=>{setRandomSettings(prev=>({...prev, length:newVal}))}} />
                                            </div>
                                        </div>
                                    }

                                    {/* Website */}
                                    <div className='flex flex-col w-full'>
                                        <label>Website</label>
                                        <input title='change website url' type="text" id='website' value={"This feature coming soon"} readOnly className='flex w-full border-2 border-base-300 outline-none focus:border-primary rounded-lg h-7 px-1 bg-white '/>
                                    </div>
                                    {/* Notes */}
                                    <div className='flex flex-col w-full h-full'>
                                        <label>Notes</label>
                                        <textarea title='change username' id='notes' value={entry.notes} onChange={handleChange} className='flex w-full h-full border-2 border-base-300 outline-none focus:border-primary rounded-lg resize-none px-1 bg-white '/>
                                    </div>
                                </div>
                                
                            </div>
                            :
                            // extra fields
                            (tab === 1)?
                                <div className='flex flex-col w-full h-full shrink-0 overflow-y-hidden gap-5 p-2'>
                                    {/* search through extra fields */}
                                    <div className='flex flex-col h-8 '>
                                        <input type="text" placeholder='search for an extra field' className='flex w-full h-8 px-1 rounded-lg border-2 border-base-300 focus:border-primary outline-none' />
                                    </div>
                                    <div className='flex flex-col w-full h-full overflow-y-auto gap-2'>
                                        
                                        <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                                        <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                                        <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                                        <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                                        {entry.extraFields.map(ef=><ExtraFieldComponent extraField={ef} entry={entry} onDelete={handleDeleteExtraField} />)}
                                    </div>
                                    {/* add extrafield form */}
                                    <div className='flex flex-col w-full h-1/3 grow-0  shrink-0 border-2 rounded-lg'>
                                        <div className='flex w-full items-center justify-end relative border-2 h-10'>
                                        <div className='flex items-center w-full justify-center absolute'>New Extra Field form</div>
                                        </div>

                                    </div>
                                </div>
                                :
                                // group details
                                <div className='flex flex-col w-full h-full shrink-0 gap-5 p-2'>
                                    <div className='flex flex-col w-full h-1/4 rounded-lg shrink-0 bg-base-200 border-2 p-2 border-base-300'>
                                        <p className='flex text-md font-semibold justify-center items-center'> Group Details </p>
                                        
                                    </div>
                                    <div className='flex flex-col w-full h-3/4 grow-0 overflow-y-hidden bg-base-200 border-base-300 border-2 rounded-lg p-2'>
                                        <p className='flex w-full items-center justify-center h-fit'>All Groups</p>
                                        <input type="text" placeholder='Search for a group' value={groupSearch} onChange={(e)=>{setGroupSearch(e.target.value)}} className='flex border-2 rounded-lg border-base-300 bg-base-100 px-1' />
                                        <div className='flex w-full h-full grow-0 gap-2 flex-col overflow-y-auto'>
                                            <div className='flex flex-col  w-full h-fit gap-2 p-2'>
                                                {groups.map((group,i)=>
                                                    <div onClick={()=>{handleGroupChange(group)}} key={i.toString()} className='flex w-full min-w-10 px-2 items-center truncate text-ellipsis text-nowrap bg-base-100 rounded-lg h-10 shrink-0 border-2 border-base-300' >
                                                        {group}
                                                    </div>
                                                )}
                                                {
                                                    (groups.length === 0 && groupSearch.length > 0) &&
                                                    <div className='flex w-full min-w-10 px-2 items-center truncate text-ellipsis text-nowrap bg-base-100 rounded-lg h-10 shrink-0 border-2 border-base-300'> 
                                                        Create new group with name '{groupSearch}'
                                                    </div>
                                                }
                                            </div>
                                        </div>


                                    </div>
                                </div>
                        }
                    </div>
                    {/* Bottom bar */}
                    <div className='flex flex-row w-full h-12 shrink-0 items-center border-2 p-1 px-4 border-base-300'>
                        <div className='flex w-1/2 h-full items-center p-2'>
                            <Image onClick={handleDeleteEntry} title='Delete Entry' src={"/images/delete_red.svg"} alt='show' width={20} height={20} className='flex w-8 h-8 shrink-0 border-2 border-error rounded-sm cursor-pointer'/>
                        </div>
                        
                        <div className='flex w-full h-full justify-end'>
                            <button className='flex w-fit px-2 border-2  text-primary-content rounded-lg h-full items-center bg-primary hover:bg-primary-darken' onClick={handleConfirm}>Save Changes</button>
                        </div>
                    </div>
                </div>
                
            </div>
            
        </div>
    )
}
