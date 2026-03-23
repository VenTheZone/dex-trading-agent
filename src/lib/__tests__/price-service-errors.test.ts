import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearPriceCache, fetchPriceWithFallback } from '../price-service';
import { pythonApi } from '../python-api-client';

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

  describe('fetchPriceWithFallback - Error Scenarios', () => {
    it('throws enhanced errors with network categorization', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(fetchPriceWithFallback('BTCUSD')).rejects.toMatchObject({
        message: expect.stringContaining('network'),
        errorType: 'network',
        isRetryable: true,
      });
    });

    it('throws enhanced errors with timeout metadata', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(fetchPriceWithFallback('ETHUSD')).rejects.toMatchObject({
        errorType: 'timeout',
        isRetryable: true,
      });
    });

    it('throws enhanced errors with server metadata', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('500 Internal Server Error'));

      await expect(fetchPriceWithFallback('SOLUSD')).rejects.toMatchObject({
        errorType: 'server',
        isRetryable: true,
      });
    });

    it('uses stale cache as fallback on error after cache expiry', async () => {
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);
      const first = await fetchPriceWithFallback('BTCUSD');

      vi.setSystemTime(new Date('2026-03-23T00:00:06Z'));
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Network error'));
      const cached = await fetchPriceWithFallback('BTCUSD');

      expect(first.price).toBe(50000);
      expect(cached).toMatchObject({
        price: 50000,
        isStale: true,
        timestamp: first.timestamp,
      });
    });

    it('throws when no cache is available', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(fetchPriceWithFallback('NEWCOIN')).rejects.toThrow();
    });

    it('marks client errors as non-retryable', async () => {
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('404 Not Found'));

      await expect(fetchPriceWithFallback('INVALID')).rejects.toMatchObject({
        errorType: 'client',
        isRetryable: false,
      });
    });
  });

  describe('Cache behavior with errors', () => {
    it('caches successful results', async () => {
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(3000);

      await fetchPriceWithFallback('ETHUSD');
      await fetchPriceWithFallback('ETHUSD');

      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
    });

    it('does not cache failed requests', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(3000);

      await expect(fetchPriceWithFallback('ETHUSD')).rejects.toThrow();
      const price = await fetchPriceWithFallback('ETHUSD');

      expect(price).toMatchObject({ price: 3000, isStale: false });
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
    });
  });
});
