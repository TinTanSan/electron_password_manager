import { VaultContext } from '@contexts/vaultContext'
import { useRouter } from 'next/router';
import React, { useContext, useEffect } from 'react'


export default function Settings() {


    const {vault, setVault} = useContext(VaultContext);
    const router = useRouter();
    useEffect(()=>{
        if(vault === undefined){
            // go back to the 'login' page 
            router.push("/loadFile");
        }else{
            document.title = "Settings"
        }
    },[])

    return (
    <div className='flex flex-col gap-2 w-scren h-screen bg-base-200'> 

    </div>
  )
}
