/**
 * This module will create valid vaults and entries as required for testing purposes
 * 
 */

import { createUUID, encrypt, shaHash } from "#main/crypto/commons";
import { KEKParts, makeNewKEK } from "#main/crypto/keyFunctions";
import { Entry, Vault } from "#main/interfaces/VaultServiceInterfaces";
import { randomBytes } from "crypto";

export const generateRandomArray = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};


export const createValidEntry = (kek:KEKParts)=>{
    const title = generateRandomArray(128);
    const username = generateRandomArray(128);
    const password = Buffer.from(generateRandomArray(32));
    const notes = generateRandomArray(512);
    const group = "";
    const extraFields = [];
    const entry = {
        title,
        username,
        password,
        passHash: shaHash(password.toString()),
        isFavourite: false,
        notes: notes??"",
        extraFields: extraFields?? [],
        group:group ?? "",
    }
    return entry;
}


export const createValidVault = async (masterPassword?:string, numEntries:number=10) =>{
    const mPass = masterPassword ?? generateRandomArray(32);
    const kekParts = await makeNewKEK(mPass);
    let entriesMap = new Map();
    for(let x:number; x<numEntries; x++){
        entriesMap.set(createUUID(), createValidEntry(kekParts));
    }

    let vault:Vault = {
        vaultMetadata: {
            createDate: new Date(),
            lastEditDate: new Date(),
            version: '1.0.0'
        },
        filePath:'test.vlt',
        fileContents:Buffer.from(""),
        isUnlocked: false,
        kek:kekParts,
        entries: entriesMap,
        entryGroups: []
    }

    return vault;
}
