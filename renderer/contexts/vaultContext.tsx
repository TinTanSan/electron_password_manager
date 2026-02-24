import { createContext } from "react";
import { Vault } from "../interfaces/Vault";


type VaultCxtType = {
    vault: Vault ,
    setVault: React.Dispatch<React.SetStateAction<Vault>>
}

export const defaultVaultState:Vault = {
    filePath: "",
    isUnlocked: false,
    entries: [],
    entryGroups: [],
    vaultMetadata:{
        lastRotateDate: new Date(),
        createDate: new Date(),
        lastEditDate: new Date(),
        version: "0.1.0"
    }
}

export const VaultContext = createContext<VaultCxtType>({
        vault: {...defaultVaultState},
        setVault: (_:Vault) => { throw new Error("setVault called outside provider") }
})