// Secure browser storage for API keys and settings
const STORAGE_PREFIX = 'dex_agent_';
export const storage = {
    // API Keys
    saveApiKeys: (keys) => {
        try {
            // Validate OpenRouter key format if provided
            if (keys.openRouter && keys.openRouter !== 'DEMO_MODE') {
                if (!keys.openRouter.startsWith('sk-or-v1-')) {
                    throw new Error('Invalid OpenRouter API key format. Key must start with "sk-or-v1-"');
                }
            }
            // Validate Hyperliquid keys if not demo mode
            if (keys.hyperliquid.apiKey !== 'DEMO_MODE') {
                if (!keys.hyperliquid.apiSecret || keys.hyperliquid.apiSecret.length < 10) {
                    throw new Error('Invalid Hyperliquid API secret');
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
                }
                else {
                    localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
                }
            }
            else {
                localStorage.removeItem(`${STORAGE_PREFIX}demo_mode`);
                localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
            }
        }
        catch (error) {
            console.error('Failed to save API keys:', error);
            throw error;
        }
    },
    getApiKeys: () => {
        try {
            const data = localStorage.getItem(`${STORAGE_PREFIX}api_keys`);
            if (!data)
                return null;
            const parsed = JSON.parse(data);
            // Validate structure
            if (!parsed.hyperliquid || !parsed.openRouter) {
                console.warn('Invalid API keys structure in storage');
                return null;
            }
            return parsed;
        }
        catch (error) {
            console.error('Failed to parse API keys:', error);
            return null;
        }
    },
    isDemoMode: () => {
        return localStorage.getItem(`${STORAGE_PREFIX}demo_mode`) === 'true';
    },
    // Trading Settings
    saveSettings: (settings) => {
        try {
            // Validate settings before saving
            if (settings.leverage < 1 || settings.leverage > 100) {
                throw new Error('Invalid leverage value (must be 1-100)');
            }
            if (settings.takeProfitPercent < 0 || settings.takeProfitPercent > 1000) {
                throw new Error('Invalid take profit percentage (must be 0-1000)');
            }
            if (settings.stopLossPercent < 0 || settings.stopLossPercent > 100) {
                throw new Error('Invalid stop loss percentage (must be 0-100)');
            }
            if (!Array.isArray(settings.allowedCoins)) {
                throw new Error('Invalid allowedCoins format (must be array)');
            }
            localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
        }
        catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    },
    getSettings: () => {
        try {
            const data = localStorage.getItem(`${STORAGE_PREFIX}settings`);
            if (!data) {
                return {
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
            }
            const parsed = JSON.parse(data);
            // Validate and sanitize settings
            return {
                mode: ['paper', 'live'].includes(parsed.mode) ? parsed.mode : 'paper',
                takeProfitPercent: Math.max(0, Math.min(parsed.takeProfitPercent || 100, 1000)),
                stopLossPercent: Math.max(0, Math.min(parsed.stopLossPercent || 20, 100)),
                useAdvancedStrategy: Boolean(parsed.useAdvancedStrategy),
                partialProfitPercent: Math.max(0, Math.min(parsed.partialProfitPercent || 50, 100)),
                useTrailingStop: Boolean(parsed.useTrailingStop),
                leverage: Math.max(1, Math.min(parsed.leverage || 1, 100)),
                maxLeverage: Math.max(1, Math.min(parsed.maxLeverage || 20, 100)),
                allowAILeverage: Boolean(parsed.allowAILeverage),
                allowedCoins: Array.isArray(parsed.allowedCoins) ? parsed.allowedCoins : ['BTCUSD', 'ETHUSD', 'SOLUSD', 'AVAXUSD'],
            };
        }
        catch (error) {
            console.error('Failed to parse settings:', error);
            return {
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
        }
    },
    // Clear all data
    clearAll: () => {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        }
        catch (error) {
            console.error('Failed to clear storage:', error);
        }
    },
};
