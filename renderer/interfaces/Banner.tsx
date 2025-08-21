import {BannerCTXType} from '../contexts/bannerContext';


export interface BannerDetails{
    id: string;
    text: string,
    type: 'info' |'success' | 'warning' | 'error' ,// we have four types of banners ,
}
// simple function to abstract away the adding of banners into the context. 
export function addBanner(bannerContext:BannerCTXType | undefined, text:string, type:'info' |'success' | 'warning' | 'error' ){
    if (bannerContext !== undefined){
        const id = window.crypto.randomUUID();
        bannerContext.setBanners(prev => {
            const updated = [...prev, {id, text, type}];
            return updated.length > 5 ? updated.slice(-5) : updated;
        });
  
        setTimeout(() => {
            bannerContext.setBanners(prev=>prev.filter(x=>x.id !== id))
        }, 3000);

    }else{
        throw new Error("Tried to add a notification to the banners, but the bannerContext was undefined.")
    }
}