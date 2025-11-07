import React, { useContext, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import FancyInput from './fancyInput';
import NewEntryForm from './NewEntryForm';
import SearchBar, { SearchSettings } from './searchBar';
import { Vault } from '../interfaces/Vault';

type props = {
    search:string,
    setSearch: React.Dispatch<React.SetStateAction<string>>,
    searchSettings: SearchSettings,
    setSearchSettings:React.Dispatch<React.SetStateAction<SearchSettings>>
}

export default function Navbar({search, setSearch, searchSettings, setSearchSettings}:props) {
    const {vault,setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [showEntryForm, setShowEntryForm] = useState(false)


    return (
        <div className='flex flex-row w-full h-12 items-center justify-between p-1 px-3 gap-5'>
            {showEntryForm && <NewEntryForm setShowForm={setShowEntryForm}/>}
            <SearchBar value={search} setValue={setSearch} settings={searchSettings} setSearchSettings={setSearchSettings}/>
            <button onClick={()=>{setShowEntryForm(true)}} className='flex bg-neutral hover:bg-neutral-darken text-neutral-content sm:w-30 md:w-48 shrink h-full justify-center items-center rounded-md text-nowrap'>+ New Entry</button>
        </div>
  )
}
