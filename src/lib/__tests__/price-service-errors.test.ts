import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchPriceWithFallback, clearPriceCache } from '../price-service';
import { pythonApi } from '../python-api-client';

// Mock the python API client
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

  describe('fetchPriceWithFallback - Error Scenarios', () => {
    it('should throw enhanced error with categorization on network failure', async () => {
      const networkError = new Error('Failed to fetch');
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(networkError);

      await expect(fetchPriceWithFallback('BTCUSD')).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('network'),
        })
      );
    });

    it('should throw enhanced error with isRetryable flag', async () => {
      const timeoutError = new Error('Request timeout');
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(timeoutError);

      try {
        await fetchPriceWithFallback('ETHUSD');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isRetryable).toBe(true);
        expect(error.errorType).toBe('timeout');
      }
    });

    it('should throw enhanced error with errorType property', async () => {
      const serverError = new Error('500 Internal Server Error');
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(serverError);

      try {
        await fetchPriceWithFallback('SOLUSD');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.errorType).toBe('server');
        expect(error.isRetryable).toBe(true);
      }
    });

    it('should use stale cache as fallback on error', async () => {
      // First successful fetch to populate cache
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(50000);
      const firstPrice = await fetchPriceWithFallback('BTCUSD');
      expect(firstPrice).toBe(50000);

      // Second fetch fails, should return cached value
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Network error'));
      const cachedPrice = await fetchPriceWithFallback('BTCUSD');
      expect(cachedPrice).toBe(50000);
    });

    it('should throw error when no cache available', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(error);

      await expect(fetchPriceWithFallback('NEWCOIN')).rejects.toThrow();
    });

    it('should mark client errors as non-retryable', async () => {
      const clientError = new Error('404 Not Found');
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(clientError);

      try {
        await fetchPriceWithFallback('INVALID');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isRetryable).toBe(false);
        expect(error.errorType).toBe('client');
      }
    });
  });

  describe('Cache behavior with errors', () => {
    it('should cache successful results', async () => {
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(3000);
      
      await fetchPriceWithFallback('ETHUSD');
      await fetchPriceWithFallback('ETHUSD');

      // Should only call API once due to caching
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
    });

    it('should not cache failed requests', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(3000);

      // First call fails
      await expect(fetchPriceWithFallback('ETHUSD')).rejects.toThrow();
      
      // Second call should retry (not use failed cache)
      const price = await fetchPriceWithFallback('ETHUSD');
      expect(price).toBe(3000);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
    });
  });
});
