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

  // Try primary Binance API
  try {
    const response = await fetch(
      `${API_CONFIG.BINANCE.BASE_URL}/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(API_CONFIG.BINANCE.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const price = parseFloat(data.price);
      
      // Cache the result
      priceCache[symbol] = { price, timestamp: Date.now() };
      return price;
    }
  } catch (error) {
    console.warn('Primary Binance API failed, trying fallback...', error);
  }

  // Try fallback Binance API
  try {
    const response = await fetch(
      `${API_CONFIG.BINANCE.FALLBACK_URL}/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(API_CONFIG.BINANCE.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const price = parseFloat(data.price);
      
      // Cache the result
      priceCache[symbol] = { price, timestamp: Date.now() };
      return price;
    }
  } catch (error) {
    console.error('Fallback Binance API also failed', error);
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
