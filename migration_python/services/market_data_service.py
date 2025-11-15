"""
Market Data Service - Hyperliquid-focused price fetching
Replaces: Convex marketData.ts actions
"""

import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class MarketDataService:
    """
    Handles market data fetching from Hyperliquid (primary trading platform)
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
        Fetch price from Hyperliquid with caching
        Priority: Cache > Hyperliquid > Stale Cache > Error
        """
        # Check cache first
        cache_key = f"{symbol}_{is_testnet}"
        if cache_key in self.price_cache:
            cached = self.price_cache[cache_key]
            if datetime.now() - cached["timestamp"] < timedelta(seconds=self.CACHE_DURATION):
                print(f"[CACHE HIT] {symbol}: ${cached['price']}")
                return cached["price"]
        
        # Fetch from Hyperliquid
        price = await self.fetch_from_hyperliquid(symbol, is_testnet)
        if price:
            self.price_cache[cache_key] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # If fetch fails, check if we have stale cache
        if cache_key in self.price_cache:
            print(f"[STALE CACHE] Using old price for {symbol}")
            return self.price_cache[cache_key]["price"]
        
        raise ValueError(f"Failed to fetch price for {symbol} from Hyperliquid")
