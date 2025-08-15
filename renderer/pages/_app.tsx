import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'

import '../styles/globals.css'
import { VaultContext, VaultType } from '../contexts/vaultContext'
import { BannerContext } from '../contexts/bannerContext'
import { BannerDetails } from '../interfaces/Banner'
import Notifications from '../components/notifications'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }: AppProps) {
  const [vault, setVault] = useState<VaultType>()
  const [banners, setBanners] = useState<Array<BannerDetails>>([]);
  const navigate = useRouter();
  useEffect(()=>{
    if(vault === undefined && navigate.pathname !=="/loadFile"){
      
      navigate.push('loadFile')
    }
  }, [vault])
  return (
    <VaultContext.Provider value={{vault, setVault}}>
      <BannerContext.Provider value={{banners, setBanners}}>
        <Notifications />
        <title>{vault? vault.filePath.substring(vault.filePath.lastIndexOf("/")+1, vault.filePath.length-4) + " Vault": "Vault manager"}</title>
        <Component {...pageProps} />
      </BannerContext.Provider>
    </VaultContext.Provider>
  )
}

export default MyApp
