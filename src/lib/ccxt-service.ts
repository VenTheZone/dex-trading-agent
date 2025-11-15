"use node";

// DEPRECATED: This file is no longer used.
// All market data is fetched exclusively from Hyperliquid via the Python backend.
// See migration_python/services/market_data_service.py for the actual implementation.

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

// Note: Hyperliquid is the ONLY price source since it's our trading platform
// Frontend: src/lib/price-service.ts -> pythonApi.fetchPrice()
// Backend: migration_python/services/market_data_service.py -> fetch_from_hyperliquid()