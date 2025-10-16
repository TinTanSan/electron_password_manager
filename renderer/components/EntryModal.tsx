import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { Entry, ExtraField } from '../interfaces/Entry';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import Image from 'next/image';
import zxcvbn from 'zxcvbn';
import RandomPassModal from './RandomPassModal';
import ExtraFieldComponent from './ExtraField';

type props ={
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    uuid:string
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

export default function EntryModal({setShowModal, uuid}:props) {
    const {vault, setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [submit, setSubmit] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [tab, setTab] = useState(0);
    const [showRandomPassModal, setShowRandomPassModal] = useState(false);
    const [entry, setEntry] = useState<Entry | undefined>(vault.entries.find(x=>x.metadata.uuid === uuid));
    const [entryPass, setEntryPass]= useState<string>("");
    const [extraFeild, setExtraFeild] = useState<ExtraField>({name:"", data:Buffer.from(''), isProtected:false});
    const [collapseLoginDetails, setCollapseLoginDetails] = useState(false);
    const [passwordScore, setpasswordScore] = useState({score:0, feedback:""});
    
    useEffect(()=>{
        if (submit){
            entry.decryptEntryPass(vault.kek).then((x)=>{
                
                setEntryPass(x.toString());
            }).catch((error)=>{
                console.error(error)
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
                addBanner(bannerContext, 'entry updated successfully', 'success')
                setShowModal(false);    
            } catch (error) {
                addBanner(bannerContext, 'unable to update entry '+error, 'error');
            }
        })
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


    return (
        <div className='flex flex-col w-screen py-2 px-1 h-screen top-0 left-0 justify-center items-end backdrop-brightness-50 absolute' onClick={()=>{setShowModal(false)}}>
            <div className='flex flex-col text-base-content overflow-y-auto p-2 w-[40%] h-full bg-base-100 rounded-xl z-10' onClick={(e)=>{e.stopPropagation()}}>
                <div className='flex w-full h-10 justify-end'>
                    <Image src={'/images/close_black.svg'} alt='x' width={0} height={0} className='flex w-5 h-auto'/>
                </div>
                <div className={`flex flex-col w-full duration-100 transition-all  ${collapseLoginDetails?'h-13 border-neutral-content  delay-300 ':"h-130 border-base-content "} gap-2 p-2 border-2 rounded-lg `}>
                    <div className={`flex flex-row w-full h-fit justify-between items-center border-2`}>
                        <h1 className='flex w-fit text-nowrap shrink text-xl font-semibold'>Login Details</h1>
                        <Image src={"/images/up_arrow.svg"} onClick={()=>{setCollapseLoginDetails(prev=>!prev)}} alt='^' width={0} height={0} className={`flex w-5 h-5 transition-all duration-300 ${collapseLoginDetails? "rotate-180" : "rotate-0"}`} />
                    </div>
                    <div className={`duration-300 transition-all ${collapseLoginDetails?"w-0 h-0 collapse opacity-0":"w-full h-full visible flex flex-col gap-2 delay-100"} `}>
                        {/* username input */}
                        <div className='flex flex-col gap-1'>
                            <label className='flex w-full text-lg'>Username</label>
                            <input id='username' value={entry.username} onChange={handleChange} className='flex w-full border-2 rounded-lg px-1 h-9 border-base-300 outline-none focus:border-primary duration-300 transition-all' />
                        </div>
                        {/* password input */}
                        <div className='flex flex-col gap-1'>
                            <label className='flex w-full text-lg'>Password</label>
                            
                            <div className='flex border-2 border-base-300 rounded-lg items-center px-2 gap-1 focus-within:border-primary duration-300 transition-all'>
                                <input id='password' value={entryPass} type={showPass? "text": "password"} onChange={handleChange} className='flex w-full h-9 outline-none' />
                                <Image onClick={handleCopy} src={"/images/copy.svg"} alt='copy' width={0} height={0} className='flex w-6 h-6 ' />
                                <Image onClick={()=>{setShowPass(prev=>!prev)}} src={showPass?"/images/hidePass.svg" : "/images/showPass.svg"} alt='show' width={0} height={0} className='flex w-6 h-6'/>
                                <Image src={"/images/randomise.svg"} alt='copy' width={0} height={0} className='flex w-6 h-6 ' />
                            </div>
                            {/* password strength meter */}
                            <div className='flex flex-col w-full h-fit shrink-0 px-2'>
                                <div className='gap-1 flex w-full h-1 bg-base-200  rounded-lg overflow-hidden'>
                                    <div className={`flex ${scoreWidth[passwordScore.score]} transition-all duration-300 h-full shrink-0 rounded-full ${scoreToColor[passwordScore.score]}`} />
                                </div>
                                <div className={`flex w-full h-full ${scoreToText[passwordScore.score]}`}>{handleGetFeedback(entryPass, passwordScore)}</div>
                            </div>
                        </div>
                        {/* notes input */}
                        <div className='flex flex-col gap-1'>
                            <label className='flex w-full text-lg'>Notes</label>
                            <textarea id='notes' value={entry.notes} onChange={handleChange} className='flex w-full border-2 rounded-lg px-1 h-40 resize-none outline-none border-base-300 focus:border-primary duration-300 transition-all' />
                        </div>
                        {/* URL input to come */}
                        <div className='flex flex-col gap-1'>
                            <label className='flex w-full text-lg'>Website</label>
                            <input value={"This feature coming"} readOnly className='flex w-full border-2 rounded-lg px-1 h-9 border-base-300 outline-none focus:border-primary duration-300 transition-all' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
