import { CATALOGS } from '@/translations';
import { LANGUAGES } from '@/utils/languages';

export type TOfferedLanguage = {
    code: string;
    displayName: string;
};

/**
 * English plus every bundled catalog. Derived from `CATALOGS` so offering a
 * language this build cannot render is impossible; an empty `CATALOGS` is the App
 * Builder's English-only artifact, which offers EN alone.
 */
export const getOfferedLanguages = (): TOfferedLanguage[] => {
    const offeredCodes = ['EN', ...Object.keys(CATALOGS)];
    return LANGUAGES.filter(language => offeredCodes.includes(language.code));
};

/** Computed once, so the `languages` prop keeps a stable identity across renders. */
export const OFFERED_LANGUAGES: TOfferedLanguage[] = getOfferedLanguages();

/**
 * Calls the function rather than reading OFFERED_LANGUAGES: the constant is
 * evaluated at import time, before a test's `CATALOGS` mock exists.
 */
export const isOfferedLanguage = (code: string): boolean =>
    getOfferedLanguages().some(language => language.code === code);
