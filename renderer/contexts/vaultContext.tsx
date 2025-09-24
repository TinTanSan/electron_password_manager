import { createContext } from "react";
import { Entry } from "../interfaces/Entry";
import { VaultType } from "../interfaces/Vault";


type VaultCxtType = {
    vault: VaultType, setVault: React.Dispatch<React.SetStateAction<VaultType>>}

export const VaultContext = createContext<VaultCxtType | undefined>(undefined)