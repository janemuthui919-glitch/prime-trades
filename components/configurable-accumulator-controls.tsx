'use client';

/**
 * Config-driven Accumulators trade controls.
 *
 * Renders the SAME functional controls as TradeControls, but Growth rate,
 * Stake, Take profit, Contract info and Buy each have 3 style variants, and the
 * rows render in a configurable order. Fully functional (uses the real trading
 * handlers + the active-position / close behaviour). Theme colour comes from the
 * app's --primary (existing branding pipeline), so `bg-primary` / `text-primary`
 * pick it up automatically.
 *
 * HARD CONSTRAINT: every variant is composed ONLY from components the
 * accumulators template already uses — <Select>, <Input>, <Button>, <Label>,
 * <Tooltip> and plain divs/text. No Switch, Slider, ToggleGroup or Checkbox.
 *
 * Used by the editor (/edit), preview (/preview) and the deployed app when an
 * AccumulatorsAppConfig is present. The original TradeControls is untouched.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Localize } from '@deriv-com/translations';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useRearrangeDrag } from '@/hooks/use-rearrange-drag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { BuyResult } from '@deriv/core';
import type { AccumulatorProposalInfo } from '../hooks/use-accumulator-proposal';
import type { GrowthRate, OpenPosition } from '../lib/types';
import type { BlockKey, ControlKey, AccumulatorsAppConfig, StyleVariant } from '../lib/app-config';

/** Human labels shown on each draggable block in rearrange mode. */
function getBlockLabels(localize: (text: string) => string): Record<BlockKey, string> {
  return {
    chart: localize('Chart + symbol'),
    growthRate: localize('Growth rate'),
    stake: localize('Stake'),
    takeProfit: localize('Take profit'),
    info: localize('Contract info'),
    buy: localize('Buy button'),
  };
}

/** Small "i" tooltip badge — same affordance the real TradeControls uses. */
function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] text-muted-foreground">
            i
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * The Buy button, in its three configurable styles — and the Close-position
 * button that replaces it while a trade is running (preserved across variants).
 *
 * Exported because the button has two homes: inline in the reorderable column
 * (the default), or lifted into the pinned bottom bar when `buy.pinned` is on —
 * and that bar is owned by the view, not by this component. One implementation
 * means the pinned button stays style-for-style identical to the inline one.
 */
export interface ConfigurableBuyButtonProps {
  variant: StyleVariant;
  isConnected: boolean;
  proposal: AccumulatorProposalInfo | null;
  onBuy: () => void;
  isBuying: boolean;
  activePosition?: OpenPosition | null;
  onClose?: (contractId: number, bidPrice: string) => void;
  isClosing?: boolean;
}

export function ConfigurableBuyButton({
  variant,
  isConnected,
  proposal,
  onBuy,
  isBuying,
  activePosition,
  onClose,
  isClosing,
}: ConfigurableBuyButtonProps) {
  if (activePosition && onClose) {
    const total = (parseFloat(activePosition.buy_price) + parseFloat(activePosition.profit)).toFixed(2);
    const closeShape =
      variant === 'b'
        ? 'rounded-md'
        : variant === 'c'
          ? 'rounded-xl'
          : 'rounded-full';
    return (
      <Button
        variant="outline"
        className={cn(
          'w-full border-black bg-white text-black hover:bg-white hover:text-black dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white/10',
          closeShape,
        )}
        size="lg"
        disabled={!isConnected || isClosing || !activePosition.is_valid_to_sell}
        onClick={() => onClose(activePosition.contract_id, activePosition.bid_price)}
      >
        {isClosing ? (
          <Localize i18n_default_text="Closing..." />
        ) : (
          <span className="flex flex-col items-center leading-tight gap-0.5">
            <span>
              <Localize i18n_default_text="Close" />
            </span>
            <span className="text-xs font-normal opacity-90">{total} {activePosition.currency}</span>
          </span>
        )}
      </Button>
    );
  }

  const disabled = !isConnected || !proposal || isBuying;

  const variants: Record<StyleVariant, () => React.ReactNode> = {
    // a — pill (default, exactly today's control)
    a: () => (
      <Button
        className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
        disabled={disabled}
        onClick={onBuy}
      >
        {isBuying ? (
          <Localize i18n_default_text="Purchasing..." />
        ) : (
          <Localize i18n_default_text="Buy" />
        )}
      </Button>
    ),
    // Block — squared, bold.
    b: () => (
      <Button
        className="w-full h-14 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-base font-bold"
        disabled={disabled}
        onClick={onBuy}
      >
        {isBuying ? (
          <Localize i18n_default_text="Purchasing..." />
        ) : (
          <Localize i18n_default_text="Buy" />
        )}
      </Button>
    ),
    // Gradient background.
    c: () => (
      <Button
        className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/70 hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
        disabled={disabled}
        onClick={onBuy}
      >
        {isBuying ? (
          <Localize i18n_default_text="Purchasing..." />
        ) : (
          <Localize i18n_default_text="Buy" />
        )}
      </Button>
    ),
  };
  return (variants[variant] ?? variants.a)();
}

