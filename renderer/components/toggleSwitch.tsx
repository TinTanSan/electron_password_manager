import React from 'react'


type props = {
    value:boolean,
    setValue: (x:boolean)=>void
}
export default function ToggleSwitch({value, setValue}:props) {
  return (
    <div className='flex w-10 h-5 border-2 rounded-full justify-start' onClick={()=>{setValue(!value)}}>
        <div className={`flex ${value?  "w-full" : "w-0"} bg-neutral transition-all duration-500`} />
        <div className={`flex h-full w-auto aspect-square rounded-full border-2  z-10 bg-white  ${value?" translate-x-full":" -translate-x-full"} duration-500 transition-all`} />
    </div>
  )
}
