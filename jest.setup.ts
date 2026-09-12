import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { applyReact19DomPolyfills } from '@/utils/react19-dom-polyfills';

// React Router 8 expects Web Encoding APIs that jsdom does not provide by default.
Object.assign(globalThis, { TextDecoder, TextEncoder });
applyReact19DomPolyfills();

let originalLocalStorage: Storage;
const localStorageMock: Storage = {
    clear() {
        this.store = {};
    },
    getItem(key) {
        return this.store[key];
    },
    key() {
        return 'test key';
    },
    length: 0,
    removeItem(key) {
        delete this.store[key];
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    store: {},
};

export const mockLocalStorageBeforeEachTest = () => {
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
};

export const restoreLocalStorageAfterEachTest = () => {
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
};

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
        })),
    });
}

// Mock fetch for tests
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;
