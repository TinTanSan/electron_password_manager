import React from 'react'
import { Entry } from '../interfaces/Entry'
type props={
    entry: Entry
}

export default function EntryComponent({entry}:props) {
    

  return (
    <div className='flex relative flex-col basis-md items-center grow max-w-md h-90 gap-2 shrink-0 border-2 border-base-300 bg-base-100 shadow-xl/20 w-full  rounded-xl p-2'>
        <div className="justify-center flex w-full font-bold text-xl">{entry.title}</div>
        <div className="flex flex-col w-full h-full gap-2 px-2">        
            <div className='flex w-full h-10 gap-2'>
                <div>Username:</div>
                <div>{entry.username}</div>
            </div>
            <div className='flex w-full h-10 gap-2'>
                <div>Password:</div>
                <div>{'*'.repeat(8)}</div>
            </div>
            <div className='flex h-full rounded-lg p-1 border-2 shrink w-full'>{entry.notes}</div>
        </div>
        <button className='flex w-1/2 rounded-lg justify-center h-10 items-center bg-primary hover:bg-primary-darken text-primary-content'>Edit Entry</button>
    </div>
  )
}
