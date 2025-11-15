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
    reason = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    size = Column(Float, nullable=True)
    side = Column(Enum(TradingSide), nullable=True)
    mode = Column(Enum(TradingMode), nullable=False, default=TradingMode.PAPER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class BalanceHistory(Base):
    __tablename__ = "balance_history"
    
    id = Column(Integer, primary_key=True, index=True)
    balance = Column(Float, nullable=False)
    mode = Column(Enum(TradingMode), nullable=False, default=TradingMode.PAPER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

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
