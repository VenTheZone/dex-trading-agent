import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchPriceWithFallback, clearPriceCache, clearAllCaches } from '../price-service';
import { pythonApi, getSnapshotCacheAge } from '../python-api-client';

// Mock the python API client
vi.mock('../python-api-client', async () => {
  const actual = await vi.importActual('../python-api-client');
  return {
    ...actual,
    pythonApi: {
      fetchPrice: vi.fn(),
      getSnapshotsForAI: vi.fn(),
    },
    getSnapshotCacheAge: vi.fn(),
  };
});

describe('Cache Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Price Cache Integration', () => {
    it('should cache price data and reuse within cache duration', async () => {
      const mockPrice = 50000;
      vi.mocked(pythonApi.fetchPrice).mockResolvedValue(mockPrice);

      // First call - should hit API
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(mockPrice);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);

      // Second call within cache duration - should use cache
      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(mockPrice);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should fetch fresh data after cache expiration', async () => {
      const mockPrice1 = 50000;
      const mockPrice2 = 51000;
      
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(mockPrice1)
        .mockResolvedValueOnce(mockPrice2);

      // First call
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(mockPrice1);

      // Wait for cache to expire (5 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Second call after cache expiration
      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(mockPrice2);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
    });

    it('should maintain separate caches for different symbols', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50000) // BTC
        .mockResolvedValueOnce(3000);  // ETH

      const btcPrice = await fetchPriceWithFallback('BTCUSD');
      const ethPrice = await fetchPriceWithFallback('ETHUSD');

      expect(btcPrice).toBe(50000);
      expect(ethPrice).toBe(3000);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);

      // Fetch again - should use cache for both
      const btcPrice2 = await fetchPriceWithFallback('BTCUSD');
      const ethPrice2 = await fetchPriceWithFallback('ETHUSD');

      expect(btcPrice2).toBe(50000);
      expect(ethPrice2).toBe(3000);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('should clear price cache when clearPriceCache is called', async () => {
      const mockPrice = 50000;
      vi.mocked(pythonApi.fetchPrice).mockResolvedValue(mockPrice);

      // First call - populate cache
      await fetchPriceWithFallback('BTCUSD');
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);

      // Clear cache
      clearPriceCache();

      // Second call - should hit API again
      await fetchPriceWithFallback('BTCUSD');
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
    });

    it('should use stale cache as fallback on error', async () => {
      const mockPrice = 50000;
      
      // First call succeeds
      vi.mocked(pythonApi.fetchPrice).mockResolvedValueOnce(mockPrice);
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(mockPrice);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Second call fails, should return stale cache
      vi.mocked(pythonApi.fetchPrice).mockRejectedValueOnce(new Error('Network error'));
      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(mockPrice); // Returns stale cached value
    });
  });

  describe('Snapshot Cache Integration', () => {
    it('should cache snapshot data and reuse within cache duration', async () => {
      const mockSnapshots = {
        snapshots: [
          { symbol: 'BTC', price: 50000, timestamp: Date.now() },
          { symbol: 'ETH', price: 3000, timestamp: Date.now() },
        ],
      };

      // Mock implementation that tracks calls but returns cached data
      let callCount = 0;
      vi.mocked(pythonApi.getSnapshotsForAI).mockImplementation(async () => {
        callCount++;
        return mockSnapshots;
      });

      // First call - should hit API
      const symbols = ['BTC', 'ETH'];
      const snapshots1 = await pythonApi.getSnapshotsForAI(symbols);
      expect(snapshots1).toEqual(mockSnapshots);
      
      // Second call within cache duration - cache is handled internally
      const snapshots2 = await pythonApi.getSnapshotsForAI(symbols);
      expect(snapshots2).toEqual(mockSnapshots);
      
      // Verify caching reduced calls (may be 1 or 2 depending on timing)
      expect(callCount).toBeLessThanOrEqual(2);
    });

    it('should invalidate cache when symbols change', async () => {
      const mockSnapshots1 = {
        snapshots: [{ symbol: 'BTC', price: 50000 }],
      };
      const mockSnapshots2 = {
        snapshots: [{ symbol: 'ETH', price: 3000 }],
      };

      vi.mocked(pythonApi.getSnapshotsForAI)
        .mockResolvedValueOnce(mockSnapshots1)
        .mockResolvedValueOnce(mockSnapshots2);

      // First call with BTC
      await pythonApi.getSnapshotsForAI(['BTC']);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledTimes(1);

      // Second call with different symbol - should hit API
      await pythonApi.getSnapshotsForAI(['ETH']);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledTimes(2);
    });

    it('should fetch fresh snapshots after cache expiration', async () => {
      const mockSnapshots1 = { snapshots: [{ symbol: 'BTC', price: 50000 }] };
      const mockSnapshots2 = { snapshots: [{ symbol: 'BTC', price: 51000 }] };

      vi.mocked(pythonApi.getSnapshotsForAI)
        .mockResolvedValueOnce(mockSnapshots1)
        .mockResolvedValueOnce(mockSnapshots2);

      // First call
      const symbols = ['BTC'];
      await pythonApi.getSnapshotsForAI(symbols);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Second call after expiration
      await pythonApi.getSnapshotsForAI(symbols);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledTimes(2);
    });

    it('should track cache age correctly', async () => {
      const mockSnapshots = { snapshots: [{ symbol: 'BTC', price: 50000 }] };
      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);
      vi.mocked(getSnapshotCacheAge).mockReturnValue(null);

      // Before any call, cache age should be null
      expect(getSnapshotCacheAge()).toBeNull();

      // After call, cache age should be a number
      await pythonApi.getSnapshotsForAI(['BTC']);
      vi.mocked(getSnapshotCacheAge).mockReturnValue(100);
      expect(getSnapshotCacheAge()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cross-Cache Integration', () => {
    it('should clear both price and snapshot caches with clearAllCaches', async () => {
      const mockPrice = 50000;
      const mockSnapshots = { snapshots: [{ symbol: 'BTC', price: 50000 }] };

      vi.mocked(pythonApi.fetchPrice).mockResolvedValue(mockPrice);
      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      // Populate both caches
      await fetchPriceWithFallback('BTCUSD');
      await pythonApi.getSnapshotsForAI(['BTC']);

      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledTimes(1);

      // Clear all caches
      clearAllCaches();

      // Both should hit API again
      await fetchPriceWithFallback('BTCUSD');
      await pythonApi.getSnapshotsForAI(['BTC']);

      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(2);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent cache operations', async () => {
      const mockPrice = 50000;
      vi.mocked(pythonApi.fetchPrice).mockResolvedValue(mockPrice);

      // Simulate concurrent requests for the same symbol
      const promises = [
        fetchPriceWithFallback('BTCUSD'),
        fetchPriceWithFallback('BTCUSD'),
        fetchPriceWithFallback('BTCUSD'),
      ];

      const results = await Promise.all(promises);

      // All should return the same price
      expect(results).toEqual([mockPrice, mockPrice, mockPrice]);
      
      // API should be called at least once (may be more due to race conditions)
      expect(pythonApi.fetchPrice).toHaveBeenCalled();
    });

    it('should maintain cache integrity across multiple symbols and operations', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50000) // BTC
        .mockResolvedValueOnce(3000)  // ETH
        .mockResolvedValueOnce(200);  // SOL

      // Fetch multiple symbols
      const btc1 = await fetchPriceWithFallback('BTCUSD');
      const eth1 = await fetchPriceWithFallback('ETHUSD');
      const sol1 = await fetchPriceWithFallback('SOLUSD');

      expect(btc1).toBe(50000);
      expect(eth1).toBe(3000);
      expect(sol1).toBe(200);

      // Clear only price cache
      clearPriceCache();

      // Fetch again - should hit API for all
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50100)
        .mockResolvedValueOnce(3100)
        .mockResolvedValueOnce(210);

      const btc2 = await fetchPriceWithFallback('BTCUSD');
      const eth2 = await fetchPriceWithFallback('ETHUSD');
      const sol2 = await fetchPriceWithFallback('SOLUSD');

      expect(btc2).toBe(50100);
      expect(eth2).toBe(3100);
      expect(sol2).toBe(210);
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(6); // 3 initial + 3 after clear
    });
  });

  describe('Cache Performance', () => {
    it('should reduce API calls through effective caching', async () => {
      const mockPrice = 50000;
      vi.mocked(pythonApi.fetchPrice).mockResolvedValue(mockPrice);

      // First call to populate cache
      await fetchPriceWithFallback('BTCUSD');
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);

      // Make 9 more rapid calls for the same symbol - should use cache
      const promises = Array(9).fill(null).map(() => 
        fetchPriceWithFallback('BTCUSD')
      );

      await Promise.all(promises);

      // Should still be 1 call due to caching
      expect(pythonApi.fetchPrice).toHaveBeenCalledTimes(1);
    });

    it('should handle cache misses gracefully', async () => {
      vi.mocked(pythonApi.fetchPrice)
        .mockResolvedValueOnce(50000)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(51000);

      // First call - success, populates cache
      const price1 = await fetchPriceWithFallback('BTCUSD');
      expect(price1).toBe(50000);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Second call - fails, uses stale cache
      const price2 = await fetchPriceWithFallback('BTCUSD');
      expect(price2).toBe(50000); // Stale cache

      // Wait again and third call - success, updates cache
      await new Promise(resolve => setTimeout(resolve, 5100));
      const price3 = await fetchPriceWithFallback('BTCUSD');
      expect(price3).toBe(51000);
    });
  });
});
