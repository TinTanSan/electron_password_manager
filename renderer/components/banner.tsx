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
  return (
    <div className={`flex`}>{bannerDetails.text}</div>
  )
}
