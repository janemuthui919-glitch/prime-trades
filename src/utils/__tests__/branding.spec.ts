import { getAppName, getShowAppName } from '../branding';

jest.mock('../../../brand.config.json', () => ({
    platform: {
        name: 'Display Bot',
        show_name: true,
    },
}));

describe('branding helpers', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME;

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.NEXT_PUBLIC_DERIV_APP_NAME;
        } else {
            process.env.NEXT_PUBLIC_DERIV_APP_NAME = originalEnv;
        }
    });

    it('prefers NEXT_PUBLIC_DERIV_APP_NAME over platform.name', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = 'Env Bot';
        expect(getAppName()).toBe('Env Bot');
    });

    it('falls back to platform.name when the env var is blank', () => {
        process.env.NEXT_PUBLIC_DERIV_APP_NAME = '   ';
        expect(getAppName()).toBe('Display Bot');
    });

    it('returns show_name from brand config (defaults true)', () => {
        expect(getShowAppName()).toBe(true);
    });
});
