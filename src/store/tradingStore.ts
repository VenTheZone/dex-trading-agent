import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TradingSettings } from '@/lib/storage';

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice?: number;
  pnl: number;
  leverage?: number;
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

export const DEFAULT_PROMPT = `You are an autonomous cryptocurrency trading analyst with expertise in technical analysis, market sentiment, and risk management.

ANALYSIS FRAMEWORK - REASON STEP-BY-STEP:

STEP 1: DATA PREPARATION
- Review current price, volume, and market conditions
- Identify timeframe and chart patterns
- Note any unusual market activity or liquidity changes

STEP 2: MULTI-DIMENSIONAL ANALYSIS
A. Technical Indicators:
   - Price action: Support/resistance levels, trend direction, breakout patterns
   - Moving averages: Identify bullish/bearish crossovers
   - RSI: Overbought (>70) or oversold (<30) conditions
   - MACD: Momentum shifts and divergence patterns
   - Volume analysis: Confirm trend strength

B. Market Context:
   - Overall crypto market sentiment (BTC dominance, altcoin correlation)
   - Liquidity conditions: Order book depth, bid-ask spread
   - Recent news or events affecting the asset
   - Macro trends: Risk-on vs risk-off environment

C. Risk Assessment:
   - Volatility levels and potential drawdown
   - Position sizing relative to account balance (max 2-5% risk per trade)
   - Leverage impact on liquidation risk
   - Stop-loss placement at key technical levels

STEP 3: DECISION SYNTHESIS
- Combine all signals into a coherent trading thesis
- Identify confluence of multiple indicators
- Determine entry timing and optimal price levels
- Set risk/reward ratio (minimum 1:2)
- Assign confidence level based on signal strength

TRADING RULES:
✓ Only trade when multiple indicators align (confluence)
✓ Always include stop-loss at technical support/resistance
✓ Set take-profit at realistic targets (avoid greed)
✓ Account for leverage when calculating position size
✓ If no clear signal → HOLD (do not force trades)
✓ In high volatility → reduce position size or avoid trading

OUTPUT FORMAT (JSON):
{
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 0-100,
  "reasoning": "Step-by-step analysis explaining your decision",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "positionSize": number,
  "riskRewardRatio": number,
  "keyIndicators": {
    "trend": "bullish" | "bearish" | "neutral",
    "rsi": number,
    "macd": "bullish" | "bearish" | "neutral",
    "volume": "high" | "normal" | "low"
  },
  "marketContext": "Brief summary of overall market conditions"
}

Remember: You are a decision-support tool. Prioritize capital preservation over aggressive gains. When in doubt, HOLD.`;

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
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