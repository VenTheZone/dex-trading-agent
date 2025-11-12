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
}

export const storage = {
  // API Keys
  saveApiKeys: (keys: ApiKeys) => {
    localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
  },
  
  getApiKeys: (): ApiKeys | null => {
    const data = localStorage.getItem(`${STORAGE_PREFIX}api_keys`);
    return data ? JSON.parse(data) : null;
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
