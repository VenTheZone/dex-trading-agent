import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  balance: number;
  position: Position | null;
  mode: 'paper' | 'live' | 'demo';
  network: 'mainnet' | 'testnet';
  settings: TradingSettings;
  chartType: 'time' | 'range';
  chartInterval: string;
  isAutoTrading: boolean;
  connectionMode: 'wallet' | 'api' | 'demo';
  aiModel: 'deepseek/deepseek-chat' | 'qwen/qwen-2.5-72b-instruct';
  setBalance: (balance: number) => void;
  setPosition: (position: Position | null) => void;
  setMode: (mode: 'paper' | 'live' | 'demo') => void;
  setNetwork: (network: 'mainnet' | 'testnet') => void;
  updateSettings: (settings: Partial<TradingSettings>) => void;
  setChartType: (type: 'time' | 'range') => void;
  setChartInterval: (interval: string) => void;
  setAutoTrading: (enabled: boolean) => void;
  setConnectionMode: (mode: 'wallet' | 'api' | 'demo') => void;
  setAiModel: (model: 'deepseek/deepseek-chat' | 'qwen/qwen-2.5-72b-instruct') => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
      balance: 10000,
      position: null,
      mode: 'paper',
      network: 'mainnet',
      connectionMode: 'demo',
      aiModel: 'deepseek/deepseek-chat',
      settings: {
        mode: 'paper',
        takeProfitPercent: 2,
        stopLossPercent: 1,
        useAdvancedStrategy: false,
        partialProfitPercent: 50,
        useTrailingStop: true,
        leverage: 1,
        maxLeverage: 20,
        allowAILeverage: false,
        allowedCoins: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD'],
      },
      chartType: 'time',
      chartInterval: '15',
      isAutoTrading: false,
      setBalance: (balance) => set({ balance }),
      setPosition: (position) => set({ position }),
      setMode: (mode) => set({ mode }),
      setNetwork: (network) => set({ network }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setChartType: (type) => set({ chartType: type }),
      setChartInterval: (interval) => set({ chartInterval: interval }),
      setAutoTrading: (enabled) => set({ isAutoTrading: enabled }),
      setConnectionMode: (mode) => set({ connectionMode: mode }),
      setAiModel: (model) => set({ aiModel: model }),
    }),
    {
      name: 'trading-storage',
    }
  )
);