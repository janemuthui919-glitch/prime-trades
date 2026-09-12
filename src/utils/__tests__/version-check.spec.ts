/**
 * The first-visit language wipe behind #804.
 *
 * `performVersionCheck` clears localStorage whenever `bot_version` is absent —
 * i.e. on every first visit. `app/i18n.ts` has already seeded the deploy's
 * language by then (ES imports are evaluated before the importing module's body,
 * and `main.tsx` imports `AuthWrapper` -> `App` -> `./i18n` on its first line), so
 * the clear used to take the language with it. i18next kept the right language in
 * memory, so the UI looked correct while storage was empty and every reader of
 * `getInitialLanguage()` fell back to EN.
 */
import { LANGUAGE_STORAGE_KEY } from '../../app/seed-translations';
import { BOT_VERSION_CONFIG } from '@/constants/bot-version';
import { performVersionCheck } from '../version-check';

jest.mock('js-cookie', () => ({ __esModule: true, default: { remove: jest.fn() } }));

describe('performVersionCheck', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    describe('first visit (no bot_version, so storage is cleared)', () => {
        beforeEach(() => {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify('FR'));
            localStorage.setItem('dbot_settings', '{"a":1}');
            performVersionCheck();
        });

        it('keeps the seeded language, so the OAuth lang is not EN on a first login', () => {
            expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(JSON.stringify('FR'));
        });

        it('still clears everything else', () => {
            expect(localStorage.getItem('dbot_settings')).toBeNull();
        });

        it('still records the bot version, so the next visit does not clear again', () => {
            expect(localStorage.getItem(BOT_VERSION_CONFIG.STORAGE_KEY)).toBe(
                BOT_VERSION_CONFIG.REQUIRED_VERSION.toString()
            );
        });
    });

    it('leaves storage untouched once the version is valid', () => {
        localStorage.setItem(BOT_VERSION_CONFIG.STORAGE_KEY, BOT_VERSION_CONFIG.REQUIRED_VERSION.toString());
        localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify('PT'));
        localStorage.setItem('dbot_settings', '{"a":1}');

        performVersionCheck();

        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(JSON.stringify('PT'));
        expect(localStorage.getItem('dbot_settings')).toBe('{"a":1}');
    });

    it('writes no language key when none was seeded (an English deploy)', () => {
        performVersionCheck();
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it.each(['ES', 'FR', 'PT'])('preserves %s across the first-visit clear', code => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(code));
        performVersionCheck();
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(JSON.stringify(code));
    });
});
