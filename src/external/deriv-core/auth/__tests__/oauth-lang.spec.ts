/**
 * A Bot deployed in ES/FR/PT was sending its clients to an English login: the
 * authorize URL carried no `lang` (#804). `packages/core`'s twin already
 * appended it — bot's vendored copy had drifted.
 */
import { buildAuthorizationUrl, buildSignUpUrl } from '../oauth';
import type { AuthConfig } from '../../types';

jest.mock('../../config/urls', () => ({
    getAuthBaseUrl: () => 'https://staging-auth.deriv.com/oauth2',
}));

const config: AuthConfig = {
    clientId: 'app-id',
    redirectUri: 'https://partner.example.com',
};

/** PKCE needs a real digest; jsdom exposes no `crypto.subtle`. */
beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
        value: {
            getRandomValues: (array: Uint8Array) => {
                for (let i = 0; i < array.length; i += 1) array[i] = i % 256;
                return array;
            },
            subtle: {
                digest: async () => new Uint8Array(32).buffer,
            },
        },
        configurable: true,
    });
});

describe.each([
    ['buildAuthorizationUrl', buildAuthorizationUrl],
    ['buildSignUpUrl', buildSignUpUrl],
])('%s', (_name, build) => {
    it('forwards lang so the Deriv login continues in the app’s language', async () => {
        const url = await build({ ...config, lang: 'fr' });
        expect(new URL(url).searchParams.get('lang')).toBe('FR');
    });

    it('upper-cases the code, matching what the WebSocket handshake sends', async () => {
        const url = await build({ ...config, lang: 'pt' });
        expect(new URL(url).searchParams.get('lang')).toBe('PT');
    });

    it.each([undefined, ''])('omits lang entirely when the config carries %p', async (lang) => {
        const url = await build({ ...config, lang });
        expect(new URL(url).searchParams.has('lang')).toBe(false);
    });

    it('keeps the affiliate and utm params alongside lang', async () => {
        const url = await build({
            ...config,
            lang: 'es',
            affiliateToken: 'A7ANELWCRU7J',
            affiliateTokenParam: 'sidi',
            utmSource: 'affiliate_248640',
            utmMedium: 'affiliate',
            utmCampaign: 'dynamicworks',
        });
        const params = new URL(url).searchParams;
        expect(params.get('lang')).toBe('ES');
        expect(params.get('sidi')).toBe('A7ANELWCRU7J');
        expect(params.get('utm_source')).toBe('affiliate_248640');
        expect(params.get('utm_medium')).toBe('affiliate');
        expect(params.get('utm_campaign')).toBe('dynamicworks');
    });
});

it('sign-up keeps prompt=registration once lang is appended', async () => {
    const url = await buildSignUpUrl({ ...config, lang: 'fr' });
    const params = new URL(url).searchParams;
    expect(params.get('prompt')).toBe('registration');
    expect(params.get('lang')).toBe('FR');
});
