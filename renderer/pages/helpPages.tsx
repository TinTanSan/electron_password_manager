import React from 'react'

export default function Help() {
  return (
    <div className='flex flex-col w-screen h-screen bg-base-200 p-2'>
      <div className='flex flex-col w-full h-1/4 p-1 rounded-lg bg-base-100 border-2 border-base-300'>
        What is a password manager
      </div>
      <div className='flex flex-col w-full h-1/4 p-1 rounded-lg bg-base-100 border-2 border-base-300'>
        How does this password manager work
      </div>
    </div>
  )
}

