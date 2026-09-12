'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Localize } from '@deriv-com/translations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import type { BuyResult } from '@deriv/core';
import type { AccumulatorProposalInfo } from '../hooks/use-accumulator-proposal';
import type { GrowthRate, OpenPosition } from '../lib/types';

interface TradeControlsProps {
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
  /** Whether the user is authenticated — shows the View your positions link when true. */
  isAuthenticated?: boolean;
}

export function TradeControls({
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
}: TradeControlsProps) {
  const { currentLang, localize } = useAppTranslations();
  const numberLocale = LANGUAGE_LOCALES[currentLang];

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

  return (
    <div className="w-full space-y-3 lg:max-w-[400px] lg:space-y-4">
      {/* Growth Rate selector */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">
            <Localize i18n_default_text="Growth rate" />
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] text-muted-foreground">
                  i
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">
                  <Localize i18n_default_text="Your stake grows by the selected percentage for each tick that stays within the barrier range." />
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select
          value={String(growthRate)}
          onValueChange={(value) => {
            onGrowthRateChange(parseFloat(value));
          }}
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

      {/* Stake */}
      <div className="space-y-1.5">
        <Label htmlFor="stake" className="text-xs text-muted-foreground">
          <Localize i18n_default_text="Stake" />
        </Label>
        <Input
          id="stake"
          type="number"
          value={stake}
          onChange={(e) => onStakeChange(e.target.value)}
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
          }}
          min={0}
          step="0.01"
          labelRight="USD"
        />
      </div>

      {/* Take Profit (optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="take-profit" className="text-xs text-muted-foreground">
            <Localize i18n_default_text="Take profit" />
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] text-muted-foreground">
                  i
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="text-xs">
                  <Localize i18n_default_text="The contract closes automatically when your profit reaches this amount. Leave empty for no limit." />
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="take-profit"
          type="number"
          value={takeProfit}
          onChange={(e) => onTakeProfitChange(e.target.value)}
          onKeyDown={(e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
          }}
          min={0}
          step="0.01"
          placeholder="-"
          labelRight="USD"
        />
      </div>

      {/* Contract info summary — skeleton while waiting for proposal */}
      {!proposal && !activePosition && (
        <div className="space-y-2.5 rounded-md border border-border bg-muted/30 p-3 animate-pulse">
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
      )}

      {/* Contract info summary */}
      {proposal && !activePosition && (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              <Localize i18n_default_text="Max. payout" />
            </span>
            <span className="font-medium">
              {proposal.maxPayout.toLocaleString(numberLocale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              USD
            </span>
          </div>
          {proposal.barrierPercentage && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                <Localize i18n_default_text="Barrier" />
              </span>
              <span className="font-medium">{proposal.barrierPercentage}</span>
            </div>
          )}
          {proposal.maxTicks > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                <Localize i18n_default_text="Max. duration" />
              </span>
              <span className="font-medium">
                <Localize
                  i18n_default_text="{{ticks}} ticks"
                  values={{ ticks: proposal.maxTicks }}
                />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active position summary — shown when a trade is running */}
      {activePosition && (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-xs">
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
            <span className={`font-medium ${parseFloat(activePosition.profit) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {parseFloat(activePosition.profit) >= 0 ? '+' : ''}{parseFloat(activePosition.profit).toFixed(2)} {activePosition.currency}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1.5">
            <span className="text-muted-foreground font-medium">
              <Localize i18n_default_text="Total return" />
            </span>
            <span className="font-semibold">
              {(parseFloat(activePosition.buy_price) + parseFloat(activePosition.profit)).toFixed(2)} {activePosition.currency}
            </span>
          </div>
        </div>
      )}

      {/* Buy / Close button — inline on desktop, fixed above footer on mobile */}
      <div className="max-lg:fixed max-lg:bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] max-lg:left-3 max-lg:right-3 lg:static">
        {!activePosition && (
          <Button
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
            disabled={!isConnected || !proposal || isBuying}
            onClick={onBuy}
          >
            {isBuying ? (
              <Localize i18n_default_text="Purchasing..." />
            ) : (
              <Localize i18n_default_text="Buy" />
            )}
          </Button>
        )}

        {activePosition && onClose && (
          <Button
            variant="outline"
            className="w-full rounded-full border-black bg-white text-black hover:bg-white hover:text-black dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-white/10"
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
                <span className="text-xs font-normal opacity-90">
                  {(parseFloat(activePosition.buy_price) + parseFloat(activePosition.profit)).toFixed(2)} {activePosition.currency}
                </span>
              </span>
            )}
          </Button>
        )}
      </div>

      {/* View your positions — shown when authenticated */}
      {isAuthenticated && (
        <Button
          asChild
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          <Link href="/reports">
            <Localize i18n_default_text="View your positions →" />
          </Link>
        </Button>
      )}
    </div>
  );
}
