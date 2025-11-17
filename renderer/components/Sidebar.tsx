import React, { useContext, useState } from 'react'
import Image from 'next/image';
import { VaultContext } from '../contexts/vaultContext';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';
import { Vault } from '../interfaces/Vault';
import Link from 'next/link';
export default function Sidebar() {
    const [hamburgerOpen, setHamburgerOpen] = useState(false);
    const bannerContext = useContext(BannerContext);
    const {vault, setVault} = useContext(VaultContext);
    const handleLock = ()=>{
        window.ipc.clearClipboard();
        window.ipc.openFile(vault.filePath).then((content)=>{
            setVault(prev=>(new Vault({...prev, fileContents:content.fileContents, isUnlocked:false})))
            bannerContext.setBanners([]);
            addBanner(bannerContext, 'Vault locked', 'info');
        })
        console.log('done')
    }
    const handleClose = ()=>{
        bannerContext.setBanners([])
        addBanner(bannerContext, "Vault Closed successfully", 'info')
        setVault(undefined);
    }
    return (
        <div className={`flex flex-col relative justify-center shadow-[0.5rem_0_1.25rem_rgba(0,0,0,0.1)] ${hamburgerOpen?'xs:w-1/2 sm:w-1/4 items-end':'w-14 items-center'} h-full transition-all duration-[400ms] bg-base-100 p-2`}>
            <div className={`flex ${hamburgerOpen?'w-full':"w-8"} h-10 transition-all duration-[750ms] justify-end`}>
                <Image onClick={()=>{setHamburgerOpen(prev=>!prev)}} src={hamburgerOpen?"/images/close_black.svg":'/images/menu.svg'} alt='menu' width={0} height={0} className={`flex ${hamburgerOpen?'w-6':'w-8'} h-auto shrink-0 `} />
            </div>

            <div className='flex flex-col  w-full h-full [&_a]:hover:text-primary [&_a]:cursor-pointer'>{hamburgerOpen? 
                <div className='flex flex-col gap-5 w-full h-full   '>
                    <div className='flex flex-col gap-5 w-full h-1/4 shrink-0 text-base-content'>
                        <div className='flex flex-col gap-2 w-full h-fit text-lg '>
                            <h1 className='flex w-full text-xl'>Entries</h1>  
                            <div className='flex flex-col gap-2 w-full h-fit pl-5'>
                            <Link href={"/home"} className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>All Entries</Link> 
                            <h3 className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>Starred</h3>
                            <Link href={"/groups"} className='flex w-fit text-nowrap overflow-ellipsis overflow-hidden max-w-full'>Groups</Link>
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
                            <h3>Preferences</h3>
                        </div>
                    </div>
                    
                    <hr className='flex w-full text-xl text-base-300' />
                    
                    <div className='flex flex-col gap-5 w-full  h-1/5 shrink-0 text-base-content'>
                        <h1 className='flex w-full text-xl'>Help</h1>  
                        <div className='flex flex-col gap-2 w-full h-fit text-lg pl-5'>
                            <h3>Keybinds & shortcuts</h3>
                            <h3>Helpful documentation</h3>
                            <h3>How does this password manager work?</h3>
                            
                        </div>
                    </div>
                    
                    <div className='flex w-full h-full items-end'>
                        <div className='flex w-full h-10 justify-between'>
                            <div onClick={handleLock} className='flex w-fit h-fit p-0.5 items-center hover:bg-warning border-3 border-warning rounded-lg group'>
                                <Image  src={"/images/lock.svg"} alt='lock' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                                <p className='flex group-hover:visible w-0 group-hover:w-28  h-full overflow-hidden group-hover:text-warning-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Lock Vault</p>
                            </div>
                            
                            <div onClick={handleClose} className='flex w-fit items-center h-fit p-0.5 border-3 border-error hover:bg-error rounded-lg group'>
                                <p className='flex group-hover:items-center group-hover:visible w-0 h-full group-hover:w-28 overflow-hidden group-hover:text-warning-content text-lg font-[500] justify-center items-center text-nowrap transition-all duration-500'>Close & exit</p>
                                <Image  src={"/images/exit.svg"} alt='exit' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                            </div>
                        </div>
                    </div>  
                </div>
                :
                <div className='flex flex-col justify-end w-full h-full items-center py-2 gap-5 relative'>
                    <div onClick={handleLock} className='flex w-fit h-fit p-0.5 border-3 border-warning rounded-lg group hover:bg-warning'>
                        <span className='group-hover:visible invisible absolute left-11 bg-white border-[0.5px] border-neutral text-warning-content rounded-sm px-2 w-fit text-nowrap'>lock vault</span>
                        <Image onClick={()=>{}} src={"/images/lock.svg"} alt='lock' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                    </div>
                    <div onClick={handleClose}  className='flex w-fit h-fit p-0.5 border-3 border-error rounded-lg group hover:bg-error'>
                        <span className='group-hover:visible invisible absolute left-11 bg-white border-[0.5px] border-neutral text-warning-content rounded-sm px-2 w-fit text-nowrap'>close & exit vault</span>
                        <Image  src={"/images/exit.svg"} alt='exit' width={0} height={0} className='flex w-8 h-8 group-hover:saturate-[5] group-hover:brightness-[15%]' />
                    </div>
                </div>
            }</div> 

        </div>
    )
}
