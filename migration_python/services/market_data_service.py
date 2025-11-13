"""
PSEUDO-CODE: Market Data Service
Replaces: Convex marketData.ts actions

This file shows how to implement multi-exchange price fetching in Python.
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
        "OKX": "https://www.okx.com/api/v5/market/ticker",
        "GATEIO": "https://api.gateio.ws/api/v4/spot/tickers",
        "MEXC": "https://api.mexc.com/api/v3/ticker/price",
        "COINBASE": "https://api.coinbase.com/v2/prices",
        "KRAKEN": "https://api.kraken.com/0/public/Ticker"
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
    
    async def fetch_from_kucoin(self, symbol: str) -> Optional[float]:
        """Fetch price from KuCoin"""
        try:
            kucoin_symbol = symbol.replace("USD", "USDT").replace("USDT", "-USDT")
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.API_ENDPOINTS['KUCOIN']}?symbol={kucoin_symbol}"
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("data", {}).get("price"):
                        return float(data["data"]["price"])
        except Exception as e:
            print(f"KuCoin failed for {symbol}: {e}")
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
    
    async def fetch_current_price(self, symbol: str, is_testnet: bool = False) -> float:
        """
        Fetch current price with automatic fallback to multiple exchanges
        Replaces: marketData.fetchCurrentPrice
        """
        # Check cache first
        cached = self.price_cache.get(symbol)
        if cached and (datetime.now() - cached["timestamp"]).total_seconds() < self.CACHE_DURATION:
            return cached["price"]
        
        # Try Hyperliquid first (most accurate for execution)
        price = await self.fetch_from_hyperliquid(symbol, is_testnet)
        if price:
            self.price_cache[symbol] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # Try Binance (fast CEX fallback)
        price = await self.fetch_from_binance(symbol)
        if price:
            self.price_cache[symbol] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # Try KuCoin (global accessibility)
        price = await self.fetch_from_kucoin(symbol)
        if price:
            self.price_cache[symbol] = {"price": price, "timestamp": datetime.now()}
            return price
        
        # If all APIs fail, return cached value if available (even if stale)
        if cached:
            print(f"Using stale cached price for {symbol}")
            return cached["price"]
        
        # Last resort: throw error
        raise Exception(f"Failed to fetch price for {symbol} from all sources")
    
    async def fetch_bulk_prices(self, symbols: List[str]) -> Dict[str, float]:
        """
        Fetch prices for multiple symbols in parallel
        Replaces: marketData.fetchBulkPrices
        """
        tasks = [self.fetch_current_price(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            symbol: result
            for symbol, result in zip(symbols, results)
            if not isinstance(result, Exception)
        }
    
    async def fetch_symbol_market_data(self, symbol: str, exchange: str = "binance") -> Dict:
        """
        Fetch comprehensive market data for a trading symbol
        Replaces: marketData.fetchSymbolMarketData
        """
        try:
            binance_symbol = symbol.replace("/", "")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://api.binance.com/api/v3/ticker/24hr?symbol={binance_symbol}"
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "symbol": symbol,
                    "price": float(data["lastPrice"]),
                    "bid": float(data["bidPrice"]),
                    "ask": float(data["askPrice"]),
                    "volume": float(data["volume"]),
                    "high": float(data["highPrice"]),
                    "low": float(data["lowPrice"]),
                    "change": float(data["priceChangePercent"]),
                    "timestamp": data["closeTime"]
                }
        except Exception as e:
            raise Exception(f"Failed to fetch market data: {str(e)}")
