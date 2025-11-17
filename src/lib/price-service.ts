import { pythonApi, clearSnapshotCache } from './python-api-client';
import { TRADING_CONSTANTS } from './constants';
import { categorizeError } from './error-handler';
import type { NetworkType } from './constants';

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
    network: NetworkType;
  };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastReset: number;
}

const priceCache: PriceCache = {};
const cacheMetrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastReset: Date.now(),
};

/**
 * Fetches price from Hyperliquid via Python backend
 * Hyperliquid is the ONLY price source since it's our trading platform
 */
export async function fetchPriceWithFallback(symbol: string, network: NetworkType = 'mainnet'): Promise<number> {
  // Check cache first (network-specific)
  const cacheKey = `${symbol}_${network}`;
  const cached = priceCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < TRADING_CONSTANTS.PRICE_CACHE_DURATION) {
    cacheMetrics.hits++;
    console.debug(`[Price Cache] HIT for ${symbol} on ${network} (age: ${Date.now() - cached.timestamp}ms)`);
    return cached.price;
  }

  // Cache miss
  cacheMetrics.misses++;
  console.debug(`[Price Cache] MISS for ${symbol} on ${network} (reason: ${cached ? 'expired' : 'not found'})`);

  try {
    // Fetch from Hyperliquid via Python backend (avoids CORS)
    const isTestnet = network === 'testnet';
    const price = await pythonApi.fetchPrice(symbol, isTestnet);
    
    // Cache the result with network context
    priceCache[cacheKey] = { price, timestamp: Date.now(), network };
    return price;
  } catch (error: any) {
    cacheMetrics.errors++;
    const errorInfo = categorizeError(error);
    
    console.error(`[Price Service] Failed to fetch ${symbol} on ${network}:`, {
      type: errorInfo.type,
      message: errorInfo.message,
      isRetryable: errorInfo.isRetryable,
      originalError: error.message,
    });
    
    // If we have stale cache, use it as last resort
    if (cached) {
      console.warn(`[Price Service] Using stale cached price for ${symbol} on ${network} (age: ${Date.now() - cached.timestamp}ms)`);
      return cached.price;
    }
    
    // Enhance error message with categorization
    const enhancedError = new Error(
      `Failed to fetch price for ${symbol} on ${network}: ${errorInfo.message} (${errorInfo.type})`
    );
    (enhancedError as any).isRetryable = errorInfo.isRetryable;
    (enhancedError as any).errorType = errorInfo.type;
    
    throw enhancedError;
  }
}

export async function fetchMultiplePrices(symbols: string[], network: NetworkType = 'mainnet'): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        results[symbol] = await fetchPriceWithFallback(symbol, network);
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol} on ${network}:`, error);
        // Don't throw, just skip this symbol
      }
    })
  );
  
  return results;
}

export function clearPriceCache() {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
}

export function clearAllCaches() {
  clearPriceCache();
  clearSnapshotCache();
  console.info('[Cache] All caches cleared');
}

/**
 * Get cache performance metrics
 */
export function getCacheMetrics(): CacheMetrics & { hitRate: number; totalRequests: number } {
  const totalRequests = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = totalRequests > 0 ? (cacheMetrics.hits / totalRequests) * 100 : 0;
  
  return {
    ...cacheMetrics,
    hitRate: Math.round(hitRate * 100) / 100,
    totalRequests,
  };
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics() {
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.errors = 0;
  cacheMetrics.lastReset = Date.now();
  console.info('[Cache Metrics] Reset');
}

/**
 * Log cache performance summary
 */
export function logCachePerformance() {
  const metrics = getCacheMetrics();
  const uptime = Math.round((Date.now() - metrics.lastReset) / 1000);
  
  console.info('[Cache Performance]', {
    uptime: `${uptime}s`,
    hits: metrics.hits,
    misses: metrics.misses,
    errors: metrics.errors,
    hitRate: `${metrics.hitRate}%`,
    totalRequests: metrics.totalRequests,
  });
}