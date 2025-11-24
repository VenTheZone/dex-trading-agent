"""
Market Data Service - Hyperliquid-focused price fetching
Replaces: Convex marketData.ts actions
"""

import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from .price_stream_service import get_price_stream, PriceSnapshot

class MarketDataService:
    """
    Handles market data fetching from Hyperliquid (primary trading platform)
    Now uses PriceStreamService for real-time data
    """
    
    # Price cache to reduce API calls
    price_cache: Dict[str, Dict] = {}
    CACHE_DURATION = 5  # seconds
    
    async def fetch_from_hyperliquid(self, symbol: str, is_testnet: bool = False) -> Optional[float]:
        """Fetch price from Hyperliquid (primary source)"""
        try:
            base_url = (
                "https://api.hyperliquid-testnet.xyz" if is_testnet
                else "https://api.hyperliquid.xyz"
            )
            hl_symbol = symbol.replace("USD", "")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{base_url}/info",
                    json={"type": "allMids"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if hl_symbol in data:
                        price = float(data[hl_symbol])
                        print(f"[HYPERLIQUID] {symbol}: ${price}")
                        return price
                    else:
                        print(f"[HYPERLIQUID] Symbol {hl_symbol} not found in response")
                else:
                    print(f"[HYPERLIQUID] HTTP {response.status_code} for {symbol}")
        except Exception as e:
            print(f"[HYPERLIQUID] Failed for {symbol}: {e}")
        
        return None
    
    async def fetch_price_with_fallback(self, symbol: str, is_testnet: bool = False) -> float:
        """
        Fetch price from cache/stream first, fallback to direct fetch
        Priority: Price Stream Cache > Direct Fetch > Stale Cache > Error
        """
        # Try to get from price stream cache first
        price_stream = get_price_stream()
        snapshot = price_stream.get_snapshot(symbol)
        
        if snapshot:
            # Check if snapshot is fresh (within 5 seconds)
            age = (datetime.now() - snapshot.timestamp).total_seconds()
            if age < 5.0:
                print(f"[STREAM CACHE] {symbol}: ${snapshot.price} (age: {age:.1f}s)")
                return snapshot.price
        
        # Check local cache
        cache_key = f"{symbol}_{is_testnet}"
        if cache_key in self.price_cache:
            cached = self.price_cache[cache_key]
            if datetime.now() - cached["timestamp"] < timedelta(seconds=self.CACHE_DURATION):
                print(f"[CACHE HIT] {symbol}: ${cached['price']}")
                return cached["price"]
        
        # Fetch from Hyperliquid directly
        price = await self.fetch_from_hyperliquid(symbol, is_testnet)
        if price:
            self.price_cache[cache_key] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # If fetch fails, check if we have stale cache
        if cache_key in self.price_cache:
            print(f"[STALE CACHE] Using old price for {symbol}")
            return self.price_cache[cache_key]["price"]
        
        # Last resort: check stale stream cache
        if snapshot:
            print(f"[STALE STREAM] Using old price for {symbol} (age: {age:.1f}s)")
            return snapshot.price
        
        raise ValueError(f"Failed to fetch price for {symbol} from Hyperliquid")
    
    def get_snapshot(self, symbol: str) -> Optional[PriceSnapshot]:
        """Get price snapshot from stream cache"""
        price_stream = get_price_stream()
        return price_stream.get_snapshot(symbol)
    
    def get_all_snapshots(self) -> Dict[str, PriceSnapshot]:
        """Get all price snapshots from stream cache"""
        price_stream = get_price_stream()
        return price_stream.get_all_snapshots()
