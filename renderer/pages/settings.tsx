import Sidebar from '@components/Sidebar';
import Slider from '@components/Slider';
import { PreferenceContext, preferenceInputMapper } from '@contexts/preferencesContext';
import { VaultContext } from '@contexts/vaultContext'
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react'


export default function Settings() {
    const {preference, setPreference} = useContext(PreferenceContext);
    const {vault, setVault} = useContext(VaultContext);
    const router = useRouter();

    // handle all numerical preference changes except for a couple of items such as font size and font spacing
    // which will have 3-5 predefined values they could be
    const handlePreferenceChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
        let v = Number(e.target.value)
        if (!Number.isNaN(v) && preferenceInputMapper[e.target.id].max < v){
            v = preferenceInputMapper[e.target.id].max;
        }
        setPreference(prev=>({...prev, [e.target.id]:Number.isNaN(v)? "" : v}))
    }

    const confirmChanges = ()=>{

    }

    useEffect(()=>{
        if(vault === undefined){
            // go back to the 'login' page 
            router.push("/loadFile");
        }else{
            document.title = "Settings";
        }
    },[])

    return (
    <div className='flex gap-5 w-scren h-screen overflow-hidden bg-base-200 p-2 text-neutral'> 
        <Sidebar />
        <div className='flex flex-col w-full h-full overflow-y-autox'>
            <div className='flex flex-col w-full h-fit'>
                <div className='flex flex-col text-xl justify-center w-full'>
                    Settings
                </div>
                <div className='flex w-full h-full bg-base-100 rounded-lg flex-col p-2'>    
                    
                </div>
            </div>
            <div id='preferences' className='flex w-full h-fit flex-col gap-2'>
                <div className='flex flex-col text-xl justify-center w-full'>
                    Preferences
                </div>
                <div className='flex w-full h-full  rounded-lg flex-wrap p-2 gap-5 justify-between'>    
                    {
                        Object.keys(preferenceInputMapper).map((key)=>
                        {
                            const inputSettings = preferenceInputMapper[key];
                            return (
                                <div key={key} className='flex flex-col w-[45vw] border-2 shrink-0 border-base-300 p-2 bg-base-100 rounded-lg gap-2'>
                                    <div className='flex flex-col'>
                                        <label>{inputSettings.label}</label>
                                        <i className='text-xs'>minimum: {inputSettings.min}, maximum: {inputSettings.max}</i>
                                    </div>
                                    <input type='number' min={inputSettings.min} max={inputSettings.max} step={inputSettings.step} value={preference[key]} className='flex w-30 h-8 border-2 px-1 rounded-lg border-base-300' id={key} onChange={handlePreferenceChange} />
                                </div>
                            )
                        }
                        )
                    }
                </div>
                <div className='flex flex-row gap-1 rounded-lg w-full h-fit p-2'>
                    
                    <div className='flex flex-col w-full h-fit bg-base-100 border-2 rounded-lg p-2 border-base-300'>
                        <div>
                            Font sizes
                        </div>
                        <div className='flex flex-row gap-2 h-28 shrink-0 w-full'>
                            <div className='flex flex-row w-full h-full p-2 items-center rounded-lg gap-5 text-base-content'>
                                <div className='flex flex-col cursor-pointer hover:bg-base-300 hover:h-25 h-24 aspect-square shrink-0 p-1 items-center justify-between border-2 border-base-300 rounded-md text-sm'>
                                    <p>Small</p>
                                    <p>aA</p>
                                    <p>14 px</p>
                                </div>  
                                <div className='flex flex-col cursor-pointer hover:bg-base-300 hover:h-25 h-24 aspect-square shrink-0 p-1 border-2 border-base-300 justify-between items-center rounded-lg text-md'>
                                    <p>Medium</p>
                                    <p>aA</p>
                                    <p>16 px</p>
                                </div>  
                                <div className='flex flex-col cursor-pointer hover:bg-base-300 hover:h-25 h-24 aspect-square shrink-0  p-1 border-2 items-center justify-between border-base-300 rounded-lg text-lg'>
                                    <p>Large</p>
                                    <p>aA</p>
                                    <p>18 px</p>
                                </div>  
                            </div>
                        </div>

                        <div className='flex flex-col gap-2 h-fit w-full'>
                            <div>Preview</div>
                            <div className='flex flex-col w-full h-full'>
                                <div className='flex text-title  w-full items-center'>Title</div>
                                <div className='flex text-subheading  w-full items-center'>Sub headings</div>
                                <div className='flex text-normal  w-full items-center'>main content</div>
                                <div className='flex text-subnotes  w-full items-center'>subnotes</div>
                            </div>
                        </div>
                        
                    </div>
                    <div className='flex flex-col w-full  h-fit rounded-lg'>
                        <div>Line spacing</div>
                        <div className='flex flex-row w-full h-28 bg-base-100 border-base-300 border-2 rounded-lg'>

                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
  )
}
