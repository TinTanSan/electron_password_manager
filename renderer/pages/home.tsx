// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import {SearchSettings} from '../components/searchBar';
import EntryComponent from '../components/EntryComponent';
import Image from 'next/image';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const [searchFilter, setSearchFilter] = useState("");
  const [shownEntries, setShownEntires] = useState<Array<Entry>>([]);
  
  
  // for pagination
  const [paginatedEntries, setPaginatedEntries] = useState(shownEntries);
  const [page, setPage] = useState(0);
  // hard coded 100 should be changed to use whatever is listed in the preferences
  const maxPages = Math.floor(shownEntries.length/100);

  const [hamburgerOpen, setHamburgerOpen] = useState(false);
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
            // [...vault.entries, ...Array.from({length: 1000}, (_,i)=>new Entry({title:'test_'+i, password:Buffer.from('hello'), username:'testuser', notes:'hello'}, vault.kek))]
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
    <div className='flex w-screen h-screen items-center justify-center bg-gradient-to-b from-base-200 to-base-300 via-80% overflow-hidden'>
    {(vault !== undefined && !vault.isUnlocked) && 
      <UnlockVaultPrompt />
      
    }
    
    {(vault !== undefined && vault.isUnlocked) && 
      <div className='flex w-full h-full gap-3 '>
        {/* sidebar */}
        <div className={`flex flex-col relative justify-center shadow-lg ${hamburgerOpen?'xs:w-1/2 sm:w-1/3 items-end':'w-14 items-center'} h-full transition-all duration-[400ms] bg-base-100 p-2`}>
          <div className={`flex ${hamburgerOpen?'w-full':"w-8"} h-10 transition-all duration-[750ms] justify-end`}>
            <Image onClick={()=>{setHamburgerOpen(prev=>!prev)}} src={hamburgerOpen?"/images/close_black.svg":'/images/menu.svg'} alt='menu' width={0} height={0} className={`flex ${hamburgerOpen?'w-6':'w-8'} h-auto shrink-0 `} />
          </div>
          <div className='flex flex-col  w-full h-full'>
            {
              hamburgerOpen? 
              <div className='flex flex-col gap-5 w-full h-full'>
                <div className='flex flex-col gap-5 w-full h-1/4 shrink-0 text-base-content'>
                  <div className='flex flex-col gap-2 w-full h-fit text-lg'>
                    <h1 className='flex w-full text-xl'>Entries</h1>  
                    <div className='flex flex-col gap-2 w-full h-fit pl-5'>
                      <h3 className='flex w-fit border-2'>All Entries</h3> 
                      {/* 26.4k */}
                      <h3 className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>Starred</h3>
                      <h3 className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>Groups</h3>
                      <h3 className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>Expiring Passwords</h3>
                    </div>
                  </div>
                </div>
                <hr className='flex w-full text-xl text-base-300' />
                <div className='flex flex-col gap-5 w-full  h-1/5 shrink-0 text-base-content'>
                  <h1 className='flex w-full text-xl'>Settings</h1>  
                  <div className='flex flex-col gap-2 w-full h-fit text-lg pl-5'>
                    <h3>Vault Settings</h3>
                    <h3>Entry Settings</h3>
                  </div>
                </div>
                <hr className='flex w-full text-xl text-base-300' />
                <div className='flex flex-col gap-5 w-full text-xl h-1/5 shrink-0 text-base-content'>
                  <h1>Preferences</h1>
                </div>
                <div className='flex w-full h-full items-end'>
                  <div className='flex w-full h-10 justify-between'>
                    <div className='flex w-fit h-fit p-0.5 items-center hover:bg-warning border-3 border-warning rounded-lg group'>
                      <Image onClick={()=>{}} src={"/images/lock.svg"} alt='lock' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                      <p className='flex group-hover:visible w-0 group-hover:w-28  h-full overflow-hidden group-hover:text-warning-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Lock Vault</p>
                    </div>
                    <div className='flex w-fit items-center h-fit p-0.5 border-3 border-error hover:bg-error rounded-lg group'>
                      <p className='flex group-hover:items-center group-hover:visible w-0 h-full group-hover:w-28 overflow-hidden group-hover:text-warning-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Close & exit</p>
                      <Image src={"/images/exit.svg"} alt='exit' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                    </div>
                  </div>
                </div>  


              </div>
              :
              <div className='flex flex-col-reverse w-full h-full items-center py-5 gap-5 relative'>
                <div className='flex w-fit h-fit p-0.5 border-3 border-warning rounded-lg group hover:bg-warning'>
                  <span className='group-hover:visible invisible absolute left-11 bg-white border-[0.5px] border-neutral text-warning-content rounded-sm px-2 w-fit text-nowrap'>lock vault</span>
                  <Image onClick={()=>{}} src={"/images/lock.svg"} alt='lock' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                </div>
                <div className='flex w-fit h-fit p-0.5 border-3 border-error rounded-lg group hover:bg-error'>
                  <span className='group-hover:visible invisible absolute left-11 bg-white border-[0.5px] border-neutral text-warning-content rounded-sm px-2 w-fit text-nowrap'>close & exit vault</span>
                  <Image src={"/images/exit.svg"} alt='exit' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                </div>
              </div>
            }
          </div> 

        </div>
        {/* main section */}
        <div className='flex w-full h-full flex-col gap-3'>

        </div>
      </div>
    }
    </div>  
  )
}
