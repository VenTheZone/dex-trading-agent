import { create } from 'zustand';
import { TradingSettings } from '@/lib/storage';

interface TradingState {
  mode: 'paper' | 'live';
  balance: number;
  position: {
    symbol: string;
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
  } | null;
  settings: TradingSettings;
  chartInterval: string;
  chartType: 'time' | 'range';
  
  setMode: (mode: 'paper' | 'live') => void;
  setBalance: (balance: number) => void;
  setPosition: (position: TradingState['position']) => void;
  updateSettings: (settings: Partial<TradingSettings>) => void;
  setChartInterval: (interval: string) => void;
  setChartType: (type: 'time' | 'range') => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  mode: 'paper',
  balance: 10000,
  position: null,
  settings: {
    mode: 'paper',
    takeProfitPercent: 100,
    stopLossPercent: 20,
    useAdvancedStrategy: false,
    partialProfitPercent: 50,
    useTrailingStop: true,
  },
  chartInterval: '15m',
  chartType: 'time',
  
  setMode: (mode) => set({ mode }),
  setBalance: (balance) => set({ balance }),
  setPosition: (position) => set({ position }),
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  setChartInterval: (interval) => set({ chartInterval: interval }),
  setChartType: (type) => set({ chartType: type }),
}));
