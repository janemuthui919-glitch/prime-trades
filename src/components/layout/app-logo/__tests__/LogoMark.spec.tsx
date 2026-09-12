import { fireEvent, render, screen } from '@testing-library/react';
import { LOGO_CANDIDATES } from '../../../../utils/branding';
import { LogoMark } from '../LogoMark';

// Default to the old-BFF fallback (all extension candidates) so the probing tests
// exercise the full chain; individual tests reassign this to simulate a
// brand.config.json with platform.logo_path recorded. The mock factory closes over
// the variable, so reassignment takes effect on the next render.
let mockLogoCandidates: string[] = [];
jest.mock('../../../../utils/branding', () => {
    const actual = jest.requireActual('../../../../utils/branding');
    return {
        ...actual,
        getLogoCandidates: (): string[] => mockLogoCandidates,
    };
});

// No NEXT_PUBLIC_DERIV_APP_NAME / preview name in the test env, so getAppName()
// resolves to brand.config.json platform.name ("Deriv Trading Bot").
describe('LogoMark', () => {
    const originalAppBuild = process.env.NEXT_PUBLIC_APP_BUILD;

    beforeEach(() => {
        mockLogoCandidates = LOGO_CANDIDATES;
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_APP_BUILD = originalAppBuild;
    });

    it('renders the resolved app name', () => {
        render(<LogoMark />);
        expect(screen.getByText('Deriv Trading Bot')).toBeInTheDocument();
    });

    it('renders the logo image (first candidate) by default', () => {
        render(<LogoMark />);
        expect(screen.getByRole('img')).toHaveAttribute('src', '/logo.png');
    });

    it('falls back to the letter badge after every logo candidate fails', () => {
        render(<LogoMark />);
        // Candidates: /logo.png, /logo.jpg, /logo.jpeg, /logo.webp — error through all.
        for (let i = 0; i < 4; i++) {
            const img = screen.queryByRole('img');
            if (!img) break;
            fireEvent.error(img);
        }
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        // Letter badge shows the first letter of the app name.
        expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('skips logo file probing in the preview build and renders the letter badge', () => {
        // The static preview build (NEXT_PUBLIC_APP_BUILD=true) ships no public/logo.*; the
        // live App Builder logo arrives as a data URL via PREVIEW_BRANDING. With no live logo
        // yet, there should be no <img> probe (which would 404) — only the badge fallback.
        process.env.NEXT_PUBLIC_APP_BUILD = 'true';
        render(<LogoMark />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('hides the name text when preview showAppName is false', () => {
        process.env.NEXT_PUBLIC_APP_BUILD = 'true';
        const {
            setPreviewShowAppName,
        } = require('@/utils/live-branding-store') as typeof import('@/utils/live-branding-store');
        const { act } = require('@testing-library/react') as typeof import('@testing-library/react');
        act(() => {
            setPreviewShowAppName(false);
        });
        render(<LogoMark />);
        expect(screen.queryByText('Deriv Trading Bot')).not.toBeInTheDocument();
        act(() => {
            setPreviewShowAppName(true);
        });
    });

    it('renders only the letter badge when brand.config.json records no logo (logo_path: null)', () => {
        mockLogoCandidates = [];
        render(<LogoMark />);
        // The BFF said no logo ships — no <img> probe (which would 404), only the badge.
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('renders exactly the recorded logo_path when the BFF wrote one', () => {
        mockLogoCandidates = ['/logo.webp'];
        render(<LogoMark />);
        expect(screen.getByRole('img')).toHaveAttribute('src', '/logo.webp');
        // A failed load falls straight to the badge — no other extensions to guess.
        fireEvent.error(screen.getByRole('img'));
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('D')).toBeInTheDocument();
    });
});