export interface ConfigurableAccumulatorControlsProps {
  config: AccumulatorsAppConfig;
  growthRate: GrowthRate;
  onGrowthRateChange: (rate: GrowthRate) => void;
  growthRateOptions: { value: number; label: string }[];
  isConnected: boolean;
  stake: string;
  onStakeChange: (value: string) => void;
  takeProfit: string;
  onTakeProfitChange: (value: string) => void;
  proposal: AccumulatorProposalInfo | null;
  onBuy: () => void;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  onClearBuyResult: () => void;
  /** The currently active accumulator position (only 1 allowed at a time). */
  activePosition?: OpenPosition | null;
  /** Callback to sell/close the active position. */
  onClose?: (contractId: number, bidPrice: string) => void;
  /** Whether the close/sell action is in progress. */
  isClosing?: boolean;
  isAuthenticated?: boolean;
  /** Edit mode — control rows become selectable (click opens its accordion). */
  editMode?: boolean;
  /** Called when a control row is clicked in edit mode. */
  onSelect?: (key: ControlKey) => void;
  /** The currently selected control (highlighted). */
  selectedKey?: string | null;
  /**
   * Rearrange mode — blocks become draggable to reorder the layout directly in
   * the phone (chart + symbol move as one). Component editing is disabled while
   * on. Only meaningful together with `editMode`.
   */
  rearrangeMode?: boolean;
  /** Called with the new block order after a drag-drop reorder. */
  onReorder?: (order: BlockKey[]) => void;
  /**
   * The chart + symbol-dropdown block, rendered at the `chart` position in the
   * order. It manages its own edit selection, so it's placed as-is.
   */
  chartSlot?: React.ReactNode;
  /**
   * Buy is pinned to the bottom bar, which the view owns — so skip it here
   * rather than rendering it inline. Also keeps it out of rearrange mode: a
   * pinned button has no position to drag.
   */
  pinBuy?: boolean;
}

