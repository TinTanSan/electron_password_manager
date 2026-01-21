import React, { useContext, useEffect, useRef, useState } from 'react'
import { BannerDetails } from '../interfaces/Banner'
import { BannerContext } from '../contexts/bannerContext';
import Image from 'next/image';

export default function Banner({bannerDetails}:{bannerDetails:BannerDetails}) {
    const banners = useContext(BannerContext);
    const handleColour = ()=>{
        if (bannerDetails.type === 'success'){
            return ' bg-success/75 border-success-darken text-success-content'
        }else if (bannerDetails.type === "info"){
            return ' bg-info/75 border-info-darken text-info-content'
        }else if (bannerDetails.type === 'warning'){
            return ' bg-warning/75 border-warning-darken text-warning-content'
        }else{
            return ' bg-error/75 border-error-darken text-error-content'
        }
    }

    


    
  return (
    // <div className={`flex relative flex-row animate-slide-in border-2 px-2 justify-between items-center overflow-hidden rounded-lg h-fit ${handleColour()} w-full`}>
    
    //     <div className={`flex absolute top-0 h-1 opacity-100 saturate-150 rounded-full brightness-90 animate-[shrink_2950ms_linear_forwards] duration-1000 ${handleStripeColour()}`} />
    //     <Image src={'/images/'+bannerDetails.type+".svg"} alt={bannerDetails.type} width={20} height={20} className='flex h-auto fill-success-content'/>
    //     <div className='flex w-full h-full opacity-100 items-center text-lg p-2 cursor-default '>{bannerDetails.text}</div>
    //     <button className='flex text-2xl w-fit h-fit' onClick={()=>{banners.setBanners(prev=>prev.filter(x=>x.id !== bannerDetails.id))}}>&#x2716;</button>
    // </div>
    <div className={`flex flex-row relative animate-slide-in  border-r-2 border-t-2 border-b-2 border-base-300 gap-1 justify-between items-center overflow-hidden rounded-lg h-14 max-h-fit py-2 bg-white w-full`}>
        <div className={`flex w-1.5 h-full ${handleColour()}`} />
        <div className='flex w-full h-full items-center'>{ bannerDetails.text }</div>
        <button className='flex text-2xl w-fit h-fit' onClick={()=>{banners.setBanners(prev=>prev.filter(x=>x.id !== bannerDetails.id))}}>&#x2716;</button>
    </div>
  )
}
