import React, { FormEvent, useContext, useEffect, useRef, useState } from 'react'
import { defaultVaultState, VaultContext } from '@contexts/vaultContext'
import { useRouter } from 'next/router'
import { BannerContext } from '@contexts/bannerContext'
import { addBanner } from "@interfaces/Banner";
import FancyInput from '@components/fancyInput'
import { isStrongPassword } from '@utils/commons'
import Image from 'next/image'
import { PreferenceContext } from '@contexts/preferencesContext';
export default function LoadFile() {
    const {vault, setVault} = useContext(VaultContext);
    const navigate = useRouter()
    const [recent, setRecent] = useState<Array<string>>([]);
    const [password, setPassword] = useState("");
    const [requiresInitialisation, setRequiresInitisalisation] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const {setBanners} = useContext(BannerContext);
    const [showDeleteConfirmationPopup, setShowDeleteConfirmationPopup] = useState(false);
    const [vaultToDelete, setVaultToDelete] = useState("");
    const [unlocked, setunlocked] = useState(false);
    const {preference} = useContext(PreferenceContext);


    // simply for resetting unlock animation
    const ref = useRef(null);
    // when using a file dialog to create a file
    const handleCreateFile = ()=>{
        window.fileIPC.openCreateFile().then((ipcResponse)=>{
            if (ipcResponse.status === 'OK'){
                window.vaultIPC.openVault(ipcResponse.response).then((response)=>{

                    if (response.status === "OK"){
                        setRequiresInitisalisation(response.response === "SET_PASS");
                        
                        recent.forEach((x)=>{console.log(x)});
                        setVault({ 
                            filePath:ipcResponse.response, 
                            isUnlocked:false, 
                            entries:[], 
                            vaultMetadata: {
                                lastEditDate:new Date(), 
                                lastRotateDate: new Date(), 
                                version: '1.0.0.0', 
                                createDate: new Date()
                            }, 
                            entryGroups: []
                        });           
                        window.fileIPC.getRecents().then((response)=>{setRecent(response.response)})
                    }
                    else if (response.status === 'INTERNAL_ERROR'){
                        addBanner(setBanners, '"Unable to move further, something went wrong opening the vault', 'error');
                        console.error(response);
                        return;
                    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                })
            }else if (ipcResponse.status === "CLIENT_ERROR" && ipcResponse.message.includes("user did not open a vault")){
                addBanner(setBanners, "You did not open a vault", 'warning');
            }else{
                addBanner(setBanners, 'internal error when opening vault', 'error');
                console.error(ipcResponse);
            }
        })
    }

    const handleOpenFile = (filePath:string | undefined= undefined)=>{
        // filepath is undefined if the user clicked on open vault, 
        // the filepath will be defined and a valid path if they picked from the recent vaults
        if (filePath === undefined){
            window.fileIPC.openFilePicker().then((response)=>{
                if (response.status ==="OK"){
                    const res = response.response;    
                    setVault({...defaultVaultState, filePath:res.filePath});
                    window.fileIPC.addRecent(res.filePath);
                    addBanner(setBanners, "Vault Opened successfully", 'success')
                }else if (response.status==="CANCELLED"){
                    addBanner(setBanners, "No vault chosen", 'warning')
                }else{
                    addBanner(setBanners, "Extension not valid for a vault", "error")
                }
            })
        }else{
            window.vaultIPC.openVault(filePath).then((response)=>{
                if (response.status === 'INTERNAL_ERROR'){
                    addBanner(setBanners, '"Internal error, unable to open the vault', 'error');
                    console.error(response)
                    return;
                }
                if (response.status === "CLIENT_ERROR"){
                    addBanner(setBanners, "Unable to open vault"+response.message, 'error');
                    console.error(response);
                    return;
                }
                setRequiresInitisalisation(response.response === "SET_PASS");
                setVault(({...defaultVaultState, filePath:filePath}));
            })
        }
        
    }

    const handleEnter = (e:FormEvent)=>{
          e.preventDefault();
          if (requiresInitialisation){
            // create new master password, i.e. new vault or vault key rotations
            if (password === ""){
              addBanner(setBanners, "Password cannot be empty", "warning")
              return;
            }
            if (password !== confirmPassword){
              addBanner(setBanners, "The two password fields were not the same", 'error');
              return;
            }  
            const passMessage = preference.requireStrongMasterPassword? isStrongPassword(password): password.length ===0? "Password cannot be empty" : "";
            if (passMessage.length !== 0){
              // give the user a warning about unsafe master pass
              addBanner(setBanners,passMessage, 'warning' )
              return;
            }
            window.vaultIPC.setMasterPassword(password).then((response)=>{
                if (response === true){
                    setunlocked(true);
                    setVault(prev=>({...prev, isUnlocked:true}))
                    navigate.push('/home');
                }else{
                    addBanner(setBanners, 'unable to write to file', 'error')
                }
            }).catch((error)=>{
                addBanner(setBanners, 'unable to write hash to file '+error, 'error');
            })
          }else{
            // simple unlock
            if (!password){
              addBanner(setBanners, "Password cannot be empty", "warning");
              return;
            }
            window.vaultIPC.unlockVault(password).then((response)=>{
                setPassword("");
                setConfirmPassword("");
                if (response.status === "OK"){
                    setunlocked(true);
                    addBanner(setBanners, 'vault unlocked', 'success')
                    const anim = ref.current;
                    if (anim){
                        anim.setCurrentTime(0);
                    }
                    setTimeout(() => {
                        setunlocked(false);
                        setVault(prev=>({...prev, isUnlocked:true,entries: response.entriesToDisplay}))
                        navigate.push('/home');    
                    }, 2500);
                    
                }else{
                    addBanner(setBanners, 'incorrect password','error');
                }
            }).catch((error)=>{
                console.error(error)
                addBanner(setBanners, 'unable to verify password: '+error,'error')
            })
          }
    }



    useEffect(()=>{
        window.fileIPC.getRecents().then((ipcResponse)=>{
            if (ipcResponse.status === "OK"){
                setRecent(ipcResponse.response);
                handleOpenFile(ipcResponse.response[0]);
                document.title = 'Open a Vault'
            }else{
                addBanner(setBanners, 'unable to get recents list', 'error');
                setRecent([]);
            }
            
        })
    },[])

    useEffect(()=>{
        if (vault && vault.filePath){
            document.title = vault.filePath.substring(vault.filePath.lastIndexOf("/")+1)
        }else{
            document.title = "Open a vault"
        }
    }, [vault])

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (vault.filePath) {
                    setVault({ ...defaultVaultState });
                    addBanner(setBanners, 'Vault closed successfully', 'info')
                }
            }
        };
        document.addEventListener("keydown", handler);
        return () => {
            document.removeEventListener("keydown", handler);
        };
    }, [vault]);

    const handleCancelOpenVault = ()=>{
        setVault({...defaultVaultState});
        setPassword("");
        setConfirmPassword("");
        addBanner(setBanners, "Vault Closed successfully", 'info');
    }
    useEffect(()=>{
        const handler = (e:KeyboardEvent)=>{
            if (e.key === "Enter" && showDeleteConfirmationPopup) handleDeleteVault()
        }
    
        document.addEventListener('keydown', handler);
        return ()=>{
            document.removeEventListener('keydown', handler)
        }
    },[showDeleteConfirmationPopup])

    const handleDeleteVault = ()=>{
        if (vaultToDelete){
            window.fileIPC.deleteFile(vaultToDelete).then(()=>{
                setRecent(prev=>prev.filter(x=>x!==vaultToDelete));
                addBanner(setBanners, "Vault deleted successfully", 'success')
                setShowDeleteConfirmationPopup(false);
            })
        }else{
            addBanner(setBanners, 'cannot delete a vault without knowing the file path', 'error')
        }
        
    }
    const handleRemoveRecent = (filePath:string)=>{
        window.fileIPC.removeRecent(filePath).then((response)=>{
            if(response === "OK"){
                window.fileIPC.getRecents().then((response)=>{
                    setRecent(response);
                    addBanner(setBanners, 'Successfully removed vault from recents list', 'success');
                })
            }
        })
    }


    

  return (
    (vault === undefined || !vault.filePath) ? 
    <div className='flex flex-col h-screen w-screen items-center bg-base-200 gap-20 text-base-content p-5'>
            <div className='flex flex-col w-full h-2/3 gap-2 justify-start overflow-y-auto  bg-base-100 rounded-lg border-2 border-base-300'>
                <div className='flex w-full h-fit items-center text-xl justify-center'>Recently opened vaults</div>
                <div className='flex flex-col w-full h-fit gap-2 p-2 items-center'>
                    {
                        recent.map((recentFile,i)=>(
                            <div  key={i} className='flex justify-between z-0  p-1 h-10 gap-2 w-full'>
                                <div onClick={()=>{handleRemoveRecent(recentFile)}} className='flex w-fit min-w-8 h-full items-center justify-center group cursor-pointer'>
                                    <p className='group-hover:items-center group-hover:text-nowrap duration-300 w-0 h-full group-hover:w-44 overflow-hidden group-hover:text-error-content font-medium justify-center items-center transition-all'>Remove from List</p>
                                    <Image src={"/images/remove.svg"} alt='remove' width={0} height={0} className='flex w-8 h-8 border-2 border-info rounded-full'/>
                                </div>
                                <div onClick={()=>{handleOpenFile(recentFile)}} className='flex bg-base-200 border-base-300 border-2 px-1 items-center text-ellipsis rounded-md hover:bg-base-300 w-full h-full cursor-pointer'>
                                    {recentFile.replace("/","")}
                                </div>                                
                                <div onClick={()=>{setShowDeleteConfirmationPopup(true); setVaultToDelete(recentFile)}} className='flex w-fit h-fit items-center group'>
                                    <p className='group-hover:items-center duration-300 w-0 h-full group-hover:w-fit group-hover:px-2 overflow-hidden group-hover:text-error-content font-medium justify-center items-center transition-all'>Delete</p>
                                    <Image  src={'/images/delete_red.svg'} alt='delete' className='peer flex w-8 h-full z-10 hover:border  hover:brightness-20' width={0} height={0}/>
                                </div>

                            </div>
                        ))
                    }
                    {
                     showDeleteConfirmationPopup && 
                        <div className='flex flex-col z-10 border-2 rounded-lg border-base-300 bg-base-100 shadow-lg w-1/3 h-1/5 gap-2 absolute top-1/3'>
                            <p className='flex h-1/4 w-full justify-center p-1 text-lg'>Delete Vault?</p>
                            <div className='flex w-full h-3/4 gap-2 flex-col bg-base-300 p-2 rounded-b-md'>
                            <p className='flex w-full h-full'>
                                Deleting the vault means you will lose all the passwords you kept inside of it.
                            </p>
                            <div className='flex w-full h-full gap-5 justify-between'>
                                <button onClick={()=>{setShowDeleteConfirmationPopup(false); setVaultToDelete("")}} className='flex border-2 px-2 bg-base-100 hover:bg-base-200 hover:text-info-content text-base-content w-full items-center justify-center rounded-lg  border-neutral'>Cancel</button>
                                <button onClick={handleDeleteVault} className='flex border-2 px-2 hover:bg-error hover:text-error-content bg-base-100 text-error w-full items-center justify-center rounded-lg  border-error'>Confirm</button>
                            </div>
                            </div>
                        </div>
                    }
                </div>
                
            </div>
            
            <div className="grid grid-flow-row-dense gap-5 row-span-1 justify-center">
                <div className='grid grid-flow-row-dense row-span-1 justify-center text-wrap shrink flex-wrap'>
                    To load an existing vault click Load vault, otherwise create a new vault using the create vault button.
                </div>
                <div className='grid grid-flow-row-dense lg:grid-flow-col-dense  gap-5 row-span-1 justify-center'>
                    <button onClick={()=>{handleOpenFile()}} className='flex justify-center items-center bg-primary hover:bg-primary-darken text-primary-content w-32 h-10 rounded-lg transition-all duration-700 hover:rounded-xl'>
                        load Vault
                    </button>
                    <button onClick={()=>{handleCreateFile()}} className='flex justify-center items-center bg-primary hover:bg-primary-darken text-primary-content w-32 h-10 rounded-lg transition-all duration-700 hover:rounded-xl'>
                        Create Vault
                    </button>
                </div>
            </div>
            
        </div>
    :
    <div className='flex justify-center items-center w-screen h-screen bg-base-200'>
       <div className={` flex flex-col bg-base-100 text-base-content w-2/5 max-w-187.5 max-h-200 h-2/3 rounded-xl p-5 shadow-lg border-base-300 border-2 gap-4 items-center animate-modal-open `}>
            <div className='flex justify-center w-full text-title font-bold'>{requiresInitialisation?"Set up Vault":"Unlock Vault"}</div>
            <div className='flex w-full h-fit justify-center flex-col items-center'>
                <div className='flex text-subheading'>
                    <b> {vault.filePath.substring(vault.filePath.lastIndexOf("/")+1, vault.filePath.length-4)} </b>  <div className='flex w-1 font-normal' />vault
                </div>
                <p className='flex text-subnotes'>{vault.filePath}</p>
            </div>
            <form onSubmit={handleEnter} className='flex flex-col h-full w-full justify-start items-center text-normal py-5'>
                {requiresInitialisation && 
                    <div className='flex flex-nowrap text-sm w-full h-fit items-center justify-center gap-2'>
                        <div className='flex w-4 h-4 rounded-full border justify-center items-center cursor-default'>i</div>
                        <div className='flex w-fit flex-wrap'>
                        Create a strong master password
                        </div>
                    </div>
                }
                {unlocked && 
                    <div className='flex bg-base-100 z-10 w-full items-center justify-center h-fit'>
                    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="96" height="96" className='flex absolute'>
                        {/* shackle and it's animation */}
                        <g>
                            <animateTransform id="shackleAnim" attributeName="transform" type="translate" from="0 0" to="0 -22" dur="0.75s" begin="0.3s" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" fill="freeze" />
                            <path fill="none" stroke="oklch(19.616% 0.063 257.651)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" d="M 72 143 L 72 98 Q 72 78 100 78 Q 128 78 128 98 L 128 118" />
                        </g>
                        {/* <!-- Lock body --> */}
                        <rect fill="oklch(19.616% 0.063 257.651)" x="53" y="113" width="94" height="72" rx="6"/>

                        {/* <!-- Slot covers --> */}
                        <rect fill="oklch(19.616% 0.063 257.651)" x="65" y="114" width="14" height="71"/>
                        <rect fill="oklch(19.616% 0.063 257.651)" x="121" y="114" width="14" height="71"/>

                        {/* <!-- Keyhole --> */}
                        <circle fill="#ffffff" cx="100" cy="141" r="7"/>
                        <rect fill="#ffffff" x="97" y="141" width="6" height="12" rx="2"/>
                    </svg>
                    </div>
                }
                <div id='mainPassInput' className='flex flex-col h-full justify-center items-center text-normal w-[80%] gap-5'>
                    <FancyInput autoFocus={true}  placeHolder='Enter your password' type='password'  value={password} setValue={setPassword}/>
                    {requiresInitialisation && <FancyInput autoFocus={false} placeHolder='Confirm password' type='password'  value={confirmPassword} setValue={setConfirmPassword}/>}
                </div>
                <div className='flex w-full h-1/2 gap-5 justify-center items-end text-normal'>
                    <button type='button' onClick={handleCancelOpenVault} className='flex bg-secondary text-secondary-content w-28 justify-center items-center h-10 rounded-lg hover:bg-secondary-darken'>Cancel</button>
                    <button onClick={handleEnter} type='submit' className='flex bg-primary text-primary-content min-w-28 px-5 justify-center items-center h-10 rounded-lg hover:bg-primary-darken'>{requiresInitialisation? "Create Vault": "Unlock"}</button>
                </div>
            </form> 
        </div>
    </div>
    )
}
