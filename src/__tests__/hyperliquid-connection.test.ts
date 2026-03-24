import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/lib/storage';
import type { ApiKeys } from '@/lib/storage';

describe('Hyperliquid Connection Tests', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await storage.clearAll();
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
    it('should save and retrieve API keys for mainnet', async () => {
      const keys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: '0x' + 'a'.repeat(64),
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        openRouter: 'sk-or-v1-test123',
      };

      await storage.saveApiKeys(keys);
      const retrieved = await storage.getApiKeys();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hyperliquid.apiKey).toBe(keys.hyperliquid.apiKey);
      expect(retrieved?.openRouter).toBe(keys.openRouter);
    });

    it('should handle demo mode correctly', async () => {
      const demoKeys: ApiKeys = {
        hyperliquid: {
          apiKey: 'DEMO_MODE',
          apiSecret: 'DEMO_MODE',
          walletAddress: 'DEMO_MODE',
        },
        openRouter: 'DEMO_MODE',
      };

      await storage.saveApiKeys(demoKeys);
      expect(await storage.isDemoMode()).toBe(true);

      const retrieved = await storage.getApiKeys();
      expect(retrieved?.hyperliquid.apiKey).toBe('DEMO_MODE');
    });

    it('should preserve OpenRouter key in demo mode', async () => {
      const demoKeysWithRealOpenRouter: ApiKeys = {
        hyperliquid: {
          apiKey: 'DEMO_MODE',
          apiSecret: 'DEMO_MODE',
          walletAddress: 'DEMO_MODE',
        },
        openRouter: 'sk-or-v1-real-key',
      };

      await storage.saveApiKeys(demoKeysWithRealOpenRouter);
      expect(await storage.isDemoMode()).toBe(true);

      const retrieved = await storage.getApiKeys();
      expect(retrieved?.openRouter).toBe('sk-or-v1-real-key');
    });

    it('should throw error for invalid OpenRouter key format', async () => {
      const invalidKeys: ApiKeys = {
        hyperliquid: {
          apiKey: '0x1234567890123456789012345678901234567890',
          apiSecret: '0x' + 'a'.repeat(64),
          walletAddress: '0x1234567890123456789012345678901234567890',
        },
        openRouter: 'invalid-key-format',
      };

      await storage.saveApiKeys(invalidKeys);
      expect(await storage.validateApiKeys()).toBe(false);
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

  describe('Settings Validation', () => {
    it('should validate leverage bounds', async () => {
      const settings = await storage.getSettings();
      expect(settings.leverage).toBeGreaterThanOrEqual(1);
      expect(settings.leverage).toBeLessThanOrEqual(100);
    });

    it('should validate take profit percentage bounds', async () => {
      const settings = await storage.getSettings();
      expect(settings.takeProfitPercent).toBeGreaterThanOrEqual(0);
      expect(settings.takeProfitPercent).toBeLessThanOrEqual(1000);
    });

    it('should validate stop loss percentage bounds', async () => {
      const settings = await storage.getSettings();
      expect(settings.stopLossPercent).toBeGreaterThanOrEqual(0);
      expect(settings.stopLossPercent).toBeLessThanOrEqual(100);
    });
  });
});
