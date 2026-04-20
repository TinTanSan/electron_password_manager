import React, { Dispatch, FormEvent, SetStateAction, useContext, useState } from 'react'
import ExtraFieldComponent from './ExtraField'
import { Entry, ExtraField } from '@interfaces/Entry'
import { BannerContext } from '@contexts/bannerContext'
import { addBanner } from '@interfaces/Banner'
import ToggleSwitch from '@components/toggleSwitch'
import Image from 'next/image'

type props = {
    entry:Entry,
    setEntry: Dispatch<SetStateAction<Entry>>
}


export default function ExtraFieldsTab({entry, setEntry}:props) {
    const {setBanners} = useContext(BannerContext);
    
    const [newExtraField, setNewExtraField] = useState<ExtraField>({name:"", data:Buffer.from(""), isProtected:false});
    const [showNewExtraFieldForm, setShowNewExtraFieldForm] = useState(false);

    const handleDeleteExtraField = (name:string)=>{
        window.entryIPC.removeExtraField(entry.metadata.uuid, name).then((response)=>{
            setEntry(response);
        })
    }
    const handleAddExtraField = (e:FormEvent)=>{
        e.preventDefault();
        if (newExtraField.name.length === 0){
            addBanner(setBanners, "Cannot create an extrafield without a name", 'warning')
        }
        else if (newExtraField.data.length === 0){
            addBanner(setBanners, "Cannot create an extrafield without data", 'warning')
        }
        window.entryIPC.addExtraField(entry.metadata.uuid, newExtraField).then((response)=>{    
            console.log(response);
            if (response.status === "OK"){
                setEntry(prev=>({...prev, extraFields:[...prev.extraFields, newExtraField]}));
                addBanner(setBanners, "successfully added extra field", 'success');
            }else if (response.status === "CLIENT_ERROR"){
                addBanner(setBanners, "Unable to add extra field: " +response.message, 'error');
            }else{
                addBanner(setBanners, "Internal error when adding extra field", 'error');
                console.error(response)
            }
        })


    }

    
    const handleChange =(e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        if (e.target.id === "data"){
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
            <div className='flex text-sm flex-col p-1 rounded-lg w-full h-full overflow-y-auto gap-2 border bg-base-200 border-base-300'>
                {entry.extraFields.map(ef=><ExtraFieldComponent key={ef.name} extraField={ef} entry={entry} onDelete={handleDeleteExtraField} />)}
            </div>
            {/* add extrafield form */}
            <div className='flex flex-col w-full h-fit justify-center items-center border-2 p-1 border-base-300 rounded-lg text-base-content'>
                <div className='flex w-full h-10 items-center justify-between  cursor-pointer' onClick={()=>{setShowNewExtraFieldForm(prev=>!prev)}} >
                    <p className='flex text-subheading'>Add new extra field</p>
                    <button className='flex w-8 h-8 items-center justify-center' >
                        <Image src={'/images/up_arrow.svg'} alt='^' width={0} height={0} className={`flex ${showNewExtraFieldForm? "rotate-180": "rotate-0"} h-auto w-8 duration-300 transition-all`}/>
                    </button>
                </div>
                <form onSubmit={handleAddExtraField} className={`flex flex-col text-normal gap-2 w-full ${showNewExtraFieldForm? "h-[20vh] visible" : "h-0 collapse"} transition-all duration-300`}>
                    <div className='flex gap-2 w-full h-fit shrink-0'>
                        <label className='flex w-12' >Name</label>
                        <input type="text" id='name' onChange={handleChange} value={newExtraField.name} className='flex border-2 border-base-300 outline-none focus:border-base-contentb px-1 bg-base-100 h-8 rounded-lg w-full' />
                        <div className='flex w-fit h-full gap-1 items-center text-normal '>
                            <p className='flex text-nowrap'>Encrypt field?</p>
                            <ToggleSwitch value={newExtraField.isProtected} setValue={(newVal:boolean)=>{setNewExtraField(prev=>({...prev, isProtected:newVal}))}} />
                        </div>
                    </div>
                    <div className='flex w-full h-full'>
                        <label className='flex w-12' >Data</label>
                        <textarea id="data"  onChange={handleChange} value={newExtraField.data.toString()} className='flex border-2 border-base-300 resize-none outline-none focus:border-base-content px-1 bg-base-100 rounded-lg w-full h-full' />
                    </div>
                    
                    <button type="submit" className='flex w-full h-10 shrink-0 items-center justify-center bg-primary hover:bg-primary-darken text-primary-content hover:rounded-xl transition-all duration-300 rounded-lg'>Add</button>

                </form>
            </div>

        </div>
    )
}
