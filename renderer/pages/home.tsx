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
  
  // for pagination
  const [paginatedEntries, setPaginatedEntries] = useState([]);
  const [page, setPage] = useState(0);
  // total number of entries
  const [numEntries, setNumEntries]= useState(0);
  
  // singleton vairable for entriesPerPage which will eventually be supplied by the preferences context/ hook
  const entriesPerPage = 100;  
  const maxPages = Math.ceil(numEntries/entriesPerPage);

  const [searchSettings, setSearchSettings] = useState<SearchSettings>({searchUsername:true, searchNotes:true, searchTitle:true})


  useEffect(()=>{
    window.vaultIPC.getNumEntries().then((x)=>{setNumEntries(x)})
  },[])

  useEffect(()=>{
    if(!searchFilter){
      window.vaultIPC.getPaginatedEntries(0).then((response)=>{
        setPaginatedEntries(response);
      })
    }else{
      const title = searchSettings.searchTitle? searchFilter : "";
      const username = searchSettings.searchUsername? searchFilter : "";
      const notes = searchSettings.searchNotes? searchFilter : "";
      window.vaultIPC.searchEntries(title,username, notes).then((response)=>{
        setPaginatedEntries(response);
      })
    }
      
  }, [searchFilter, searchSettings, vault?.entries])


  useEffect(()=>{
    window.vaultIPC.getPaginatedEntries(page).then((response)=>{
      setPaginatedEntries(response);
    })
  }, [page])

  return (
    <div className='flex w-screen h-screen items-center justify-center bg-linear-to-b from-20% from-base-200 to-base-300 via-80% overflow-hidden'>
      <title>{vault? vault.filePath.substring(vault.filePath.lastIndexOf("/")+1, vault.filePath.length-4) + " Vault": "Vault manager"}</title>
    {(vault !== undefined && !vault.isUnlocked) && 
      <UnlockVaultPrompt />
      
    }
    
    {(vault !== undefined && vault.isUnlocked) && 
      <div className='flex w-full h-full gap-3'>
        <Sidebar />
        {/* main section */}
        <div className='flex w-full h-full flex-col gap-3 py-2'>
          <Navbar search={searchFilter} setSearch={setSearchFilter} setSearchSettings={setSearchSettings} searchSettings={searchSettings}  />
          <div className='flex flex-col gap-2 w-full h-full overflow-y-auto p-2 px-3'>
            {paginatedEntries.map((entry:Entry, i:number)=><EntryComponent key={i} entry={entry}/>)}
          </div>
        
          {/* bottom pages bar  */}
          <div className='flex relative w-full h-10 shrink-0 px-3 mb-2 justify-center items-center text-base-content'>
            {maxPages > 1 && 
              <div className='flex w-1/2 bg-base-100 h-full rounded-lg items-center  shadow-xl border-2 border-base-300'>
              <button className='flex'>
                <Image src={"/images/up_arrow.svg"} alt='<' width={25} height={30} className='flex rotate-270'/>
                <p>Previous</p>
              </button>
            </div>}
            <p className='flex w-fit right-3  absolute'>
              showing entries {(entriesPerPage*page)} - {Math.min(((entriesPerPage*page) + entriesPerPage), paginatedEntries.length)} of {numEntries}
            </p>

          </div>
        
        </div>
      </div>
    }
    </div>  
  )
}
