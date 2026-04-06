import React from 'react'


type props = {
    value:boolean,
    setValue: (x:boolean)=>void,
}
export default function ToggleSwitch({value, setValue}:props) {
  return (
    <div className={`flex w-10 h-5 border-2  ${ value? "border-base-content transition-all duration-500" : "border-base-300"}  rounded-full overflow-hidden justify-start relative `} onClick={()=>{setValue(!value)}}>
        <div className={`flex ${value?  "w-full" : "w-0"} h-full bg-base-content transition-all duration-300 absolute left-0 rounded-lg`} />
        <div className={`flex  w-4 shrink-0 h-4 rounded-full border-2 border-base-content z-10 bg-white absolute  ${value?"left-[calc(100%-16px)] duration-300 ":" left-0  duration-200"} transition-all`} />
    </div>
  )
}
