import { API_CONFIG, TRADING_CONSTANTS } from './constants';

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};

export async function fetchPriceWithFallback(symbol: string): Promise<number> {
  // Check cache first
  const cached = priceCache[symbol];
  if (cached && Date.now() - cached.timestamp < TRADING_CONSTANTS.PRICE_CACHE_DURATION) {
    return cached.price;
  }

  // Convert symbol format (e.g., BTCUSD -> BTCUSDT for Binance)
  const binanceSymbol = symbol.replace('USD', 'USDT');

  // Try all Binance API endpoints
  for (const baseUrl of API_CONFIG.BINANCE.BASE_URLS) {
    try {
      const response = await fetch(
        `${baseUrl}/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(API_CONFIG.BINANCE.TIMEOUT) }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Check if response has error code (geo-restriction)
        if (data.code !== undefined) {
          console.warn(`Binance endpoint ${baseUrl} returned error:`, data.msg);
          continue;
        }
        const price = parseFloat(data.price);
        
        // Cache the result
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    } catch (error) {
      console.warn(`Binance endpoint ${baseUrl} failed:`, error);
    }
  }

  // Try Binance US as fallback
  try {
    const response = await fetch(
      `${API_CONFIG.BINANCE.US_URL}/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(API_CONFIG.BINANCE.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === undefined) {
        const price = parseFloat(data.price);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('Binance US API failed:', error);
  }

  // If both APIs fail, return cached value if available (even if stale)
  if (cached) {
    console.warn(`Using stale cached price for ${symbol}`);
    return cached.price;
  }

  // Last resort: throw error
  throw new Error(`Failed to fetch price for ${symbol} from all sources`);
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