import React, { useEffect, useState } from 'react'
import { ExtraField } from '../interfaces/Entry'


type props = {
    extraField: ExtraField,
    uuid: string
}

export default function ExtraFieldComponent({extraField, uuid}:props) {

  const [data, setData] = useState();

  useEffect(()=>{
    
  },[extraField])

  return (
    <div className='flex flex-row w-full text-md gap-2 border-2 rounded-lg border-base-300 px-2 h-10 items-center'>
        <input className='flex w-full h-full items-center border-r-2 border-base-300 outline-none' readOnly value={extraField.name} />
        
        <input className='flex w-full border-r-2 border-base-300 h-full items-center outline-none' readOnly value={extraField.data.toString()} />
        <div className='flex w-32 justify-end'>
        <input type='checkbox' checked={extraField.isSensitive} className='flex' readOnly/>
        </div>
    </div>
  )
}
