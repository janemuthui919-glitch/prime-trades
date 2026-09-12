/**
 * Puts a language and its catalogs in place before `initializeI18n()` runs — that
 * call resolves the language itself and never reads brand.config.
 */

/** The localStorage key `@deriv-com/translations` reads and writes. */
export const LANGUAGE_STORAGE_KEY = 'i18n_language';

const TRANSLATION_NAMESPACE = 'translation';

export type TSeedLanguageInput = {
    urlLang: string | null;
    storedLang: string | null;
    /** `platform.i18n.default_language` from brand.config.json. */
    configuredDefault: string | null | undefined;
    /** The keys of `CATALOGS` — the languages this build can render. */
    bundledCodes: string[];
};

/** The minimal surface of the i18next instance this module needs. */
export type TResourceBundleHost = {
    addResourceBundle: (
        language: string,
        namespace: string,
        resources: Record<string, string>
    ) => unknown;
};

/**
 * The language to seed, or `null` to leave the library's own resolution alone.
 *
 * An `EN` default seeds nothing: EN is already `fallbackLng`, so writing it would
 * only pin returning visitors to a preference they never expressed.
 */
export const resolveSeedLanguage = ({
    urlLang,
    storedLang,
    configuredDefault,
    bundledCodes,
}: TSeedLanguageInput): string | null => {
    if (urlLang || storedLang) return null;
    if (bundledCodes.length === 0) return null;

    const code = configuredDefault?.toUpperCase();
    if (!code) return null;
    if (code === 'EN') return null;
    if (!bundledCodes.includes(code)) return null;

    return code;
};

export type TBootLanguageClampInput = Pick<TSeedLanguageInput, 'urlLang' | 'storedLang' | 'bundledCodes'>;

/** What has to go before `getInitialLanguage()` reads it. */
export type TBootLanguageClamp = {
    stripUrlLang: boolean;
    clearStoredLang: boolean;
};

/** The library stores the code JSON-quoted, but tolerates a raw one it has yet to rewrite. */
const readStoredCode = (storedLang: string): string => {
    try {
        return String(JSON.parse(storedLang));
    } catch {
        return storedLang;
    }
};

/** Both inputs are checked because `?lang=` outranks storage in `getInitialLanguage()`. */
export const resolveBootLanguageClamp = ({
    urlLang,
    storedLang,
    bundledCodes,
}: TBootLanguageClampInput): TBootLanguageClamp => {
    const offeredCodes = ['EN', ...bundledCodes.map(code => code.toUpperCase())];
    const isOffered = (code: string) => offeredCodes.includes(code.toUpperCase());

    return {
        // An empty `?lang=` is what `getInitialLanguage()` itself ignores.
        stripUrlLang: !!urlLang && !isOffered(urlLang),
        clearStoredLang: !!storedLang && !isOffered(readStoredCode(storedLang)),
    };
};

/** Guarded for the same reason `persistSeedLanguage` is: a throw here is a blank page. */
export const applyBootLanguageClamp = ({ stripUrlLang, clearStoredLang }: TBootLanguageClamp): void => {
    if (stripUrlLang) {
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('lang');
            window.history.replaceState({}, '', url.toString());
        } catch {
            /* history unavailable — the stored clamp below still applies */
        }
    }

    if (clearStoredLang) {
        try {
            localStorage.removeItem(LANGUAGE_STORAGE_KEY);
        } catch {
            /* storage unavailable — fall through to getInitialLanguage()'s own default */
        }
    }
};

/**
 * JSON-quoted, the form the library reads and writes. Guarded because this runs at
 * module scope before `createRoot().render()`, where a throw is a blank page.
 */
export const persistSeedLanguage = (code: string): void => {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(code));
    } catch {
        /* storage unavailable — fall through to getInitialLanguage()'s own default */
    }
};

/** A seeded bundle marks the language loaded, so the backend `read` never fires. */
export const seedCatalogBundles = (
    i18n: TResourceBundleHost,
    catalogs: Record<string, Record<string, string>>
): void => {
    i18n.addResourceBundle('EN', TRANSLATION_NAMESPACE, {});
    for (const [code, catalog] of Object.entries(catalogs)) {
        i18n.addResourceBundle(code, TRANSLATION_NAMESPACE, catalog);
    }
};
