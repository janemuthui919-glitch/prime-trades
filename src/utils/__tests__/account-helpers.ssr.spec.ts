/** @jest-environment node */

import { getDeviceType } from '../account-helpers';

describe('account-helpers SSR behavior', () => {
    it('should return "desktop" when window is unavailable', () => {
        expect(globalThis.window).toBeUndefined();
        expect(getDeviceType()).toBe('desktop');
    });
});
