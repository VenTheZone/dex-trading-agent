"""
Chart Snapshot Service
Captures TradingView chart data at two intervals:
1. Lightweight snapshots (10s): Basic market data + indicators
2. Full snapshots (60s): Complete data + asset curves for visualization
"""
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from database import SessionLocal
from database.schema import ChartSnapshot, SnapshotType
from services.market_data_service import MarketDataService
from lib.tokenData import TRADING_TOKENS

class ChartSnapshotService:
    def __init__(self):
        self.market_service = MarketDataService()
        self.is_running = False
        self.lightweight_interval = 10  # seconds
        self.full_interval = 60  # seconds
        
    async def start(self):
        """Start the snapshot capture loops"""
        if self.is_running:
            return
        
        self.is_running = True
        print("[SNAPSHOT SERVICE] Starting chart snapshot capture...")
        
        # Run both snapshot loops concurrently
        await asyncio.gather(
            self._lightweight_snapshot_loop(),
            self._full_snapshot_loop()
        )
    
    async def stop(self):
        """Stop the snapshot capture"""
        self.is_running = False
        print("[SNAPSHOT SERVICE] Stopping chart snapshot capture...")
    
    async def _lightweight_snapshot_loop(self):
        """Capture lightweight snapshots every 10 seconds"""
        while self.is_running:
            try:
                await self._capture_lightweight_snapshots()
                await asyncio.sleep(self.lightweight_interval)
            except Exception as e:
                print(f"[SNAPSHOT ERROR] Lightweight snapshot failed: {e}")
                await asyncio.sleep(5)  # Wait before retry
    
    async def _full_snapshot_loop(self):
        """Capture full snapshots every 60 seconds (first 10s of each minute)"""
        while self.is_running:
            try:
                # Wait until the first 10 seconds of the next minute
                now = datetime.utcnow()
                seconds_into_minute = now.second
                
                if seconds_into_minute < 10:
                    # We're in the capture window
                    await self._capture_full_snapshots()
                    # Wait until next minute
                    wait_seconds = 60 - seconds_into_minute
                    await asyncio.sleep(wait_seconds)
                else:
                    # Wait until next minute's capture window
                    wait_seconds = 60 - seconds_into_minute
                    await asyncio.sleep(wait_seconds)
            except Exception as e:
                print(f"[SNAPSHOT ERROR] Full snapshot failed: {e}")
                await asyncio.sleep(5)
    
    async def _capture_lightweight_snapshots(self):
        """Capture lightweight snapshots for all trading tokens"""
        db = SessionLocal()
        try:
            for token in TRADING_TOKENS:
                symbol = token['symbol']
                
                # Fetch current market data
                market_data = await self.market_service.get_market_data(symbol, is_testnet=False)
                
                if not market_data:
                    continue
                
                # Create lightweight snapshot
                snapshot = ChartSnapshot(
                    symbol=symbol,
                    snapshot_type=SnapshotType.LIGHTWEIGHT,
                    price=market_data.get('price', 0),
                    volume_24h=market_data.get('volume_24h'),
                    price_change_24h=market_data.get('price_change_24h'),
                    mark_price=market_data.get('mark_price'),
                    index_price=market_data.get('index_price'),
                    funding_rate=market_data.get('funding_rate'),
                    next_funding_time=market_data.get('next_funding_time'),
                    open_interest=market_data.get('open_interest'),
                    long_short_ratio=market_data.get('long_short_ratio'),
                    rsi_14=market_data.get('rsi_14'),
                    macd=market_data.get('macd'),
                    macd_signal=market_data.get('macd_signal'),
                    chart_interval="5m",  # Default interval for lightweight
                    asset_curve_data=None  # No asset curves for lightweight
                )
                
                db.add(snapshot)
            
            db.commit()
            print(f"[SNAPSHOT] Captured {len(TRADING_TOKENS)} lightweight snapshots")
        except Exception as e:
            db.rollback()
            print(f"[SNAPSHOT ERROR] Failed to save lightweight snapshots: {e}")
        finally:
            db.close()
    
    async def _capture_full_snapshots(self):
        """Capture full snapshots with asset curve data"""
        db = SessionLocal()
        try:
            for token in TRADING_TOKENS:
                symbol = token['symbol']
                
                # Fetch current market data
                market_data = await self.market_service.get_market_data(symbol, is_testnet=False)
                
                if not market_data:
                    continue
                
                # Fetch asset curve data (historical prices for visualization)
                asset_curve = await self._fetch_asset_curve(symbol)
                
                # Create full snapshot
                snapshot = ChartSnapshot(
                    symbol=symbol,
                    snapshot_type=SnapshotType.FULL,
                    price=market_data.get('price', 0),
                    volume_24h=market_data.get('volume_24h'),
                    price_change_24h=market_data.get('price_change_24h'),
                    mark_price=market_data.get('mark_price'),
                    index_price=market_data.get('index_price'),
                    funding_rate=market_data.get('funding_rate'),
                    next_funding_time=market_data.get('next_funding_time'),
                    open_interest=market_data.get('open_interest'),
                    long_short_ratio=market_data.get('long_short_ratio'),
                    rsi_14=market_data.get('rsi_14'),
                    macd=market_data.get('macd'),
                    macd_signal=market_data.get('macd_signal'),
                    chart_interval="5m",
                    asset_curve_data=json.dumps(asset_curve) if asset_curve else None
                )
                
                db.add(snapshot)
            
            db.commit()
            print(f"[SNAPSHOT] Captured {len(TRADING_TOKENS)} full snapshots with asset curves")
        except Exception as e:
            db.rollback()
            print(f"[SNAPSHOT ERROR] Failed to save full snapshots: {e}")
        finally:
            db.close()
    
    async def _fetch_asset_curve(self, symbol: str, lookback_hours: int = 24) -> Optional[List[Dict]]:
        """
        Fetch historical price data for asset curve visualization
        Returns list of {timestamp, price, volume} points
        """
        try:
            # Fetch historical data from Hyperliquid or price stream cache
            # This is for visualization only, not AI decision making
            historical_data = await self.market_service.get_historical_prices(
                symbol, 
                interval="5m", 
                lookback_hours=lookback_hours
            )
            
            return historical_data
        except Exception as e:
            print(f"[SNAPSHOT ERROR] Failed to fetch asset curve for {symbol}: {e}")
            return None
    
    def get_latest_snapshots(
        self, 
        db: Session, 
        symbols: Optional[List[str]] = None,
        snapshot_type: Optional[SnapshotType] = None,
        limit: int = 100
    ) -> List[ChartSnapshot]:
        """Retrieve latest snapshots for given symbols"""
        query = db.query(ChartSnapshot)
        
        if symbols:
            query = query.filter(ChartSnapshot.symbol.in_(symbols))
        
        if snapshot_type:
            query = query.filter(ChartSnapshot.snapshot_type == snapshot_type)
        
        return query.order_by(ChartSnapshot.created_at.desc()).limit(limit).all()
    
    def get_snapshot_for_ai_analysis(
        self, 
        db: Session, 
        symbols: List[str]
    ) -> Dict[str, Dict]:
        """
        Get the most recent lightweight snapshot for each symbol
        Formatted for AI analysis (text-based, not visual)
        """
        snapshots = {}
        
        for symbol in symbols:
            latest = db.query(ChartSnapshot).filter(
                ChartSnapshot.symbol == symbol,
                ChartSnapshot.snapshot_type == SnapshotType.LIGHTWEIGHT
            ).order_by(ChartSnapshot.created_at.desc()).first()
            
            if latest:
                snapshots[symbol] = {
                    'symbol': latest.symbol,
                    'price': latest.price,
                    'volume_24h': latest.volume_24h,
                    'price_change_24h': latest.price_change_24h,
                    'mark_price': latest.mark_price,
                    'index_price': latest.index_price,
                    'funding_rate': latest.funding_rate,
                    'open_interest': latest.open_interest,
                    'long_short_ratio': latest.long_short_ratio,
                    'rsi_14': latest.rsi_14,
                    'macd': latest.macd,
                    'macd_signal': latest.macd_signal,
                    'timestamp': latest.created_at.isoformat()
                }
        
        return snapshots
    
    def cleanup_old_snapshots(self, db: Session, days_to_keep: int = 7):
        """Remove snapshots older than specified days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted = db.query(ChartSnapshot).filter(
            ChartSnapshot.created_at < cutoff_date
        ).delete()
        
        db.commit()
        print(f"[SNAPSHOT CLEANUP] Removed {deleted} old snapshots")
        return deleted

# Global instance
snapshot_service = ChartSnapshotService()
