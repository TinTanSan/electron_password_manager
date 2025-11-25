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
    openLastOpenedVault: boolean; // like how VS code opens the files that you were working on previously rahter than finding them again
}

const preferenceDefaults: PreferenceType = {
    vaultLockTimeOut: 30,
    keyRotationPeriod: 90,
    requireStrongMasterPassword: true,
    entriesPerPage: 50,
    maxGeneratedPassLength: 50,
    clearClipboardTime: 10,
    fontSize: 14,
    fontSpacing: 1,
    openLastOpenedVault: true
}


type PreferenceCTXType = {
    preference: PreferenceType | undefined,
    setPreference: React.Dispatch<React.SetStateAction<PreferenceType>>
}


export const PreferenceContext = createContext<PreferenceCTXType>({
    preference: undefined,
    setPreference:(_:PreferenceType)=>{throw new Error('Set prefence called outside of provider')} 
})