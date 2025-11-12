"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// Simplified market data fetching using direct API calls instead of CCXT
// This avoids dependency issues in Convex environment

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
