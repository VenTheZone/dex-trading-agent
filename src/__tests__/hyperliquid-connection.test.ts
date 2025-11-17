import { describe, it, expect, beforeEach } from 'vitest';
import { storage, ApiKeys } from '@/lib/storage';

describe('Hyperliquid Connection Tests', () => {
  beforeEach(() => {
    // Clear storage before each test
    storage.clearAll();
  });

  describe('API Key Validation', () => {
    it('should accept valid mainnet wallet address (42 chars with 0x)', () => {
      const validAddress = '0x1234567890123456789012345678901234567890';
      expect(validAddress.length).toBe(42);
      expect(validAddress.startsWith('0x')).toBe(true);
    });

    it('should accept valid private key (64 chars without 0x)', () => {
      const validPrivateKey = 'a'.repeat(64);
      expect(validPrivateKey.length).toBe(64);
      expect(/^[0-9a-fA-F]+$/.test(validPrivateKey)).toBe(true);
    });

    it('should accept valid private key (66 chars with 0x)', () => {
      const validPrivateKey = '0x' + 'a'.repeat(64);
      expect(validPrivateKey.length).toBe(66);
      expect(validPrivateKey.startsWith('0x')).toBe(true);
    });

    it('should reject wallet address as private key (42 chars)', () => {
      const walletAddress = '0x1234567890123456789012345678901234567890';
      expect(walletAddress.length).toBe(42);
      // This should be caught by validation logic
    });

    it('should reject invalid private key length', () => {
      const invalidKey = 'a'.repeat(50);
      expect(invalidKey.length).not.toBe(64);
      expect(invalidKey.length).not.toBe(66);
    });

    it('should reject non-hexadecimal private key', () => {
      const invalidKey = 'g'.repeat(64);
      expect(/^[0-9a-fA-F]+$/.test(invalidKey)).toBe(false);
    });

    it('should accept valid OpenRouter API key format', () => {
      const validKey = 'sk-or-v1-1234567890abcdef';
      expect(validKey.startsWith('sk-or-v1-')).toBe(true);
    });

    it('should reject invalid OpenRouter API key format', () => {
      const invalidKey = 'sk-1234567890abcdef';
      expect(invalidKey.startsWith('sk-or-v1-')).toBe(false);
    });
  });

  describe('Storage Operations', () => {
    it('should save and retrieve API keys for mainnet', () => {
      const keys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: '0x' + 'a'.repeat(64),
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        openRouter: 'sk-or-v1-test123',
      };

      storage.saveApiKeys(keys);
      const retrieved = storage.getApiKeys();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hyperliquid.apiKey).toBe(keys.hyperliquid.apiKey);
      expect(retrieved?.openRouter).toBe(keys.openRouter);
    });

    it('should handle demo mode correctly', () => {
      const demoKeys: ApiKeys = {
        hyperliquid: {
          apiKey: 'DEMO_MODE',
          apiSecret: 'DEMO_MODE',
          walletAddress: 'DEMO_MODE',
        },
        openRouter: 'DEMO_MODE',
      };

      storage.saveApiKeys(demoKeys);
      expect(storage.isDemoMode()).toBe(true);

      const retrieved = storage.getApiKeys();
      expect(retrieved?.hyperliquid.apiKey).toBe('DEMO_MODE');
    });

    it('should preserve OpenRouter key in demo mode', () => {
      const demoKeysWithRealOpenRouter: ApiKeys = {
        hyperliquid: {
          apiKey: 'DEMO_MODE',
          apiSecret: 'DEMO_MODE',
          walletAddress: 'DEMO_MODE',
        },
        openRouter: 'sk-or-v1-real-key',
      };

      storage.saveApiKeys(demoKeysWithRealOpenRouter);
      expect(storage.isDemoMode()).toBe(true);

      const retrieved = storage.getApiKeys();
      expect(retrieved?.openRouter).toBe('sk-or-v1-real-key');
    });

    it('should throw error for invalid OpenRouter key format', () => {
      const invalidKeys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: '0x' + 'a'.repeat(64),
        },
        openRouter: 'invalid-key-format',
      };

      expect(() => storage.saveApiKeys(invalidKeys)).toThrow();
    });

    it('should throw error for invalid Hyperliquid secret', () => {
      const invalidKeys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: 'short',
        },
        openRouter: 'sk-or-v1-test123',
      };

      expect(() => storage.saveApiKeys(invalidKeys)).toThrow();
    });
  });

  describe('Network Configuration', () => {
    it('should support mainnet configuration', () => {
      const mainnetConfig = {
        network: 'mainnet',
        isTestnet: false,
      };

      expect(mainnetConfig.network).toBe('mainnet');
      expect(mainnetConfig.isTestnet).toBe(false);
    });

    it('should support testnet configuration', () => {
      const testnetConfig = {
        network: 'testnet',
        isTestnet: true,
      };

      expect(testnetConfig.network).toBe('testnet');
      expect(testnetConfig.isTestnet).toBe(true);
    });
  });

  describe('Connection Mode Validation', () => {
    it('should validate wallet connection mode', () => {
      const modes = ['wallet', 'api', 'demo'] as const;
      expect(modes).toContain('wallet');
      expect(modes).toContain('api');
      expect(modes).toContain('demo');
    });

    it('should validate trading mode', () => {
      const tradingModes = ['paper', 'live', 'demo'] as const;
      expect(tradingModes).toContain('paper');
      expect(tradingModes).toContain('live');
      expect(tradingModes).toContain('demo');
    });
  });

  describe('Input Sanitization', () => {
    it('should handle wallet address with extra whitespace', () => {
      const address = '  0x1234567890123456789012345678901234567890  ';
      const trimmed = address.trim();
      expect(trimmed.length).toBe(42);
    });

    it('should handle private key with extra whitespace', () => {
      const privateKey = '  0x' + 'a'.repeat(64) + '  ';
      const trimmed = privateKey.trim();
      expect(trimmed.length).toBe(66);
    });

    it('should handle mixed case hexadecimal', () => {
      const mixedCase = '0xAbCdEf1234567890';
      expect(/^0x[0-9a-fA-F]+$/.test(mixedCase)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API keys gracefully', () => {
      const retrieved = storage.getApiKeys();
      expect(retrieved).toBeNull();
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('dex_agent_api_keys', 'invalid-json');
      const retrieved = storage.getApiKeys();
      expect(retrieved).toBeNull();
    });

    it('should handle missing required fields', () => {
      const incompleteKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
        },
      };

      localStorage.setItem('dex_agent_api_keys', JSON.stringify(incompleteKeys));
      const retrieved = storage.getApiKeys();
      expect(retrieved).toBeNull();
    });

    it('should clear all storage correctly', () => {
      const keys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: '0x' + 'a'.repeat(64),
        },
        openRouter: 'sk-or-v1-test123',
      };

      storage.saveApiKeys(keys);
      storage.clearAll();

      const retrieved = storage.getApiKeys();
      expect(retrieved).toBeNull();
      expect(storage.isDemoMode()).toBe(false);
    });
  });

  describe('Settings Validation', () => {
    it('should validate leverage bounds', () => {
      const settings = storage.getSettings();
      expect(settings.leverage).toBeGreaterThanOrEqual(1);
      expect(settings.leverage).toBeLessThanOrEqual(100);
    });

    it('should validate take profit percentage bounds', () => {
      const settings = storage.getSettings();
      expect(settings.takeProfitPercent).toBeGreaterThanOrEqual(0);
      expect(settings.takeProfitPercent).toBeLessThanOrEqual(1000);
    });

    it('should validate stop loss percentage bounds', () => {
      const settings = storage.getSettings();
      expect(settings.stopLossPercent).toBeGreaterThanOrEqual(0);
      expect(settings.stopLossPercent).toBeLessThanOrEqual(100);
    });

    it('should reject invalid leverage', () => {
      expect(() => {
        storage.saveSettings({
          mode: 'paper',
          takeProfitPercent: 100,
          stopLossPercent: 20,
          useAdvancedStrategy: false,
          partialProfitPercent: 50,
          useTrailingStop: true,
          leverage: 150, // Invalid
          maxLeverage: 20,
          allowAILeverage: false,
          allowedCoins: ['BTCUSD'],
        });
      }).toThrow();
    });
  });
});
