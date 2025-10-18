// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import {SearchSettings} from '../components/searchBar';
import EntryComponent from '../components/EntryComponent';
import Image from 'next/image';
import Sidebar from '../components/Sidebar';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const [searchFilter, setSearchFilter] = useState("");
  const [shownEntries, setShownEntires] = useState<Array<Entry>>([]);
  
  
  // for pagination
  const [paginatedEntries, setPaginatedEntries] = useState(shownEntries);
  const [page, setPage] = useState(0);
  // hard coded 100 should be changed to use whatever is listed in the preferences
  // const maxPages = Math.floor(shownEntries.length/100);

  const [searchSettings, setSearchSettings] = useState<SearchSettings>({searchUsername:true, searchNotes:true, searchTitle:true})

  useEffect(()=>{ 
    // 56 is the length of the salt + wrapped VK i.e. 16 bytes for salt and 40 bytes for wrappedVK
    if(vault && vault.kek !== undefined && vault.isUnlocked && vault.fileContents.length > 56){
      vault.vaultLevelDecrypt().then((decryptedVault)=>{
        setVault(decryptedVault);
        setSearchFilter("")
      })
    }
  },[vault?.isUnlocked])

  useEffect(()=>{
    if (vault !== undefined && vault.isUnlocked){
      const sf = searchFilter.toLowerCase();
      setShownEntires(
        ()=>{
          const entries = sf !== "" ?
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
            setPaginatedEntries(entries);
            return entries;
        }
      )
      setPage(0);
    }
  }, [searchFilter, searchSettings, vault?.entries])


  useEffect(()=>{
    setPaginatedEntries(shownEntries.slice(page*100, (page*100)+100))
  }, [page])

  return (
    <div className='flex w-screen h-screen items-center justify-center bg-gradient-to-b from-20% from-base-200 to-base-300 via-80% overflow-hidden'>
    {(vault !== undefined && !vault.isUnlocked) && 
      <UnlockVaultPrompt />
      
    }
    
    {(vault !== undefined && vault.isUnlocked) && 
      <div className='flex w-full h-full gap-3'>
        <Sidebar />
        {/* main section */}
        <div className='flex w-full h-full flex-col gap-3 py-2'>
          <Navbar search={searchFilter} setSearch={setSearchFilter} setSearchSettings={setSearchSettings} searchSettings={searchSettings}  />
          <div className='flex flex-col gap-2  w-full h-full overflow-y-auto px-2'>
            {paginatedEntries.map((entry:Entry, i:number)=><EntryComponent key={i} entry={entry}/>)}
          </div>
        
        </div>
      </div>
    }
    </div>  
  )
}
