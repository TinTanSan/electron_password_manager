import Image from 'next/image';
import React, { useState } from 'react'
type Props = {
    placeHolder: string,
    type: React.HTMLInputTypeAttribute,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>
}
export default function FancyInput({placeHolder,value, setValue, type}: Props) {
    const [focus, setFocus] = useState(false);
    const isPassword = type === "password";
    const [inputType, setInputType] = useState(type)
  return (
    <div className={`flex h-fit w-full relative border-2 ${focus?"border-primary":"border-neutral"} rounded-lg px-2 items-center`}>
        {focus && <div className='flex h-1 w-fit text-nowrap text-sm absolute -top-0.5 z-10 bg-white left-3 justify-center items-center text-primary font-semibold'>{placeHolder}</div>}
        <input onChange={(e)=>{setValue(e.target.value)}} value={value} type={inputType} placeholder={!focus? placeHolder: ""} onFocus={()=>{setFocus(true)}} onBlur={()=>{setFocus(false)}} className={`flex items-center outline-0 rounded-lg h-8 w-full`} />
        {isPassword && <Image onClick={()=>{setInputType(prev=>prev==="password"? "text": "password")}} src={inputType==="text"? "/images/hidePass.svg":"/images/showPass.svg"} alt='show' width={25} height={25} />}
    </div>
  )
}
