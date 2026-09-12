import { render, screen } from '@testing-library/react';
import MobileMenu from '../mobile-menu';

/**
 * The mobile counterpart of the footer gating check: with
 * `platform.footer.enable_language_settings` false, the drawer offers no language
 * entry point even when the modal manager reports it open.
 */

// Built inside the factory: jest hoists jest.mock above module-scope consts.
jest.mock('@deriv-com/ui', () => {
    type TChildren = { children?: React.ReactNode };
    const Drawer = ({ children }: TChildren) => <div>{children}</div>;
    Drawer.Header = ({ children }: TChildren) => <div>{children}</div>;
    Drawer.Content = ({ children }: TChildren) => <div>{children}</div>;
    Drawer.Footer = ({ children }: TChildren) => <div>{children}</div>;

    return {
        Drawer,
        MobileLanguagesDrawer: () => <div data-testid='mobile-languages-drawer' />,
        useDevice: () => ({ isDesktop: false }),
    };
});

jest.mock('@/hooks/useModalManager', () => ({
    __esModule: true,
    default: () => ({
        hideModal: jest.fn(),
        // Deliberately "already open": only the brand-config gate should keep it off.
        isModalOpenFor: () => true,
        showModal: jest.fn(),
    }),
}));

jest.mock('@/hooks/useStore', () => ({ useStore: () => ({ client: {} }) }));

jest.mock('../use-mobile-menu-config', () => ({
    __esModule: true,
    default: () => ({ hasMenuItems: true }),
}));

jest.mock('../menu-header', () => ({
    __esModule: true,
    default: ({ hideLanguageSetting }: { hideLanguageSetting: boolean }) =>
        hideLanguageSetting ? null : <button data-testid='language-setting-entry' />,
}));

jest.mock('../menu-content', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../back-button', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../reports-submenu', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../toggle-button', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../footer/NetworkStatus', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('../../../footer/ServerTime', () => ({ __esModule: true, default: () => <div /> }));

describe('MobileMenu language settings gating', () => {
    it('renders no language entry point and no drawer when language settings are disabled', () => {
        render(<MobileMenu />);

        expect(screen.queryByTestId('language-setting-entry')).not.toBeInTheDocument();
        expect(screen.queryByTestId('mobile-languages-drawer')).not.toBeInTheDocument();
    });
});
