import React, { useContext, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { VaultContext } from '../contexts/vaultContext'
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
    const {vault, setVault} = useContext(VaultContext);
  return (
    <div className='flex w-screen h-screen overflow-hidden bg-linear-to-b from-base-200 to-base-300'>
        <title>Groups</title>
        <Sidebar />
        {/* main content */}
        <div className='flex w-full h-full p-2'>
            <div className='flex flex-col w-full h-full gap-2'>
                {vault?.entryGroups.map((group, i)=>
                    <div key={i} className='flex border-2 h-12 w-full rounded-lg border-base-300 bg-white px-2 items-center text-md font-medium gap-5'>
                        <div className='flex w-full'>
                            {group.groupName}
                        </div>
                        <p className='flex w-40 justify-end text-nowrap font-normal text-md'>
                            {group.entries.length} Entries
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  )
}
