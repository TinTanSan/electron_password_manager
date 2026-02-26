import React, { Dispatch, SetStateAction, useState } from 'react'
import ExtraFieldComponent from './ExtraField'
import { Entry, ExtraField } from '@interfaces/Entry'

type props = {
    entry:Entry,
    setEntry: Dispatch<SetStateAction<Entry>>
}


export default function ExtraFieldsTab({entry, setEntry}:props) {
    
    const [newExtraField, setNewExtraField] = useState<ExtraField>({name:"", data:Buffer.from(""), isProtected:false})

    const handleDeleteExtraField = (name:string)=>{
        window.vaultIPC.removeExtraField(entry.metadata.uuid, name).then((response)=>{
            setEntry(response);
        })
    }

    
    const handleChange =(e:React.ChangeEvent<HTMLInputElement>)=>{
        if (e.target.id === "isProtected"){
            setNewExtraField(prev=>({...prev, isProtected: e.target.checked}))
        }else if (e.target.id === "data"){
            setNewExtraField(prev=>({...prev, data: Buffer.from(e.target.value)}));
        }else{
            setNewExtraField(prev=>({...prev, name:e.target.value}))
        }
    }

    return (
        <div className='flex flex-col w-full h-full shrink-0 overflow-y-hidden gap-5 p-2'>
            {/* search through extra fields */}
            <div className='flex flex-col h-8 '>
                <input type="text" placeholder='search for an extra field' className='flex w-full h-8 px-1 rounded-lg border-2 border-base-300 focus:border-primary outline-none' />
            </div>
            <div className='flex text-sm flex-col bg-base-200 p-1 rounded-lg w-full h-full overflow-y-auto gap-2 border-2 border-base-300'>
                <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
                {entry.extraFields.map(ef=><ExtraFieldComponent extraField={ef} entry={entry} onDelete={handleDeleteExtraField} />)}
            </div>
            {/* add extrafield form */}
            <div className='flex flex-col w-full h-1/3 grow-0  shrink-0 border-2 border-base-300 bg-base-200 rounded-lg p-1'>
                <div className='flex w-full items-center justify-end relative h-10'>
                    <div className='flex items-center w-full justify-center'>
                        Add another extra Field
                    </div>
                </div>
                <div className='flex flex-col gap-2'>
                    <div className='flex gap-2 w-full h-fit'>
                        <label className='flex w-12' >Name</label>
                        <input type="text" id='name' onChange={handleChange} value={newExtraField.name} className='flex border-2 border-base-300 outline-none focus:border-primary px-1 bg-base-100 rounded-lg w-full' />
                    </div>
                    <div className='flex gap-2 w-full h-fit'>
                        <label className='flex w-12' >Data</label>
                        <input type="text" id="data"  onChange={handleChange} value={newExtraField.data.toString()} className='flex border-2 border-base-300 outline-none focus:border-primary px-1 bg-base-100 rounded-lg w-full' />
                    </div>
                    <div className='flex w-full h-fit justify-between'>
                        <p>Encrypt this extra field?</p>
                        <input type="checkbox" id="isProtected" onChange={handleChange} checked={newExtraField.isProtected} className='flex border-2 rounded-full w-4 h-full' />
                    </div>
                </div>
            </div>
        </div>
    )
}
