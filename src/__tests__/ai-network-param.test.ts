import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pythonApi } from '../lib/python-api-client';

// Mock global fetch
const globalFetch = global.fetch;

describe('AI Analysis Network Parameter', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.clearAllMocks();
  });

  it('should pass network parameter to analyzeMarket', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { action: 'hold', confidence: 50, reasoning: 'test' } }),
    });

    const request = {
      apiKey: 'sk-or-v1-test',
      symbol: 'BTC',
      userBalance: 1000,
      settings: {
        takeProfitPercent: 5,
        stopLossPercent: 2,
        useAdvancedStrategy: false,
      },
      network: 'testnet' as const,
    };

    await pythonApi.analyzeMarket(request);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body).toHaveProperty('network');
    expect(body.network).toBe('testnet');
  });

  it('should pass network parameter to analyzeMultiChart', async () => {
    // Mock successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { action: 'hold', confidence: 50, reasoning: 'test' } }),
    });

    const request = {
      apiKey: 'sk-or-v1-test',
      charts: [],
      userBalance: 1000,
      settings: {
        takeProfitPercent: 5,
        stopLossPercent: 2,
        useAdvancedStrategy: false,
      },
      network: 'testnet' as const,
    };

    await pythonApi.analyzeMultiChart(request);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);

    expect(body).toHaveProperty('network');
    expect(body.network).toBe('testnet');
  });
});