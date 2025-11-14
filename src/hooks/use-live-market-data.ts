import { useState, useEffect } from 'react';
import { fetchPriceWithFallback } from '@/lib/price-service';
import { TRADING_TOKENS } from '@/lib/tokenData';

export interface LiveMarketData {
  symbol: string;
  price: number;
  priceChange24h?: number;
  lastUpdated: number;
  isLoading: boolean;
  error?: string;
}

export function useLiveMarketData() {
  const [marketData, setMarketData] = useState<Record<string, LiveMarketData>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchAllPrices = async () => {
      const symbols = TRADING_TOKENS.map(token => `${token.symbol}USD`);
      
      for (const symbol of symbols) {
        if (!isActive) break;

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
              },
            }));
          }
        } catch (error: any) {
          console.error(`Failed to fetch price for ${symbol}:`, error);
          
          if (isActive) {
            setMarketData(prev => ({
              ...prev,
              [symbol]: {
                symbol,
                price: 0,
                lastUpdated: Date.now(),
                isLoading: false,
                error: error.message,
              },
            }));
          }
        }
      }

      if (isActive && isInitialLoad) {
        setIsInitialLoad(false);
      }
    };

    // Initial fetch
    fetchAllPrices();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAllPrices, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [isInitialLoad]);

  return { marketData, isInitialLoad };
}
