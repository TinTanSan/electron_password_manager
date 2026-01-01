import * as argon2 from 'argon2';

import * as crypto from 'node:crypto';
import { preferenceStore } from '../helpers/store/preferencesStore';
import { encrypt } from './commons';
// Create entirely new KEK based on a password, this can be used for key rotation and initial set up

export type KEKParts  ={
    passHash: string,
    salt : Buffer,
    kek: Buffer | undefined;

}


export async function makeNewKEK(password:string):Promise<KEKParts>{
        const passHash = await argon2.hash(password, {
            type: argon2.argon2id,
            timeCost: preferenceStore.get('timeCost'),
            memoryCost:preferenceStore.get('memoryCost'),
            parallelism:preferenceStore.get('parallelism'),
            hashLength:preferenceStore.get('hashLength'),
        });

        const salt = crypto.randomBytes(preferenceStore.get('saltLength'));
        const kekHash = await argon2.hash(password, {
            type: argon2.argon2id,
            salt:Buffer.from(salt),
            timeCost: preferenceStore.get('timeCost'),
            memoryCost:preferenceStore.get('memoryCost'),
            parallelism:preferenceStore.get('parallelism'),
            hashLength:preferenceStore.get('hashLength'),
            raw:true
        });
        return {
            passHash,
            salt,
            kek: kekHash
        };
}


