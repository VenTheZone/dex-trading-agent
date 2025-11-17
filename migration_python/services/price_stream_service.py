"""
Price Stream Service - Real-time price streaming with polling and caching
Uses event-driven architecture with 1.5s polling intervals
"""

import asyncio
import httpx
from typing import Dict, List, Optional, Callable
from datetime import datetime
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class PriceSnapshot:
    """Price snapshot with metadata"""
    symbol: str
    price: float
    timestamp: datetime
    source: str = "hyperliquid"
    
    def to_dict(self):
        return {
            "symbol": self.symbol,
            "price": self.price,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source
        }

class PriceStreamService:
    """
    Real-time price streaming service with event publishing
    - Polls Hyperliquid every 1.5 seconds
    - Maintains price cache
    - Publishes price updates to subscribers
    """
    
    def __init__(self, poll_interval: float = 1.5):
        self.poll_interval = poll_interval
        self.price_cache: Dict[str, PriceSnapshot] = {}
        self.subscribers: List[Callable] = []
        self.is_running = False
        self.symbols: List[str] = []
        self.is_testnet = False
        
    def subscribe(self, callback: Callable[[PriceSnapshot], None]):
        """Subscribe to price updates"""
        self.subscribers.append(callback)
        logger.info(f"New subscriber added. Total subscribers: {len(self.subscribers)}")
        
    def unsubscribe(self, callback: Callable):
        """Unsubscribe from price updates"""
        if callback in self.subscribers:
            self.subscribers.remove(callback)
            logger.info(f"Subscriber removed. Total subscribers: {len(self.subscribers)}")
    
    async def _fetch_price(self, symbol: str) -> Optional[float]:
        """Fetch single price from Hyperliquid"""
        try:
            base_url = (
                "https://api.hyperliquid-testnet.xyz" if self.is_testnet
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
                    else:
                        logger.warning(f"Symbol {hl_symbol} not found in Hyperliquid response")
                else:
                    logger.error(f"Hyperliquid HTTP {response.status_code} for {symbol}")
        except Exception as e:
            logger.error(f"Failed to fetch price for {symbol}: {e}")
        
        return None
    
    async def _poll_prices(self):
        """Poll prices for all symbols"""
        tasks = [self._fetch_price(symbol) for symbol in self.symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for symbol, result in zip(self.symbols, results):
            if isinstance(result, Exception):
                logger.error(f"Error fetching {symbol}: {result}")
                continue
                
            if result is not None:
                snapshot = PriceSnapshot(
                    symbol=symbol,
                    price=result,
                    timestamp=datetime.now()
                )
                
                # Update cache
                old_price = self.price_cache.get(symbol)
                self.price_cache[symbol] = snapshot
                
                # Publish to subscribers if price changed
                if old_price is None or old_price.price != snapshot.price:
                    await self._publish_update(snapshot)
    
    async def _publish_update(self, snapshot: PriceSnapshot):
        """Publish price update to all subscribers"""
        for callback in self.subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(snapshot)
                else:
                    callback(snapshot)
            except Exception as e:
                logger.error(f"Error in subscriber callback: {e}")
    
    async def start(self, symbols: List[str], is_testnet: bool = False):
        """Start the price stream"""
        self.symbols = symbols
        self.is_testnet = is_testnet
        self.is_running = True
        
        logger.info(f"Starting price stream for {len(symbols)} symbols (poll interval: {self.poll_interval}s)")
        
        while self.is_running:
            try:
                await self._poll_prices()
                await asyncio.sleep(self.poll_interval)
            except Exception as e:
                logger.error(f"Error in price stream loop: {e}")
                await asyncio.sleep(self.poll_interval)
    
    def stop(self):
        """Stop the price stream"""
        self.is_running = False
        logger.info("Price stream stopped")
    
    def get_snapshot(self, symbol: str) -> Optional[PriceSnapshot]:
        """Get latest price snapshot from cache"""
        return self.price_cache.get(symbol)
    
    def get_all_snapshots(self) -> Dict[str, PriceSnapshot]:
        """Get all cached price snapshots"""
        return self.price_cache.copy()
    
    def get_price(self, symbol: str) -> Optional[float]:
        """Get latest price from cache"""
        snapshot = self.price_cache.get(symbol)
        return snapshot.price if snapshot else None

# Global price stream instance
_price_stream: Optional[PriceStreamService] = None

def get_price_stream() -> PriceStreamService:
    """Get or create global price stream instance"""
    global _price_stream
    if _price_stream is None:
        _price_stream = PriceStreamService(poll_interval=1.5)
    return _price_stream
