import React, { useContext } from 'react'
import { VaultContext } from '../contexts/vaultContext'
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';

export default function Navbar() {
    const vaultContext = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);

    const handleClose = ()=>{
        addBanner(bannerContext, "Vault Closed successfully", 'info')
        vaultContext.setVault(undefined);
    }

    const handleLock = ()=>{
        addBanner(bannerContext, "Vault locked successfully", 'info')
        vaultContext.setVault(prev=>({...prev, isUnlocked:false}));
    }


    return (
        <div className='flex w-full h-10 flex-row items-center justify-between px-2 shadow-lg bg-base-100 border-2 border-base-300 rounded-lg'>
            <button className='flex bg-primary hover:bg-primary-darken text-primary-content w-24 h-8 justify-center items-center rounded-lg'>New</button>
            <div className='flex w-fit gap-2 ' >
                <button onClick={handleLock} className='flex bg-accent hover:bg-accent-darken text-accent-content w-24 justify-center items-center rounded-lg h-8' title='locking will send you back to the unlock page'>Lock</button>
                <button onClick={handleClose} className='flex bg-primary hover:bg-primary-darken text-primary-content w-24 justify-center items-center rounded-lg h-8'  title='closing will allow you to open anohter vault'>Close Vault</button>
            </div>
        </div>
  )
}
