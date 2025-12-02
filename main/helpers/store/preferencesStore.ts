import Store from 'electron-store';

export interface Preferences{
    fontSize: number;
    vaultLockTimeOut: number; //  seconds
    keyRotationPeriod: number; // days
    requireStrongMasterPassword: boolean;
    entriesPerPage: number;
    maxGeneratedPassLength: number; //characters
    clearClipboardTime: number; //seconds
    fontSpacing: number;
    loadPreviousVault: boolean; 
    // password hash params
    saltLength: number; // bytes
    timeCost: number,
    memoryCost: number,
    parallelism: number,
    hashLength: number,
}

export const preferenceStore = new Store<Preferences>({defaults:{
    fontSize: 16,
    vaultLockTimeOut: 30,
    keyRotationPeriod: 90,
    requireStrongMasterPassword: true,
    entriesPerPage: 50,
    maxGeneratedPassLength: 50,
    clearClipboardTime: 10,
    fontSpacing: 1,
    saltLength: 12,
    loadPreviousVault: true,
    timeCost: 3,
    memoryCost:65536, 
    parallelism:4, 
    hashLength:32,
}})