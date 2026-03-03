import Sidebar from '@components/Sidebar';
import { minMaxValuesForPreferences, PreferenceContext } from '@contexts/preferencesContext';
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
        const v = Number(e.target.value)

        if (!Number.isNaN(v) && Object.keys(minMaxValuesForPreferences).includes(e.target.id)){
            const [min, max] = minMaxValuesForPreferences[e.target.id];
            if (v < min){
                e.target.value = min;
            }else if (v > max){
                e.target.value = max;
            }
        }

        setPreference(prev=>({...prev, [e.target.id]:e.target.value}))
    }


    useEffect(()=>{
        if(vault === undefined){
            // go back to the 'login' page 
            router.push("/loadFile");
        }else{
            document.title = "Settings"
        }
    },[])

    return (
    <div className='flex gap-5 w-scren h-screen bg-base-200 p-2 '> 
        <Sidebar />
        <div className='flex flex-col w-full h-full'>
            <div className='flex flex-col w-full h-fit'>
                <div className='flex flex-col text-xl justify-center w-full'>
                    Settings
                </div>
                <div className='flex w-full h-full bg-base-100 rounded-lg flex-col p-2'>    
                    
                </div>
            </div>
            <div className='flex w-full h-fit flex-col'>
                <div className='flex flex-col text-xl justify-center w-full'>
                    Preferences
                </div>
                <div className='flex w-full h-full bg-base-100 rounded-lg flex-col p-2'>    
                    <div className='flex flex-col'>
                        <label>Vault Lock Time Out (minutes)</label>
                        <i className='text-xs'>minimum: {minMaxValuesForPreferences['vaultLockTimeOut'][0]}, maximum: {minMaxValuesForPreferences['vaultLockTimeOut'][1]}</i>
                        <input className='flex w-30 h-8 border-2 ' id='vaultLockTimeOut' onChange={handlePreferenceChange} />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
