"""
Database Schema - SQLAlchemy Models
Replaces Convex schema with no authentication
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

# Import Base from parent package
from . import Base

class TradingMode(str, enum.Enum):
    PAPER = "paper"
    LIVE = "live"
    DEMO = "demo"

class TradingSide(str, enum.Enum):
    LONG = "long"
    SHORT = "short"

class TradingLog(Base):
    __tablename__ = "trading_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    ai_reasoning = Column(Text, nullable=False)
    error_message = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    size = Column(Float, nullable=True)
    side = Column(Enum(TradingSide), nullable=True)
    leverage = Column(Float, nullable=True)
    success = Column(Boolean, nullable=True)
    mode = Column(Enum(TradingMode), nullable=False, default=TradingMode.PAPER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class BalanceHistory(Base):
    __tablename__ = "balance_history"
    
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False)
    mode = Column(Enum(TradingMode), nullable=False, default=TradingMode.PAPER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class PositionSnapshot(Base):
    __tablename__ = "position_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    side = Column(Enum(TradingSide), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    leverage = Column(Float, nullable=False)
    mode = Column(Enum(TradingMode), nullable=False, default=TradingMode.PAPER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class SnapshotType(str, enum.Enum):
    LIGHTWEIGHT = "lightweight"  # 10s interval, no asset curves
    FULL = "full"  # 60s interval, includes asset curves

class ChartSnapshot(Base):
    """
    Stores TradingView chart snapshots for multi-chart AI analysis
    Two types: lightweight (10s) and full (60s with asset curves)
    """
    __tablename__ = "chart_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    snapshot_type = Column(Enum(SnapshotType), nullable=False, index=True)
    
    # Market data
    price = Column(Float, nullable=False)
    volume_24h = Column(Float, nullable=True)
    price_change_24h = Column(Float, nullable=True)
    
    # Perpetual futures specific
    mark_price = Column(Float, nullable=True)
    index_price = Column(Float, nullable=True)
    funding_rate = Column(Float, nullable=True)
    next_funding_time = Column(Integer, nullable=True)
    open_interest = Column(Float, nullable=True)
    long_short_ratio = Column(Float, nullable=True)
    
    # Technical indicators (lightweight snapshots)
    rsi_14 = Column(Float, nullable=True)
    macd = Column(Float, nullable=True)
    macd_signal = Column(Float, nullable=True)
    
    # Asset curve data (full snapshots only) - JSON stored as Text
    asset_curve_data = Column(Text, nullable=True)  # JSON: [{timestamp, price, volume}, ...]
    
    # Metadata
    chart_interval = Column(String, nullable=False)  # e.g., "5m", "1h"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
