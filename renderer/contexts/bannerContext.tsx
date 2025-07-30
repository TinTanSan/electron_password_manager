import { createContext } from "react";
import { BannerDetails } from "../interfaces/Banner";

export type BannerCTXType = {
    banners: Array<BannerDetails>,
    setBanners: React.Dispatch<React.SetStateAction<Array<BannerDetails>>>
}

export const BannerContext = createContext<BannerCTXType | undefined>(undefined);