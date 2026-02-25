import React from 'react'
import ExtraFieldComponent from './ExtraField'
import { Entry } from '@interfaces/Entry'

export default function ExtraFieldsList({entry}:{entry:Entry}) {
    const handleDeleteExtraField = (name:string)=>{
        window.vaultIPC.removeExtraField(entry.metadata.uuid, name).then((response)=>{
            
        })
    }

    return (
        <div className='flex flex-col bg-base-300 p-1 rounded-lg w-full h-full overflow-y-auto gap-2'>
            <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
            <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
            <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
            <ExtraFieldComponent extraField={{isProtected:false, name:"Test", data:Buffer.from("hello")}} entry={entry} onDelete={handleDeleteExtraField} />
            {entry.extraFields.map(ef=><ExtraFieldComponent extraField={ef} entry={entry} onDelete={handleDeleteExtraField} />)}
        </div>
    )
}
