import React from 'react';
import { Joyride, type EventData, type Options, type Step, type Styles } from 'react-joyride';
import { localize } from '@deriv-com/translations';

const common_tour_button_properties: React.CSSProperties = {
    fontWeight: '700',
    fontSize: '1.4rem',
    height: '4rem',
    padding: '1rem 1.6rem',
};

/** Legacy v2 styles shape still used by tour callers (options + buttonNext). */
type TLegacyTourStyles = Partial<Styles> & {
    options?: Partial<Options> & {
        arrowColor?: string;
        backgroundColor?: string;
        primaryColor?: string;
        textColor?: string;
        width?: number | string;
    };
    buttonNext?: React.CSSProperties;
};

/** v2 step flags that joyride v3 renamed or folded into `options`. */
type TLegacyStep = Step & {
    disableBeacon?: boolean;
    hideBackButton?: boolean;
    disableOverlay?: boolean;
    disableCloseOnEsc?: boolean;
    spotlightClicks?: boolean;
    disableOverlayClose?: boolean;
};

interface IReactJoyrideWrapperProps {
    steps: TLegacyStep[];
    styles?: TLegacyTourStyles;
    handleCallback: (data: EventData) => void;
    spotlightClicks?: boolean;
    disableCloseOnEsc?: boolean;
    disableOverlay?: boolean;
    disableOverlayClose?: boolean;
}

function mapLegacyStep(step: TLegacyStep): Step {
    const {
        disableBeacon,
        hideBackButton,
        disableOverlay,
        disableCloseOnEsc,
        spotlightClicks,
        disableOverlayClose,
        ...rest
    } = step;

    const mapped: Step = { ...rest };

    if (disableBeacon !== undefined) mapped.skipBeacon = disableBeacon;
    if (disableOverlay !== undefined) mapped.hideOverlay = disableOverlay;
    if (disableCloseOnEsc) mapped.dismissKeyAction = false;
    if (disableOverlayClose) mapped.overlayClickAction = false;
    if (spotlightClicks !== undefined) mapped.blockTargetInteraction = !spotlightClicks;
    if (hideBackButton) mapped.buttons = ['close', 'primary'];

    return mapped;
}

const ReactJoyrideWrapper: React.FC<IReactJoyrideWrapperProps> = ({
    steps,
    styles,
    handleCallback,
    spotlightClicks,
    disableCloseOnEsc,
    disableOverlay,
    disableOverlayClose,
}) => {
    const { options: legacy_options, buttonNext, ...style_rest } = styles ?? {};

    return (
        <Joyride
            run
            steps={steps.map(mapLegacyStep)}
            continuous
            onEvent={handleCallback}
            locale={{ back: localize('Previous'), next: localize('Next') }}
            options={{
                arrowColor: legacy_options?.arrowColor ?? 'var(--general-main-2)',
                backgroundColor: legacy_options?.backgroundColor ?? 'var(--general-main-2)',
                primaryColor: legacy_options?.primaryColor ?? 'var(--brand-red-coral)',
                textColor: legacy_options?.textColor ?? 'var(--text-general)',
                width: legacy_options?.width ?? 440,
                ...legacy_options,
                ...(disableCloseOnEsc ? { dismissKeyAction: false as const } : {}),
                ...(disableOverlayClose ? { overlayClickAction: false as const } : {}),
                ...(disableOverlay !== undefined ? { hideOverlay: disableOverlay } : {}),
                ...(spotlightClicks !== undefined ? { blockTargetInteraction: !spotlightClicks } : {}),
            }}
            styles={{
                buttonBack: {
                    border: '0.2rem solid var(--text-less-prominent)',
                    marginInlineEnd: '1rem',
                    borderRadius: '0.4rem',
                    color: 'var(--text-general)',
                    ...common_tour_button_properties,
                },
                buttonPrimary: {
                    ...common_tour_button_properties,
                    ...buttonNext,
                },
                buttonClose: {
                    insetInlineEnd: '0px',
                    right: 'unset',
                },
                overlay: {
                    height: '100vh',
                    width: '100vw',
                },
                // v3 dropped options.spotlightShadow; SVG cutout takes filter instead of box-shadow.
                spotlight: {
                    filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.5))',
                },
                ...style_rest,
            }}
        />
    );
};

export default ReactJoyrideWrapper;
