"""
Market Data Service - Multi-exchange price fetching with fallback
Replaces: Convex marketData.ts actions
"""

import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class MarketDataService:
    """
    Handles market data fetching from multiple exchanges with fallback
    """
    
    # Price cache to reduce API calls
    price_cache: Dict[str, Dict] = {}
    CACHE_DURATION = 5  # seconds
    
    API_ENDPOINTS = {
        "BINANCE": [
            "https://api.binance.com/api/v3",
            "https://api1.binance.com/api/v3",
            "https://api2.binance.com/api/v3",
            "https://api3.binance.com/api/v3"
        ],
        "BINANCE_US": "https://api.binance.us/api/v3",
        "KUCOIN": "https://api.kucoin.com/api/v1/market/orderbook/level1",
        "COINBASE": "https://api.coinbase.com/v2/prices",
    }
    
    async def fetch_from_binance(self, symbol: str) -> Optional[float]:
        """Fetch price from Binance with multiple endpoint fallbacks"""
        binance_symbol = symbol.replace("USD", "USDT")
        
        for endpoint in self.API_ENDPOINTS["BINANCE"]:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        f"{endpoint}/ticker/price?symbol={binance_symbol}"
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if "code" not in data:  # No error code
                            return float(data["price"])
            except Exception as e:
                print(f"Binance endpoint {endpoint} failed: {e}")
                continue
        
        # Try Binance US as last resort
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.API_ENDPOINTS['BINANCE_US']}/ticker/price?symbol={binance_symbol}"
                )
                if response.status_code == 200:
                    data = response.json()
                    if "code" not in data:
                        return float(data["price"])
        except Exception as e:
            print(f"Binance US failed: {e}")
        
        return None
    
    async def fetch_from_hyperliquid(self, symbol: str, is_testnet: bool = False) -> Optional[float]:
        """Fetch price from Hyperliquid (primary source)"""
        try:
            base_url = (
                "https://api.hyperliquid-testnet.xyz" if is_testnet
                else "https://api.hyperliquid.xyz"
            )
            hl_symbol = symbol.replace("USD", "")
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{base_url}/info",
                    json={"type": "allMids"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if hl_symbol in data:
                        return float(data[hl_symbol])
        except Exception as e:
            print(f"Hyperliquid failed for {symbol}: {e}")
        
        return None
    
    async def fetch_price_with_fallback(self, symbol: str, is_testnet: bool = False) -> float:
        """
        Fetch price with multiple exchange fallbacks
        Priority: Hyperliquid > Binance > Cache > Error
        """
        # Check cache first
        cache_key = f"{symbol}_{is_testnet}"
        if cache_key in self.price_cache:
            cached = self.price_cache[cache_key]
            if datetime.now() - cached["timestamp"] < timedelta(seconds=self.CACHE_DURATION):
                print(f"[CACHE HIT] {symbol}: ${cached['price']}")
                return cached["price"]
        
        # Try Hyperliquid first
        price = await self.fetch_from_hyperliquid(symbol, is_testnet)
        if price:
            self.price_cache[cache_key] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # Fallback to Binance
        price = await self.fetch_from_binance(symbol)
        if price:
            self.price_cache[cache_key] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # If all fail, check if we have stale cache
        if cache_key in self.price_cache:
            print(f"[STALE CACHE] Using old price for {symbol}")
            return self.price_cache[cache_key]["price"]
        
        raise ValueError(f"Failed to fetch price for {symbol} from all sources")
