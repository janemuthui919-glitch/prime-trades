import { CATALOGS } from '@/translations';
import { initializeI18n } from '@deriv-com/translations';
import brandConfig from '../../brand.config.json';
import {
    applyBootLanguageClamp,
    LANGUAGE_STORAGE_KEY,
    persistSeedLanguage,
    resolveBootLanguageClamp,
    resolveSeedLanguage,
    seedCatalogBundles,
} from './seed-translations';

// Catalogs are statically imported, never fetched: a partner deploy has no origin
// or CDN we control.

// Seeding must precede initializeI18n, which resolves the language itself and never
// reads brand.config.
const urlLang = new URLSearchParams(window.location.search).get('lang');
const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const bundledCodes = Object.keys(CATALOGS);

const seedLanguage = resolveSeedLanguage({
    urlLang,
    storedLang,
    configuredDefault: brandConfig.platform?.i18n?.default_language,
    bundledCodes,
});
if (seedLanguage) persistSeedLanguage(seedLanguage);

// Both inputs are clamped here, before initializeI18n resolves the language from them.
applyBootLanguageClamp(resolveBootLanguageClamp({ urlLang, storedLang, bundledCodes }));

const i18nInstance = initializeI18n({ cdnUrl: '' });

// The OTA backend in @deriv-com/translations unconditionally fetches
// `<cdnUrl>/translations/<lng>.json` for the active language — cdnUrl '' just makes
// that resolve to `/translations/en.json`, which 404s on both the App Builder
// preview (served under /bot/preview) and standalone partner deploys, since no
// translation JSON ships in either build. The 404 is swallowed (EN falls back to
// the inline i18n_default_text), but the browser still logs the failed request.
//
// Seeding a bundle marks its language as already loaded, so i18next's connector
// skips the backend `read` for it and the fetch never happens. This is synchronous
// while i18next defers loadResources to a setTimeout, so the bundles are in place
// before the load runs. EN renders from the inline i18n_default_text either way.
seedCatalogBundles(i18nInstance, CATALOGS);

export default i18nInstance;
