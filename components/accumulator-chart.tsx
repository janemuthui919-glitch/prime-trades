'use client';

import { SmartChartWrapper } from '@/components/custom/smart-chart';
import type { ChartBarrier } from '@/components/custom/smart-chart';
import type { ContractMarker } from '@/lib/chart-markers';
import type { UseSmartChartsApiReturn } from '@/hooks/use-smartcharts-api';
import type { SmartChartChartData } from '@/hooks/use-smartchart-chart-data';

export interface AccumulatorChartProps {
  symbolKey: string;
  symbol: string | undefined;
  isConnectionOpened: boolean;
  isMobile: boolean;
  chartData: SmartChartChartData | undefined;
  getQuotes: UseSmartChartsApiReturn['getQuotes'];
  subscribeQuotes: UseSmartChartsApiReturn['subscribeQuotes'];
  unsubscribeQuotes: UseSmartChartsApiReturn['unsubscribeQuotes'];
  onSymbolChange?: (symbol: string) => void;
  isLive?: boolean;
  endEpoch?: number;
  barriers?: ChartBarrier[];
  /** Contract markers rendered on the chart when trades are placed. */
  contractsArray?: ContractMarker[];
}

export function AccumulatorChart(props: AccumulatorChartProps) {
  return (
    <SmartChartWrapper
      chartId="accumulator-chart"
      defaultGranularity={0}
      {...props}
    />
  );
}
