import { CATALOGS } from '@/translations';

// Record into plain arrays, not jest.fns — the setup runs once at module import
// time, and jest's `clearMocks: true` would wipe a jest.fn's call log before the
// first test body executes.
const mockBundleCalls: unknown[][] = [];
const fetchedUrls: string[] = [];

jest.mock('@deriv-com/translations', () => ({
    initializeI18n: jest.fn(() => ({
        addResourceBundle: (...args: unknown[]) => mockBundleCalls.push(args),
    })),
}));

// `clearMocks` keeps implementations, so this recorder survives into the test
// bodies. Installed before the module under test is required.
(global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
    fetchedUrls.push(String(input));
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
});

// Boot state the clamp has to correct, planted before the module runs: a stored
// language this build cannot render, plus the same as a ?lang= param.
localStorage.setItem('i18n_language', JSON.stringify('DE'));
window.history.replaceState({}, '', '/bot/preview?lang=de&keep=1');

// Required rather than imported so it runs after the recorder above is in place.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const i18nInstance = require('../i18n').default;

describe('bot i18n setup', () => {
    // Regression: the OTA backend in @deriv-com/translations fetches
    // `<cdnUrl>/translations/<lng>.json` for the active language regardless of
    // cdnUrl. With cdnUrl '' that resolved to `/translations/en.json`, which 404'd
    // on both the App Builder preview (served under /bot/preview) and standalone
    // partner deploys (no translation JSON ships in either build). Seeding an empty
    // EN bundle before i18next's deferred loadResources runs makes it treat EN as
    // already loaded, so the backend `read` — and its fetch — never fires.
    it('seeds an empty EN translation bundle so the OTA backend never fetches /translations/en.json', () => {
        expect(mockBundleCalls).toContainEqual(['EN', 'translation', {}]);
    });

    it('seeds a resource bundle for every bundled catalog', () => {
        for (const [code, catalog] of Object.entries(CATALOGS)) {
            expect(mockBundleCalls).toContainEqual([code, 'translation', catalog]);
        }
    });

    it('registers exactly EN plus one bundle per catalog, and nothing else', () => {
        expect(mockBundleCalls.map(call => call[0])).toEqual(['EN', ...Object.keys(CATALOGS)]);
    });

    // Import-time only: `initializeI18n` is mocked here, so the no-fetch guarantee
    // itself is covered by ./i18n-no-fetch.spec.ts.
    it('issues no request during its own import-time setup', () => {
        expect(fetchedUrls.filter(url => url.includes('/translations/'))).toEqual([]);
    });

    // The helpers are unit-tested in seed-translations.spec.ts; these two assert
    // i18n.ts actually WIRES them in before initializeI18n. Without them, deleting
    // the applyBootLanguageClamp call is invisible to the whole suite — the same
    // helpers-right-wiring-unverified shape as the bug this clamp fixes.
    it('clears a stored language this build cannot render', () => {
        expect(localStorage.getItem('i18n_language')).toBeNull();
    });

    it('strips an unrenderable ?lang= while keeping the path and other params', () => {
        expect(window.location.search).toBe('?keep=1');
        expect(window.location.pathname).toBe('/bot/preview');
    });

    it('exports the initialized i18n instance', () => {
        expect(i18nInstance).toBeDefined();
    });
});
