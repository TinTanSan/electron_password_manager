import React, { useContext, useEffect, useState } from 'react'
import { Entry, ExtraField } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import Image from 'next/image';
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';

type props = {
    extraField: ExtraField,
    entry:Entry,
    onDelete: (name:string)=>void 
}

export default function ExtraFieldComponent({extraField, entry, onDelete}:props) {
  const {vault} = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const [data, setData] = useState<undefined | string>(undefined);
  const [showData, setShowData] = useState(false);
  useEffect(()=>{
    setShowData(false)
  },[extraField])

  useEffect(()=>{
    if (!extraField.isProtected){
      setData(extraField.data.toString());
      return;
    }
    if (extraField.isProtected && showData && !data){
        entry.decryptExtraField(extraField.name, vault.kek).then((d)=>{
          if (d.status === "ERROR"){
            addBanner(bannerContext, 'error decrypting extra field data', 'error')
            setData(undefined);
          }else{
            setData(d.data.toString());
          }
        })
    }else if (!showData){
      setData(undefined);
    }
  },[showData])

  const handleDelete = ()=>{
    onDelete(extraField.name);
  }


  return (
    <div className='flex flex-row w-full h-40 shrink-0 border-2 border-base-300 bg-base-100 rounded-lg p-2 gap-2'>
      <div className='flex flex-col w-full h-full gap-2'>
        <div className='flex flex-row border-2 border-base-300 rounded-lg focus-within:border-primary'>
          <div className='flex border-r-2 border-base-300 px-1'>Name</div>
          <input className='flex w-full h-full bg-base-100 px-1 rounded-r-lg outline-none' readOnly value={extraField.name}/>
        </div>
        <div className='flex flex-row w-full h-fit gap-2'>
          <button onClick={()=>{handleDelete()}} className='flex w-1/2 items-center justify-center rounded-lg h-8 bg-error hover:bg-error-darken hover:text-white text-white'>Delete</button>
          {extraField.isProtected && <button onClick={()=>{setShowData(prev=>!prev)}} className={`flex border-2 w-1/2 items-center justify-center rounded-lg h-8 border-neutral ${showData&& "bg-neutral text-neutral-content"}`}>{showData?"Hide" : "Reveal"}</button>}
        </div>
      </div>
      <div className='flex flex-col w-full h-full'>
        <textarea value={(!extraField.isProtected  || showData)?data:"Click reveal to show contents"}  readOnly className='flex p-1 overflow-y-auto border-2 border-base-300 resize-none h-full w-full rounded-lg bg-base-100 text-base-content'/>
      </div>
    </div>
  )
}
