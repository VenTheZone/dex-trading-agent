import { create } from 'zustand';
import { TradingSettings } from '@/lib/storage';

interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  side: 'long' | 'short';
  stopLoss?: number;
  takeProfit?: number;
}

interface TradingState {
  mode: 'paper' | 'live';
  balance: number;
  position: Position | null;
  settings: TradingSettings;
  chartInterval: string;
  chartType: 'time' | 'range';
  isAutoTrading: boolean;
  
  setMode: (mode: 'paper' | 'live') => void;
  setBalance: (balance: number) => void;
  setPosition: (position: Position | null) => void;
  updateSettings: (settings: Partial<TradingSettings>) => void;
  setChartInterval: (interval: string) => void;
  setChartType: (type: 'time' | 'range') => void;
  setAutoTrading: (enabled: boolean) => void;
  updatePositionPrice: (currentPrice: number) => void;
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
    leverage: 1,
    maxLeverage: 20,
    allowAILeverage: false,
  },
  chartInterval: '15m',
  chartType: 'time',
  isAutoTrading: false,
  
  setMode: (mode) => set({ mode }),
  setBalance: (balance) => set({ balance }),
  setPosition: (position) => set({ position }),
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  setChartInterval: (interval) => set({ chartInterval: interval }),
  setChartType: (type) => set({ chartType: type }),
  setAutoTrading: (enabled) => set({ isAutoTrading: enabled }),
  updatePositionPrice: (currentPrice) => set((state) => {
    if (!state.position) return state;
    
    const pnl = state.position.side === 'long'
      ? (currentPrice - state.position.entryPrice) * state.position.size
      : (state.position.entryPrice - currentPrice) * state.position.size;
    
    return {
      position: {
        ...state.position,
        currentPrice,
        pnl,
      }
    };
  }),
}));