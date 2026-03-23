import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearAllCaches,
  clearPriceCache,
  fetchPriceWithFallback,
} from '../price-service';
import { clearSnapshotCache, pythonApi } from '../python-api-client';

describe('Cache Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T00:00:00Z'));
    vi.restoreAllMocks();
    clearAllCaches();
    clearSnapshotCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearAllCaches();
  });

  it('reuses cached price data within the cache duration', async () => {
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice').mockResolvedValueOnce(50000);

    const first = await fetchPriceWithFallback('BTCUSD');
    const second = await fetchPriceWithFallback('BTCUSD');

    expect(first).toMatchObject({ price: 50000, isStale: false });
    expect(second.price).toBe(50000);
    expect(fetchPriceSpy).toHaveBeenCalledTimes(1);
  });

  it('fetches fresh price data after cache expiration', async () => {
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice')
      .mockResolvedValueOnce(50000)
      .mockResolvedValueOnce(51000);

    const first = await fetchPriceWithFallback('BTCUSD');
    vi.setSystemTime(new Date('2026-03-23T00:00:05.100Z'));
    const second = await fetchPriceWithFallback('BTCUSD');

    expect(first.price).toBe(50000);
    expect(second.price).toBe(51000);
    expect(fetchPriceSpy).toHaveBeenCalledTimes(2);
  });

  it('uses stale cached prices as a fallback after an expired fetch fails', async () => {
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice')
      .mockResolvedValueOnce(50000)
      .mockRejectedValueOnce(new Error('Network error'));

    const first = await fetchPriceWithFallback('BTCUSD');
    vi.setSystemTime(new Date('2026-03-23T00:00:05.100Z'));
    const second = await fetchPriceWithFallback('BTCUSD');

    expect(first.price).toBe(50000);
    expect(second).toMatchObject({
      price: 50000,
      isStale: true,
      timestamp: first.timestamp,
    });
    expect(fetchPriceSpy).toHaveBeenCalledTimes(2);
  });

  it('clears the price cache independently', async () => {
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice')
      .mockResolvedValueOnce(50000)
      .mockResolvedValueOnce(50100);

    await fetchPriceWithFallback('BTCUSD');
    clearPriceCache();
    const refreshed = await fetchPriceWithFallback('BTCUSD');

    expect(refreshed.price).toBe(50100);
    expect(fetchPriceSpy).toHaveBeenCalledTimes(2);
  });

  it('clears both price and snapshot caches with clearAllCaches', async () => {
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice')
      .mockResolvedValueOnce(50000)
      .mockResolvedValueOnce(50500);
    const requestSpy = vi.spyOn(pythonApi as any, 'request')
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50000 } } },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { snapshots: { BTCUSD: { price: 50500 } } },
      });

    await fetchPriceWithFallback('BTCUSD');
    await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');
    clearAllCaches();
    const refreshedPrice = await fetchPriceWithFallback('BTCUSD');
    const refreshedSnapshots = await pythonApi.getSnapshotsForAI(['BTCUSD'], 'fast');

    expect(refreshedPrice.price).toBe(50500);
    expect(refreshedSnapshots.snapshots.BTCUSD.price).toBe(50500);
    expect(fetchPriceSpy).toHaveBeenCalledTimes(2);
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent requests for the same symbol', async () => {
    let resolvePrice: ((value: number) => void) | undefined;
    const fetchPriceSpy = vi.spyOn(pythonApi, 'fetchPrice').mockImplementationOnce(
      () => new Promise((resolve) => {
        resolvePrice = resolve;
      })
    );

    const pending = Promise.all([
      fetchPriceWithFallback('BTCUSD'),
      fetchPriceWithFallback('BTCUSD'),
      fetchPriceWithFallback('BTCUSD'),
    ]);

    resolvePrice?.(50000);
    const results = await pending;

    expect(results.map((result) => result.price)).toEqual([50000, 50000, 50000]);
    expect(fetchPriceSpy).toHaveBeenCalledTimes(1);
  });
});
