import React, { useContext, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import FancyInput from './fancyInput';
import NewEntryForm from './NewEntryForm';

type props = {
    search:string,
    setSearch: React.Dispatch<React.SetStateAction<string>>
}

export default function Navbar({search, setSearch}:props) {
    const {vault,setVault} = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const [showEntryForm, setShowEntryForm] = useState(false)


    const handleClose = ()=>{
        addBanner(bannerContext, "Vault Closed successfully", 'info')
        setVault(undefined);
    }

    const handleLock = ()=>{
        window.ipc.openFile(vault.filePath).then((content)=>{
            setVault(prev=>({...prev, fileContents:content.fileContents, isUnlocked:false}))
        })
    }


    return (
        <div className='flex w-full h-12 relative flex-row items-center justify-between px-1 shadow-lg bg-base-100 border-2 border-base-300 rounded-xl'>
            {showEntryForm && <NewEntryForm setShowForm={setShowEntryForm}/>}
            <button onClick={()=>{setShowEntryForm(true)}} className='flex bg-primary hover:bg-primary-darken text-primary-content w-32 shrink-0 h-8 justify-center items-center rounded-lg text-nowrap'>New Entry</button>
            <div className='flex justify-center w-full px-5 text-xl shrink grow'>
                <FancyInput value={search} setValue={setSearch} placeHolder='search for an entry' type='text'  />
            </div>
            <div className='flex w-fit gap-2 ' >
                <button onClick={handleLock} className='flex bg-accent hover:bg-accent-darken shrink-0 text-accent-content w-24 justify-center items-center rounded-lg h-8' title='locking will send you back to the unlock page'>Lock</button>
                <button onClick={handleClose} className='flex bg-primary hover:bg-primary-darken shrink-0 text-primary-content w-24 justify-center items-center rounded-lg h-8'  title='closing will allow you to open anohter vault'>Close Vault</button>
            </div>
        </div>
  )
}
