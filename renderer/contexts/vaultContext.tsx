import { createContext } from "react";
import { Vault } from "../interfaces/Vault";


type VaultCxtType = {
    vault: Vault | undefined,
    setVault: React.Dispatch<React.SetStateAction<Vault | undefined>>
}

export const VaultContext = createContext<VaultCxtType>({
        vault: undefined,
        setVault: (_:Vault) => { throw new Error("setVault called outside provider") }
    })