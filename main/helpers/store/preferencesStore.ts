import Store from 'electron-store';

export const preferenceStore = new Store({defaults:{
    fontSize: 16,
    vaultLockTimeOut: 30,
    keyRotationPeriod: 90,
    requireStrongMasterPassword: true,
    entriesPerPage: 50,
    maxGeneratedPassLength: 50,
    clearClipboardTime: 10,
    fontSpacing: 1,
    loadPreviousVault: true,
    timeCost: 3,
    memoryCost:65536, 
    parallelism:4, 
    hashLength:32,
}})
export type Preferences = typeof preferenceStore;