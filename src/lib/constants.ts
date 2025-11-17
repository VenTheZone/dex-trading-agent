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
  
  // Snapshot Strategy (optimized based on Hyper Alpha Arena)
  SNAPSHOT_FAST_INTERVAL: 5000, // 5 seconds - lightweight updates
  SNAPSHOT_FULL_INTERVAL: 60000, // 60 seconds - complete data with calculations
  SNAPSHOT_CACHE_DURATION: 5000, // 5 seconds cache
  
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

// Liquidation Risk Thresholds
export const LIQUIDATION_RISK = {
  SAFE_DISTANCE_PERCENT: 20, // 20% distance to liquidation is safe
  WARNING_DISTANCE_PERCENT: 10, // 10% triggers warning
  DANGER_DISTANCE_PERCENT: 5, // 5% is dangerous
  CRITICAL_DISTANCE_PERCENT: 2, // 2% is critical
  MAX_MARGIN_USAGE_PERCENT: 80, // Don't allow new positions above 80% margin usage
  EMERGENCY_CLOSE_PERCENT: 90, // Auto-close positions at 90% margin usage
} as const;

// API Configuration
export const API_CONFIG = {
  OPENROUTER: {
    BASE_URL: 'https://openrouter.ai/api/v1',
    KEY_PREFIX: 'sk-or-v1-',
    TIMEOUT: 30000,
  },
  HYPERLIQUID: {
    MAINNET_URL: 'https://api.hyperliquid.xyz',
    TESTNET_URL: 'https://api.hyperliquid-testnet.xyz',
    MAINNET_APP_URL: 'https://app.hyperliquid.xyz',
    TESTNET_APP_URL: 'https://app.hyperliquid-testnet.xyz',
    TIMEOUT: 10000,
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
  PRICE_FETCH_FAILED: 'Failed to fetch market prices from Hyperliquid. Please try again.',
} as const;

// Network validation
export const NETWORK_TYPES = ['mainnet', 'testnet'] as const;
export type NetworkType = typeof NETWORK_TYPES[number];

/**
 * Validate network type
 */
export function isValidNetwork(network: string): network is NetworkType {
  return NETWORK_TYPES.includes(network as NetworkType);
}

/**
 * Convert boolean isTestnet to network type
 */
export function booleanToNetwork(isTestnet: boolean): NetworkType {
  return isTestnet ? 'testnet' : 'mainnet';
}

/**
 * Convert network type to boolean isTestnet
 */
export function networkToBoolean(network: NetworkType): boolean {
  return network === 'testnet';
}

/**
 * Validate and normalize network parameter
 */
export function validateNetwork(network: unknown): NetworkType {
  if (typeof network === 'boolean') {
    return booleanToNetwork(network);
  }
  
  if (typeof network === 'string' && isValidNetwork(network)) {
    return network;
  }
  
  console.warn(`Invalid network type: ${network}, defaulting to mainnet`);
  return 'mainnet';
}