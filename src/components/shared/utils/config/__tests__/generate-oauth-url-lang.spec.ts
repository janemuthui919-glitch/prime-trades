/**
 * The template half of #804: the URL builder can append `lang`, but only if the
 * caller reads the language the app is actually rendering in.
 */
jest.mock('@deriv-com/translations', () => ({
    getInitialLanguage: jest.fn(() => 'EN'),
}));

jest.mock('@/services/derivws-accounts.service', () => ({
    DerivWSAccountsService: { getAuthenticatedWebSocketURL: jest.fn() },
}));

const buildAuthorizationUrl = jest.fn(async () => 'https://auth/login');
const buildSignUpUrl = jest.fn(async () => 'https://auth/signup');

jest.mock('@/external/deriv-core', () => ({
    buildAuthorizationUrl: (...args: unknown[]) => buildAuthorizationUrl(...(args as [])),
    buildSignUpUrl: (...args: unknown[]) => buildSignUpUrl(...(args as [])),
    getAuthInfo: jest.fn(() => null),
    parseReferralLink: jest.fn(() => null),
    parseLandingParams: jest.fn(() => null),
    resolveReferralViaProxy: jest.fn(async () => null),
}));

import { getInitialLanguage } from '@deriv-com/translations';
import { generateOAuthURL } from '../config';

describe('generateOAuthURL language', () => {
    const OLD_ENV = process.env.NEXT_PUBLIC_DERIV_APP_ID;

    beforeEach(() => {
        process.env.NEXT_PUBLIC_DERIV_APP_ID = '34hcV8bQLzHVDtLso8juw';
        (getInitialLanguage as jest.Mock).mockReturnValue('EN');
    });

    afterAll(() => {
        process.env.NEXT_PUBLIC_DERIV_APP_ID = OLD_ENV;
    });

    it.each(['ES', 'FR', 'PT'])('hands the login builder the app language %s', async (code) => {
        (getInitialLanguage as jest.Mock).mockReturnValue(code);
        await generateOAuthURL();
        expect(buildAuthorizationUrl).toHaveBeenCalledWith(expect.objectContaining({ lang: code }));
    });

    it('hands the sign-up builder the same language', async () => {
        (getInitialLanguage as jest.Mock).mockReturnValue('FR');
        await generateOAuthURL('registration');
        expect(buildSignUpUrl).toHaveBeenCalledWith(expect.objectContaining({ lang: 'FR' }));
    });

    it('still passes EN, so a login is never left to resolve its own language', async () => {
        await generateOAuthURL();
        expect(buildAuthorizationUrl).toHaveBeenCalledWith(expect.objectContaining({ lang: 'EN' }));
    });
});
