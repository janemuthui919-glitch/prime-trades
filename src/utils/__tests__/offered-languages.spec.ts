type TOfferedLanguagesModule = typeof import('../offered-languages');

/**
 * `CATALOGS` is a static import, so each bundle shape needs the module re-required
 * under a different mock.
 */
const withCatalogs = (
    catalogs: Record<string, Record<string, string>>,
    assertion: (module: TOfferedLanguagesModule) => void
) => {
    jest.isolateModules(() => {
        jest.doMock('@/translations', () => ({ CATALOGS: catalogs }));
        assertion(require('../offered-languages'));
    });
};

const codesOf = (module: TOfferedLanguagesModule) =>
    module.getOfferedLanguages().map(language => language.code);

describe('getOfferedLanguages', () => {
    it('offers English plus every bundled language, in table order', () => {
        withCatalogs({ ES: {}, FR: {}, PT: {} }, module => {
            expect(codesOf(module)).toEqual(['EN', 'ES', 'FR', 'PT']);
            expect(module.getOfferedLanguages().map(language => language.displayName)).toEqual([
                'English',
                'Español',
                'Français',
                'Português',
            ]);
        });
    });

    it('offers only English and the one language a single-language build bundles', () => {
        withCatalogs({ FR: {} }, module => {
            expect(codesOf(module)).toEqual(['EN', 'FR']);
        });
    });

    it('offers English alone when nothing is bundled', () => {
        // An empty `CATALOGS` is the App Builder's English-only artifact.
        withCatalogs({}, module => {
            expect(module.getOfferedLanguages()).toEqual([{ code: 'EN', displayName: 'English' }]);
        });
    });

    it('skips a bundled language with no display name rather than rendering it blank', () => {
        withCatalogs({ FR: {}, XX: {} }, module => {
            expect(codesOf(module)).toEqual(['EN', 'FR']);
        });
    });
});

describe('OFFERED_LANGUAGES', () => {
    it('holds the same list `getOfferedLanguages()` computes', () => {
        withCatalogs({ ES: {}, FR: {}, PT: {} }, module => {
            expect(module.OFFERED_LANGUAGES).toEqual(module.getOfferedLanguages());
        });
    });

    it('is evaluated once, so the languages prop keeps a stable identity across renders', () => {
        withCatalogs({ ES: {}, FR: {} }, module => {
            expect(module.OFFERED_LANGUAGES).toBe(module.OFFERED_LANGUAGES);
            expect(module.getOfferedLanguages()).not.toBe(module.OFFERED_LANGUAGES);
        });
    });
});

describe('isOfferedLanguage', () => {
    it('accepts English and every bundled language', () => {
        withCatalogs({ ES: {}, FR: {} }, module => {
            expect(module.isOfferedLanguage('EN')).toBe(true);
            expect(module.isOfferedLanguage('ES')).toBe(true);
            expect(module.isOfferedLanguage('FR')).toBe(true);
        });
    });

    it('rejects a language this build cannot render', () => {
        withCatalogs({ FR: {} }, module => {
            expect(module.isOfferedLanguage('DE')).toBe(false);
            expect(module.isOfferedLanguage('ZZ')).toBe(false);
        });
    });

    it('accepts English alone when nothing is bundled', () => {
        withCatalogs({}, module => {
            expect(module.isOfferedLanguage('EN')).toBe(true);
            expect(module.isOfferedLanguage('DE')).toBe(false);
            expect(module.isOfferedLanguage('ZZ')).toBe(false);
        });
    });
});
