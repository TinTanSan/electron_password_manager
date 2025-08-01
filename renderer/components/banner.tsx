import React, { useContext, useEffect } from 'react'
import { BannerDetails } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext';

export default function Banner({bannerDetails}:{bannerDetails:BannerDetails}) {
    const banners = useContext(BannerContext);
    useEffect(()=>{
        const timer = setTimeout(() => {
            banners.setBanners(prev=>prev.filter(x=>x.id !== bannerDetails.id))
        }, 3000);
        return () => clearTimeout(timer);
    },[]);

    const handleColour = ()=>{
        if (bannerDetails.type === 'success'){
            return ' bg-success border-success-darken text-success-content hover:bg-success-darken'
        }else if (bannerDetails.type === "info"){
            return ' bg-info border-info-darken text-info-content hover:bg-info-darken'
        }else if (bannerDetails.type === 'warning'){
            return ' bg-warning border-warning-darken text-warning-content hover:bg-warning-darken'
        }else{
            return ' bg-error border-error-darken text-error-content hover:bg-error-darken'
        }
    }

  return (
    <div className={`flex animate-slide-in border-2 justify-between p-2 gap-2 rounded-lg h-fit ${handleColour()} w-full opacity-90`}>
        <div className='flex w-full h-full items-center text-lg'>{bannerDetails.text}</div>
        <button className='flex text-xl' onClick={()=>{banners.setBanners(prev=>prev.filter(x=>x.id !== bannerDetails.id))}}>&#x2716;</button>
    </div>
  )
}
