/**
 * No-code Accumulators app config.
 *
 * Drives the EDITABLE parts of the real Accumulators app: the style variant of
 * the Growth rate, Stake, Take profit, Contract info and Buy controls, plus the
 * order of the blocks. The symbol dropdown, chart header, app header and
 * login/sign-up stay fixed. The theme colour is handled by the existing
 * branding pipeline (globals.css --primary).
 *
 * When no config is present the app renders exactly as today (default below).
 */

import { isStyleVariant, normalizeBlockOrder } from '@/lib/no-code-config';
import type { StyleVariant } from '@/lib/no-code-config';

export type { StyleVariant };

/** Styleable control rows (each has 3 style variants). */
export type ControlKey = 'growthRate' | 'stake' | 'takeProfit' | 'info' | 'buy';

/**
 * Reorderable layout blocks. Same as the control keys plus `chart` — the chart +
 * symbol-dropdown move together as a single block. The header stays fixed.
 */
export type BlockKey = ControlKey | 'chart';

export interface AccumulatorsAppConfig {
  styles: {
    growthRate: StyleVariant;
    stake: StyleVariant;
    takeProfit: StyleVariant;
    info: StyleVariant;
    buy: StyleVariant;
  };
  /** Top-to-bottom order of layout blocks (includes `chart`). */
  order: BlockKey[];
  /**
   * Chart options. `hidden` removes the price chart while keeping the symbol
   * dropdown (rendered standalone). The series colour itself isn't configurable
   * (SmartCharts is a Flutter canvas — theme dark/light only).
   */
  chart: {
    hidden: boolean;
  };
  /**
   * Buy button options. `pinned` lifts the Buy button out of the scrolling
   * column into a bar at the bottom of the mobile layout, directly above the
   * footer. Desktop is unaffected — its controls card grows to fit, so the Buy
   * button is never scrolled out of reach there.
   */
  buy: {
    pinned: boolean;
  };
}

export const ALL_CONTROL_KEYS: ControlKey[] = [
  'growthRate',
  'stake',
  'takeProfit',
  'info',
  'buy',
];

/** All reorderable blocks, in default order (chart first). */
export const ALL_BLOCK_KEYS: BlockKey[] = [
  'chart',
  'growthRate',
  'stake',
  'takeProfit',
  'info',
  'buy',
];

export const DEFAULT_APP_CONFIG: AccumulatorsAppConfig = {
  styles: { growthRate: 'a', stake: 'a', takeProfit: 'a', info: 'a', buy: 'a' },
  order: ['chart', 'growthRate', 'stake', 'takeProfit', 'info', 'buy'],
  chart: { hidden: false },
  buy: { pinned: true },
};

/** Validate + normalise an arbitrary value into a safe AccumulatorsAppConfig. */
export function normalizeAppConfig(value: unknown): AccumulatorsAppConfig {
  if (!value || typeof value !== 'object') return DEFAULT_APP_CONFIG;
  const raw = value as Partial<AccumulatorsAppConfig>;
  const styles = {
    growthRate: isStyleVariant(raw.styles?.growthRate) ? raw.styles!.growthRate : 'a',
    stake: isStyleVariant(raw.styles?.stake) ? raw.styles!.stake : 'a',
    takeProfit: isStyleVariant(raw.styles?.takeProfit) ? raw.styles!.takeProfit : 'a',
    info: isStyleVariant(raw.styles?.info) ? raw.styles!.info : 'a',
    buy: isStyleVariant(raw.styles?.buy) ? raw.styles!.buy : 'a',
  };
  const order = normalizeBlockOrder(raw.order, ALL_BLOCK_KEYS);
  // A stored config with no `buy` key predates the pin option: keep that app
  // unpinned rather than adopting the new default on its owner's behalf.
  return {
    styles,
    order,
    chart: { hidden: raw.chart?.hidden === true },
    buy: { pinned: !!raw.buy?.pinned },
  };
}
