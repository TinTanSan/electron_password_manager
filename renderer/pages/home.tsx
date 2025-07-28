// 'use client'
import React, { useEffect, useState } from 'react'
import { createEntry, decryptEntryPass } from '../utils/entryFunctions';

export default function HomePage() {
  const [click, setClick] = useState(false);
  useEffect(()=>{
    
    createEntry('hello', 'test','myPassawoafdhlajdsfhadjlsflajdsfhadlsjs', 'helloUser').then((e)=>{
      console.log(e.password, e.title)
      decryptEntryPass(e).then((x)=>{
        console.log(x)
      })
    })
  },[click])
  return (
    <div className='flex bg-base-200 w-screen h-screen'>
      <button onClick={()=>{setClick(!click)}} className='border-2 bg-base-300 h-10 w-30 rounded-lg'>Click me</button>
    </div>
  )
}
