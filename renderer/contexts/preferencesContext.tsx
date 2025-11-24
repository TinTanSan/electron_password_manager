import { createContext } from "react";

export type PreferenceType = {
    vaultLockTimeOut: number; //  seconds
    keyRotationPeriod: number; // days
    requireStrongMasterPassword: boolean;
    entriesPerPage: number;
    maxGeneratedPassLength: number; //characters
    clearClipboardTime: number; //seconds
    fontSize: number;
    fontSpacing: number;
}

type PreferenceCTXType = {
    preference: PreferenceType | undefined,
    setPreference: React.Dispatch<React.SetStateAction<PreferenceType>>
}


export const PreferenceContext = createContext<PreferenceCTXType>({
    preference: undefined,
    setPreference:(_:PreferenceType)=>{throw new Error('Set prefence called outside of provider')} 
})