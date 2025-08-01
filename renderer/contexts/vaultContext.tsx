import { createContext } from "react";

export type VaultType = {
    filePath:string, 
    fileContents:string
    isUnlocked:boolean,
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
}

type VaultCxtType = {
    vault: VaultType, setVault: React.Dispatch<React.SetStateAction<VaultType>>}

export const VaultContext = createContext<VaultCxtType | undefined>(undefined)