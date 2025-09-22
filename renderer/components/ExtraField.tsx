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




  return (
    <div className='flex flex-row w-full h-40 shrink-0 border-2 border-base-300 bg-base-200 rounded-lg p-2 gap-2'>
      <div className='flex flex-col w-full h-full gap-2'>
        <div className='flex flex-row border-2 border-base-300 rounded-lg focus-within:border-primary'>
          <div className='flex border-r-2 border-base-300 px-1'>Name</div>
          <input className='flex w-full h-full bg-base-100 px-1 rounded-r-lg outline-none' readOnly value={extraField.name}/>
        </div>
        <div className='flex flex-row w-full h-fit '>
          {extraField.isProtected && <button onClick={()=>{setShowData(prev=>!prev)}} className={`flex border-2 w-1/2 items-center justify-center rounded-lg h-8 border-neutral ${showData&& "bg-base-100"}`}>Reveal</button>}
        </div>

      </div>

      <div className='flex flex-col w-full h-full'>
        <textarea value={(!extraField.isProtected  || showData)?data:"Click reveal to show contents"}  readOnly className='flex p-1 overflow-y-auto border-2 border-base-300 resize-none h-full w-full'/>
      </div>


    </div>
    // <div className='flex flex-row w-full text-md items-center gap-2'>
    //   <div className='flex flex-row w-full gap-2 border-2 rounded-lg border-base-300 px-2 h-10 items-center'>
    //     <input className='flex w-full h-full items-center border-r-2 border-base-300 outline-none' defaultValue={extraField.name} onChange={(e)=>{e.target.value = extraField.name}}/>
    //     <div className='flex w-full h-full border-r-2 border-base-300 items-center px-2'>
    //       <input className='flex w-full border-base-300 h-full items-center outline-none' value={(extraField.isProtected)? (showData ? data : "*".repeat(6)) : extraField.data.toString()} onChange={(e)=>{e.target.value = data? data: "*".repeat(6)}}/>
    //       {extraField.isProtected && <Image src={showData?'/images/hidePass.svg':'/images/showPass.svg'} alt='show/hide' width={25} height={25} className='flex w-auto hover:cursor-pointer' onClick={()=>{setShowData(prev=>!prev)}} />}
    //     </div>
        
        
    //     <div className='flex w-32 justify-end'>
    //       <input type='checkbox' checked={extraField.isProtected} className='flex' readOnly/>
    //     </div>
    //     </div>
    //     <Image src={'/images/delete.svg'} alt='del' width={10} height={10} onClick={()=>{onDelete(extraField.name)}} className='flex w-auto h-6 hover:bg-error rounded-md  cursor-pointer'/>
    // </div>
  )
}
