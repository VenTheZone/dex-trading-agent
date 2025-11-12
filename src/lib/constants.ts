// Trading Constants
export const TRADING_CONSTANTS = {
  // Margin & Risk
  MARGIN_WARNING_THRESHOLD: 80, // Percentage
  LIQUIDATION_RISK_THRESHOLD: 90, // Percentage
  MAX_LEVERAGE: 20,
  DEFAULT_LEVERAGE: 1,
  
  // Polling Intervals (milliseconds)
  POSITION_POLL_INTERVAL: 15000, // 15 seconds
  BALANCE_POLL_INTERVAL: 30000, // 30 seconds
  PRICE_POLL_INTERVAL: 5000, // 5 seconds
  PRICE_CACHE_DURATION: 10000, // 10 seconds
  
  // Debounce Delays
  BALANCE_RECORD_DEBOUNCE: 5000, // 5 seconds
  
  // AI Analysis
  MIN_AI_CONFIDENCE: 0.8, // 80%
  AI_ANALYSIS_TIMEOUT: 30000, // 30 seconds
  
  // Position Sizing
  DEFAULT_POSITION_SIZE_PERCENT: 10, // 10% of balance
  MAX_POSITION_SIZE_PERCENT: 50, // 50% of balance
  
  // Demo Mode
  DEFAULT_DEMO_BALANCE: 10000,
  MIN_DEMO_BALANCE: 100,
  MAX_DEMO_BALANCE: 1000000,
} as const;

// API Configuration
export const API_CONFIG = {
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    KEY_PREFIX: 'sk-or-v1-',
    TIMEOUT: 30000,
  },
  BINANCE: {
    BASE_URL: 'https://api.binance.com/api/v3',
    FALLBACK_URL: 'https://api1.binance.com/api/v3',
    TIMEOUT: 10000,
  },
  HYPERLIQUID: {
    MAINNET_URL: 'https://api.hyperliquid.xyz',
    TESTNET_URL: 'https://api.hyperliquid-testnet.xyz',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'API keys not configured. Please set up your keys in the settings.',
  API_KEY_INVALID: 'Invalid API key format. Please check your configuration.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this trade.',
  POSITION_NOT_FOUND: 'Position not found.',
  MARGIN_TOO_HIGH: 'Margin usage too high. Cannot open new positions.',
  AI_ANALYSIS_FAILED: 'AI analysis failed. Please try again.',
} as const;
