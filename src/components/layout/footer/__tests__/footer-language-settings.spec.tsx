import { render, screen } from '@testing-library/react';
import Footer from '../index';

/**
 * With `platform.footer.enable_language_settings` false — the committed value — the
 * footer shows no language control, even when the modal manager reports it open.
 */

jest.mock('@/hooks/useApiBase', () => ({
    useApiBase: () => ({ isAuthorized: false }),
}));

jest.mock('@/hooks/useModalManager', () => ({
    __esModule: true,
    default: () => ({
        hideModal: jest.fn(),
        // Deliberately "already open": only the brand-config gate should keep it off.
        isModalOpenFor: () => true,
        showModal: jest.fn(),
    }),
}));

jest.mock('@deriv-com/ui', () => ({
    DesktopLanguagesModal: () => <div data-testid='desktop-languages-modal' />,
}));

jest.mock('../LanguageSettings', () => ({
    __esModule: true,
    default: () => <button data-testid='language-settings' />,
}));

jest.mock('../ChangeTheme', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../FullScreen', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../LogoutFooter', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../NetworkStatus', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../ServerTime', () => ({ __esModule: true, default: () => <div /> }));

describe('Footer language settings gating', () => {
    it('renders no language control and no modal when language settings are disabled', () => {
        render(<Footer />);

        expect(screen.queryByTestId('language-settings')).not.toBeInTheDocument();
        expect(screen.queryByTestId('desktop-languages-modal')).not.toBeInTheDocument();
    });
});
