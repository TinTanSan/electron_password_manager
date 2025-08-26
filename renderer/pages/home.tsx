// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { useRouter } from 'next/router';
import { BannerContext } from '../contexts/bannerContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import {SearchSettings} from '../components/searchBar';
import { vaultLevelDecrypt, vaultLevelEncrypt, writeEntriesToFile } from '../utils/vaultFunctions';
import { addBanner } from '../interfaces/Banner';
import EntryComponent from '../components/EntryComponent';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const [shownEntries, setShownEntires] = useState<Array<Entry>>([]);

  const [searchFilter, setSearchFilter] = useState("");
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({searchUsername:true, searchNotes:true, searchTitle:true})

  useEffect(()=>{
    // 56 is the length of the salt + wrapped VK i.e. 16 bytes for salt and 40 bytes for wrappedVK
    if(vault !== undefined && vault.kek !== undefined && vault.isUnlocked && vault.fileContents.length > 56){
      vaultLevelDecrypt(vault.fileContents, vault.kek).then((decryptedEntries)=>{
        setVault(prev=>({...prev, entries:decryptedEntries}));
        setShownEntires(decryptedEntries)
      })
    }
  },[vault?.isUnlocked])

  useEffect(()=>{
    if (vault !== undefined && vault.isUnlocked){
      const sf = searchFilter.toLowerCase();
      setShownEntires(
        sf !== "" ?
        vault.entries.filter((x)=>{
          if (searchSettings.searchTitle && x.title.toLowerCase().includes(sf)){
            return true
          }
          if (searchSettings.searchUsername && x.username.toLowerCase().includes(sf)){
            return true;
          }
          if (searchSettings.searchNotes &&  x.notes.toLowerCase().includes(sf)){
            return true;
          }
          return false;
        })
        :
        vault.entries
      )
    }
  }, [searchFilter, searchSettings, vault?.entries])

  return (
    <div className='flex bg-base-200 w-screen h-screen flex-col justify-center items-center p-2 relative'>
      {(vault !== undefined && !vault.isUnlocked) && <UnlockVaultPrompt />}
      { (vault !== undefined && vault.isUnlocked) && 
        <div className='flex flex-col w-full h-full items-center gap-2'>
          <Navbar search={searchFilter} setSearch={setSearchFilter} searchSettings={searchSettings} setSearchSettings={setSearchSettings} />
          <div className='flex flex-col w-full h-full border-2 bg-base-100 p-2 gap-2'>
            <div className='flex w-full h-10 gap-2'>
              <div className='flex basis-1/4 border-2 items-center justify-center rounded-lg bg-base-200 border-base-300'>Title</div>
              <div className='flex basis-1/4 border-2 items-center justify-center rounded-lg bg-base-200 border-base-300'>Username</div>
              <div className='flex basis-1/4 border-2 items-center justify-center rounded-lg bg-base-200 border-base-300'>Password</div>
              <div className='flex basis-1/4 border-2 items-center justify-center rounded-lg bg-base-200 border-base-300'>Notes</div>
            </div>
            <div className='flex flex-col w-full h-full border-2 rounded-lg overflow-y-hidden gap-2'>
              <div className='flex flex-col w-full h-full overflow-y-auto'>
                <div className="flex h-fit w-full flex-col gap-2">
                <div className="h-40 bg-zinc-200" />
                <div className="h-40 bg-zinc-200" />
                <div className="h-40 bg-zinc-200" />
                <div className="h-40 bg-zinc-200" />
                <div className="h-40 bg-zinc-200" />
                </div>

              </div>
            </div>

          </div>
          
          {/* <div className='flex w-full h-full overflow-y-auto  rounded-lg flex-col gap-3'>
            {
              shownEntries.map((x, i)=><EntryComponent key={i} entry={x} />)
            }
          </div> */}
        </div>
      }
    </div>
  )
}
