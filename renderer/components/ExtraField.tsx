import React, { useContext, useEffect, useState } from 'react'
import { Entry, ExtraField } from '../interfaces/Entry'
import { VaultContext } from '../contexts/vaultContext' 
import { BannerContext } from '../contexts/bannerContext';
import { addBanner } from '../interfaces/Banner';

type props = {
    extraField: ExtraField,
    entry:Entry,
    onDelete: (name:string)=>void 
}

export default function ExtraFieldComponent({extraField, entry, onDelete}:props) {
  const {vault, setVault} = useContext(VaultContext);
  const bannerContext = useContext(BannerContext);
  const [data, setData] = useState<undefined | string>(undefined);
  const [showData, setShowData] = useState(false);
  const [ef, setEf] = useState<ExtraField>({...extraField});
  const [encryptedData, setEncryptedData] = useState<undefined | Buffer>(ef.isProtected?ef.data : undefined);
  const hasChanged = (ef.name === extraField.name && (extraField.data.equals(ef.data)) && ef.isProtected == extraField.isProtected);
  const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
    setEf(prev=>({
        ...prev,
        [e.target.id] : e.target.id === 'data'? Buffer.from(e.target.value): e.target.value
      })
    )
    setData(e.target.value)
  }

  const handleConfirm = (e:React.MouseEvent)=>{
    e.preventDefault();
    window.vaultIPC.addExtraField(entry.metadata.uuid, extraField).then((response)=>{
      if (response ==="OK"){
        addBanner(bannerContext, "Added extra field", 'success');

      }else if(response === "ALREADY_EXISTS"){
        addBanner(bannerContext, "An extra field with that name already exists", 'error');
      }
    })
    setVault(prev=>({...prev, entries:prev.entries.map(x=>x.metadata.uuid===entry.metadata.uuid? {...x, extraFields:[...x.extraFields,extraField], metadata:{...x.metadata, lastEditedDate:new Date()}} : x) , vaultMetadata:{...prev.vaultMetadata, lastEditDate:new Date()}}))
  }
  // we assume that just clicking on the Expose/Protect button doesn't automatically update the field in the vault, the user must
  // confirm the action with the save button at the bottom.
  const handleChangeProtection = ()=>{
    throw new Error ("Implement via IPC calls")
    // if (ef.isProtected){
    //   if (encryptedData === undefined){
    //     setEncryptedData(ef.data);
    //   }
    //   entry.decryptExtraField(ef.name, vault.kek).then((results)=>{
    //     if (results.status === "OK"){
    //       setEf(prev=>({...prev, data:results.data, isProtected:false}));
    //       setData(results.data.toString());
    //     }else{
    //       addBanner(bannerContext, "Unable to permanently expose extrafield data because something went wrong decrypting the data", "error");
    //     }
    //   })
    // }else{
    //   if (encryptedData === undefined){
    //     entry.encryptField(vault.kek, ef.name, ef.data).then((encryptedEf)=>{
    //       setEf(encryptedEf)
    //     });
    //   }else{
    //     setEf(prev=>({...prev, isProtected:true, data: encryptedData}));
    //   }
    //   setShowData(false);
    //   setData(undefined);
    // }
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
        throw new Error ("Implement via IPC calls")  
        // entry.decryptExtraField(extraField.name, vault.kek).then((d)=>{
        //   if (d.status === "ERROR"){
        //     addBanner(bannerContext, 'error decrypting extra field data', 'error')
        //     setData(undefined);
        //   }else{
        //     setData(d.data.toString());
        //   }
        // })
    }else if (!showData){
      setData(undefined);
    }
  },[showData])

  const handleDelete = ()=>{
    onDelete(extraField.name);
  }


  return (
    <div className='flex flex-col w-full h-80 shrink-0 border-2 text-base-content rounded-lg border-base-300 p-2 gap-2 bg-base-100'>
      <div className='flex flex-col w-full h-full'>
        <div className='flex flex-col w-full gap-2'>
          <div>Name</div>
          <input id='name' onChange={handleChange} className='flex border-2 rounded-md items-center px-1 h-8 border-base-300' value={ef.name}/>
        </div>
        <div className='flex flex-col w-full h-full gap-2'>
          <div>Data</div>
          <textarea readOnly={!showData} id='data' onChange={handleChange} className='flex border-2 rounded-lg h-full resize-none px-1' value={showData ? data: "Click Reveal to show "} />
          <div className='flex w-full h-8 gap-2'>
          {ef.isProtected && <button className='flex border-2 border-neutral rounded-lg h-8 items-center justify-center w-1/2' onClick={()=>{setShowData(!showData)}}>Reveal</button>}
          <button onClick={handleChangeProtection} className='flex border-2 border-warning text-warning-content w-1/2 items-center justify-center rounded-lg hover:bg-warning '>{ef.isProtected? "Expose":"Protect"}</button>
          </div>
        </div>
      </div>
      <div className='flex flex-row w-full h-10 gap-2 duration-300 transition-all'>
        <button onClick={()=>{handleDelete()}} className='flex w-full items-center cursor-pointer justify-center rounded-lg h-8 bg-error hover:bg-error-darken hover:text-white text-white'>Delete</button>
        {!hasChanged && <button className='flex justify-center items-center w-full border-2 rounded-lg cursor-pointer' onClick={handleConfirm}>Save Edits</button>}
      </div>
    </div>

  )
}
''