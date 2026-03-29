import { PreferenceType } from "@contexts/preferencesContext";

export type BooleanPreferenceKeys = {
    [K in keyof PreferenceType]: PreferenceType[K] extends boolean ? K : never

}