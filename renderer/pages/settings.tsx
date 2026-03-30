import Sidebar from '@components/Sidebar';
import Slider from '@components/Slider';
import ToggleSwitch from '@components/toggleSwitch';
import { BannerContext } from '@contexts/bannerContext';
import { PreferenceContext, preferenceInputMapper } from '@contexts/preferencesContext';
import { VaultContext } from '@contexts/vaultContext'
import { addBanner } from '@interfaces/Banner';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useRef, useState } from 'react'


export default function Settings() {
    const {preference, setPreference} = useContext(PreferenceContext);
    const {vault, setVault} = useContext(VaultContext);
    const {setBanners} = useContext(BannerContext)
    const router = useRouter();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const initialPreference = useRef(preference);
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
            setPreference(prev=>({...prev, [preferenceName]:newVal ?? !prev[preferenceName]}));
        }else{
            addBanner(setBanners, "Unable to change setting", 'error');
            console.error("you tried to use a handler which is made for boolean-like preferences, the preference you tried to change `"+preferenceName+"` is not a boolean-like preference")
        }
    }

    const comparePreference = (left:PreferenceType, right:PreferenceType)=>{

    }

    const confirmChanges = ()=>{

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

    useEffect(()=>{
        if(vault === undefined || vault.filePath===""){
            // go back to the 'login' page 
            router.push("/loadFile");
        }else{
            document.title = "Settings";
        }
    },[])

    return (
    <div className='flex gap-5 w-scren h-screen overflow-hidden bg-base-200 p-2 text-neutral'> 
        <Sidebar />
        <div className='flex flex-col w-full h-full'>            
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
                <div id='preferences' className='flex w-full h-fit flex-col gap-2'>
                    <div className='flex flex-col text-xl justify-center w-full text-title'>
                        Preferences
                    </div>
                    <div className='flex w-full h-full  rounded-lg flex-wrap p-2 gap-5 justify-between'>    
                        {
                            Object.keys(preferenceInputMapper).map((key)=>
                            {
                                const inputSettings = preferenceInputMapper[key];
                                return (
                                    <div key={key} className='flex flex-col md:w-1/3 xl:w-[44.7vw] border-2 shrink-0 border-base-300 p-2 bg-base-100 rounded-lg gap-2'>
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
                    <div className='flex flex-row gap-1 rounded-lg w-full h-fit p-2'>
                        
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
            </div>
            {hasUnsavedChanges &&   <div className='flex w-full h-12 flex-row-reverse items-center'>
                <button className='flex cursor-pointer border-2 border-base-content rounded-lg items-center justify-center px-5 h-8 text-normal'>Save Changes</button>
            </div>}

        </div>
    </div>
  )
}
