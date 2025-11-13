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
  initialBalance: number;
  position: Position | null;
  mode: 'paper' | 'live' | 'demo';
  network: 'mainnet' | 'testnet';
  settings: TradingSettings;
  chartType: 'time' | 'range';
  chartInterval: string;
  isAutoTrading: boolean;
  connectionMode: 'wallet' | 'api' | 'demo';
  aiModel: 'deepseek/deepseek-chat-v3-0324:free' | 'qwen/qwen3-max';
  customPrompt: string;
  isAiThinking: boolean;
  aiThoughts: string;
  setBalance: (balance: number) => void;
  setInitialBalance: (balance: number) => void;
  resetBalance: () => void;
  setPosition: (position: Position | null) => void;
  setMode: (mode: 'paper' | 'live' | 'demo') => void;
  setNetwork: (network: 'mainnet' | 'testnet') => void;
  updateSettings: (settings: Partial<TradingSettings>) => void;
  setChartType: (type: 'time' | 'range') => void;
  setChartInterval: (interval: string) => void;
  setAutoTrading: (enabled: boolean) => void;
  setConnectionMode: (mode: 'wallet' | 'api' | 'demo') => void;
  setAiModel: (model: 'deepseek/deepseek-chat-v3-0324:free' | 'qwen/qwen3-max') => void;
  setCustomPrompt: (prompt: string) => void;
  resetPromptToDefault: () => void;
  setAiThinking: (thinking: boolean) => void;
  setAiThoughts: (thoughts: string) => void;
}

export const DEFAULT_PROMPT = `You are an expert crypto trading analyst. Analyze the following market data and provide a trading recommendation.

ANALYSIS GUIDELINES:
1. Technical Analysis: Evaluate price action, support/resistance levels, and trend direction
2. Risk Management: Consider position sizing relative to account balance and leverage
3. Market Context: Factor in overall market sentiment and correlation with major assets
4. Entry/Exit Strategy: Provide clear entry price, stop loss, and take profit levels
5. Confidence Level: Rate your confidence (0-100) based on signal strength

RISK CONSIDERATIONS:
- Never risk more than 2-5% of account balance per trade
- Account for leverage when calculating position size
- Set stop loss to limit downside risk
- Consider market volatility and liquidity

Provide your analysis in JSON format with:
{
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "detailed explanation of your analysis",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number
}`;

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      balance: 10000,
      initialBalance: 10000,
      position: null,
      mode: 'paper',
      network: 'mainnet',
      connectionMode: 'demo',
      aiModel: 'deepseek/deepseek-chat-v3-0324:free',
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
        allowedCoins: ['BTCUSD', 'ETHUSD', 'SOLUSD'],
      },
      chartType: 'time',
      chartInterval: '15',
      isAutoTrading: false,
      customPrompt: DEFAULT_PROMPT,
      isAiThinking: false,
      aiThoughts: '',
      setBalance: (balance) => set({ balance }),
      setInitialBalance: (balance) => set({ initialBalance: balance, balance }),
      resetBalance: () => set((state) => ({ balance: state.initialBalance, position: null })),
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
      setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
      resetPromptToDefault: () => set({ customPrompt: DEFAULT_PROMPT }),
      setAiThinking: (thinking) => set({ isAiThinking: thinking }),
      setAiThoughts: (thoughts) => set({ aiThoughts: thoughts }),
    }),
    {
      name: 'trading-storage',
    }
  )
);