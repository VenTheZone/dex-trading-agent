// Secure browser storage for API keys and settings
const STORAGE_PREFIX = 'dex_agent_';

export interface ApiKeys {
  hyperliquid: {
    apiKey: string;
    apiSecret: string;
    walletAddress?: string;
  };
  openRouter: string;
}

export interface TradingSettings {
  mode: 'paper' | 'live';
  takeProfitPercent: number;
  stopLossPercent: number;
  useAdvancedStrategy: boolean;
  partialProfitPercent: number;
  useTrailingStop: boolean;
  leverage: number;
  maxLeverage: number;
  allowAILeverage: boolean;
  allowedCoins: string[];
}

export const storage = {
  // API Keys
  saveApiKeys: (keys: ApiKeys) => {
    // Validate OpenRouter key format if provided
    if (keys.openRouter && keys.openRouter !== 'DEMO_MODE') {
      if (!keys.openRouter.startsWith('sk-or-v1-')) {
        throw new Error('Invalid OpenRouter API key format. Key must start with "sk-or-v1-"');
      }
    }

    // Check if demo mode
    if (keys.hyperliquid.apiKey === 'DEMO_MODE') {
      localStorage.setItem(`${STORAGE_PREFIX}demo_mode`, 'true');
      // In demo mode, preserve OpenRouter key if provided for enhanced AI testing
      if (keys.openRouter && keys.openRouter !== 'DEMO_MODE') {
        const demoKeys = {
          ...keys,
          hyperliquid: { apiKey: 'DEMO_MODE', apiSecret: 'DEMO_MODE', walletAddress: 'DEMO_MODE' },
        };
        localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(demoKeys));
      } else {
        localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
      }
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}demo_mode`);
      localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
    }
  },
  
  getApiKeys: (): ApiKeys | null => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}api_keys`);
    return data ? JSON.parse(data) : null;
  },

  isDemoMode: (): boolean => {
    return localStorage.getItem(`${STORAGE_PREFIX}demo_mode`) === 'true';
  },
  
  // Trading Settings
  saveSettings: (settings: TradingSettings) => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  },
  
  getSettings: (): TradingSettings => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    return data ? JSON.parse(data) : {
      mode: 'paper',
      takeProfitPercent: 100,
      stopLossPercent: 20,
      useAdvancedStrategy: false,
      partialProfitPercent: 50,
      useTrailingStop: true,
      leverage: 1,
      maxLeverage: 20,
      allowAILeverage: false,
      allowedCoins: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD'],
    };
  },
  
  // Clear all data
  clearAll: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};