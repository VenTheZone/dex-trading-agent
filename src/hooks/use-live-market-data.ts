import { useState, useEffect } from 'react';
import { fetchPriceWithFallback, clearAllCaches } from '@/lib/price-service';
import { TRADING_TOKENS } from '@/lib/tokenData';
import { toast } from 'sonner';
import { categorizeError } from '@/lib/error-handler';
import { startCacheMonitoring, isCachePerformanceDegraded, logCacheReport } from '@/lib/cache-monitor';
import { useTradingStore } from '@/store/tradingStore';

export interface LiveMarketData {
  symbol: string;
  price: number;
  priceChange24h?: number;
  lastUpdated: number;
  isLoading: boolean;
  error?: string;
  retryCount?: number;
}

export const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

export function useLiveMarketData() {
  const [marketData, setMarketData] = useState<Record<string, LiveMarketData>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Get network from trading store
  const network = useTradingStore((state) => state.network);

  useEffect(() => {
    // Reset state when network changes to prevent stale data
    setIsInitialLoad(true);
    setGlobalError(null);
    setMarketData({});
    
    let isActive = true;
    let retryTimeouts: NodeJS.Timeout[] = [];
    let refreshInterval: NodeJS.Timeout;
    
    // Start cache monitoring (logs every 5 minutes)
    const stopCacheMonitoring = startCacheMonitoring(300000);

    const fetchPriceWithRetry = async (symbol: string, retryCount = 0): Promise<void> => {
      if (!isActive) return;

      try {
        const price = await fetchPriceWithFallback(symbol, network);
        
        if (isActive) {
          setMarketData(prev => ({
            ...prev,
            [symbol]: {
              symbol,
              price,
              lastUpdated: Date.now(),
              isLoading: false,
              retryCount: 0,
            },
          }));
          
          // Clear global error if this was the last failing symbol
          setGlobalError(null);
        }
      } catch (error: any) {
        const errorInfo = categorizeError(error);
        
        console.error(`[Market Data] Failed to fetch ${symbol} on ${network} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
          type: errorInfo.type,
          message: errorInfo.message,
          isRetryable: errorInfo.isRetryable,
        });
        
        if (isActive) {
          // Determine if we should retry based on error type
          const shouldRetry = errorInfo.isRetryable && retryCount < MAX_RETRIES;
          
          if (shouldRetry) {
            const timeout = setTimeout(() => {
              fetchPriceWithRetry(symbol, retryCount + 1);
            }, RETRY_DELAY);
            
            retryTimeouts.push(timeout);
            
            setMarketData(prev => ({
              ...prev,
              [symbol]: {
                symbol,
                price: prev[symbol]?.price || 0,
                lastUpdated: prev[symbol]?.lastUpdated || Date.now(),
                isLoading: false,
                error: `${errorInfo.message} (${retryCount + 1}/${MAX_RETRIES})`,
                retryCount: retryCount + 1,
              },
            }));
          } else {
            // Max retries exceeded or non-retryable error
            const errorMessage = errorInfo.isRetryable 
              ? `Failed after ${MAX_RETRIES} attempts: ${errorInfo.message}`
              : `${errorInfo.message} (not retryable)`;
            
            setMarketData(prev => ({
              ...prev,
              [symbol]: {
                symbol,
                price: prev[symbol]?.price || 0,
                lastUpdated: prev[symbol]?.lastUpdated || Date.now(),
                isLoading: false,
                error: errorMessage,
                retryCount: MAX_RETRIES,
              },
            }));
            
            // Show toast only on initial load or for non-retryable errors
            if (isInitialLoad || !errorInfo.isRetryable) {
              toast.error(`Failed to fetch ${symbol} price`, {
                description: errorInfo.type === 'network' 
                  ? 'Check your internet connection'
                  : errorInfo.type === 'timeout'
                  ? 'Server took too long to respond'
                  : 'Using cached data if available',
                duration: 5000,
              });
            }
          }
        }
      }
    };

    const fetchAllPrices = async () => {
      const symbols = TRADING_TOKENS.map(token => `${token.symbol}USD`);
      
      // Initialize loading state for all symbols
      if (isInitialLoad) {
        const initialData: Record<string, LiveMarketData> = {};
        symbols.forEach(symbol => {
          initialData[symbol] = {
            symbol,
            price: 0,
            lastUpdated: Date.now(),
            isLoading: true,
          };
        });
        setMarketData(initialData);
      }
      
      // Fetch all prices with retry logic and track results
      const fetchPromises = symbols.map(symbol => fetchPriceWithRetry(symbol, 0));
      
      try {
        await Promise.allSettled(fetchPromises);
        
        if (isActive && isInitialLoad) {
          setIsInitialLoad(false);
          
          // Check if all fetches failed by examining the results
          // Use a small delay to allow state updates to complete
          setTimeout(() => {
            if (!isActive) return;
            
            // Access current marketData state via setMarketData callback to avoid closure issues
            setMarketData(currentData => {
              const allFailed = symbols.every(symbol => {
                const data = currentData[symbol];
                return data?.error && data.retryCount === MAX_RETRIES;
              });
              
              if (allFailed) {
                setGlobalError('Unable to fetch live market data. Please check your internet connection and ensure the backend service is running.');
                toast.error('Market data unavailable', {
                  description: 'All price sources are currently unreachable. Check backend connection.',
                  duration: 10000,
                });
              }
              
              return currentData; // Return unchanged state
            });
          }, 100);
          
          // Check cache performance after initial load
          if (isCachePerformanceDegraded()) {
            console.warn('[Market Data] Cache performance is degraded. Consider investigating.');
            logCacheReport();
          }
        }
      } catch (error: any) {
        console.error('[Market Data] Unexpected error in fetchAllPrices:', error);
        if (isActive) {
          setGlobalError('An unexpected error occurred while fetching market data');
        }
      }
    };

    // Initial fetch
    fetchAllPrices();

    // Refresh every 30 seconds
    refreshInterval = setInterval(() => {
      if (isActive) {
        fetchAllPrices();
      }
    }, REFRESH_INTERVAL);

    return () => {
      isActive = false;
      clearInterval(refreshInterval);
      retryTimeouts.forEach(timeout => clearTimeout(timeout));
      stopCacheMonitoring(); // Stop cache monitoring
      // Clear caches on unmount to prevent stale data
      clearAllCaches();
    };
  }, [network]); // Add network to dependencies

  const retrySymbol = (symbol: string) => {
    setMarketData(prev => ({
      ...prev,
      [symbol]: {
        ...prev[symbol],
        isLoading: true,
        error: undefined,
        retryCount: 0,
      },
    }));
    
    // Trigger a new fetch for this symbol with current network
    fetchPriceWithFallback(symbol, network)
      .then(price => {
        setMarketData(prev => ({
          ...prev,
          [symbol]: {
            symbol,
            price,
            lastUpdated: Date.now(),
            isLoading: false,
            retryCount: 0,
          },
        }));
        toast.success(`${symbol} price updated`);
      })
      .catch(error => {
        const errorInfo = categorizeError(error);
        setMarketData(prev => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            isLoading: false,
            error: errorInfo.message,
          },
        }));
        toast.error(`Failed to fetch ${symbol} price`, {
          description: errorInfo.type === 'network' 
            ? 'Check your internet connection'
            : errorInfo.message,
        });
      });
  };

  return { 
    marketData, 
    isInitialLoad, 
    globalError,
    retrySymbol,
  };
}