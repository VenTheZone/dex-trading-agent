"""
Database Schema - SQLAlchemy Models
Replaces Convex schema with no authentication
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .import Base

# ============================================================================
# ENUMS
# ============================================================================

class TradingSideEnum(enum.Enum):
    LONG = "long"
    SHORT = "short"

class OrderSideEnum(enum.Enum):
    BUY = "buy"
    SELL = "sell"

class OrderTypeEnum(enum.Enum):
    MARKET = "market"
    LIMIT = "limit"

class OrderStatusEnum(enum.Enum):
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    PARTIAL = "partial"

class TradingModeEnum(enum.Enum):
    PAPER = "paper"
    LIVE = "live"

# ============================================================================
# TRADING LOG MODEL
# ============================================================================

class TradingLog(Base):
    """Store all trading actions and decisions"""
    __tablename__ = "trading_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Log data
    action = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False)
    reason = Column(String(500), nullable=False)
    details = Column(Text, nullable=True)
    
    # Trade details (optional)
    price = Column(Float, nullable=True)
    size = Column(Float, nullable=True)
    side = Column(Enum(TradingSideEnum), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

# ============================================================================
# BALANCE HISTORY MODEL
# ============================================================================

class BalanceHistory(Base):
    """Track balance changes over time"""
    __tablename__ = "balance_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    balance = Column(Float, nullable=False)
    mode = Column(Enum(TradingModeEnum), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

# ============================================================================
# POSITION SNAPSHOT MODEL
# ============================================================================

class PositionSnapshot(Base):
    """Store position snapshots for tracking"""
    __tablename__ = "position_snapshots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    symbol = Column(String(20), nullable=False, index=True)
    side = Column(Enum(TradingSideEnum), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    leverage = Column(Float, nullable=False)
    mode = Column(Enum(TradingModeEnum), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

# ============================================================================
# PAPER TRADING MODELS
# ============================================================================

class PaperPosition(Base):
    """Paper trading positions"""
    __tablename__ = "paper_positions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    symbol = Column(String(20), nullable=False, unique=True, index=True)
    side = Column(Enum(TradingSideEnum), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, default=0.0)
    leverage = Column(Float, nullable=False)
    
    # Risk management
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaperOrder(Base):
    """Paper trading order history"""
    __tablename__ = "paper_orders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    symbol = Column(String(20), nullable=False, index=True)
    side = Column(Enum(OrderSideEnum), nullable=False)
    type = Column(Enum(OrderTypeEnum), nullable=False)
    size = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(Enum(OrderStatusEnum), nullable=False)
    
    filled_price = Column(Float, nullable=True)
    filled_size = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    filled_at = Column(DateTime, nullable=True)
