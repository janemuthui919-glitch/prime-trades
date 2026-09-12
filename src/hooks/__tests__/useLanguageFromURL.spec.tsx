import { renderHook } from '@testing-library/react';
import { useLanguageFromURL } from '../useLanguageFromURL';

const mockSwitchLanguage = jest.fn();

jest.mock('@deriv-com/translations', () => ({
    useTranslations: () => ({ switchLanguage: mockSwitchLanguage }),
}));

// `isOfferedLanguage` reads `CATALOGS` at call time, so a getter varies the bundle
// per test without module isolation, which would hand the hook a second React. The
// state lives in the factory, which also answers the import-time read.
type TCatalogsRef = { current: Record<string, Record<string, string>> };

jest.mock('@/translations', () => {
    const ref: TCatalogsRef = { current: {} };
    return {
        __ref: ref,
        get CATALOGS() {
            return ref.current;
        },
    };
});

const bundled = jest.requireMock<{ __ref: TCatalogsRef }>('@/translations').__ref;

const setUrl = (search: string) => {
    window.history.replaceState({}, '', `/bot/preview${search}`);
};

describe('useLanguageFromURL', () => {
    beforeEach(() => {
        mockSwitchLanguage.mockClear();
        localStorage.clear();
        setUrl('');
    });

    it('switches to a bundled language named by ?lang=', () => {
        bundled.current = { ES: {}, FR: {}, PT: {} };
        setUrl('?lang=fr');

        renderHook(() => useLanguageFromURL());

        expect(mockSwitchLanguage).toHaveBeenCalledWith('FR');
        expect(window.location.search).toBe('');
    });

    it('falls back to English when ?lang= names a language this build cannot render', () => {
        // Reporting German while rendering English text is the failure mode here.
        bundled.current = { FR: {} };
        setUrl('?lang=de');

        renderHook(() => useLanguageFromURL());

        expect(mockSwitchLanguage).toHaveBeenCalledWith('EN');
        expect(window.location.search).toBe('');
    });

    it('falls back to English for an unknown ?lang= value', () => {
        bundled.current = { ES: {}, FR: {}, PT: {} };
        setUrl('?lang=zz');

        renderHook(() => useLanguageFromURL());

        expect(mockSwitchLanguage).toHaveBeenCalledWith('EN');
        expect(window.location.search).toBe('');
    });

    it('falls back to English when nothing is bundled', () => {
        // An English-only artifact can render nothing else, whatever ?lang= asks for.
        bundled.current = {};
        setUrl('?lang=de');

        renderHook(() => useLanguageFromURL());

        expect(mockSwitchLanguage).toHaveBeenCalledWith('EN');
        expect(window.location.search).toBe('');
    });

    it('keeps the deployment sub-path when it strips the lang parameter', () => {
        bundled.current = { FR: {} };
        setUrl('?lang=fr&foo=bar');

        renderHook(() => useLanguageFromURL());

        expect(window.location.pathname).toBe('/bot/preview');
        expect(window.location.search).toBe('?foo=bar');
    });
});
