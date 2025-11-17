/**
 * Cache Monitoring Service
 * Provides centralized cache performance monitoring and reporting
 */

import { getCacheMetrics, logCachePerformance, resetCacheMetrics } from './price-service';
import { getSnapshotCacheMetrics, logSnapshotCachePerformance, resetSnapshotCacheMetrics } from './python-api-client';

export interface CombinedCacheMetrics {
  price: ReturnType<typeof getCacheMetrics>;
  snapshot: ReturnType<typeof getSnapshotCacheMetrics>;
  overall: {
    totalHits: number;
    totalMisses: number;
    totalRequests: number;
    overallHitRate: number;
  };
}

/**
 * Get combined metrics from all caches
 */
export function getAllCacheMetrics(): CombinedCacheMetrics {
  const priceMetrics = getCacheMetrics();
  const snapshotMetrics = getSnapshotCacheMetrics();
  
  const totalHits = priceMetrics.hits + snapshotMetrics.hits;
  const totalMisses = priceMetrics.misses + snapshotMetrics.misses;
  const totalRequests = totalHits + totalMisses;
  const overallHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  
  return {
    price: priceMetrics,
    snapshot: snapshotMetrics,
    overall: {
      totalHits,
      totalMisses,
      totalRequests,
      overallHitRate: Math.round(overallHitRate * 100) / 100,
    },
  };
}

/**
 * Log comprehensive cache performance report
 */
export function logCacheReport() {
  console.group('📊 Cache Performance Report');
  
  logCachePerformance();
  logSnapshotCachePerformance();
  
  const metrics = getAllCacheMetrics();
  console.info('[Overall Cache Performance]', {
    totalHits: metrics.overall.totalHits,
    totalMisses: metrics.overall.totalMisses,
    totalRequests: metrics.overall.totalRequests,
    overallHitRate: `${metrics.overall.overallHitRate}%`,
  });
  
  // Warn if performance is degraded
  if (isCachePerformanceDegraded()) {
    console.warn('⚠️ Cache performance is below optimal levels. Hit rate is below 50%.');
  }
  
  console.groupEnd();
}

/**
 * Reset all cache metrics
 */
export function resetAllCacheMetrics() {
  resetCacheMetrics();
  resetSnapshotCacheMetrics();
  console.info('[Cache Monitor] All metrics reset');
}

/**
 * Start periodic cache monitoring
 * @param intervalMs Interval in milliseconds (default: 5 minutes)
 */
export function startCacheMonitoring(intervalMs: number = 300000): () => void {
  console.info('[Cache Monitor] Starting periodic monitoring');
  
  const intervalId = setInterval(() => {
    logCacheReport();
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.info('[Cache Monitor] Stopped periodic monitoring');
  };
}

/**
 * Check if cache performance is degraded
 */
export function isCachePerformanceDegraded(): boolean {
  const metrics = getAllCacheMetrics();
  const threshold = 50; // 50% hit rate threshold
  
  return metrics.overall.overallHitRate < threshold && metrics.overall.totalRequests > 10;
}

/**
 * Get cache health status
 */
export function getCacheHealthStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
  const metrics = getAllCacheMetrics();
  const hitRate = metrics.overall.overallHitRate;
  
  if (hitRate >= 80) return 'excellent';
  if (hitRate >= 60) return 'good';
  if (hitRate >= 40) return 'fair';
  return 'poor';
}