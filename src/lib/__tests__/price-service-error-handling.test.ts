import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAllCaches, clearPriceCache, fetchPriceWithFallback } from '../price-service';
import { clearSnapshotCache, pythonApi } from '../python-api-client';

vi.mock('../python-api-client', () => ({
  pythonApi: {
    fetchPrice: vi.fn(),
  },
  clearSnapshotCache: vi.fn(),
}));

describe('Price Service Error Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T00:00:00Z'));
    clearPriceCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('fetchPriceWithFallback', () => {
    it('returns cached price results when available and fresh', async () => {
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);

      const first = await fetchPriceWithFallback('BTCUSD');
      const second = await fetchPriceWithFallback('BTCUSD');

      expect(first).toMatchObject({ price: 50000, isStale: false });
      expect(second).toMatchObject({ price: 50000, isStale: false, timestamp: first.timestamp });
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
    });

    it('fetches a new price when the cache is stale', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50000)
        .mockResolvedValueOnce(51000);

      const first = await fetchPriceWithFallback('BTCUSD');
      vi.setSystemTime(new Date('2026-03-23T00:00:06Z'));
      const second = await fetchPriceWithFallback('BTCUSD');

      expect(first.price).toBe(50000);
      expect(second).toMatchObject({ price: 51000, isStale: false });
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
    });

    it('uses stale cache as a fallback on network error', async () => {
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);
      const first = await fetchPriceWithFallback('BTCUSD');

      vi.setSystemTime(new Date('2026-03-23T00:00:10Z'));
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Failed to fetch'));

      const second = await fetchPriceWithFallback('BTCUSD');

      expect(second).toMatchObject({
        price: 50000,
        isStale: true,
        timestamp: first.timestamp,
      });
    });

    it('throws enhanced errors when no cache is available', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchPriceWithFallback('BTCUSD')).rejects.toThrow(/Failed to fetch price for BTCUSD/);
    });

    it('categorizes network errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(fetchPriceWithFallback('BTCUSD')).rejects.toMatchObject({
        isRetryable: true,
        errorType: 'network',
      });
    });

    it('categorizes timeout errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(fetchPriceWithFallback('ETHUSD')).rejects.toMatchObject({
        isRetryable: true,
        errorType: 'timeout',
      });
    });

    it('categorizes server errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('500 Internal Server Error'));

      await expect(fetchPriceWithFallback('SOLUSD')).rejects.toMatchObject({
        isRetryable: true,
        errorType: 'server',
      });
    });

    it('categorizes client errors as non-retryable', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('404 Not Found'));

      await expect(fetchPriceWithFallback('INVALIDUSD')).rejects.toMatchObject({
        isRetryable: false,
        errorType: 'client',
      });
    });
  });

  describe('clearAllCaches', () => {
    it('clears both price and snapshot caches', () => {
      clearAllCaches();

      expect(clearSnapshotCache).toHaveBeenCalledTimes(1);
    });
  });
});
