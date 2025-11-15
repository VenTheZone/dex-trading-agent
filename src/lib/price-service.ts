import { pythonApi } from './python-api-client';
import { TRADING_CONSTANTS } from './constants';

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};

/**
 * Fetches price from Hyperliquid via Python backend
 * Hyperliquid is the ONLY price source since it's our trading platform
 */
export async function fetchPriceWithFallback(symbol: string): Promise<number> {
  // Check cache first
  const cached = priceCache[symbol];
  if (cached && Date.now() - cached.timestamp < TRADING_CONSTANTS.PRICE_CACHE_DURATION) {
    return cached.price;
  }

  try {
    // Fetch from Hyperliquid via Python backend (avoids CORS)
    const price = await pythonApi.fetchPrice(symbol, false);
    
    // Cache the result
    priceCache[symbol] = { price, timestamp: Date.now() };
    return price;
  } catch (error: any) {
    console.error(`Failed to fetch price for ${symbol} from Hyperliquid:`, error);
    
    // If we have stale cache, use it as last resort
    if (cached) {
      console.warn(`Using stale cached price for ${symbol}`);
      return cached.price;
    }
    
    throw new Error(`Failed to fetch price for ${symbol} from Hyperliquid: ${error.message}`);
  }
}

export async function fetchMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  
  await Promise.allSettled(
    symbols.map(async (symbol) => {
      try {
        results[symbol] = await fetchPriceWithFallback(symbol);
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        // Don't throw, just skip this symbol
      }
    })
  );
  
  return results;
}

export function clearPriceCache() {
  Object.keys(priceCache).forEach(key => delete priceCache[key]);
}