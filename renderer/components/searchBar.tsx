import React from 'react'

// which fields to search through
export type SearchSettings = {
    searchTitle: boolean,
    searchUsername: boolean, 
    searchNotes: boolean,
}

type props ={
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    settings: SearchSettings,
    setSearchSettings: React.Dispatch<React.SetStateAction<SearchSettings>>
}

export default function SearchBar({value, setValue, settings, setSearchSettings}:props) {
  return (
    <div className='flex w-full shrink grow border-2 rounded-xl items-center px-1 h-9 gap-1'>
        <input value={value} onChange={(e)=>{setValue(e.target.value)}} className='w-full outline-none' placeholder={`search for an entry`} />
        <button title='allow searching through titles' onClick={()=>{setSearchSettings((prev)=>({...prev, searchTitle:!prev.searchTitle}))}} className={`w-7 h-6 text-sm border-2 flex items-center justify-center rounded-lg ${settings.searchTitle&& 'bg-neutral text-white border-none font-bold'}`}>T</button>
        <button title='allow searching through usernames' onClick={()=>{setSearchSettings((prev)=>({...prev, searchUsername:!prev.searchUsername}))}} className={`w-7 h-6 text-sm border-2 flex items-center justify-center rounded-lg ${settings.searchUsername&& 'bg-neutral text-white border-none font-bold'}`}>U</button>
        <button title='allow searching through notes' onClick={()=>{setSearchSettings((prev)=>({...prev, searchNotes:!prev.searchNotes}))}} className={`w-7 h-6 text-sm border-2 flex items-center justify-center rounded-lg ${settings.searchNotes&& 'bg-neutral text-white border-none font-bold'}`}>N</button>
    </div>
  )
}
