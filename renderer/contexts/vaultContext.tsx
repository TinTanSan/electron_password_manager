import { createContext } from "react";

type VaultType = {filePath:string, fileContents:string}

type VaultCxtType = {vault: VaultType, setVault: React.Dispatch<React.SetStateAction<VaultType>>}

export const VaultContext = createContext<VaultCxtType | undefined>(undefined)