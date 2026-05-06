import React, { useContext,} from 'react'
import { BannerDetails } from '@interfaces/Banner'
import { BannerContext } from '@contexts/bannerContext';

const colourStyle = {
    'success':' bg-success/75 border-success-darken text-success-content',
    'info':' bg-info/75 border-info-darken text-info-content',
    "warning":' bg-warning/75 border-warning-darken text-warning-content',
    "error":' bg-error/75 border-error-darken text-error-content'
}

export default function Banner({bannerDetails}:{bannerDetails:BannerDetails}) {
    const banners = useContext(BannerContext);
    
  return (
    <div className={`flex flex-row relative animate-slide-in  border-r-2 border-t-2 border-b-2 border-base-300 gap-1 justify-between items-center overflow-hidden rounded-lg h-14 max-h-fit bg-white w-full`}>
        <div className={`flex w-1 h-full ${colourStyle[bannerDetails.type]}`} />
        <div className='flex w-full h-full items-center py-2 overflow-hidden text-ellipsis'>{ bannerDetails.text }</div>
        <button className='flex text-2xl w-fit h-fit font-light' onClick={()=>{banners.setBanners(prev=>prev.filter(x=>x.id !== bannerDetails.id))}}>&#x2716;</button>
    </div>
  )
}
