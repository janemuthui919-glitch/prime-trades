import Cookies from 'js-cookie';
import { BOT_VERSION_CONFIG } from '@/constants/bot-version';
// Relative, not `@/app/...`: jest's moduleNameMapper aliases one directory at a
// time and has no `@/app/` entry.
import { LANGUAGE_STORAGE_KEY } from '../app/seed-translations';

/**
 * Clears all localStorage data except for the bot_version and the language.
 *
 * The language has to survive for the same reason the version does: this runs on
 * every first visit (no `bot_version` yet), and `app/i18n.ts` has *already* seeded
 * the deploy's configured language by then. `main.tsx` calls this before its own
 * body does anything else, but ES imports are evaluated before the importing
 * module's body — and `main.tsx` imports `AuthWrapper` -> `App` -> `./i18n` on its
 * first line — so the seed is unavoidably earlier. Clearing it left i18next holding
 * the right language in memory (the UI was French) while storage was empty, so
 * every later reader of `getInitialLanguage()` — the OAuth `lang`, the redirect and
 * transfer URLs, static links — fell back to EN. That is why a first login landed
 * on an English screen and only the second was French (#804).
 */
const clearLocalStorage = (): void => {
    try {
        // Get the current bot_version before clearing
        const currentBotVersion = localStorage.getItem(BOT_VERSION_CONFIG.STORAGE_KEY);
        const currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

        // Clear all localStorage
        localStorage.clear();

        // Restore the bot_version if it existed
        if (currentBotVersion) {
            localStorage.setItem(BOT_VERSION_CONFIG.STORAGE_KEY, currentBotVersion);
        }

        // Restore the language the app is already rendering in.
        if (currentLanguage) {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
        }
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};

/**
 * Clears all cookies for the current domain and parent domains
 */
const clearCookies = (): void => {
    try {
        // Get all cookies
        const cookies = document.cookie.split(';');

        // Clear each cookie for different domain variations
        const domains = [`.${document.domain.split('.').slice(-2).join('.')}`, `.${document.domain}`, document.domain];

        const paths = ['/', window.location.pathname.split('/', 2)[1] || ''];

        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            if (cookieName) {
                // Remove cookie for different domain and path combinations
                domains.forEach(domain => {
                    paths.forEach(path => {
                        Cookies.remove(cookieName, { domain, path });
                    });
                });
                // Also try removing without domain/path
                Cookies.remove(cookieName);
            }
        });
    } catch (error) {
        console.error('Error clearing cookies:', error);
    }
};

/**
 * Sets the bot version in localStorage to prevent infinite clearing
 */
const setBotVersion = (): void => {
    try {
        localStorage.setItem(BOT_VERSION_CONFIG.STORAGE_KEY, BOT_VERSION_CONFIG.REQUIRED_VERSION.toString());
    } catch (error) {
        console.error('Error setting bot version:', error);
    }
};

/**
 * Checks if the current bot version matches the required version
 * @returns true if version matches or is not set, false if version is different
 */
const isVersionValid = (): boolean => {
    try {
        const currentVersion = localStorage.getItem(BOT_VERSION_CONFIG.STORAGE_KEY);

        // If no version is set, consider it invalid (needs clearing)
        if (currentVersion === null) {
            return false;
        }

        // Parse the version and check if it matches
        const versionNumber = parseInt(currentVersion, 10);
        return versionNumber === BOT_VERSION_CONFIG.REQUIRED_VERSION;
    } catch (error) {
        console.error('Error checking bot version:', error);
        return false;
    }
};

/**
 * Performs version check and clears storage if necessary
 * This function should be called at the very beginning of app initialization
 * before any other localStorage or cookie operations
 */
export const performVersionCheck = (): void => {
    console.log('Performing bot version check...');

    if (!isVersionValid()) {
        console.log('Bot version mismatch or not set. Clearing localStorage and cookies...');

        // Clear all storage
        clearLocalStorage();
        clearCookies();

        // Set the correct version to prevent infinite clearing
        setBotVersion();

        console.log('Storage cleared and bot version set to:', BOT_VERSION_CONFIG.REQUIRED_VERSION);
    } else {
        console.log('Bot version is valid:', BOT_VERSION_CONFIG.REQUIRED_VERSION);
    }
};
