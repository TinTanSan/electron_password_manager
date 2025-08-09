// 'use client'
import React, { useContext, useEffect, useState } from 'react'
import { VaultContext } from '../contexts/vaultContext';
import { useRouter } from 'next/router';
import { BannerContext } from '../contexts/bannerContext';
import UnlockVaultPrompt from '../components/unlockVaultPrompt';


export default function HomePage() {
  const vaultContext = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const naviagte = useRouter();
  
  // whether or not the vault is unlocked, automatically lock after 1 minute of inactivity

  return (
    <div className='flex bg-base-200 w-screen h-screen flex-col justify-center items-center'>
      {(vaultContext.vault !== undefined && !vaultContext.vault.isUnlocked) && <UnlockVaultPrompt />}
      { (vaultContext.vault !== undefined && vaultContext.vault.isUnlocked) && 
        <div>
          Home

        </div>
      }
    </div>
  )
}
