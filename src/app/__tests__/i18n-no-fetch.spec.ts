/**
 * Drives a real i18next instance against a recording backend: `i18n.spec.ts` mocks
 * `initializeI18n` wholesale, so its no-fetch assertion cannot fail.
 */
import i18next, { type i18n as I18nInstance } from 'i18next';
import {
    applyBootLanguageClamp,
    LANGUAGE_STORAGE_KEY,
    resolveBootLanguageClamp,
    seedCatalogBundles,
} from '../seed-translations';

const TRANSLATION_NAMESPACE = 'translation';

/** A backend that records what it was asked to load instead of fetching it. */
const recordingBackend = (reads: string[]) => ({
    type: 'backend' as const,
    init: () => undefined,
    read: (language: string, namespace: string, callback: (err: unknown, data: Record<string, string>) => void) => {
        reads.push(`${language}/${namespace}`);
        callback(null, {});
    },
});

const initInstance = (reads: string[], lng = 'FR'): I18nInstance => {
    const instance = i18next.createInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instance.use(recordingBackend(reads) as any).init({
        lng,
        fallbackLng: 'EN',
        ns: [TRANSLATION_NAMESPACE],
        defaultNS: TRANSLATION_NAMESPACE,
        interpolation: { escapeValue: false },
    });
    return instance;
};

/** Let i18next's deferred loadResources run. */
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('bundled catalogs make the translation backend unreachable', () => {
    it('never asks the backend for a language whose bundle was seeded', async () => {
        const reads: string[] = [];
        const instance = initInstance(reads);

        // Exactly what src/app/i18n.ts does, in the same order.
        instance.addResourceBundle('EN', TRANSLATION_NAMESPACE, {});
        instance.addResourceBundle('FR', TRANSLATION_NAMESPACE, {
            '123': 'Annuler',
        });

        await flush();

        expect(reads.filter(read => read.startsWith('FR/'))).toEqual([]);
        expect(instance.t('123')).toBe('Annuler');
    });

    it('DOES ask the backend for a language with no bundle (negative control)', async () => {
        const reads: string[] = [];
        const instance = initInstance(reads);

        // FR is the active language and has no bundle.
        instance.addResourceBundle('EN', TRANSLATION_NAMESPACE, {});

        await flush();

        expect(reads.filter(read => read.startsWith('FR/'))).not.toEqual([]);
    });
});

/** Mirrors getInitialLanguage() in @deriv-com/translations, which jest maps to a mock. */
const resolveBootLanguage = (): string => {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang) return urlLang.toUpperCase();

    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!storedLang) return 'EN';
    try {
        return String(JSON.parse(storedLang));
    } catch {
        return storedLang;
    }
};

describe('an English-only artifact never reaches the backend', () => {
    // What the App Builder emits for an English deploy, which ships no catalog to serve.
    const NO_CATALOGS = {};

    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, '', '/bot/preview');
    });

    const bootAfterClamp = async (reads: string[]) => {
        applyBootLanguageClamp(
            resolveBootLanguageClamp({
                urlLang: new URLSearchParams(window.location.search).get('lang'),
                storedLang: localStorage.getItem(LANGUAGE_STORAGE_KEY),
                bundledCodes: Object.keys(NO_CATALOGS),
            })
        );

        // Exactly what src/app/i18n.ts does, in the same order.
        const instance = initInstance(reads, resolveBootLanguage());
        seedCatalogBundles(instance, NO_CATALOGS);

        await flush();
        return instance;
    };

    it('boots English despite a stored language it cannot render', async () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, '"FR"');
        const reads: string[] = [];

        const instance = await bootAfterClamp(reads);

        expect(instance.language).toBe('EN');
        expect(reads).toEqual([]);
    });

    it('boots English despite a ?lang= it cannot render', async () => {
        // ?lang= outranks storage, so clamping storage alone would not be enough.
        window.history.replaceState({}, '', '/bot/preview?lang=de');
        const reads: string[] = [];

        const instance = await bootAfterClamp(reads);

        expect(instance.language).toBe('EN');
        expect(window.location.search).toBe('');
        expect(reads).toEqual([]);
    });
});
