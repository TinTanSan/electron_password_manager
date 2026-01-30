import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { useRouter } from 'next/router'
import { BannerContext } from '../contexts/bannerContext'
import { addBanner } from '../interfaces/Banner'
import FancyInput from '../components/fancyInput'
import { isStrongPassword } from '../utils/commons'
import Image from 'next/image'

export default function LoadFile() {
    const {vault, setVault} = useContext(VaultContext);
    const navigate = useRouter()
    const [recent, setRecent] = useState<Array<string>>([]);
    const [password, setPassword] = useState("");
    const [requiresInitialisation, setRequiresInitisalisation] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const banners = useContext(BannerContext);
    const [showDeleteConfirmationPopup, setShowDeleteConfirmationPopup] = useState(false);
    const [vaultToDelete, setVaultToDelete] = useState("");
    // when using a file dialog to create a file
    const handleCreateFile = ()=>{
        window.fileIPC.openCreateFile().then((filePath)=>{
            if (filePath){
                // since its a new file, the file content will be empty anyways
                setVault({ filePath, isUnlocked:false, entries:[], vaultMetadata: {lastEditDate:new Date(), lastRotateDate: new Date(), version: '1.0.0.0', createDate: new Date()}, entryGroups: []});
                window.fileIPC.addRecent(filePath)
                setRecent(prev=>[...prev, filePath])
                window.vaultIPC.openVault(filePath).then((response)=>{
                    if (response.message === 'NOT_OK'){
                        addBanner(banners, '"Unable to move further, something went wrong opening the vault', 'error');
                        return;
                    }
                    setRequiresInitisalisation(response.message === "SET_PASS");
                })
            }
        })
    }

    const handleOpenFile = (filepath:string | undefined= undefined)=>{
        // filepath is undefined if the user clicked on open vault, 
        // the filepath will be defined and a valid path if they picked from the recent vaults
        if (filepath === undefined){
            window.fileIPC.openFilePicker().then(({fileContents, filePath, status}:{fileContents:string, filePath:string, status:string})=>{
                if (status ==="OK"){
                    window.fileIPC.getRecents().then((recents:Array<string>)=>{
                        setRecent(recents);
                        setVault({ filePath, isUnlocked:false, entries:[], vaultMetadata: {lastEditDate:new Date(), lastRotateDate: new Date(), version: '1.0.0.0', createDate: new Date()}, entryGroups: []});
                        const recent_vault = recents[0].substring(recents[0].lastIndexOf("/")+1, recents[0].length-4);
                        addBanner(banners, "Vault "+recent_vault+" Opened successfully", 'success')
                    })
                }else if (status==="CANCELLED"){
                    addBanner(banners, "No vault chosen", 'warning')
                }else{
                    addBanner(banners, "Extension not valid for a vault", "error")
                }
            })
        }else{
            window.vaultIPC.openVault(filepath).then((response)=>{
                if (response.message === 'NOT_OK'){
                    addBanner(banners, '"Unable to move further, something went wrong opening the vault', 'error');
                    return;
                }
                setRequiresInitisalisation(response.message === "SET_PASS");
                setVault({ filePath:filepath, isUnlocked:false, entries:[], vaultMetadata: {lastEditDate:new Date(), lastRotateDate: new Date(), version: '1.0.0.0', createDate: new Date()}, entryGroups: []});
            })
        }
        
    }

    const handleEnter = (e:FormEvent)=>{
          e.preventDefault();
          if (requiresInitialisation){
            // create new master password, i.e. new vault or vault key rotations
            if (password === ""){
              addBanner(banners, "Password cannot be empty", "warning")
              return;
            }
            if (password !== confirmPassword){
              addBanner(banners, "The two password fields were not the same", 'error');
              return;
            } 
            const passMessage = isStrongPassword(password)
            if (passMessage.length !== 0){
              // give the user a warning about unsafe master pass
              addBanner(banners,passMessage, 'warning' )
              return;
            }
            window.vaultIPC.setMasterPassword(password).then((response)=>{
                console.log(response);
                if (response === true){
                    setVault(prev=>({...prev, isUnlocked:true}))
                    navigate.push('/home');
                }else{
                    addBanner(banners, 'unable to write to file', 'error')
                }
            }).catch((error)=>{
                addBanner(banners, 'unable to write hash to file '+error, 'error');
            })
          }else{
            // simple unlock
            if (!password){
              addBanner(banners, "Password cannot be empty", "warning");
              return;
            }
            window.vaultIPC.unlockVault(password).then((response)=>{
                setPassword("");
                setConfirmPassword("");
                if (response.status === "OK"){
                    addBanner(banners, 'vault unlocked', 'success')
                    setVault(prev=>({...prev, isUnlocked:true,entries: response.entriesToDisplay}))
                    navigate.push('/home');
                }else{
                    addBanner(banners, 'incorrect password','error');
                }
            }).catch((error)=>{
                addBanner(banners, 'unable to verify password: '+error,'error')
            })
          }
        }

    const escapeHandler = (e:KeyboardEvent) => {
        if (e.key === "Escape") {
            if(showDeleteConfirmationPopup){
                console.log(showDeleteConfirmationPopup);
                setShowDeleteConfirmationPopup(false);
                setVaultToDelete("");
            }else{
                console.log(showDeleteConfirmationPopup, 'cancelled')
                handleCancel();
            }    
        }
    };

    const handleCancel = ()=>{
        setVault(prev=>({...prev,filePath:""}));
        setPassword("");
        setConfirmPassword("");
        addBanner(banners, "Vault Closed successfully", 'info')
    }

    const handleDeleteVault = ()=>{
        if (vaultToDelete){
            window.fileIPC.deleteFile(vaultToDelete).then(()=>{
                setRecent(prev=>prev.filter(x=>x!==vaultToDelete));
                addBanner(banners, "Vault deleted successfully", 'success')
                setShowDeleteConfirmationPopup(false);
            })
        }else{
            addBanner(banners, 'Cannot delete vault without knowing the filePath', 'error')
        }
        // stop the click from opening the vault
        
    }

    useEffect(() => {
        document.addEventListener("keydown", (escapeHandler), false);
        return () => {
            document.removeEventListener("keydown", escapeHandler, false);
        };
    }, []);
    useEffect(()=>{
        window.fileIPC.getRecents().then((x)=>{setRecent(x)})
    },[])

  return (
    (vault === undefined || !vault.filePath) ? 
    <div className='flex flex-col h-screen w-screen items-center bg-base-200 gap-20 text-base-content p-5'>
            <title>Open Vault</title>
            <div className='flex flex-col w-full h-1/2 gap-2 justify-start  bg-base-100 rounded-lg border-2 border-base-300'>
                <div className='flex w-full h-fit items-center text-xl justify-center'>Recently opened vaults</div>
                <div className='flex flex-col w-full gap-2 p-2 items-center'>
                    {
                        recent.map((recentFile,i)=>(
                            <div  key={i} className='flex justify-between border-base-300 border-2 z-0 items-center rounded-md p-1 h-10 bg-base-200 w-full text-ellipsis has-[div:hover]:bg-base-300'>
                                <div onClick={()=>{handleOpenFile(recentFile)}} className='flex w-full h-full cursor-pointer'>
                                    {recentFile.substring(1)}
                                </div>
                                <div onClick={()=>{setShowDeleteConfirmationPopup(true); setVaultToDelete(recentFile)}} className='flex w-fit h-fit items-center group'>
                                    <p className='group-hover:items-center duration-300 w-0 h-full group-hover:w-14 group-hover:px-1 overflow-hidden group-hover:text-error-content font-medium justify-center items-center transition-all'>Delete</p>
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
    <div className='flex justify-center items-center w-screen h-screen'>
       <div className='flex flex-col bg-base-100 text-base-content w-1/2 h-2/3 rounded-xl p-5 shadow-lg border-base-300 border-2 gap-5 items-center'>
            <div className='flex justify-center w-full text-3xl font-bold'>{requiresInitialisation?"Set up Vault":"Unlock Vault"}</div>
            
            <form onSubmit={handleEnter} className='flex flex-col h-full w-full justify-center items-center py-5'>
                {requiresInitialisation && 
                <div className='flex flex-nowrap text-sm w-full h-fit items-center justify-center gap-2'>
                    <div className='flex w-4 h-4 rounded-full border justify-center items-center'>i</div>
                    <div className='flex w-fit flex-wrap'>
                    Create a strong master password
                    </div>
                </div>
                }
                <div id='mainPassInput' className='flex flex-col h-full justify-center items-center w-[80%] gap-5'>
                    <FancyInput autoFocus={true}  placeHolder='Enter your password' type='password'  value={password} setValue={setPassword}/>
                    {requiresInitialisation && <FancyInput autoFocus={false} placeHolder='Confirm password' type='password'  value={confirmPassword} setValue={setConfirmPassword}/>}
                </div>
                <div className='flex w-full h-fit gap-5 justify-center  text-lg'>
                <button type='button' onClick={handleCancel} className='flex bg-secondary text-secondary-content w-28 justify-center items-center h-10 rounded-lg hover:bg-secondary-darken'>Cancel</button>
                <button type='submit' className='flex bg-primary text-primary-content w-28 justify-center items-center h-10 rounded-lg hover:bg-primary-darken'>{requiresInitialisation? "Create Vault": "Unlock"}</button>
                </div>
            </form> 
        </div>
    </div>
    )
}
