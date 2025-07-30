// 'use client'
import React, { useEffect, useState } from 'react'
import { createEntry, decryptEntryPass } from '../utils/entryFunctions';

export default function HomePage() {
  const handleClick = ()=>{
  }
  return (
    <div className='flex bg-base-200 w-screen h-screen'>
      <button onClick={()=>{handleClick()}} className='border-2 bg-base-300 h-10 w-30 rounded-lg'>Click me</button>
    </div>
  )
}
