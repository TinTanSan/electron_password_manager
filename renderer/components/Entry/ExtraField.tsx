import React, { useContext, useEffect, useState } from 'react'
import { Entry, ExtraField } from '@interfaces/Entry'
import { VaultContext } from '@contexts/vaultContext' 
import { BannerContext } from '@contexts/bannerContext';
import { addBanner } from '@interfaces/Banner';
import { IPCResponse } from '@utils/commons';
import Image from 'next/image';

type props = {
    extraField: ExtraField,
    entry:Entry,
    onChangeProtectedNess: (name:string, protectedness:boolean)=>void,
    onDelete: (name:string)=>void 
}

export default function ExtraFieldComponent({extraField, entry, onDelete, onChangeProtectedNess}:props) {
  const {setVault} = useContext(VaultContext);
  const {setBanners} = useContext(BannerContext);
  const [data, setData] = useState<Buffer>(Buffer.from(extraField.data));
  const [showData, setShowData] = useState((!extraField.isProtected)); //by default we set show data to be true if the extrafield is not protected
  const [ef, setEf] = useState<ExtraField>({...extraField, data:Buffer.from(extraField.data)});

  const [collapse, setCollapse] = useState(true);
  
  const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
    setEf(prev=>({
        ...prev,
        [e.target.id] : e.target.id === 'data'? Buffer.from(e.target.value): e.target.value
      })
    )
    if (e.target.id === 'data'){
      setData(Buffer.from(e.target.value))
    } 
  }

  const handleConfirm = (e:React.MouseEvent)=>{
    e.preventDefault();
    if (ef.name.length  === 0){
      addBanner(setBanners, "Cannot add extra field without a name","warning")
    }
    if (ef.data.length  === 0){
      addBanner(setBanners, "Cannot add extra field without data","warning")
    }

    window.entryIPC.addExtraField(entry.metadata.uuid, extraField).then((response)=>{
      if (response ==="OK"){
        addBanner(setBanners, "Added extra field", 'success');

      }else if(response === "ALREADY_EXISTS"){
        addBanner(setBanners, "An extra field with that name already exists", 'error');
      }
    })
    setVault(prev=>({...prev, entries:prev.entries.map(x=>x.metadata.uuid===entry.metadata.uuid? {...x, extraFields:[...x.extraFields,extraField], metadata:{...x.metadata, lastEditedDate:new Date()}} : x) , vaultMetadata:{...prev.vaultMetadata, lastEditDate:new Date()}}))
  }
  // we assume that just clicking on the Expose/Protect button doesn't automatically update the field in the vault, the user must
  // confirm the action with the save button at the bottom.
  const handleChangeProtection = ()=>{
    onChangeProtectedNess(extraField.name, !extraField.isProtected);
  }

  useEffect(()=>{
    setShowData(false);
    setEf({...extraField, data:Buffer.from(extraField.data)});
  },[extraField])

  useEffect(()=>{
    if (!extraField.isProtected){
      setData(Buffer.from(extraField.data));
      return;
    }
    if (extraField.isProtected && showData){
        if (ef.isProtected){
          window.entryIPC.decryptExtraField(entry.metadata.uuid, extraField.name).then((response:IPCResponse<Buffer>)=>{
            if (response.status === "OK"){
              setData(Buffer.from(response.response));
            }else if (response.status === "CLIENT_ERROR"){
              addBanner(setBanners, response.message ?? "Unable to decrypt extraField",'error')
            }else{ 
              addBanner(setBanners, 'unable to decrypt extrafield data','error');
              console.error(response)
            }
          })
        }
    }else if (extraField.isProtected && !showData){
      setData(prev=>prev.fill(0));
    }
  },[showData])

  const handleDelete = ()=>{
    onDelete(extraField.name);
  }


  return (
    <div className='flex flex-col w-full h-fit shrink-0 border-2 text-base-content rounded-lg border-base-300 p-2 gap-2 bg-base-100'>
      <div className={`flex flex-col gap-1 overflow-hidden ${collapse?"h-10":" h-80"} transition-all duration-300`}>
        {/* EF name and collapse button */}
        <div className='flex w-full h-10 shrink-0 justify-end'>
          <div className='flex w-full overflow-hidden  items-center text-md font-semibold'>{ef.name}</div>
          <button onClick={()=>{setCollapse(prev=>!prev)}}><Image src={'/images/up_arrow.svg'} alt='^' className={`flex w-8 h-8 ${collapse ?"rotate-180 ": "rotate-0 "}} transform-all duration-300`} height={0} width={0} /></button>
        </div>
        <div className='flex flex-col w-full gap-1'>
          <div>Name</div>
          <input id='name' onChange={handleChange} className='flex border-2 rounded-md items-center px-1 h-8 border-base-300' value={ef.name}/>
        </div>
        <div className='flex flex-col w-full h-full gap-1'>
          <div className='flex flex-col w-full h-full border-2 border-base-300 rounded-lg'>
              <textarea className='flex resize-none outline-none w-full h-full p-0.5' readOnly={!showData && ef.isProtected} id='data' onChange={handleChange} value={(!ef.isProtected || showData) ?data.toString()  : "Click reveal to show"} />
              <div className='flex bg-base-200 h-10 shrink-0 items-center px-1 justify-between'>
                {(ef.isProtected)&&  <button onClick={()=>{setShowData(prev=>!prev)}} className='flex w-fit px-5 bg-base-300 hover:bg-base-darken h-8 rounded-lg items-center justify-center '> {showData ? "hide":"reveal"}</button>}
                <button onClick={handleChangeProtection} className='flex rounded-sm  w-fit px-2 cursor-pointer bg-base-300 hover:bg-base-darken ease-in-out duration-300 transition-all h-8 items-center justify-center'>{ef.isProtected ?"Decrypt" :"Protect"}</button>
              </div>
          </div>
        </div>
        <div className='flex flex-row w-full h-10 gap-2 duration-300 transition-all'>
          <button onClick={()=>{handleDelete()}} className='flex w-full items-center cursor-pointer justify-center rounded-lg h-8 hover:bg-error hover:text-error-content text-error border-error border-2'>Delete</button>
        </div>  
      </div>
      


      {/* <div className='flex flex-col w-full h-full gap-2'>
        <div className='flex flex-col w-full gap-1'>
          <div>Name</div>
          <input id='name' onChange={handleChange} className='flex border-2 rounded-md items-center px-1 h-8 border-base-300' value={ef.name}/>
        </div>
        <div className='flex flex-col w-full h-full gap-1'>
          <div className='flex flex-col w-full h-full border-2 border-base-300 rounded-lg'>
              <textarea className='flex resize-none outline-none w-full h-full p-0.5' readOnly={!showData} id='data' onChange={handleChange} value={(!ef.isProtected || showData) ?data.toString()  : "Click reveal to show"} />
              <div className='flex bg-base-200 h-10 shrink-0 items-center px-1 justify-between'>
                {(ef.isProtected)&&  <button onClick={()=>{setShowData(prev=>!prev)}} className='flex w-fit px-5 bg-base-300 hover:bg-base-darken h-8 rounded-lg items-center justify-center '> {showData ? "hide":"reveal"}</button>}
                <button onClick={handleChangeProtection} className='flex rounded-sm  w-fit px-2 cursor-pointer bg-base-300 hover:bg-base-darken ease-in-out duration-300 transition-all h-8 items-center justify-center'>{ef.isProtected ?"Decrypt" :"Protect"}</button>
              </div>
          </div>
        </div>
      </div>
      <div className='flex flex-row w-full h-10 gap-2 duration-300 transition-all'>
        <button onClick={()=>{handleDelete()}} className='flex w-full items-center cursor-pointer justify-center rounded-lg h-8 hover:bg-error hover:text-error-content text-error border-error border-2'>Delete</button>
      </div> */}
    </div>

  )
}
''