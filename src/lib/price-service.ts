import { API_CONFIG, TRADING_CONSTANTS } from './constants';

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};

/**
 * Fetches price from Hyperliquid (primary source)
 */
async function fetchFromHyperliquid(symbol: string): Promise<number | null> {
  try {
    const hlSymbol = symbol.replace('USD', '');
    
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
      signal: AbortSignal.timeout(API_CONFIG.BINANCE.TIMEOUT)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data[hlSymbol]) {
        return parseFloat(data[hlSymbol]);
      }
    }
  } catch (error) {
    console.warn(`Hyperliquid API failed for ${symbol}:`, error);
  }
  return null;
}

export async function fetchPriceWithFallback(symbol: string): Promise<number> {
  // Check cache first
  const cached = priceCache[symbol];
  if (cached && Date.now() - cached.timestamp < TRADING_CONSTANTS.PRICE_CACHE_DURATION) {
    return cached.price;
  }

  // Try Hyperliquid first (most accurate)
  let price = await fetchFromHyperliquid(symbol);
  if (price) {
    priceCache[symbol] = { price, timestamp: Date.now() };
    return price;
  }

  // Convert symbol format (e.g., BTCUSD -> BTCUSDT for most exchanges)
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

  // Try KuCoin
  try {
    const response = await fetch(
      `${API_CONFIG.KUCOIN.BASE_URL}?symbol=BTC-USDT`.replace('BTC-USDT', binanceSymbol.replace('USDT', '-USDT')),
      { signal: AbortSignal.timeout(API_CONFIG.KUCOIN.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.price) {
        const price = parseFloat(data.data.price);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('KuCoin API failed:', error);
  }

  // Try OKX
  try {
    const response = await fetch(
      `${API_CONFIG.OKX.BASE_URL}?instId=${binanceSymbol.replace('USDT', '-USDT')}`,
      { signal: AbortSignal.timeout(API_CONFIG.OKX.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.[0]?.last) {
        const price = parseFloat(data.data[0].last);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('OKX API failed:', error);
  }

  // Try Gate.io
  try {
    const response = await fetch(
      `${API_CONFIG.GATEIO.BASE_URL}?currency_pair=${binanceSymbol.replace('USDT', '_USDT')}`,
      { signal: AbortSignal.timeout(API_CONFIG.GATEIO.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data[0]?.last) {
        const price = parseFloat(data[0].last);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('Gate.io API failed:', error);
  }

  // Try MEXC
  try {
    const response = await fetch(
      `${API_CONFIG.MEXC.BASE_URL}?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(API_CONFIG.MEXC.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.price) {
        const price = parseFloat(data.price);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('MEXC API failed:', error);
  }

  // Try Coinbase
  try {
    const coinbaseSymbol = symbol.replace('USD', '-USD');
    const response = await fetch(
      `${API_CONFIG.COINBASE.BASE_URL}/${coinbaseSymbol}/spot`,
      { signal: AbortSignal.timeout(API_CONFIG.COINBASE.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data?.amount) {
        const price = parseFloat(data.data.amount);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('Coinbase API failed:', error);
  }

  // Try Kraken
  try {
    const krakenMap: Record<string, string> = {
      'BTCUSD': 'XXBTZUSD',
      'ETHUSD': 'XETHZUSD',
      'SOLUSD': 'SOLUSD',
      'AVAXUSD': 'AVAXUSD',
      'BNBUSD': 'BNBUSD',
      'ADAUSD': 'ADAUSD',
      'DOTUSD': 'DOTUSD',
      'MATICUSD': 'MATICUSD',
    };
    
    const krakenSymbol = krakenMap[symbol] || symbol;
    const response = await fetch(
      `${API_CONFIG.KRAKEN.BASE_URL}?pair=${krakenSymbol}`,
      { signal: AbortSignal.timeout(API_CONFIG.KRAKEN.TIMEOUT) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = data.result?.[Object.keys(data.result)[0]];
      if (result?.c?.[0]) {
        const price = parseFloat(result.c[0]);
        priceCache[symbol] = { price, timestamp: Date.now() };
        return price;
      }
    }
  } catch (error) {
    console.warn('Kraken API failed:', error);
  }

  // If all APIs fail, return cached value if available (even if stale)
  if (cached) {
    console.warn(`Using stale cached price for ${symbol}`);
    return cached.price;
  }

  // Last resort: throw error
  throw new Error(`Failed to fetch price for ${symbol} from all sources (8 exchanges tested)`);
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