export function ConfigurableAccumulatorControls(props: ConfigurableAccumulatorControlsProps) {
  const {
    config,
    growthRate,
    onGrowthRateChange,
    growthRateOptions,
    isConnected,
    stake,
    onStakeChange,
    takeProfit,
    onTakeProfitChange,
    proposal,
    onBuy,
    isBuying,
    buyResult,
    buyError,
    onClearBuyResult,
    activePosition,
    onClose,
    isClosing,
    isAuthenticated,
    editMode,
    onSelect,
    selectedKey,
    rearrangeMode,
    onReorder,
    pinBuy,
    chartSlot,
  } = props;

  const { currentLang, localize } = useAppTranslations();
  const numberLocale = LANGUAGE_LOCALES[currentLang];
  const blockLabels = getBlockLabels(localize);

  const rearrange = useRearrangeDrag<BlockKey>(config.order, (next) => onReorder?.(next));

  // Flash the draggable blocks once — the first time the layout is unlocked in
  // this session — so the user notices the components can be dragged.
  const [hasFlashed, setHasFlashed] = useState(false);
  useEffect(() => {
    if (!rearrangeMode || hasFlashed) return;
    const timer = window.setTimeout(() => setHasFlashed(true), 2000);
    return () => window.clearTimeout(timer);
  }, [rearrangeMode, hasFlashed]);

  // Scroll the selected control into view in edit mode.
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    if (!editMode || !selectedKey) return;
    const el = rowRefs.current[selectedKey];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [editMode, selectedKey]);

  useEffect(() => {
    if (buyError) {
      toast.error(localize('Purchase Failed'), { description: buyError });
      onClearBuyResult();
    }
  }, [buyError, onClearBuyResult, localize]);
  useEffect(() => {
    if (buyResult) {
      toast.success(localize('Contract Purchased'), {
        description: localize(
          'Buy price: {{buy_price}} USD | Payout: {{payout}} USD | Balance: {{balance}} USD',
          {
            buy_price: buyResult.buyPrice.toFixed(2),
            payout: buyResult.payout.toFixed(2),
            balance: buyResult.balanceAfter.toFixed(2),
          }
        ),
      });
      onClearBuyResult();
    }
  }, [buyResult, onClearBuyResult, localize]);

  // ── Growth rate (3 styles) ──────────────────────────────────────────────
  // Real control = <Select> of the discrete 1–5% rates. Each variant sets the
  // exact same growthRate value via onGrowthRateChange.
  const renderGrowthRate = () => {
    const label = (
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">
          <Localize i18n_default_text="Growth rate" />
        </Label>
        <InfoTooltip
          text={localize(
            'Your stake grows by the selected percentage for each tick that stays within the barrier range.'
          )}
        />
      </div>
    );

    const variants: Record<StyleVariant, () => React.ReactNode> = {
      // a — <Select> dropdown (default, exactly today's control)
      a: () => (
        <div className="space-y-1.5">
          {label}
          <Select
            value={String(growthRate)}
            onValueChange={(value) => onGrowthRateChange(parseFloat(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {growthRateOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
      // Segmented row of <Button>s — one per rate.
      b: () => (
        <div className="space-y-1.5">
          {label}
          <div className="flex gap-1">
            {growthRateOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={growthRate === opt.value ? 'default' : 'outline'}
                size="sm"
                className={cn('flex-1 px-0', growthRate === opt.value && 'bg-primary text-primary-foreground')}
                onClick={() => onGrowthRateChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      ),
      // −/+ <Button> stepper cycling the discrete rates.
      c: () => {
        const idx = growthRateOptions.findIndex((option) => option.value === growthRate);
        const safeIdx = idx < 0 ? 0 : idx;
        const step = (delta: number) => {
          const next = growthRateOptions[safeIdx + delta];
          if (next) onGrowthRateChange(next.value);
        };
        const currentLabel = growthRateOptions[safeIdx]?.label ?? '';
        return (
          <div className="space-y-1.5">
            {label}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={safeIdx <= 0}
                onClick={() => step(-1)}
              >
                −
              </Button>
              <div className="flex flex-1 items-center justify-center rounded-md border border-border bg-background py-2 text-sm font-semibold">
                {currentLabel}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={safeIdx >= growthRateOptions.length - 1}
                onClick={() => step(1)}
              >
                +
              </Button>
            </div>
          </div>
        );
      },
    };
    return (variants[config.styles.growthRate] ?? variants.a)();
  };

  // ── Stake (3 styles) ────────────────────────────────────────────────────
  // Real control = USD <Input>.
  const renderStake = () => {
    const current = parseFloat(stake) || 0;
    const setStakeNum = (amount: number) => onStakeChange(String(Math.max(0, amount)));
    const stakeInput = (extraClass?: string) => (
      <Input
        id="stake"
        type="number"
        value={stake}
        onChange={(event) => onStakeChange(event.target.value)}
        onKeyDown={(event) => {
          if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
        }}
        min={0}
        step="0.01"
        labelRight="USD"
        className={extraClass}
      />
    );

    const variants: Record<StyleVariant, () => React.ReactNode> = {
      // a — plain <Input> (default, exactly today's control)
      a: () => (
        <div className="space-y-1.5">
          <Label htmlFor="stake" className="text-xs text-muted-foreground">
            <Localize i18n_default_text="Stake" />
          </Label>
          {stakeInput()}
        </div>
      ),
      // <Input> flanked by −/+ <Button> steppers.
      b: () => (
        <div className="space-y-1.5">
          <Label htmlFor="stake" className="text-xs text-muted-foreground">
            <Localize i18n_default_text="Stake" />
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setStakeNum(current - 1)}>−</Button>
            {stakeInput('text-center')}
            <Button variant="outline" size="icon" onClick={() => setStakeNum(current + 1)}>+</Button>
          </div>
        </div>
      ),
      // Preset chip <Button>s + <Input>.
      c: () => (
        <div className="space-y-1.5">
          <Label htmlFor="stake" className="text-xs text-muted-foreground">
            <Localize i18n_default_text="Stake" />
          </Label>
          <div className="flex gap-2">
            {['5', '10', '25', '50'].map((preset) => (
              <Button
                key={preset}
                variant={stake === preset ? 'default' : 'outline'}
                size="sm"
                className={cn('flex-1', stake === preset && 'bg-primary text-primary-foreground')}
                onClick={() => onStakeChange(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
          {stakeInput()}
        </div>
      ),
    };
    return (variants[config.styles.stake] ?? variants.a)();
  };

  // ── Take profit (3 styles) ──────────────────────────────────────────────
  // Real control = optional USD <Input>.
  const renderTakeProfit = () => {
    const current = parseFloat(takeProfit) || 0;
    const setTpNum = (amount: number) => onTakeProfitChange(String(Math.max(0, amount)));
    const tpInput = (extraClass?: string) => (
      <Input
        id="take-profit"
        type="number"
        value={takeProfit}
        onChange={(event) => onTakeProfitChange(event.target.value)}
        onKeyDown={(event) => {
          if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault();
        }}
        min={0}
        step="0.01"
        placeholder="-"
        labelRight="USD"
        className={extraClass}
      />
    );
    const label = (
      <div className="flex items-center gap-1.5">
        <Label htmlFor="take-profit" className="text-xs text-muted-foreground">
          <Localize i18n_default_text="Take profit" />
        </Label>
        <InfoTooltip
          text={localize(
            'The contract closes automatically when your profit reaches this amount. Leave empty for no limit.'
          )}
        />
      </div>
    );

    const variants: Record<StyleVariant, () => React.ReactNode> = {
      // a — plain <Input> (default, exactly today's control)
      a: () => (
        <div className="space-y-1.5">
          {label}
          {tpInput()}
        </div>
      ),
      // <Input> + −/+ steppers.
      b: () => (
        <div className="space-y-1.5">
          {label}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setTpNum(current - 1)}>−</Button>
            {tpInput('text-center')}
            <Button variant="outline" size="icon" onClick={() => setTpNum(current + 1)}>+</Button>
          </div>
        </div>
      ),
      // Preset chips + <Input>.
      c: () => (
        <div className="space-y-1.5">
          {label}
          <div className="flex gap-2">
            {['10', '25', '50', '100'].map((preset) => (
              <Button
                key={preset}
                variant={takeProfit === preset ? 'default' : 'outline'}
                size="sm"
                className={cn('flex-1', takeProfit === preset && 'bg-primary text-primary-foreground')}
                onClick={() => onTakeProfitChange(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
          {tpInput()}
        </div>
      ),
    };
    return (variants[config.styles.takeProfit] ?? variants.a)();
  };

  // ── Contract info (3 styles) ────────────────────────────────────────────
  // Real control = the Max payout / Barrier / Max duration summary. Each variant
  // restyles the SAME data and keeps the active-position summary behaviour.
  const renderInfo = () => {
    const variant = config.styles.info;

    // Active position summary — shown when a trade is running (behaviour kept
    // identical to TradeControls across all variants).
    if (activePosition) {
      const profit = parseFloat(activePosition.profit);
      const total = (parseFloat(activePosition.buy_price) + profit).toFixed(2);
      const wrapClass =
        variant === 'b'
          ? 'space-y-1.5 text-xs'
          : 'space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs';
      return (
        <div className={wrapClass}>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <Localize i18n_default_text="Stake" />
            </span>
            <span className="font-medium">{parseFloat(activePosition.buy_price).toFixed(2)} {activePosition.currency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <Localize i18n_default_text="Current P&L" />
            </span>
            <span className={`font-medium ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)} {activePosition.currency}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1.5">
            <span className="text-muted-foreground font-medium">
              <Localize i18n_default_text="Total return" />
            </span>
            <span className="font-semibold">{total} {activePosition.currency}</span>
          </div>
        </div>
      );
    }

    // Loading skeleton while waiting for the proposal.
    if (!proposal) {
      const skeletonWrap =
        variant === 'b'
          ? 'space-y-2.5 animate-pulse'
          : 'space-y-2.5 rounded-md border border-border bg-muted/30 p-3 animate-pulse';
      return (
        <div className={skeletonWrap}>
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-muted-foreground/20" />
            <div className="h-3 w-16 rounded bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-14 rounded bg-muted-foreground/20" />
            <div className="h-3 w-12 rounded bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-muted-foreground/20" />
            <div className="h-3 w-14 rounded bg-muted-foreground/20" />
          </div>
        </div>
      );
    }

    const maxPayout = proposal.maxPayout.toLocaleString(numberLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const rows: [string, string][] = [[localize('Max. payout'), `${maxPayout} USD`]];
    if (proposal.barrierPercentage) rows.push([localize('Barrier'), proposal.barrierPercentage]);
    if (proposal.maxTicks > 0) {
      rows.push([
        localize('Max. duration'),
        localize('{{ticks}} ticks', { ticks: proposal.maxTicks }),
      ]);
    }

    const variants: Record<StyleVariant, () => React.ReactNode> = {
      // a — bordered card (default, exactly today's control)
      a: () => (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      ),
      // Plain rows — no border/background.
      b: () => (
        <div className="space-y-1.5 text-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      ),
      // Compact one-line — same data condensed with separators.
      c: () => (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-xs">
          {rows.map(([, value], index) => (
            <span key={value} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground">·</span>}
              <span className="font-medium">{value}</span>
            </span>
          ))}
        </div>
      ),
    };
    return (variants[variant] ?? variants.a)();
  };

  // ── Buy / Close (3 styles, themed) ──────────────────────────────────────
  const renderBuy = () => (
    <ConfigurableBuyButton
      variant={config.styles.buy}
      isConnected={isConnected}
      proposal={proposal}
      onBuy={onBuy}
      isBuying={isBuying}
      activePosition={activePosition}
      onClose={onClose}
      isClosing={isClosing}
    />
  );

  const renderers: Record<ControlKey, () => React.ReactNode> = {
    growthRate: renderGrowthRate,
    stake: renderStake,
    takeProfit: renderTakeProfit,
    info: renderInfo,
    buy: renderBuy,
  };

  if (editMode && rearrangeMode) {
    // Rearrange mode: every block (incl. the chart + symbol, which move as one)
    // is draggable. Inner content is inert so dragging never triggers a control.
    return (
      <div className="w-full space-y-2">
        {config.order.map((key) => {
          const isChart = key === 'chart';
          // Desktop: chart lives in its own fixed left column (no chartSlot here).
          if (isChart && !chartSlot) return null;
          if (key === 'buy' && pinBuy) return null;
          const dragging = rearrange.draggingKey === key;
          const over = rearrange.overKey === key;
          return (
            <div
              key={key}
              {...rearrange.getItemProps(key)}
              className={cn(
                'group relative cursor-grab rounded-xl border-2 border-dashed bg-card/40 transition-all active:cursor-grabbing',
                !hasFlashed && 'nocode-drag-hint',
                'border-border',
                !rearrange.isDragging && 'hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm',
                over && 'border-primary bg-primary/10 ring-2 ring-primary/40',
                dragging && 'opacity-40',
              )}
            >
              <div
                className={cn(
                  'absolute left-2 top-2 z-[70] flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border transition-colors',
                  !rearrange.isDragging && 'group-hover:text-primary group-hover:ring-primary/40',
                  over && 'text-primary ring-primary/40',
                )}
              >
                <GripVertical className="h-3.5 w-3.5" />
                {blockLabels[key]}
              </div>
              <div className="absolute inset-0 z-[60]" />
              <div
                inert={editMode || undefined}
                className="pointer-events-none select-none px-2 pb-2 pt-9"
              >
                {isChart ? chartSlot : renderers[key as ControlKey]()}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (editMode) {
    // Each block is selectable: clicking opens its accordion in the dashboard.
    return (
      <div className="w-full space-y-3">
        {config.order.map((key) => {
          if (key === 'buy' && pinBuy) return null;
          if (key === 'chart') {
            return (
              <div
                key="chart"
                ref={(el) => {
                  rowRefs.current.chart = el;
                }}
                className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
              >
                {chartSlot}
              </div>
            );
          }
          const selected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              ref={(el) => {
                rowRefs.current[key] = el;
              }}
              onClick={() => onSelect?.(key)}
              className={[
                'group relative block w-full rounded-xl border-2 bg-background p-3 text-left shadow-sm transition-colors',
                selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60',
              ].join(' ')}
            >
              <div
                className={[
                  'pointer-events-none absolute inset-0 z-10 rounded-xl bg-primary/10 transition-opacity',
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                ].join(' ')}
              />
              {/* `inert`, not just pointer-events-none: that only removes the
                  subtree from POINTER hit-testing, so the real Buy <button>
                  inside keeps tabIndex 0 and Enter/Space still fires its
                  onClick — and /edit is the live app on a real account. The
                  pinned bar got this in 9804954; the column needs it for the
                  same reason. The row <button> around this stays interactive,
                  so selecting the block still works. */}
              <div inert={editMode || undefined} className="pointer-events-none">
                {renderers[key]()}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 lg:space-y-4">
      {config.order.map((key) => {
        // Chart only renders where a chartSlot is provided (the no-code mobile
        // column). On desktop the chart lives in its own column.
        if (key === 'buy' && pinBuy) return null;
        if (key === 'chart') return chartSlot ? <div key="chart">{chartSlot}</div> : null;
        return <div key={key}>{renderers[key]()}</div>;
      })}
      {isAuthenticated && (
        <Button asChild variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
          <Link href="/reports">
            <Localize i18n_default_text="View your positions →" />
          </Link>
        </Button>
      )}
    </div>
  );
}
