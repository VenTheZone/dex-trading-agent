"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// Price cache to reduce API calls
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 5000; // 5 seconds

// Multiple API endpoints for redundancy
const API_ENDPOINTS = {
  BINANCE: [
    'https://api.binance.com/api/v3',
    'https://api1.binance.com/api/v3',
    'https://api2.binance.com/api/v3',
    'https://api3.binance.com/api/v3',
  ],
  BINANCE_US: 'https://api.binance.us/api/v3',
  COINBASE: 'https://api.coinbase.com/v2/prices',
  KRAKEN: 'https://api.kraken.com/0/public/Ticker',
};

/**
 * Fetches price from Coinbase as fallback
 */
async function fetchFromCoinbase(symbol: string): Promise<number | null> {
  try {
    // Convert BTCUSD to BTC-USD format for Coinbase
    const coinbaseSymbol = symbol.replace('USD', '-USD');
    const response = await fetch(
      `${API_ENDPOINTS.COINBASE}/${coinbaseSymbol}/spot`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      return parseFloat(data.data.amount);
    }
  } catch (error) {
    console.warn(`Coinbase API failed for ${symbol}:`, error);
  }
  return null;
}

/**
 * Fetches price from Kraken as fallback
 */
async function fetchFromKraken(symbol: string): Promise<number | null> {
  try {
    // Convert BTCUSD to XXBTZUSD format for Kraken
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
      `${API_ENDPOINTS.KRAKEN}?pair=${krakenSymbol}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const result = data.result[Object.keys(data.result)[0]];
      return parseFloat(result.c[0]); // Current price
    }
  } catch (error) {
    console.warn(`Kraken API failed for ${symbol}:`, error);
  }
  return null;
}

/**
 * Fetches price from Binance with multiple endpoint fallbacks
 */
async function fetchFromBinance(symbol: string): Promise<number | null> {
  const binanceSymbol = symbol.replace('USD', 'USDT');
  
  // Try all Binance endpoints
  for (const endpoint of API_ENDPOINTS.BINANCE) {
    try {
      const response = await fetch(
        `${endpoint}/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Check if response has error code (geo-restriction)
        if (data.code !== undefined) {
          console.warn(`Binance endpoint ${endpoint} returned error:`, data.msg);
          continue;
        }
        return parseFloat(data.price);
      }
    } catch (error) {
      console.warn(`Binance endpoint ${endpoint} failed:`, error);
    }
  }
  
  // Try Binance US as last resort
  try {
    const response = await fetch(
      `${API_ENDPOINTS.BINANCE_US}/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === undefined) {
        return parseFloat(data.price);
      }
    }
  } catch (error) {
    console.warn('Binance US API failed:', error);
  }
  
  return null;
}

/**
 * Fetches comprehensive market data for a trading symbol
 * @param symbol - Trading pair symbol (e.g., "BTC/USD")
 * @param exchange - Exchange name (optional, defaults to Binance)
 * @returns Market data including price, volume, high/low, and 24h change
 */
export const fetchSymbolMarketData = action({
  args: {
    symbol: v.string(),
    exchange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Use Binance public API directly (no auth needed)
      const binanceSymbol = args.symbol.replace('/', '');
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        symbol: args.symbol,
        price: parseFloat(data.lastPrice),
        bid: parseFloat(data.bidPrice),
        ask: parseFloat(data.askPrice),
        volume: parseFloat(data.volume),
        high: parseFloat(data.highPrice),
        low: parseFloat(data.lowPrice),
        change: parseFloat(data.priceChangePercent),
        timestamp: data.closeTime,
      };
    } catch (error: any) {
      console.error(`Error fetching market data for ${args.symbol}:`, error);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  },
});

/**
 * Fetches current price with automatic fallback to multiple exchanges
 * Includes caching to reduce API calls
 * @param symbol - Trading pair symbol (e.g., "BTCUSD")
 * @returns Current price as number
 */
export const fetchCurrentPrice = action({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    // Check cache first
    const cached = priceCache[args.symbol];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    // Try Binance first (fastest)
    let price = await fetchFromBinance(args.symbol);
    if (price) {
      priceCache[args.symbol] = { price, timestamp: Date.now() };
      return price;
    }

    // Try Coinbase
    price = await fetchFromCoinbase(args.symbol);
    if (price) {
      priceCache[args.symbol] = { price, timestamp: Date.now() };
      return price;
    }

    // Try Kraken
    price = await fetchFromKraken(args.symbol);
    if (price) {
      priceCache[args.symbol] = { price, timestamp: Date.now() };
      return price;
    }

    // If all APIs fail, return cached value if available (even if stale)
    if (cached) {
      console.warn(`Using stale cached price for ${args.symbol} (age: ${Date.now() - cached.timestamp}ms)`);
      return cached.price;
    }

    // Last resort: throw error
    throw new Error(`Failed to fetch price for ${args.symbol} from all sources (Binance, Coinbase, Kraken)`);
  },
});

/**
 * Fetches prices for multiple symbols in parallel
 * @param symbols - Array of trading pair symbols
 * @returns Object mapping symbols to their current prices
 */
export const fetchBulkPrices = action({
  args: {
    symbols: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, number> = {};
    
    // Fetch all prices in parallel
    const pricePromises = args.symbols.map(async (symbol) => {
      try {
        // Check cache first
        const cached = priceCache[symbol];
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return { symbol, price: cached.price };
        }

        // Try Binance first
        let price = await fetchFromBinance(symbol);
        if (price) {
          priceCache[symbol] = { price, timestamp: Date.now() };
          return { symbol, price };
        }

        // Try Coinbase
        price = await fetchFromCoinbase(symbol);
        if (price) {
          priceCache[symbol] = { price, timestamp: Date.now() };
          return { symbol, price };
        }

        // Try Kraken
        price = await fetchFromKraken(symbol);
        if (price) {
          priceCache[symbol] = { price, timestamp: Date.now() };
          return { symbol, price };
        }

        // If all APIs fail, return cached value if available (even if stale)
        if (cached) {
          console.warn(`Using stale cached price for ${symbol}`);
          return { symbol, price: cached.price };
        }

        return null;
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return null;
      }
    });
    
    const prices = await Promise.all(pricePromises);
    
    // Build results object
    prices.forEach((result) => {
      if (result) {
        results[result.symbol] = result.price;
      }
    });
    
    return results;
  },
});

/**
 * Fetches order book data (bids and asks) for a symbol
 * @param symbol - Trading pair symbol
 * @param limit - Number of price levels to return (default: 20)
 * @param exchange - Exchange name (optional)
 * @returns Order book with top bids and asks
 */
export const fetchSymbolOrderBook = action({
  args: {
    symbol: v.string(),
    limit: v.optional(v.number()),
    exchange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const binanceSymbol = args.symbol.replace('/', '');
      const limit = args.limit || 20;
      const response = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${binanceSymbol}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        symbol: args.symbol,
        bids: data.bids.slice(0, 10).map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: data.asks.slice(0, 10).map((a: any) => [parseFloat(a[0]), parseFloat(a[1])]),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`Error fetching order book for ${args.symbol}:`, error);
      throw new Error(`Failed to fetch order book: ${error.message}`);
    }
  },
});

// Legacy exports for backward compatibility
export const fetchMarketData = fetchSymbolMarketData;
export const fetchPriceWithFallback = fetchCurrentPrice;
export const fetchMultiplePrices = fetchBulkPrices;
export const fetchOrderBook = fetchSymbolOrderBook;