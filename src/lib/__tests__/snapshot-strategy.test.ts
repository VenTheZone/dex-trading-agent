import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearSnapshotCache,
  getSnapshotCacheAge,
  getSnapshotCacheMetrics,
  pythonApi,
  resetSnapshotCacheMetrics,
} from '../python-api-client';

describe('Snapshot Strategy Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T00:00:00Z'));
    vi.restoreAllMocks();
    clearSnapshotCache();
    resetSnapshotCacheMetrics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearSnapshotCache();
    resetSnapshotCacheMetrics();
  });

  it('reuses cached fast snapshots and tracks cache age', async () => {
    const requestSpy = vi.spyOn(pythonApi as any, 'request').mockResolvedValueOnce({
      success: true,
      data: { snapshots: { BTCUSD: { price: 50000 } } },
    });

    const first = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    vi.setSystemTime(new Date('2026-03-23T00:00:01Z'));
    const second = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    const metrics = getSnapshotCacheMetrics();

    expect(second).toEqual(first);
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(getSnapshotCacheAge()).toBe(1000);
    expect(metrics).toMatchObject({
      totalRequests: 2,
      hits: 1,
      misses: 1,
      fastSnapshots: 1,
      fullSnapshots: 0,
      hitRate: 50,
    });
  });

  it('invalidates the snapshot cache when the snapshot type changes', async () => {
    const requestSpy = vi.spyOn(pythonApi as any, 'request')
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000 } } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000, indicators: { rsi: 65 } } } },
      });

    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'full');

    expect(requestSpy).toHaveBeenCalledTimes(2);
    expect(getSnapshotCacheMetrics()).toMatchObject({
      misses: 2,
      invalidations: 1,
      fastSnapshots: 1,
      fullSnapshots: 1,
    });
  });

  it('invalidates the snapshot cache when the symbol set changes', async () => {
    const requestSpy = vi.spyOn(pythonApi as any, 'request')
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000 } } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000 }, ETHUSD: { price: 3000 } } },
      });

    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    await pythonApi.getSnapshotsForAI(['BTCUSD', 'ETHUSD'], 'fast');

    expect(requestSpy).toHaveBeenCalledTimes(2);
    expect(getSnapshotCacheMetrics()).toMatchObject({
      misses: 2,
      invalidations: 1,
      fastSnapshots: 2,
    });
  });

  it('expires the snapshot cache after five seconds', async () => {
    const requestSpy = vi.spyOn(pythonApi as any, 'request')
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000 } } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 51000 } } },
      });

    const first = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    vi.setSystemTime(new Date('2026-03-23T00:00:05.100Z'));
    const second = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

    expect(first.snapshots.BTCUSD.price).toBe(50000);
    expect(second.snapshots.BTCUSD.price).toBe(51000);
    expect(requestSpy).toHaveBeenCalledTimes(2);
    expect(getSnapshotCacheMetrics()).toMatchObject({
      misses: 2,
      invalidations: 1,
      hits: 0,
    });
  });

  it('resets snapshot metrics cleanly', async () => {
    vi.spyOn(pythonApi as any, 'request').mockResolvedValueOnce({
      success: true,
      data: { snapshots: { BTCUSD: { price: 50000 } } },
    });

    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    resetSnapshotCacheMetrics();

    expect(getSnapshotCacheMetrics()).toMatchObject({
      totalRequests: 0,
      hits: 0,
      misses: 0,
      invalidations: 0,
      fastSnapshots: 0,
      fullSnapshots: 0,
    });
  });
});
