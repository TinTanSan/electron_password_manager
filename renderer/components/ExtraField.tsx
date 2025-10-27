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
  const [ef, setEf] = useState<ExtraField>({...extraField});

  const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
    setEf(prev=>({
        ...prev,
        [e.target.id] : e.target.id === 'data'? Buffer.from(e.target.value): e.target.value
      })
    )
  }

  const handleConfirm = (e:React.MouseEvent)=>{
    e.preventDefault();
    entry.addExtraField(vault.kek, {...ef}).then((newState)=>{
      vault.mutate('entries',[vault.entries.filter(x=>x.metadata.uuid !== entry.metadata.uuid),newState])
    }) 
  }

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
    <div className='flex flex-col w-full h-80 shrink-0 border-2 rounded-lg border-base-300 p-2 gap-2 bg-base-100'>
      <div className='flex flex-col w-full h-full'>
        <div className='flex flex-col w-full gap-2'>
          <div>Name</div>
          <input className='flex border-2 rounded-md items-center px-1 h-8 border-base-300' readOnly value={extraField.name}/>
        </div>
        <div className='flex flex-col w-full h-full gap-2'>
          <div>Data</div>
          <textarea className='flex border-2 rounded-lg h-full resize-none px-1' readOnly value={data ? data: "Click Reveal to show "} />
          <button className='flex border-2 border-neutral rounded-lg h-8 items-center justify-center w-1/2' onClick={()=>{setShowData(!showData)}}>Reveal</button>
        </div>
      </div>
      <div className='flex flex-row w-full h-10 gap-2'>
        <button onClick={()=>{handleDelete()}} className='flex w-1/2 items-center justify-center rounded-lg h-8 bg-error hover:bg-error-darken hover:text-white text-white'>Delete</button>
        <button className='flex justify-center items-center w-1/2 border-2 rounded-lg' onClick={handleConfirm}>Save Edits</button>
      </div>
    </div>

  )
}
''