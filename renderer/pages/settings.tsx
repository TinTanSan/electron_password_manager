import Sidebar from '@components/Sidebar';
import zxcvbn from 'zxcvbn';
import ToggleSwitch from '@components/toggleSwitch';
import { BannerContext } from '@contexts/bannerContext';
import { PreferenceContext, preferenceInputMapper, PreferenceType } from '@contexts/preferencesContext';
import { defaultVaultState, VaultContext } from '@contexts/vaultContext'
import { addBanner } from '@interfaces/Banner';
import { cmpObj, IPCResponse } from '@utils/commons';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useRef, useState } from 'react'

const argonMemCostExplanation = "Determines how much RAM is required to unlock your vault";
const argonTmeCost = "Sets the number of mathematical iterations the hashing process performs";
const argonParallelismCost = "Specifies how many processor cores the app can use simultaneously to perform the calculation";


export default function Settings() {
    const {preference, setPreference} = useContext(PreferenceContext);
    const {vault, setVault} = useContext(VaultContext);
    const {setBanners} = useContext(BannerContext);
    const router = useRouter();
    
    const initialPreference = useRef(preference);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(cmpObj(initialPreference.current, preference));
    
    // danger zone modal states
    const [newPassModal, setnewPassModal] = useState(false);
    const [newPass, setNewPass] = useState("");
    const [confirmNewPass, setConfirmNewPass] = useState("");
    
    const [deleteVaultModal, setdeleteVaultModal] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

    // handle all numerical preference changes except for a couple of items such as font size and font spacing
    // which will have 3-5 predefined values they could be
    const handlePreferenceChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
        let v = Number(e.target.value)
        if (!Number.isNaN(v) && preferenceInputMapper[e.target.id].max < v){
            v = preferenceInputMapper[e.target.id].max;
        }
        setPreference(prev=>({...prev, [e.target.id]:Number.isNaN(v)? "" : v}))
    }

    const handleChangeBooleanPreference = <K extends keyof PreferenceType> (preferenceName:K, newVal?:boolean)=>{
        if (typeof preference[preferenceName] === "boolean"){
            const prefNewVal = newVal ?? !preference[preferenceName];
            window.preferenceIPC.setPreference(preferenceName, prefNewVal).then((response:IPCResponse<any>)=>{
                console.log(response)
                if (response.response === true){
                    addBanner(setBanners, "preference set succesfully", 'success');
                    setPreference((prev)=>({...prev, [preferenceName] : prefNewVal}))
                }else{
                    addBanner(setBanners, "unable to set preference", 'error');
                    console.error(response);
                }
            })
        }else{
            addBanner(setBanners, "Unable to change setting", 'error');
            console.error("you tried to use a handler which is made for boolean-like preferences, the preference you tried to change `"+preferenceName+"` is not a boolean-like preference")
        }
    }


    const handleFontSizeChange = (newSize:number)=>{
        window.preferenceIPC.setPreference('fontSize', newSize).then((response)=>{
            if (response.status === "OK"){
                addBanner(setBanners, 'font size updated', 'success');
                window.preferenceIPC.getAllPreferences().then((response)=>{
                    setPreference(response.response);
                })
            }else if (response.status === "CLIENT_ERROR"){
                addBanner(setBanners, response.message, 'error')
            }else{
                addBanner(setBanners, 'Internal error', 'error')
                console.error(response.response);
            }
        })
        
    }
    const handleUpdateMasterPassword = ()=>{
        const strongPass = !preference.requireStrongMasterPassword || zxcvbn(newPass).score >= 3;
        console.log(newPass, zxcvbn(newPass))
        if(!strongPass){
            addBanner(setBanners, "Cannot set master password as it is not strong enough", 'error');
            return;
        }
        const areEq = newPass == confirmNewPass;
        if (!areEq){
            addBanner(setBanners, "Passwords do not match", 'error');
            return;
        }
        window.vaultIPC.setMasterPassword(newPass).then((response:IPCResponse<boolean>)=>{
            if (response.response){
                console.log('ok')
            }else{
                addBanner(setBanners, response.message, 'error')
            }
        })
    }

    const handleDeleteVault = ()=>{
        window.fileIPC.deleteFile(vault.filePath).then(()=>{
            addBanner(setBanners, 'vault deleted', 'success');
            setVault(defaultVaultState);
            router.push('/loadFile');
        })
    }

    useEffect(()=>{
        if(vault === undefined || vault.filePath===""){
            // go back to the 'login' page 
            router.push("/loadFile");
            
        }else{
            document.title = "Settings";
            cmpObj(initialPreference.current, preference);
        }
    },[])
    useEffect(()=>{
        setHasUnsavedChanges(cmpObj(preference, initialPreference.current))
    },[preference])

    return (
    <div className='flex gap-5 w-scren h-screen overflow-hidden bg-base-200 text-neutral'> 
        <Sidebar />
        <div className='flex flex-col w-full h-full gap-2 p-2'>            
            <div className='flex flex-col w-full h-full overflow-y-auto '>
                <div className='flex flex-col w-full h-fit'>
                    <div className='flex flex-col text-xl justify-center w-full text-title'>
                        Settings
                    </div>
                    <div className='flex w-fit items-center justify-center h-[5vh] bg-base-100 relative rounded-lg gap-5 p-2'>    
                        <div className='flex w-full h-fit items-center gap-2 text-normal'>
                            <p className='text-nowrap'>Require Strong master password?</p> 
                            <Image src={'/images/info.svg'} alt='i' width={20} height={10} className='flex h-auto peer cursor-pointer'/>
                            <div className='absolute peer-hover:visible collapse w-80 top-12 p-1 hover:visible bg-base-100 rounded-lg border-2 border-base-300 h-fit left-0 text-subnotes'>A strong password means a password that contains at least one capital letter, one number and a special character.</div>
                            
                        </div>
                        <ToggleSwitch value={preference.requireStrongMasterPassword} setValue={()=>{handleChangeBooleanPreference('requireStrongMasterPassword')}} />
                    </div>
                </div>
                <div id='preferences' className='flex w-full h-fit flex-col gap-5'>
                    <div className='flex flex-col text-xl justify-center w-full text-title'>
                        Preferences
                    </div>
                    <div className='flex w-full h-full rounded-lg flex-wrap gap-5 justify-between'>    
                        {
                            Object.keys(preferenceInputMapper).map((key)=>
                            {
                                const inputSettings = preferenceInputMapper[key];
                                return (
                                    <div key={key} className='flex flex-col w-full md:w-[45%] xl:w-[32%] border-2 shrink-0 border-base-300 p-2 bg-base-100 rounded-lg gap-2'>
                                        <div className='flex flex-col'>
                                            <label className='xl:text-subheading text-normal'>{inputSettings.label}</label>
                                            <i className='text-subnotes'>minimum: {inputSettings.min}, maximum: {inputSettings.max}</i>
                                        </div>
                                        <input type='number' min={inputSettings.min} max={inputSettings.max} step={inputSettings.step} value={preference[key]} className='flex w-30 h-8 border-2 px-1 rounded-lg text-normal border-base-300' id={key} onChange={handlePreferenceChange} />
                                    </div>
                                )
                            }
                            )
                        }
                    </div>
                    <div className='flex flex-row gap-5 rounded-lg w-full h-fit p-2'>
                        
                        <div className='flex flex-col w-full h-fit bg-base-100 border-2 rounded-lg p-2 border-base-300 text-normal'>
                            <div className='text-subheading'>
                                Font sizes
                                <p className='text-subnotes'></p>
                            </div>
                            <div className='flex flex-row gap-2 h-28 shrink-0 w-full'>
                                <div className='flex flex-row w-full h-full p-2 items-center rounded-lg gap-5 text-base-content'>
                                    <div onClick={()=>{handleFontSizeChange(20)}} className='flex flex-col cursor-pointer hover:bg-base-300 hover:w-30 transition-all duration-300 h-24 w-24 shrink-0 p-1 items-center justify-between border-2 border-base-300 rounded-md text-sm'>
                                        <p>Small</p>
                                        <p>aA</p>
                                        <p>14 px</p>
                                    </div>  
                                    <div onClick={()=>{handleFontSizeChange(28)}} className='flex flex-col cursor-pointer hover:bg-base-300 hover:w-30 transition-all duration-300 h-24 w-24  shrink-0 p-1 border-2 border-base-300 justify-between items-center rounded-lg text-md'>
                                        <p>Medium <br/> <i className='text-subnotes'>(Default)</i></p>
                                        <p>aA</p>
                                        <p>16 px</p>
                                    </div>  
                                    <div onClick={()=>{handleFontSizeChange(32)}} className='flex flex-col cursor-pointer hover:bg-base-300 hover:w-30 transition-all duration-300 h-24 w-24 shrink-0  p-1 border-2 items-center justify-between border-base-300 rounded-lg text-xl'>
                                        <p>Large</p>
                                        <p>aA</p>
                                        <p>20 px</p>
                                    </div>  
                                </div>
                            </div>

                            <div className='flex flex-col gap-2 h-fit w-full border-2 border-base-300 p-2 rounded-lg'>
                                <div className='text-subheading'>Preview</div>
                                <div className='flex flex-col w-full h-full'>
                                    <div className='flex text-title  w-full items-center textlg'>Title</div>
                                    <div className='flex text-subheading  w-full items-center'>Sub headings</div>
                                    <div className='flex text-normal  w-full items-center'>main content</div>
                                    <div className='flex text-subnotes  w-full items-center'>subnotes</div>
                                </div>
                            </div>
                            
                        </div>
                        <div className='flex flex-col w-full  h-fit rounded-lg'>
                            <div className='flex text-subheading'>Line spacing</div>
                            <div className='flex flex-row w-full h-28 bg-base-100 border-base-300 border-2 rounded-lg'>

                            </div>
                        </div>
                    </div>
                    
                </div>
            {(vault.filePath && vault.isUnlocked) && 
                <div>
                    <div className='flex w-full h-fit gap-2 flex-col'>
                        <div className='flex w-fit h-fit text-title'>Danger Zone</div>
                        <button onClick={()=>{setnewPassModal(true)}} className='flex w-fit h-8 border-error border-2 rounded-md hover:bg-error items-center justify-center px-2 text-error-content'>Change master password</button>
                        <button onClick={()=>{setdeleteVaultModal(true)}} className='flex w-fit h-8 border-error border-2 rounded-md hover:bg-error items-center justify-center px-2 text-error-content'>Delete vault</button>    
                    </div>
                    {
                        newPassModal && 
                        <div className='flex w-screen h-screen absolute top-0 left-0 z-10 backdrop-blur-sm items-center justify-center'>
                            <div className='flex flex-col gap-5 w-1/3 h-1/2 bg-base-100 shadow-md rounded-lg p-2'>
                                <div className='flex w-full h-fit text-subheading'>Change Master Password</div>
                                {preference.requireStrongMasterPassword && <span className='flex text-subnotes gap-1 relative'>Use a strong master password.
                                    <Image src={"/images/info.svg"} alt='i' width={0} height={0} className='flex w-4 h-auto aspect-square peer'/>
                                    <span className='peer invisible peer-hover:visible absolute hover:visible bg-white top-5 shadow-lg rounded-lg px-2 py-1 border-base-200 border-2'>Use at least 12 seemingly random characters, including numbers,upper and lower cases of letters and special characters.</span>
                                </span>}
                                <div className='flex flex-col w-full h-full gap-5'>
                                    <div className='flex flex-col w-full h-fit text-normal'>
                                        <label className='flex text-nowrap'>New Password</label>
                                        <input type="password" id='newPass' onChange={(e)=>{setNewPass(e.target.value)}} className='flex border-2 border-base-300 rounded-lg w-full h-8 outline-none focus:border-primary' />
                                    </div>

                                    <div className='flex flex-col w-full h-fit text-normal'>
                                        <label className='flex text-nowrap'>Confirm new password</label>
                                        <input type="password" id='confirmPass' onChange={(e)=>{setConfirmNewPass(e.target.value)}} className='flex border-2 border-base-300 rounded-lg w-full h-8 outline-none focus:border-primary' />
                                    </div>
                                </div>
                                <div className='flex w-full h-8 justify-between shrink-0'>
                                    <button onClick={()=>{setnewPassModal(false); setNewPass(""); setConfirmNewPass("")}} className='flex w-fit h-full bg-base-300 hover:bg-base-darken cursor-pointer  rounded-lg px-4 items-center justify-center'>Cancel</button>
                                    <button onClick={handleUpdateMasterPassword} className='flex w-fit h-full bg-primary text-primary-content  cursor-pointer hover:bg-primary-darken rounded-lg px-4 items-center justify-center'>Confirm</button>
                                </div>
                            </div>
                        </div>
                    }

                    {
                        deleteVaultModal && 
                        <div className='flex w-screen h-screen absolute top-0 left-0 z-10 backdrop-blur-sm items-center justify-center'>
                            <div className='flex absolute w-1/2 h-1/3 flex-col bg-base-100 rounded-lg shadow-md p-2'>
                                
                                <div className='flex w-full h-full gap-2 flex-col '>
                                    <div className='flex text-subheading text-error'>
                                        Delete vault        
                                    </div>
                                    <div className='flex w-fit text-normal '>
                                        To confirm the deletion of the vault, please type out &apos;delete&apos;
                                    </div>
                                    <input onChange={(e)=>{setDeleteConfirmationText(e.target.value)}} type="text" className='border-2 h-8 border-base-300 flex w-full rounded-md outline-none focus:border-primary transition-all duration-300 px-0.5'/>
                                </div>
                                <div className="flex w-full h-fit justify-between">
                                    <button onClick={()=>{setdeleteVaultModal(false); setDeleteConfirmationText("")}} className='flex w-40 items-center justify-center h-8 bg-base-300 rounded-lg'>Cancel</button>
                                    <button onClick={handleDeleteVault} className='flex w-40 items-center justify-center h-8  bg-error hover:bg-error-darken rounded-lg'>delete</button>
                                </div>
                            </div>
                        </div>
                    }
                
                </div>
                }
            </div>
            
            {/* {!hasUnsavedChanges &&   <div className='flex w-full bg-base-100 rounded-lg h-12 flex-row-reverse items-center'>
                <button onClick={handleSave} className='flex cursor-pointer border-2 border-base-content rounded-lg items-center justify-center px-5 h-8 text-normal'>Save Changes</button>
            </div>} */}
        </div>
    </div>
  )
}
