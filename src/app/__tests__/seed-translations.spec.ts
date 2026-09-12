import {
    applyBootLanguageClamp,
    LANGUAGE_STORAGE_KEY,
    persistSeedLanguage,
    resolveBootLanguageClamp,
    resolveSeedLanguage,
    seedCatalogBundles,
} from '../seed-translations';

const BUNDLED = ['ES', 'FR', 'PT'];

describe('resolveSeedLanguage', () => {
    it('seeds the configured default when the user has expressed no choice', () => {
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: null,
                configuredDefault: 'FR',
                bundledCodes: BUNDLED,
            })
        ).toBe('FR');
    });

    it('seeds nothing for an EN default, leaving no stored preference behind', () => {
        // EN is already `fallbackLng`, so writing it would only pin returning
        // visitors to a preference they never expressed.
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: null,
                configuredDefault: 'EN',
                bundledCodes: BUNDLED,
            })
        ).toBeNull();
    });

    it('never overrides a ?lang= parameter', () => {
        expect(
            resolveSeedLanguage({
                urlLang: 'pt',
                storedLang: null,
                configuredDefault: 'FR',
                bundledCodes: BUNDLED,
            })
        ).toBeNull();
    });

    it('never overrides a stored preference', () => {
        // Switching to English once must survive the next reload.
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: '"EN"',
                configuredDefault: 'FR',
                bundledCodes: BUNDLED,
            })
        ).toBeNull();
    });

    it('ignores a default that is not a bundled language', () => {
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: null,
                configuredDefault: 'DE',
                bundledCodes: BUNDLED,
            })
        ).toBeNull();
    });

    it('stays inert when nothing is bundled, even for an EN default', () => {
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: null,
                configuredDefault: 'EN',
                bundledCodes: [],
            })
        ).toBeNull();
    });

    it('ignores an absent default', () => {
        expect(
            resolveSeedLanguage({
                urlLang: null,
                storedLang: null,
                configuredDefault: undefined,
                bundledCodes: BUNDLED,
            })
        ).toBeNull();
    });
});

describe('persistSeedLanguage', () => {
    it('writes the JSON-quoted form the translation library reads back', () => {
        // The library JSON.parses this value and writes it back the same way.
        persistSeedLanguage('FR');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"FR"');
    });

    it('does not throw when the browser rejects the write', () => {
        // This runs at module scope before createRoot().render(), so a throw would
        // be an uncatchable blank page.
        const setItem = jest
            .spyOn(Storage.prototype, 'setItem')
            .mockImplementation(() => {
                throw new DOMException('QuotaExceededError');
            });

        expect(() => persistSeedLanguage('FR')).not.toThrow();
        expect(setItem).toHaveBeenCalled();

        setItem.mockRestore();
    });
});

describe('resolveBootLanguageClamp', () => {
    it('strips a ?lang= this build cannot render', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: 'de', storedLang: null, bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: true, clearStoredLang: false });
    });

    it('clears a stored preference this build cannot render', () => {
        // A partner who switched to FR before the app was reassembled as English-only.
        expect(
            resolveBootLanguageClamp({ urlLang: null, storedLang: '"DE"', bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: false, clearStoredLang: true });
    });

    it('clears both when neither the parameter nor the stored value is offered', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: 'zz', storedLang: '"DE"', bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: true, clearStoredLang: true });
    });

    it('leaves an offered parameter and an offered stored value alone', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: 'fr', storedLang: '"ES"', bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: false, clearStoredLang: false });
    });

    it('leaves English alone, which every build renders', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: 'en', storedLang: '"EN"', bundledCodes: [] })
        ).toEqual({ stripUrlLang: false, clearStoredLang: false });
    });

    it('clamps everything but English when nothing is bundled', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: 'fr', storedLang: '"FR"', bundledCodes: [] })
        ).toEqual({ stripUrlLang: true, clearStoredLang: true });
    });

    it('reads a stored value the library has not yet JSON-quoted', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: null, storedLang: 'FR', bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: false, clearStoredLang: false });
    });

    it('clamps nothing when neither is set', () => {
        expect(
            resolveBootLanguageClamp({ urlLang: null, storedLang: null, bundledCodes: BUNDLED })
        ).toEqual({ stripUrlLang: false, clearStoredLang: false });
    });
});

describe('applyBootLanguageClamp', () => {
    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, '', '/bot/preview');
    });

    it('removes the lang parameter, keeping the deployment sub-path and other parameters', () => {
        window.history.replaceState({}, '', '/bot/preview?lang=de&foo=bar');

        applyBootLanguageClamp({ stripUrlLang: true, clearStoredLang: false });

        expect(window.location.pathname).toBe('/bot/preview');
        expect(window.location.search).toBe('?foo=bar');
    });

    it('removes the stored preference, so the library falls back to English', () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, '"DE"');

        applyBootLanguageClamp({ stripUrlLang: false, clearStoredLang: true });

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it('touches nothing when there is nothing to clamp', () => {
        window.history.replaceState({}, '', '/bot/preview?lang=fr');
        localStorage.setItem(LANGUAGE_STORAGE_KEY, '"FR"');

        applyBootLanguageClamp({ stripUrlLang: false, clearStoredLang: false });

        expect(window.location.search).toBe('?lang=fr');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"FR"');
    });

    it('does not throw when the browser rejects either write', () => {
        // Module scope, before createRoot().render() — a throw is an uncatchable blank page.
        const replaceState = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {
            throw new DOMException('SecurityError');
        });
        const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new DOMException('SecurityError');
        });

        expect(() => applyBootLanguageClamp({ stripUrlLang: true, clearStoredLang: true })).not.toThrow();
        expect(replaceState).toHaveBeenCalled();
        expect(removeItem).toHaveBeenCalled();

        replaceState.mockRestore();
        removeItem.mockRestore();
    });
});

describe('seedCatalogBundles', () => {
    it('registers an empty EN bundle plus one bundle per catalog', () => {
        const addResourceBundle = jest.fn();

        seedCatalogBundles({ addResourceBundle }, { FR: { '123': 'Bonjour' } });

        expect(addResourceBundle.mock.calls).toEqual([
            ['EN', 'translation', {}],
            ['FR', 'translation', { '123': 'Bonjour' }],
        ]);
    });

    it('registers only the empty EN bundle when no catalog is bundled', () => {
        const addResourceBundle = jest.fn();

        seedCatalogBundles({ addResourceBundle }, {});

        expect(addResourceBundle.mock.calls).toEqual([['EN', 'translation', {}]]);
    });
});
