import React, { FormEvent, useContext, useState } from 'react'
import FancyInput from './fancyInput';
import { VaultContext } from '../contexts/vaultContext';
import { useRouter } from 'next/router';
import { addBanner } from '../interfaces/Banner';
import { BannerContext } from '../contexts/bannerContext';
import { isStrongPassword } from '../utils/commons';
import { makeNewKEK, validateKEK } from '../utils/keyFunctions';
import { commitKEK } from '../utils/vaultFunctions';
// this component will handle the initial create of the vault KEK and subsequent unlocks
export default function UnlockVaultPrompt() {
    const vaultContext = useContext(VaultContext);
    const bannerContext = useContext(BannerContext);
    const navigate = useRouter();
    // the password will only be required at this time
    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");
    // 2 cases when we would want to show the initialisation prompt, 1. acutal initialisation of the vault, 2. Master password changes
    // by default we want to check initial requirement, if this is false then we can run a extra function
  
    const initialiseRequired= vaultContext.vault.fileContents==="";
    console.log(vaultContext.vault.fileContents);
    const handleEnter = (e:FormEvent)=>{
      e.preventDefault();
      if (initialiseRequired){
        if (password === ""){
          addBanner(bannerContext, "Password cannot be empty", "warning")
          return;
        }
        if (password === confirmPassword){
          const passMessage = isStrongPassword(password)
          if(passMessage.length === 0){
              makeNewKEK(password).then((x:KEKParts)=>{
                vaultContext.setVault(prev=>({...prev, kek:x}));
                
                commitKEK(vaultContext.vault.filePath, vaultContext.vault.fileContents, x);
                addBanner(bannerContext, "Vault unlocked", 'success')
                // set vault to be unlocked
                vaultContext.setVault(prev=>({...prev, isUnlocked:true}));
                
              });
          }else{
            // give the user a warning about unsafe master pass
            addBanner(bannerContext,passMessage, 'warning' )
          }
        }else{
          addBanner(bannerContext, "The two password fields were not the same", 'error')
        }
      }else{
        // simple unlock
        if(password !==""){
          validateKEK(vaultContext.vault.fileContents, password).then((response)=>{
            if (response === undefined){
              addBanner(bannerContext, "Incorrect password", 'error')
            }else{
              vaultContext.setVault(prev=>({...prev, kek:response, isUnlocked:true}))
            }
          })
        }else{
          addBanner(bannerContext, "Password cannot be empty", "warning")
        }

      }
      
    }
  
    // when we initialise the vault at either time, we want to use a sanity checker value, which we can encrypt and decrpyt to verify
    // the password's legitimacy

    return (
    <div className='flex flex-col bg-base-100 text-base-content w-1/2 h-2/3 rounded-xl p-5 shadow-lg border-base-300 border-2 gap-5 items-center'>
        <div className='flex justify-center w-full text-3xl font-bold'>{initialiseRequired?"Set up Vault":"Unlock Vault"}</div>
        
        <form onSubmit={handleEnter} className='flex flex-col h-full w-full justify-center items-center py-5'>
          {initialiseRequired && 
            <div className='flex flex-nowrap text-sm w-[80%] h-fit items-center justify-center gap-2'>
              <div className='flex w-4 h-4 rounded-full border-[1px] justify-center items-center'>i</div>
              <div className='flex w-fit flex-wrap'>
                {initialiseRequired?"Please create a master password, this will be used to enter the vault. If you lose this password or forget it, you will not be able to enter the vault ever. But also do not use an easy to guess password or a password with only a few characters.":
                "Enter your password"}
              </div>
            </div>
          }
          <div className='flex flex-col h-full justify-center items-center w-[80%] gap-5'>
            <FancyInput placeHolder='Enter your password' type='password'  value={password} setValue={setPassword}/>
            {initialiseRequired && <FancyInput placeHolder='Confirm password' type='password'  value={confirmPassword} setValue={setConfirmPassword}/>}
          </div>
          <div className='flex w-full h-fit gap-5 justify-center  text-lg'>
            <button type='button' onClick={()=>{vaultContext.setVault(undefined); navigate.push('/loadFile'); addBanner(bannerContext, "Vault Closed successfully", 'info')}} className='flex bg-secondary text-secondary-content w-28 justify-center items-center h-10 rounded-lg hover:bg-secondary-darken'>Cancel</button>
            <button type='submit' className='flex bg-primary text-primary-content w-28 justify-center items-center h-10 rounded-lg hover:bg-primary-darken'>Unlock</button>
          </div>
        </form> 
      </div>
  )
}
