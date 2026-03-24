// Detect environment
const isQt = typeof (window as any).qt !== 'undefined';

/**
 * Generic invoke method for Qt bridge
 */
export async function invoke<T>(cmd: string, args: any = {}): Promise<T> {
  if (isQt) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        if (!(window as any).qtBridge) {
          reject(new Error("Qt bridge not initialized"));
          return;
        }
        (window as any).qtBridge.invoke(cmd, JSON.stringify(args), (result: string) => {
          try {
            const parsed = JSON.parse(result);
            if (parsed && typeof parsed === 'object' && parsed.error) {
              reject(new Error(parsed.error));
            } else {
              resolve(parsed as T);
            }
          } catch (e) {
            // result might not be JSON if it's a raw string from bridge
            resolve(result as any as T);
          }
        });
      };

      if ((window as any).qtBridge) {
        execute();
      } else {
        // Wait for bridge to be initialized
        let attempts = 0;
        const checkBridge = setInterval(() => {
          attempts++;
          if ((window as any).qtBridge) {
            clearInterval(checkBridge);
            execute();
          } else if (attempts > 100) {
            clearInterval(checkBridge);
            reject(new Error("Qt bridge timeout"));
          }
        }, 50);
      }
    });
  }

  console.warn(`Bridge not detected for command: ${cmd}. Falling back to localStorage.`);

  // Fallback for testing environment
  if (typeof (global as any)._testStorage === 'undefined') {
    (global as any)._testStorage = new Map();
  }
  const testStorage = (global as any)._testStorage;

  if (cmd === "store_get") {
    return testStorage.get(`fallback_${args.key}`) || null;
  }
  if (cmd === "store_set") {
    testStorage.set(`fallback_${args.key}`, args.value);
    return undefined as T;
  }
  if (cmd === "get_api_keys") {
    return testStorage.get("fallback_api_keys") || null;
  }
  if (cmd === "set_api_keys") {
    testStorage.set("fallback_api_keys", args.keys);
    return undefined as T;
  }
  if (cmd === "clear_api_keys") {
    testStorage.delete("fallback_api_keys");
    return undefined as T;
  }

  return null as any as T;
}

/**
 * Native confirmation dialog
 */
export async function nativeConfirm(message: string, options: { title: string; kind?: string }): Promise<boolean> {
  if (isQt) {
    try {
      const result = await invoke<string>("confirm_dialog", {
        title: options.title,
        message: message
      });
      return result === "yes" || result === "true";
    } catch (e) {
      console.error("Qt confirm failed", e);
    }
  }
  return window.confirm(`${options.title}\n\n${message}`);
}

/**
 * Open URL in system browser
 */
export async function openUrl(url: string): Promise<void> {
  if (isQt) {
    try {
      await invoke("open_url", { url });
      return;
    } catch (e) {
      console.error("Qt open_url failed", e);
    }
  }
  window.open(url, '_blank');
}

/**
 * Native save file dialog
 */
export async function saveFileDialog(title: string, defaultName: string): Promise<string | null> {
  if (isQt) {
    try {
      return await invoke<string>("save_file_dialog", { title, defaultName });
    } catch (e) {
      console.error("Qt save_file_dialog failed", e);
    }
  }
  return null;
}

// API Keys storage
export interface ApiKeys {
  hyperliquid: {
    apiKey: string;
    apiSecret: string;
    walletAddress: string;
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

// Demo keys for testing
const DEMO_KEYS: ApiKeys = {
  hyperliquid: {
    apiKey: "DEMO_MODE",
    apiSecret: "DEMO_MODE",
    walletAddress: "DEMO_MODE",
  },
  openRouter: "DEMO_MODE",
};

/**
 * Get API keys from secure store
 */
export async function getApiKeys(): Promise<ApiKeys> {
  try {
    const keys = await invoke<ApiKeys>("get_api_keys");
    return keys || { hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' }, openRouter: '' };
  } catch (error) {
    console.error("Error loading API keys from secure store:", error);
    return { hyperliquid: { apiKey: '', apiSecret: '', walletAddress: '' }, openRouter: '' };
  }
}

/**
 * Save API keys to secure store
 */
export async function saveApiKeys(keys: ApiKeys): Promise<void> {
  try {
    await invoke("set_api_keys", { keys });
  } catch (error) {
    console.error("Error saving API keys to secure store:", error);
    throw error;
  }
}

/**
 * Clear all API keys from secure store
 */
export async function clearApiKeys(): Promise<void> {
  try {
    await invoke("clear_api_keys");
  } catch (error) {
    console.error("Error clearing API keys:", error);
    throw error;
  }
}

/**
 * Enable demo mode with demo keys
 */
export async function enableDemoMode(): Promise<void> {
  await saveApiKeys(DEMO_KEYS);
}

/**
 * Check if demo mode is enabled
 */
export async function isDemoMode(): Promise<boolean> {
  const keys = await getApiKeys();
  return keys.hyperliquid?.apiKey === "DEMO_MODE";
}

/**
 * Validate that required API keys are present
 */
export async function validateApiKeys(): Promise<boolean> {
  const keys = await getApiKeys();
  const hasHyperliquid = !!(keys.hyperliquid?.apiKey && keys.hyperliquid?.apiSecret);
  const hasOpenRouter = !!keys.openRouter && keys.openRouter.startsWith('sk-or-v1-');
  const isDemo = keys.hyperliquid?.apiKey === "DEMO_MODE";
  
  if (isDemo) return true;
  return hasHyperliquid && hasOpenRouter;
}

/**
 * Generic store get
 */
export async function storeGet<T>(key: string): Promise<T | null> {
  try {
    const value = await invoke<T>("store_get", { key });
    return value;
  } catch (error) {
    console.error(`Error getting ${key} from store:`, error);
    return null;
  }
}

/**
 * Generic store set
 */
export async function storeSet<T>(key: string, value: T): Promise<void> {
  try {
    await invoke("store_set", { key, value });
  } catch (error) {
    console.error(`Error setting ${key} in store:`, error);
    throw error;
  }
}

/**
 * Backward compatibility storage object
 */
export const storage = {
  getApiKeys,
  saveApiKeys,
  clearApiKeys,
  isDemoMode,
  validateApiKeys,
  getSettings: async () => {
    const s = await storeGet<TradingSettings>("settings");
    return s || {
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
    } as TradingSettings;
  },
  saveSettings: async (settings: TradingSettings) => {
    // Validate leverage
    if (settings.leverage > 100) throw new Error("Invalid leverage");
    await storeSet("settings", settings);
  },
  clearAll: async () => {
    await clearApiKeys();
    // In a real app we'd clear more
  }
};
