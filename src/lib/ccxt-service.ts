"use node";

// This file is kept for reference but not actively used.
// Market data is fetched directly via Binance API in src/convex/marketData.ts
// to avoid CCXT dependency issues in the Convex environment.

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  high: number;
  low: number;
  change: number;
  timestamp: number;
}

// Note: Direct API calls are used instead of CCXT in production
// See src/convex/marketData.ts for the actual implementation
