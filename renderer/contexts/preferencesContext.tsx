import { createContext } from "react";



export type PreferenceType = {
    vaultLockTimeOut: number; //  minutes
    keyRotationPeriod: number; // days
    requireStrongMasterPassword: boolean;
    entriesPerPage: number;
    maxGeneratedPassLength: number; //characters
    clearClipboardTime: number; //seconds
    fontSize: number;
    fontSpacing: number;
    openLastOpenedVault: boolean; // like how VS code opens the files that you were working on previously rahter than finding them again
}

// define upper and lower bounds for all numerical preferences
export const minMaxValuesForPreferences = {
    vaultLockTimeOut: [1,30],
    keyRotationPeriod: [15,90],
    entriesPerPage: [10,200],
    maxGeneratedPassLength: [1, 128],
    clearCliboardTime: [10,30],
    fontSize: [8, 24],
    fontSpacing: [1,5] ,
}

export const preferenceDefaults: PreferenceType = {
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
    preference: PreferenceType,
    setPreference: React.Dispatch<React.SetStateAction<PreferenceType>>
}


export const PreferenceContext = createContext<PreferenceCTXType>({
    preference: {...preferenceDefaults},
    setPreference:(_:PreferenceType)=>{throw new Error('Set prefence called outside of provider')} 
})