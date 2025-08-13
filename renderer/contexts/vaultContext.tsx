import { createContext } from "react";
import { Entry } from "../interfaces/Entry";

export type VaultType = {
    filePath:string, 
    fileContents:Buffer
    isUnlocked:boolean,
    wrappedVK: Buffer,
    kek:KEKParts | undefined, //KEK should be set to undefined when the vault is locked 
    entries: Array<Entry>,
}

type VaultCxtType = {
    vault: VaultType, setVault: React.Dispatch<React.SetStateAction<VaultType>>}

export const VaultContext = createContext<VaultCxtType | undefined>(undefined)