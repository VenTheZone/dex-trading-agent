import { pythonApi } from "./python-api-client";
import { NetworkType } from "./constants";
import { categorizeError } from "./error-handler";

const TRADING_CONSTANTS = {
  CACHE_DURATION: 5000,
  STALE_THRESHOLD: 10000,
  CLEANUP_INTERVAL: 60000, // Check every minute
  MAX_CACHE_AGE: 300000,   // Remove items older than 5 minutes
  MAX_CACHE_ITEMS: 100,    // Maximum number of items to keep in cache (LRU policy)
};

export interface PriceResult {
  price: number;
  isStale: boolean;
  timestamp: number;
}

/**
 * Get cached price synchronously if available
 * Useful for Stale-While-Revalidate strategies
 */
export function getCachedPrice(symbol: string, network: NetworkType): PriceResult | null {
  const cacheKey = `${symbol}_${network}`;
  const cached = priceCache[cacheKey];
  
  if (cached) {
    return {
      price: cached.price,
      isStale: Date.now() - cached.timestamp > TRADING_CONSTANTS.CACHE_DURATION,
      timestamp: cached.timestamp
    };
  }
  
  return null;
}

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
  evictions: number;
}

const priceCache: PriceCache = {};
const pendingRequests: Record<string, Promise<number> | undefined> = {}; // Request deduplication map

const cacheMetrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  errors: 0,
  lastReset: Date.now(),
  evictions: 0,
};

let cleanupInterval: any = null;

/**
 * Prunes expired cache entries to prevent memory leaks
 * Implements both TTL (Time-To-Live) and LRU (Least Recently Used) eviction policies
 */
export function pruneCache() {
  const now = Date.now();
  let prunedCount = 0;
  
  // 1. Time-based eviction (TTL)
  Object.keys(priceCache).forEach(key => {
    if (now - priceCache[key].timestamp > TRADING_CONSTANTS.MAX_CACHE_AGE) {
      delete priceCache[key];
      prunedCount++;
    }
  });

  // 2. Size-based eviction (LRU approximation using timestamp)
  const keys = Object.keys(priceCache);
  if (keys.length > TRADING_CONSTANTS.MAX_CACHE_ITEMS) {
    // Sort by timestamp ascending (oldest first)
    const sortedKeys = keys.sort((a, b) => priceCache[a].timestamp - priceCache[b].timestamp);
    const itemsToRemove = sortedKeys.slice(0, keys.length - TRADING_CONSTANTS.MAX_CACHE_ITEMS);
    
    itemsToRemove.forEach(key => {
      delete priceCache[key];
      prunedCount++;
    });
  }
  
  if (prunedCount > 0) {
    cacheMetrics.evictions += prunedCount;
    console.debug(`[Cache Cleaner] Pruned ${prunedCount} entries (expired or overflow)`);
  }
}

/**
 * Starts the periodic cache cleanup job
 * Returns a cleanup function to stop the job
 */
export function startCacheCleanup() {
  if (cleanupInterval) return () => {}; // Already running
  
  cleanupInterval = setInterval(pruneCache, TRADING_CONSTANTS.CLEANUP_INTERVAL);
  console.info('[Cache Cleaner] Started periodic cleanup');
  
  return () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
      console.info('[Cache Cleaner] Stopped periodic cleanup');
    }
  };
}

/**
 * Fetches price from Hyperliquid via Python backend
 * Hyperliquid is the ONLY price source since it's our trading platform
 */
export async function fetchPriceWithFallback(symbol: string, network: NetworkType = 'mainnet', forceRefresh: boolean = false): Promise<PriceResult> {
  // Check cache first (network-specific)
  const cacheKey = `${symbol}_${network}`;
  const cached = priceCache[cacheKey];
  
  if (!forceRefresh && cached && Date.now() - cached.timestamp < TRADING_CONSTANTS.CACHE_DURATION) {
    cacheMetrics.hits++;
    console.debug(`[Price Cache] HIT for ${symbol} on ${network} (age: ${Date.now() - cached.timestamp}ms)`);
    return {
      price: cached.price,
      isStale: false,
      timestamp: cached.timestamp
    };
  }

  // Request Deduplication: Return existing promise if request is already in flight
  if (pendingRequests[cacheKey]) {
    try {
      const price = await pendingRequests[cacheKey]!;
      return {
        price,
        isStale: false,
        timestamp: Date.now()
      };
    } catch (error) {
      // If pending request failed, proceed to make a new request
      delete pendingRequests[cacheKey];
    }
  }

  // Cache miss or forced refresh
  if (!forceRefresh) {
    cacheMetrics.misses++;
    console.debug(`[Price Cache] MISS for ${symbol} on ${network} (reason: ${cached ? 'expired' : 'not found'})`);
  } else {
    console.debug(`[Price Cache] FORCE REFRESH for ${symbol} on ${network}`);
  }

  try {
    // Create new request promise
    const fetchPromise = (async () => {
      const isTestnet = network === 'testnet';
      return await pythonApi.fetchPrice(symbol, isTestnet);
    })();

    // Store promise in pending map
    pendingRequests[cacheKey] = fetchPromise;

    // Await result
    const price = await fetchPromise;
    
    // Cleanup pending request
    delete pendingRequests[cacheKey];
    
    // Cache the result with network context
    const timestamp = Date.now();
    priceCache[cacheKey] = { price, timestamp, network };
    return {
      price,
      isStale: false,
      timestamp
    };
  } catch (error: any) {
    delete pendingRequests[cacheKey]; // Ensure cleanup on error
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
      return {
        price: cached.price,
        isStale: true,
        timestamp: cached.timestamp
      };
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

export async function fetchMultiplePrices(symbols: string[], network: NetworkType = 'mainnet'): Promise<Record<string, PriceResult>> {
  const results: Record<string, PriceResult> = {};
  
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
  console.info('[Cache] All caches cleared');
}

/**
 * Manually evict a specific item from cache
 */
export function evictFromCache(symbol: string, network: NetworkType) {
  const cacheKey = `${symbol}_${network}`;
  if (priceCache[cacheKey]) {
    delete priceCache[cacheKey];
    cacheMetrics.evictions++;
    console.debug(`[Cache] Manually evicted ${symbol} on ${network}`);
  }
}

/**
 * Get cache performance metrics
 */
export function getCacheMetrics(): CacheMetrics & { hitRate: number; totalRequests: number; size: number } {
  const totalRequests = cacheMetrics.hits + cacheMetrics.misses;
  const hitRate = totalRequests > 0 ? (cacheMetrics.hits / totalRequests) * 100 : 0;
  
  return {
    ...cacheMetrics,
    hitRate: Math.round(hitRate * 100) / 100,
    totalRequests,
    size: Object.keys(priceCache).length,
  };
}

/**
 * Reset cache metrics
 */
export function resetCacheMetrics() {
  cacheMetrics.hits = 0;
  cacheMetrics.misses = 0;
  cacheMetrics.errors = 0;
  cacheMetrics.evictions = 0;
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
    evictions: metrics.evictions,
    size: metrics.size,
    hitRate: `${metrics.hitRate}%`,
    totalRequests: metrics.totalRequests,
  });
}