// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';
import Navbar from '../components/Navbar';
import { Entry } from '../interfaces/Entry';
import {SearchSettings} from '../components/searchBar';
import { vaultLevelDecrypt} from '../utils/vaultFunctions';
import EntryComponent from '../components/EntryComponent';


export default function HomePage() {
  const {vault, setVault} = useContext(VaultContext);
  const [searchFilter, setSearchFilter] = useState("");
  const [shownEntries, setShownEntires] = useState<Array<Entry>>([]);
  
  
  // for pagination
  const [paginatedEntries, setPaginatedEntries] = useState(shownEntries);
  const [page, setPage] = useState(0);
  // hard coded 100 should be changed to use whatever is listed in the preferences
  const maxPages = Math.floor(shownEntries.length/100);


  const [searchSettings, setSearchSettings] = useState<SearchSettings>({searchUsername:true, searchNotes:true, searchTitle:true})

  useEffect(()=>{
    // 56 is the length of the salt + wrapped VK i.e. 16 bytes for salt and 40 bytes for wrappedVK
    if(vault !== undefined && vault.kek !== undefined && vault.isUnlocked && vault.fileContents.length > 56){
      vaultLevelDecrypt(vault.fileContents, vault.kek).then((decryptedEntries)=>{
        setVault(prev=>({...prev, entries:decryptedEntries}));
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
    console.log('pages set')
    setPaginatedEntries(shownEntries.slice(page*100, (page*100)+100))
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
            <div className='flex w-full max-w-80 h-full' />
          </div>
          
          <div className='flex flex-col w-full h-full overflow-y-auto gap-2'>
            <div className='flex flex-col w-full h-fit gap-2'>
              {paginatedEntries.map((entry, i)=>
                <EntryComponent entry={entry} key={i}/>
              )}
              
            </div>
          </div>
          <div className='flex flex-row w-full h-10 p-2 items-center justify-center border-2 border-base-300 rounded-lg gap-2'>
              {/* show previous button if the current page isn't the first page */}
              <div className='flex w-24 h-8'>
               <button onClick={()=>{setPage(prev=>prev-1)}} className={`flex w-full items-center justify-center border-2 border-neutral rounded-lg h-8 hover:bg-neutral hover:text-neutral-content ${page == 0 && 'invisible'}`}>Previous</button>
              </div>
              {/*  */}
              <div className='flex w-28 gap-2 h-8 justify-end'>
                {
                  Array.from({length: Math.min(3, page-0)}, (_, i)=> page+i).map((x,i)=>
                  <button key={i} onClick={()=>{setPage(x)}} className='flex rounded-lg w-8 h-8 items-center border-2 border-neutral hover:bg-neutral hover:text-neutral-content justify-center'>
                    {x}
                  </button>)
                }
              </div>
              <div className='flex bg-neutral rounded-lg w-8 h-8 items-center text-neutral-content justify-center'>{page+1}</div>
              <div className='flex w-28 gap-2 h-8 justify-start'>
              {
                Array.from({length: Math.min(3, maxPages-page)}, (_, i)=> page+1+i).map((x,i)=>
                <button key={i} onClick={()=>{setPage(x)}} className='flex rounded-lg w-8 h-8 items-center border-2 border-neutral hover:bg-neutral hover:text-neutral-content justify-center'>
                  {x+1}
                </button>)
              }
              </div>
              {
                page < maxPages && <button onClick={()=>{setPage(prev=>prev+1)}} className='flex w-24 items-center justify-center border-2 border-neutral rounded-lg h-8 hover:bg-neutral hover:text-neutral-content'>Next</button>
              }
          </div>
        </div>

      </div>
    </div>}
    </div>  
  )
}
