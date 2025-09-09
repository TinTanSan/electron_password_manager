import React from 'react'
import { ExtraField } from '../interfaces/Entry'


type props = {
    extraField: ExtraField
}

export default function ExtraFieldComponent({extraField}:props) {
  return (
    <div className='flex flex-row w-full text-md gap-2 border-2 rounded-lg border-base-300 px-2 h-10 items-center'>
        <div className='flex w-full'>
        {extraField.name}
        </div>
        <div className='flex w-full peer-hover:'>
          {extraField.data.toString()}
        </div>
        <div className='flex w-32'>
        <input type='checkbox' checked={extraField.isSensitive}  />
        </div>
        
    </div>
  )
}
