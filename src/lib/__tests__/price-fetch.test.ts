import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPriceCache, fetchMultiplePrices, fetchPriceWithFallback } from '../price-service';
import { pythonApi } from '../python-api-client';

vi.mock('../python-api-client', () => ({
  pythonApi: {
    fetchPrice: vi.fn(),
  },
}));

describe('Price fetching service', () => {
  beforeEach(() => {
    clearPriceCache();
    vi.clearAllMocks();
  });

  it('returns a structured price result for a successful fetch', async () => {
    vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50250.5);

    const result = await fetchPriceWithFallback('BTCUSD');

    expect(result).toMatchObject({
      price: 50250.5,
      isStale: false,
    });
    expect(result.timestamp).toBeTypeOf('number');
    expect(pythonApi.fetchPrice).toHaveBeenCalledWith('BTCUSD', false);
  });

  it('uses the cache for repeated requests', async () => {
    vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(3000);

    const first = await fetchPriceWithFallback('ETHUSD');
    const second = await fetchPriceWithFallback('ETHUSD');

    expect(second.price).toBe(first.price);
    expect(second.isStale).toBe(false);
    expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
  });

  it('supports testnet requests', async () => {
    vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(125);

    const result = await fetchPriceWithFallback('SOLUSD', 'testnet');

    expect(result.price).toBe(125);
    expect(pythonApi.fetchPrice).toHaveBeenCalledWith('SOLUSD', true);
  });

  it('returns stale cached data when refresh fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T00:00:00Z'));
    vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);

    const first = await fetchPriceWithFallback('BTCUSD');

    vi.setSystemTime(new Date('2026-03-23T00:00:06Z'));
    vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Failed to fetch'));

    const second = await fetchPriceWithFallback('BTCUSD');

    expect(first.price).toBe(50000);
    expect(second).toMatchObject({
      price: 50000,
      isStale: true,
      timestamp: first.timestamp,
    });

    vi.useRealTimers();
  });

  it('returns structured results for multi-symbol fetches', async () => {
    vi.mocked(pythonApi.fetchPrice)
      .mockResolvedValueOnce(50000)
      .mockResolvedValueOnce(3000)
      .mockResolvedValueOnce(125);

    const results = await fetchMultiplePrices(['BTCUSD', 'ETHUSD', 'SOLUSD']);

    expect(results).toEqual({
      BTCUSD: expect.objectContaining({ price: 50000, isStale: false }),
      ETHUSD: expect.objectContaining({ price: 3000, isStale: false }),
      SOLUSD: expect.objectContaining({ price: 125, isStale: false }),
    });
  });

  it('skips failed symbols in multi-fetch calls', async () => {
    vi.mocked(pythonApi.fetchPrice)
      .mockResolvedValueOnce(50000)
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce(3000);

    const results = await fetchMultiplePrices(['BTCUSD', 'BADUSD', 'ETHUSD']);

    expect(results).toEqual({
      BTCUSD: expect.objectContaining({ price: 50000 }),
      ETHUSD: expect.objectContaining({ price: 3000 }),
    });
    expect(results.BADUSD).toBeUndefined();
  });
});
