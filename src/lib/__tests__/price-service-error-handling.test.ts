import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchPriceWithFallback, clearPriceCache, clearAllCaches } from '../price-service';
import { pythonApi } from '../python-api-client';

// Mock the python-api-client
vi.mock('../python-api-client', () => ({
  pythonApi: {
    fetchPrice: vi.fn(),
  },
  clearSnapshotCache: vi.fn(),
}));

describe('Price Service Error Handling', () => {
  beforeEach(() => {
    clearPriceCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPriceWithFallback', () => {
    it('should return cached price when available and fresh', async () => {
      // First call - populate cache
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(50000);

      // Second call - should use cache
      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(50000);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
    });

    it('should fetch new price when cache is stale', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50000)
        .mockResolvedValueOnce(51000);

      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(50000);

      // Wait for cache to expire (mock time)
      vi.useFakeTimers();
      vi.advanceTimersByTime(6000); // 6 seconds > 5 second cache

      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(51000);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should use stale cache as fallback on network error', async () => {
      // First call - populate cache
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(50000);

      // Clear cache timestamp to make it stale
      vi.useFakeTimers();
      vi.advanceTimersByTime(10000);

      // Second call - simulate network error
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(50000); // Should return stale cache

      vi.useRealTimers();
    });

    it('should throw enhanced error when no cache available', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fetchPriceWithFallback('BTCUSD')).rejects.toThrow(
        /Failed to fetch price for BTCUSD/
      );
    });

    it('should categorize network errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      try {
        await fetchPriceWithFallback('BTCUSD');
      } catch (error: any) {
        expect(error.isRetryable).toBe(true);
        expect(error.errorType).toBe('network');
      }
    });

    it('should categorize timeout errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('Request timeout')
      );

      try {
        await fetchPriceWithFallback('ETHUSD');
      } catch (error: any) {
        expect(error.isRetryable).toBe(true);
        expect(error.errorType).toBe('timeout');
      }
    });

    it('should categorize server errors correctly', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('500 Internal Server Error')
      );

      try {
        await fetchPriceWithFallback('SOLUSD');
      } catch (error: any) {
        expect(error.isRetryable).toBe(true);
        expect(error.errorType).toBe('server');
      }
    });

    it('should categorize client errors as non-retryable', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(
        new Error('404 Not Found')
      );

      try {
        await fetchPriceWithFallback('INVALIDUSD');
      } catch (error: any) {
        expect(error.isRetryable).toBe(false);
        expect(error.errorType).toBe('client');
      }
    });
  });

  describe('clearAllCaches', () => {
    it('should clear both price and snapshot caches', () => {
      const { clearSnapshotCache } = require('../python-api-client');
      
      clearAllCaches();

      expect(clearSnapshotCache).toHaveBeenCalled();
    });
  });
});
