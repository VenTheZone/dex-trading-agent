import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

import {
  clearApiKeys,
  enableDemoMode,
  getApiKeys,
  isDemoMode,
  saveApiKeys,
} from '@/lib/storage';
import { validateAddress, validateApiKey, validateNetwork } from '@/lib/constants';

describe('Hyperliquid connection helpers', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  describe('validation helpers', () => {
    it('accepts wallet addresses with 0x prefix', () => {
      expect(validateAddress('0x1234567890123456789012345678901234567890')).toBe(
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('rejects wallet addresses without 0x prefix', () => {
      expect(() => validateAddress('12345678901234567890')).toThrow(/wallet address/i);
    });

    it('accepts non-empty api secrets', () => {
      expect(validateApiKey('0x' + 'a'.repeat(64))).toBe('0x' + 'a'.repeat(64));
    });

    it('rejects empty api secrets', () => {
      expect(() => validateApiKey('')).toThrow(/api key/i);
    });

    it('normalizes boolean network flags', () => {
      expect(validateNetwork(true)).toBe('testnet');
      expect(validateNetwork(false)).toBe('mainnet');
    });
  });

  describe('tauri storage integration', () => {
    it('loads api keys from the secure store', async () => {
      invokeMock.mockResolvedValueOnce({
        hyperliquidMainnetApiKey: 'mainnet-key',
        hyperliquidTestnetApiKey: 'testnet-key',
        openRouterApiKey: 'sk-or-v1-test',
      });

      await expect(getApiKeys()).resolves.toEqual({
        hyperliquidMainnetApiKey: 'mainnet-key',
        hyperliquidTestnetApiKey: 'testnet-key',
        openRouterApiKey: 'sk-or-v1-test',
      });
      expect(invokeMock).toHaveBeenCalledWith('get_api_keys');
    });

    it('persists api keys to the secure store', async () => {
      const keys = {
        hyperliquidMainnetApiKey: 'mainnet-key',
        hyperliquidTestnetApiKey: 'testnet-key',
        openRouterApiKey: 'sk-or-v1-test',
      };

      await saveApiKeys(keys);

      expect(invokeMock).toHaveBeenCalledWith('set_api_keys', { keys });
    });

    it('clears api keys from the secure store', async () => {
      await clearApiKeys();

      expect(invokeMock).toHaveBeenCalledWith('clear_api_keys');
    });

    it('enables demo mode with demo keys', async () => {
      await enableDemoMode();

      expect(invokeMock).toHaveBeenCalledWith('set_api_keys', {
        keys: {
          hyperliquidMainnetApiKey: 'demo_mainnet_key',
          hyperliquidTestnetApiKey: 'demo_testnet_key',
          openRouterApiKey: 'demo_openrouter_key',
        },
      });
    });

    it('detects demo mode from stored keys', async () => {
      invokeMock.mockResolvedValueOnce({
        hyperliquidMainnetApiKey: 'demo_mainnet_key',
        hyperliquidTestnetApiKey: 'demo_testnet_key',
        openRouterApiKey: 'sk-or-v1-test',
      });

      await expect(isDemoMode()).resolves.toBe(true);
    });
  });
});
