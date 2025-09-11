import React, { useContext, useEffect, useState } from 'react'
import { ExtraField } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext'
import Image from 'next/image';

type props = {
    extraField: ExtraField,
    uuid: string,
    onDelete: (name:string)=>void 
}

export default function ExtraFieldComponent({extraField, uuid}:props) {
  const {vault} = useContext(VaultContext);
  const [data, setData] = useState();

  useEffect(()=>{
    vault.entries.find(x=>x.metadata.uuid === uuid)
  },[extraField])

  return (
    <div className='flex flex-row w-full text-md gap-2 border-2 rounded-lg border-base-300 px-2 h-10 items-center'>
        <input className='flex w-full h-full items-center border-r-2 border-base-300 outline-none' readOnly value={extraField.name} />
        
        <input className='flex w-full border-r-2 border-base-300 h-full items-center outline-none' readOnly value={extraField.data.toString()} />
        <div className='flex w-32 justify-end'>
          <input type='checkbox' checked={extraField.isSensitive} className='flex' readOnly/>
        </div>
        <Image src={'/images/delete.svg'} alt='del' width={25} height={25} className='flex w-auto bg-error'/>
    </div>
  )
}
