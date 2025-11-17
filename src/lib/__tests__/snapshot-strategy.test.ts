import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { pythonApi, getSnapshotCacheMetrics, resetSnapshotCacheMetrics, clearSnapshotCache } from '../python-api-client';

// Mock the request method
vi.mock('../python-api-client', async () => {
  const actual = await vi.importActual('../python-api-client') as any;
  return {
    ...actual,
    pythonApi: {
      ...(actual.pythonApi || {}),
      getSnapshotsForAI: vi.fn(),
    },
  };
});

describe('Snapshot Strategy Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSnapshotCache();
    resetSnapshotCacheMetrics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fast vs Full Snapshot Types', () => {
    it('should fetch fast snapshots with correct type parameter', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000, volume: 1000 },
          ETHUSD: { price: 3000, volume: 500 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      const result = await pythonApi.getSnapshotsForAI(['BTCUSD', 'ETHUSD'], 'fast');

      expect(result).toEqual(mockSnapshots);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledWith(['BTCUSD', 'ETHUSD'], 'fast');
    });

    it('should fetch full snapshots with correct type parameter', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000, volume: 1000, indicators: { rsi: 65, macd: 'bullish' } },
          ETHUSD: { price: 3000, volume: 500, indicators: { rsi: 55, macd: 'neutral' } },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      const result = await pythonApi.getSnapshotsForAI(['BTCUSD', 'ETHUSD'], 'full');

      expect(result).toEqual(mockSnapshots);
      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledWith(['BTCUSD', 'ETHUSD'], 'full');
    });

    it('should default to fast snapshot type when not specified', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      await pythonApi.getSnapshotsForAI(['BTCUSD']);

      expect(pythonApi.getSnapshotsForAI).toHaveBeenCalledWith(['BTCUSD'], undefined);
    });
  });

  describe('Snapshot Cache Behavior', () => {
    it('should cache snapshots and reuse within cache duration', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      // First call - should hit API
      const result1 = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      expect(result1).toEqual(mockSnapshots);

      // Second call within cache duration - should use cache
      const result2 = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      expect(result2).toEqual(mockSnapshots);

      // Verify metrics
      const metrics = getSnapshotCacheMetrics();
      expect(metrics.hits).toBeGreaterThan(0);
      expect(metrics.fastSnapshots).toBeGreaterThan(0);
    });

    it('should invalidate cache when snapshot type changes', async () => {
      const mockFastSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      const mockFullSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000, indicators: { rsi: 65 } },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI)
        .mockResolvedValueOnce(mockFastSnapshots)
        .mockResolvedValueOnce(mockFullSnapshots);

      // First call with fast
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      // Second call with full - should invalidate cache
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'full');

      const metrics = getSnapshotCacheMetrics();
      expect(metrics.invalidations).toBeGreaterThan(0);
    });

    it('should invalidate cache when symbols change', async () => {
      const mockSnapshots1 = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      const mockSnapshots2 = {
        snapshots: {
          BTCUSD: { price: 50000 },
          ETHUSD: { price: 3000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI)
        .mockResolvedValueOnce(mockSnapshots1)
        .mockResolvedValueOnce(mockSnapshots2);

      // First call with one symbol
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      // Second call with different symbols - should invalidate cache
      await pythonApi.getSnapshotsForAI(['BTCUSD', 'ETHUSD'], 'fast');

      const metrics = getSnapshotCacheMetrics();
      expect(metrics.invalidations).toBeGreaterThan(0);
    });
  });

  describe('Snapshot Cache Metrics', () => {
    it('should track fast and full snapshot usage separately', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      // Fetch fast snapshots
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      // Fetch full snapshots
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'full');

      const metrics = getSnapshotCacheMetrics();
      expect(metrics.fastSnapshots).toBeGreaterThan(0);
      expect(metrics.fullSnapshots).toBeGreaterThan(0);
      expect(metrics.fastSnapshotRate).toBeGreaterThan(0);
      expect(metrics.fullSnapshotRate).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      // First call - miss
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      // Second call - hit (within cache duration)
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      const metrics = getSnapshotCacheMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(50);
    });

    it('should reset metrics correctly', async () => {
      const mockSnapshots = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI).mockResolvedValue(mockSnapshots);

      // Generate some metrics
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

      let metrics = getSnapshotCacheMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);

      // Reset metrics
      resetSnapshotCacheMetrics();

      metrics = getSnapshotCacheMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.fastSnapshots).toBe(0);
      expect(metrics.fullSnapshots).toBe(0);
    });
  });

  describe('Snapshot Cache Duration', () => {
    it('should respect 5-second cache duration', async () => {
      const mockSnapshots1 = {
        snapshots: {
          BTCUSD: { price: 50000 },
        },
      };

      const mockSnapshots2 = {
        snapshots: {
          BTCUSD: { price: 51000 },
        },
      };

      vi.mocked(pythonApi.getSnapshotsForAI)
        .mockResolvedValueOnce(mockSnapshots1)
        .mockResolvedValueOnce(mockSnapshots2);

      // First call
      const result1 = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      expect(result1.snapshots.BTCUSD.price).toBe(50000);

      // Wait for cache to expire (5 seconds + buffer)
      await new Promise(resolve => setTimeout(resolve, 5100));

      // Second call after cache expiration
      const result2 = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
      expect(result2.snapshots.BTCUSD.price).toBe(51000);

      const metrics = getSnapshotCacheMetrics();
      expect(metrics.misses).toBe(2); // Both calls should be cache misses
    });
  });
});
