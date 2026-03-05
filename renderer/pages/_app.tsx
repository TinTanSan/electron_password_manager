import React, { useEffect, useRef, useState } from 'react'
import type { AppProps } from 'next/app'

import '../styles/globals.css'
import { defaultVaultState, VaultContext } from '../contexts/vaultContext';
import {Vault} from '../interfaces/Vault';
import { BannerContext } from '../contexts/bannerContext'
import { addBanner, BannerDetails } from '../interfaces/Banner'
import Notifications from '../components/notifications'
import { useRouter } from 'next/router'
import { PreferenceContext, preferenceDefaults, PreferenceType } from '@contexts/preferencesContext';

function MyApp({ Component, pageProps }: AppProps) {
  const [vault, setVault] = useState<Vault>({...defaultVaultState});
  const [preference, setPreference] = useState<PreferenceType> ({...preferenceDefaults});
  const [banners, setBanners] = useState<Array<BannerDetails>>([]);
  const navigate = useRouter();
  const activityTimeOut = useRef(null);

  const resetTimeout =()=>{
    if (activityTimeOut.current){
      clearTimeout(activityTimeOut.current);
    }
    console.log('timeout setagain')
    activityTimeOut.current = setTimeout(() => {
      setVault({...defaultVaultState})
      navigate.push('/loadFile')
      console.log('vault locked due to timeout')
    }, 100);
  }

  const handleActivity =()=>{
    if (!vault.isUnlocked) return;
    resetTimeout();
  }

  
  useEffect(()=>{
    // ensure that even if the user only logs in, if they go inactive, then we don't want the vault to stay unlocked
    if (vault && vault.isUnlocked){ 
      handleActivity()
    }
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      if (activityTimeOut.current) {
        clearTimeout(activityTimeOut.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };

  },[vault])


  useEffect(()=>{
    window.vaultIPC.mainCloseVault(()=>{
      if (vault && vault.filePath){
        setVault(defaultVaultState);
        navigate.push("/loadFile");
        console.log(vault);
        return;
      }
      if (!vault){
        window.close();
        return;
      }else if (!vault.filePath){
        window.close();
        return;
      }
    })
  }, [])

  useEffect(()=>{
    if(vault.filePath!==""){
      window.preferenceIPC.getAllPreferences().then((response)=>{
        console.log('preferences set', response.response)
        setPreference(response.response);
      })
    }
  },[])


  return (
    <VaultContext.Provider value={{vault, setVault}}>
      <PreferenceContext.Provider value={{preference, setPreference}}>
        <BannerContext.Provider value={{banners, setBanners}}>
          <Notifications />
          <Component {...pageProps}/>
        </BannerContext.Provider>
      </PreferenceContext.Provider>
    </VaultContext.Provider>
  )
}

export default MyApp
