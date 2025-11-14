import { useState, useEffect } from 'react';
import { fetchPriceWithFallback } from '@/lib/price-service';
import { TRADING_TOKENS } from '@/lib/tokenData';
import { toast } from 'sonner';

export interface LiveMarketData {
  symbol: string;
  price: number;
  priceChange24h?: number;
  lastUpdated: number;
  isLoading: boolean;
  error?: string;
  retryCount?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

export function useLiveMarketData() {
  const [marketData, setMarketData] = useState<Record<string, LiveMarketData>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let retryTimeouts: NodeJS.Timeout[] = [];

    const fetchPriceWithRetry = async (symbol: string, retryCount = 0): Promise<void> => {
      if (!isActive) return;

      try {
        const price = await fetchPriceWithFallback(symbol);
        
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
        console.error(`Failed to fetch price for ${symbol} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
        
        if (isActive) {
          // If we haven't exceeded max retries, schedule a retry
          if (retryCount < MAX_RETRIES) {
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
                error: `Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
                retryCount: retryCount + 1,
              },
            }));
          } else {
            // Max retries exceeded
            setMarketData(prev => ({
              ...prev,
              [symbol]: {
                symbol,
                price: prev[symbol]?.price || 0,
                lastUpdated: prev[symbol]?.lastUpdated || Date.now(),
                isLoading: false,
                error: error.message || 'Failed to fetch price',
                retryCount: MAX_RETRIES,
              },
            }));
            
            // Show toast only on initial load or if all symbols fail
            if (isInitialLoad) {
              toast.error(`Failed to fetch ${symbol} price`, {
                description: 'Using cached data if available',
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
      
      // Fetch all prices with retry logic
      const fetchPromises = symbols.map(symbol => fetchPriceWithRetry(symbol, 0));
      
      try {
        await Promise.allSettled(fetchPromises);
        
        if (isActive && isInitialLoad) {
          setIsInitialLoad(false);
          
          // Check if all fetches failed
          const allFailed = symbols.every(symbol => {
            const data = marketData[symbol];
            return data?.error && data.retryCount === MAX_RETRIES;
          });
          
          if (allFailed) {
            setGlobalError('Unable to fetch live market data. Please check your internet connection.');
            toast.error('Market data unavailable', {
              description: 'All price sources are currently unreachable',
              duration: 10000,
            });
          }
        }
      } catch (error: any) {
        console.error('Unexpected error in fetchAllPrices:', error);
        if (isActive) {
          setGlobalError('An unexpected error occurred while fetching market data');
        }
      }
    };

    // Initial fetch
    fetchAllPrices();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (isActive) {
        fetchAllPrices();
      }
    }, REFRESH_INTERVAL);

    return () => {
      isActive = false;
      clearInterval(interval);
      retryTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isInitialLoad]);

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
    
    // Trigger a new fetch for this symbol
    fetchPriceWithFallback(symbol)
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
        setMarketData(prev => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            isLoading: false,
            error: error.message,
          },
        }));
        toast.error(`Failed to fetch ${symbol} price`);
      });
  };

  return { 
    marketData, 
    isInitialLoad, 
    globalError,
    retrySymbol,
  };
}