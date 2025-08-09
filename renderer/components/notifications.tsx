import React, { useContext, useEffect } from 'react'
import { BannerContext } from '../contexts/bannerContext';
import Banner from './banner';

// this one hosts all the banners from the banner context
export default function Notifications() {
  const banners = useContext(BannerContext);
  useEffect(()=>{
    if (banners.banners.length > 5){
      banners.setBanners(banners=>banners.toSpliced(5,banners.length-5))
    }

  },[banners.banners])
  return (
    <div className='flex flex-col gap-5 z-50 w-[30vw] h-fit fixed top-0 right-0 p-2 overflow-y-scroll overflow-x-hidden'>
      {
        banners.banners.map((x,i)=>(
          <Banner bannerDetails={x} key={i} />
        ))
      }
    </div>

  )
}
