"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// Price cache to reduce API calls
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_DURATION = 5000; // 5 seconds

export const fetchMarketData = action({
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

export const fetchPriceWithFallback = action({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    // Check cache first
    const cached = priceCache[args.symbol];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    // Convert symbol format (e.g., BTCUSD -> BTCUSDT for Binance)
    const binanceSymbol = args.symbol.replace('USD', 'USDT');

    // Try primary Binance API
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data.price);
        
        // Cache the result
        priceCache[args.symbol] = { price, timestamp: Date.now() };
        return price;
      }
    } catch (error) {
      console.warn('Primary Binance API failed, trying fallback...', error);
    }

    // Try fallback Binance API
    try {
      const response = await fetch(
        `https://api1.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data.price);
        
        // Cache the result
        priceCache[args.symbol] = { price, timestamp: Date.now() };
        return price;
      }
    } catch (error) {
      console.error('Fallback Binance API also failed', error);
    }

    // If both APIs fail, return cached value if available (even if stale)
    if (cached) {
      console.warn(`Using stale cached price for ${args.symbol}`);
      return cached.price;
    }

    // Last resort: throw error
    throw new Error(`Failed to fetch price for ${args.symbol} from all sources`);
  },
});

export const fetchMultiplePrices = action({
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

        // Convert symbol format (e.g., BTCUSD -> BTCUSDT for Binance)
        const binanceSymbol = symbol.replace('USD', 'USDT');

        // Try primary Binance API
        try {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
            { signal: AbortSignal.timeout(5000) }
          );
          
          if (response.ok) {
            const data = await response.json();
            const price = parseFloat(data.price);
            
            // Cache the result
            priceCache[symbol] = { price, timestamp: Date.now() };
            return { symbol, price };
          }
        } catch (error) {
          console.warn(`Primary Binance API failed for ${symbol}, trying fallback...`);
        }

        // Try fallback Binance API
        try {
          const response = await fetch(
            `https://api1.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
            { signal: AbortSignal.timeout(5000) }
          );
          
          if (response.ok) {
            const data = await response.json();
            const price = parseFloat(data.price);
            
            // Cache the result
            priceCache[symbol] = { price, timestamp: Date.now() };
            return { symbol, price };
          }
        } catch (error) {
          console.error(`Fallback Binance API also failed for ${symbol}`);
        }

        // If both APIs fail, return cached value if available (even if stale)
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

export const fetchOrderBook = action({
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