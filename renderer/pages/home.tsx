// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { useRouter } from 'next/router';
import { BannerContext } from '../contexts/bannerContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import { createEntry, decryptEntryPass } from '../utils/entryFunctions';


export default function HomePage() {
  const vaultContext = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const naviagte = useRouter();
  const [entries, setEntries] = useState<Array<Entry>>([]);
  useEffect(()=>{
    if(vaultContext.vault !== undefined && vaultContext.vault.kek !== undefined){
      createEntry('a', 'b',' c','',vaultContext.vault.kek).then((entry)=>{
        console.log(entry.password)
        decryptEntryPass(entry, vaultContext.vault.kek).then((x)=>{
          console.log(x)
        })
      })
      // vaultContext.vault.fileContents.split("\n");
    }
  },[vaultContext])
  // whether or not the vault is unlocked, automatically lock after 1 minute of inactivity

  return (
    <div className='flex bg-base-200 w-screen h-screen flex-col justify-center items-center p-2'>
      {(vaultContext.vault !== undefined && !vaultContext.vault.isUnlocked) && <UnlockVaultPrompt />}
      { (vaultContext.vault !== undefined && vaultContext.vault.isUnlocked) && 
        <div className='flex flex-col w-full h-full items-center gap-2'>
          <Navbar />
          <div className='flex w-full h-full overflow-y-auto gap-y-5  transition-all duration-700 gap-5 px-2 rounded-lg flex-wrap'>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md shrink-0 max-w-lg border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
          </div>
        </div>
      }
    </div>
  )
}
