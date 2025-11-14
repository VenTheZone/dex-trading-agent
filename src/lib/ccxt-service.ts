"use node";

// This file is kept for reference but not actively used.
// Market data is fetched directly via Binance API in the Python backend
// to avoid CCXT dependency issues.

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
// See migration_python/services/market_data_service.py for the actual implementation