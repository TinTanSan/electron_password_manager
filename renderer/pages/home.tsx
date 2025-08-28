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
  const [searchFilter, setSearchFilter] = useState("");
  const [shownEntries, setShownEntires] = useState<Array<Entry>>([]);
  // for pagination
  const [page, setPage] = useState(0);
  
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({searchUsername:true, searchNotes:true, searchTitle:true})

  useEffect(()=>{
    // 56 is the length of the salt + wrapped VK i.e. 16 bytes for salt and 40 bytes for wrappedVK
    if(vault !== undefined && vault.kek !== undefined && vault.isUnlocked && vault.fileContents.length > 56){
      vaultLevelDecrypt(vault.fileContents, vault.kek).then((decryptedEntries)=>{
        setVault(prev=>({...prev, entries:decryptedEntries}));
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
          [...vault.entries, ...new Array<Entry>(1000).fill(new Entry({title:'test', password:Buffer.from('hello'), username:'testuser', notes:'hello'}, vault.kek))]
      )
      setPage(0);
    }
  }, [searchFilter, searchSettings, vault?.entries])


  useEffect(()=>{
    setShownEntires(prev=>prev.slice(page*100, (page*100)+100))
  }, [page])

  return (
    <div className='flex w-screen h-screen items-center justify-center bg-base-200'>
    {(vault !== undefined && !vault.isUnlocked) && <UnlockVaultPrompt />}
    
    {(vault !== undefined && vault.isUnlocked) && 
    <div className='flex flex-col w-full h-screen items-center p-2 overflow-y-hidden'>
      <div className="w-screen h-screen flex flex-col p-2 overflow-y-hidden gap-4">
        <Navbar search={searchFilter} setSearch={setSearchFilter} searchSettings={searchSettings} setSearchSettings={setSearchSettings} />
        <div className='flex flex-col w-full h-full text-base-content bg-base-100 rounded-xl border-2 border-base-300 overflow-y-hidden p-2 gap-2'>
          <div className='flex w-full h-10 gap-2'>
            <div className='flex w-full h-full items-center justify-center border-2 rounded-lg border-base-300 '>Title</div>
            <div className='flex w-full h-full items-center justify-center border-2 rounded-lg border-base-300 '>username</div>
            <div className='flex w-full h-full items-center justify-center border-2 rounded-lg border-base-300 '>Password</div>
            <div className='flex w-full h-full items-center justify-center border-2 rounded-lg border-base-300 '>Notes</div>

          </div>
          
          <div className='flex flex-col w-full h-full overflow-y-auto gap-2'>
            <div className='flex flex-col w-full h-fit gap-2'>
              {shownEntries.map((entry, i)=>
                <EntryComponent entry={entry} key={i}/>
              )}
              
            </div>
          </div>
        </div>

      </div>
    </div>}
    </div>  
  )
}
