import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'

import '../styles/globals.css'
import { VaultContext } from '../contexts/vaultContext';
import {Vault} from '../interfaces/Vault';
import { BannerContext } from '../contexts/bannerContext'
import { BannerDetails } from '../interfaces/Banner'
import Notifications from '../components/notifications'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }: AppProps) {
  const [vault, setVault] = useState<Vault |undefined>(undefined);
  const [banners, setBanners] = useState<Array<BannerDetails>>([]);
  const navigate = useRouter();
  useEffect(()=>{
    if(vault === undefined && navigate.pathname !=="/loadFile"){
      navigate.push('loadFile')
    }
    let timeout:NodeJS.Timeout;
    if (vault !== undefined && vault.isUnlocked){
      // timeout = setTimeout(() => {
      //   setVault(prev=>({...prev, isUnlocked:false}));
      // }, 30000);
    }
    return ()=>{
      if(timeout !== undefined){
        clearTimeout(timeout)  
      }}
  }, [vault])


  useEffect(()=>{
    window.ipc.vaultOpen(()=>{
      if (!vault) return;
      console.log('v was: ',vault)
      if (vault){
        vault.vaultLevelEncrypt().then((response)=>{
        if (vault.fileContents === response){
          console.log('eq')
          console.log("set vault ")
          setVault(undefined);
        }else{
          console.log("hello")
          vault.writeEntriesToFile().then((response)=>{
            if (response.status === "OK"){
              setVault(undefined);
            }else{
              console.error("Couldn't write entries to file, "+ response.content);
            }
          })
        }
      })
      }
    })
  },[])



  return (
    <VaultContext.Provider value={{vault, setVault}}>
      <BannerContext.Provider value={{banners, setBanners}}>
        <Notifications />
        <Component {...pageProps} />
      </BannerContext.Provider>
    </VaultContext.Provider>
  )
}

export default MyApp
