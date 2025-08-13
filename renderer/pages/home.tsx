// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { useRouter } from 'next/router';
import { BannerContext } from '../contexts/bannerContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import { createEntry, decryptEntryPass } from '../utils/entryFunctions';
import { vaultLevelDecrypt, vaultLevelEncrypt, writeEntriesToFile } from '../utils/vaultFunctions';
import { addBanner } from '../interfaces/Banner';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const naviagte = useRouter();
  const [entries, setEntries] = useState<Array<Entry>>([]);

  const [searchFilter, setSearchFilter] = useState("");
  useEffect(()=>{
    if(vault !== undefined && vault.kek !== undefined){
      // only perform the vault level decrypt if when the file contents are split by a new line, there is 2 distinct
      // lines
      createEntry('hello', 'a','badpass','c',vault.kek).then((ent)=>{
        setEntries(prev=>[...prev, ent])
      })
    }
  },[])
  useEffect(()=>{
    if(vault !== undefined && vault.kek !== undefined){
      console.log("writing entries to file")
      vaultLevelEncrypt(entries, vault.wrappedVK, vault.kek).then((response)=>{     
        setVault(prev=>({...prev, fileContents:response}))
        window.ipc.writeFile(vault.filePath, response).then((writeResponse)=>{
          if (writeResponse === "OK"){
            console.log('ok,', vault.fileContents)
            vaultLevelDecrypt(vault.fileContents, vault.kek);
          }else{
            addBanner(bannerContext, "Unable to write entry to file", 'error');
          }
        })
      })
    }
  },[entries])


  useEffect(()=>{
    if (searchFilter === ""){
      setEntries(prev=>prev.filter(x=>x.title.includes(searchFilter) || x.username.includes(searchFilter) || x.notes.includes(searchFilter)))
    }
  },[searchFilter])

  return (
    <div className='flex bg-base-200 w-screen h-screen flex-col justify-center items-center p-2'>
      {(vault !== undefined && !vault.isUnlocked) && <UnlockVaultPrompt />}
      { (vault !== undefined && vault.isUnlocked) && 
        <div className='flex flex-col w-full h-full items-center gap-2'>
          <Navbar search={searchFilter} setSearch={setSearchFilter} />
          <div className='flex w-full h-full overflow-y-auto gap-y-5  transition-all duration-700 gap-5 rounded-lg flex-wrap'>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
            <div className='bg-base-100 basis-md grow max-w-md shrink-0 border-2 border-base-300 shadow-lg w-full h-90 rounded-xl'/>
          </div>
        </div>
      }
    </div>
  )
}
