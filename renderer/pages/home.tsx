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
import EntryComponent from '../components/EntryComponent';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const naviagte = useRouter();

  const [searchFilter, setSearchFilter] = useState("");
  useEffect(()=>{
    if(vault !== undefined && vault.kek !== undefined){
      vaultLevelDecrypt(vault.fileContents, vault.kek).then((decryptedEntries)=>{
        setVault(prev=>({...prev, entries:decryptedEntries}))
      })
    }
  },[])

  return (
    <div className='flex bg-base-200 w-screen h-screen flex-col justify-center items-center p-2'>
      {(vault !== undefined && !vault.isUnlocked) && <UnlockVaultPrompt />}
      { (vault !== undefined && vault.isUnlocked) && 
        <div className='flex flex-col w-full h-full items-center gap-2'>
          <Navbar search={searchFilter} setSearch={setSearchFilter} />
          <div className='flex w-full h-full overflow-y-auto gap-3 rounded-lg flex-row flex-wrap'>
            {
              vault.entries.map((x, i)=><EntryComponent key={i} entry={x}/>)
            }
          </div>
        </div>
      }
    </div>
  )
}
