import {BannerCTXType} from '../contexts/bannerContext';


export interface BannerDetails{
    id: number;
    text: string,
    type: 'info' |'success' | 'warning' | 'error' ,// we have four types of banners 
}
// simple function to abstract away the adding of banners into the context. 
export function addBanner(bannerContext:BannerCTXType | undefined, text:string, type:'info' |'success' | 'warning' | 'error' ){
    if (bannerContext !== undefined){
        bannerContext.setBanners(prev=>[...prev, {id:Date.now(), text, type}])
    }else{
        throw new Error("Tried to add a notification to the banners, but the bannerContext was undefined.")
    }
}