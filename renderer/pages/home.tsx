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
    <div className='flex w-screen h-screen items-center justify-center bg-base-200 overflow-hidden'>
    {(vault !== undefined && !vault.isUnlocked) && 
      <UnlockVaultPrompt />
      
    }
    
    {(vault !== undefined && vault.isUnlocked) && 
      <div className='flex w-full h-full '>
        <div className={`flex w-fit h-fit transition-all border-2 ${hamburgerOpen?" items-start justify-center ":' items-center justify-start '} duration-700 gap-2 relative`}>
          <div className={`flex flex-col py-5 pt-10 px-2 bg-white ${hamburgerOpen?' h-[99vh] w-[20vw] shadow-lg transition-all duration-500 ease-in':'h-0 w-0 collapse transition-all ease-in duration-500'} top-0`}>
            <div className='flex flex-col w-full h-full bg-base-300' />
            <div className='flex w-full h-12 justify-between'>
              <div className='flex cursor-pointer hover:gap-2 group border-2 border-warning hover:bg-warning h-10 w-fit p-1 rounded-lg'>
                <Image src={"/images/lock.svg"} alt='exit' height={10} width={10} className='flex w-6 h-auto group-hover:saturate-[5] group-hover:brightness-[15%]'/>
                <p className='flex group-hover:visible w-0 group-hover:w-30 group-hover:h-full overflow-hidden group-hover:text-warning-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Lock Vault</p>
              </div>
              <div className='flex cursor-pointer hover:gap-2 group border-2 border-error hover:bg-error h-10 w-fit p-1 rounded-lg'>
                <p className='flex group-hover:visible w-0 group-hover:w-30 group-hover:h-full  overflow-hidden group-hover:text-error-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Close &amp; Exit</p>
                <Image src={"/images/exit.svg"} alt='exit' height={10} width={10} className='flex w-6 h-auto group-hover:saturate-[5] group-hover:brightness-[15%]'/>
              </div>
            </div>
          </div>  
          <Image onClick={()=>{setHamburgerOpen(!hamburgerOpen)}} src={hamburgerOpen?"/images/close_black.svg":"/images/menu.svg"} alt='i' width={10} height={10} className={` z-10 flex transition-all duration-700 ${hamburgerOpen?"w-5 absolute right-3 top-3":"w-6"} h-auto `}/>
        </div>
        <div className='flex flex-col w-full h-full p-2'>
          <div className='flex w-full h-10 bg-white'>

          </div>
        </div>
      </div>
    }
    </div>  
  )
}
