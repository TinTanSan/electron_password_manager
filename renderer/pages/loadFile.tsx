import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { useRouter } from 'next/router'
import { BannerContext } from '../contexts/bannerContext'
import { addBanner } from '../interfaces/Banner'
import { Vault } from '../interfaces/Vault'
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
    // when using a file dialog to create a file
    const handleCreateFile = ()=>{
        window.fileIPC.openCreateFile().then((filePath)=>{
            if (filePath){
                // since its a new file, the file content will be empty anyways
                setVault({ filePath, isUnlocked:false, entries:[], vaultMetadata: {lastEditDate:new Date(), lastRotateDate: new Date(), version: '1.0.0.0', createDate: new Date()}, entryGroups: []});
                window.fileIPC.addRecent(filePath);
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
        handleCancel();
        }
    };

    const handleCancel = ()=>{
        setVault(prev=>({...prev,filePath:""}));
        setPassword("");
        setConfirmPassword("");
        addBanner(banners, "Vault Closed successfully", 'info')
    }

    const handleDeleteVault = (e:React.MouseEvent<HTMLImageElement, MouseEvent>,filePath:string)=>{
        // stop the click from opening the vault
        e.stopPropagation();
        e.preventDefault();
        window.fileIPC.deleteFile(filePath).then(()=>{
            setRecent(prev=>prev.filter(x=>x!==filePath));
        })
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
    (vault === undefined || !vault.filePath) ? <div className='grid w-screen h-screen grid-flow-row p-5 grid-rows-4 bg-base-200 gap-20 text-base-content'>
            <title>Open Vault</title>
            <div className='grid grid-flow-row-dense row-span-2 grid-rows-10 grid-cols-1 justify-center bg-base-100 rounded-lg border-2 border-base-300'>
                <div className='flex w-full row-span-1 h-full items-center text-xl justify-center row-start-1'>Recently opened vaults</div>
                <div className='flex flex-col w-full gap-2 p-2'>
                    {
                        recent.map((recentFile,i)=>(
                            <div  key={i} className='flex justify-between  border-base-300 border-2 z-0 items-center rounded-md p-1 h-10 bg-base-200 w-full text-ellipsis has-[div:hover]:bg-base-300'>
                                <div onClick={()=>{handleOpenFile(recentFile)}} className='flex w-full h-full cursor-pointer'>
                                    {recentFile.substring(1)}
                                </div>
                                <div className='flex w-fit h-fit border-2 items-center'>
                                    <div className='hidden peer-hover:block transition duration-300 bg-red-500 text-white'>delete</div>
                                    <Image onClick={(e)=>{handleDeleteVault(e,recentFile)}} src={'/images/delete_red.svg'} alt='delete' className='peer flex w-8 h-full z-10 hover:border border-black  hover:brightness-0' width={0} height={0}/>
                                </div>
                            </div>
                        ))
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
