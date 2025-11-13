"""
PSEUDO-CODE: Database Schema Migration
Convex Schema → SQLAlchemy Models

This file shows how to convert the Convex schema to SQLAlchemy ORM models.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

# ============================================================================
# ENUMS
# ============================================================================

class RoleEnum(enum.Enum):
    ADMIN = "admin"
    USER = "user"
    MEMBER = "member"

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
# USER MODEL
# ============================================================================

class User(Base):
    """
    Replaces: Convex users table
    Purpose: Store user authentication and profile data
    """
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Auth fields (from Convex auth)
    email = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)
    image = Column(String(500), nullable=True)
    email_verification_time = Column(DateTime, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    
    # Role
    role = Column(Enum(RoleEnum), default=RoleEnum.USER)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trading_logs = relationship("TradingLog", back_populates="user", cascade="all, delete-orphan")
    balance_history = relationship("BalanceHistory", back_populates="user", cascade="all, delete-orphan")
    position_snapshots = relationship("PositionSnapshot", back_populates="user", cascade="all, delete-orphan")
    paper_positions = relationship("PaperPosition", back_populates="user", cascade="all, delete-orphan")
    paper_orders = relationship("PaperOrder", back_populates="user", cascade="all, delete-orphan")

# ============================================================================
# TRADING LOG MODEL
# ============================================================================

class TradingLog(Base):
    """
    Replaces: Convex tradingLogs table
    Purpose: Store all trading actions and decisions
    """
    __tablename__ = "trading_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Log data
    action = Column(String(100), nullable=False)  # e.g., "open_long", "close_position"
    symbol = Column(String(20), nullable=False)
    reason = Column(String(500), nullable=False)
    details = Column(String(1000), nullable=True)
    
    # Trade details
    price = Column(Float, nullable=True)
    size = Column(Float, nullable=True)
    side = Column(Enum(TradingSideEnum), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="trading_logs")

# ============================================================================
# BALANCE HISTORY MODEL
# ============================================================================

class BalanceHistory(Base):
    """
    Replaces: Convex balanceHistory table
    Purpose: Track balance changes over time for charting
    """
    __tablename__ = "balance_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Balance data
    balance = Column(Float, nullable=False)
    mode = Column(Enum(TradingModeEnum), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="balance_history")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_user_mode_created', 'user_id', 'mode', 'created_at'),
    )

# ============================================================================
# POSITION SNAPSHOT MODEL
# ============================================================================

class PositionSnapshot(Base):
    """
    Replaces: Convex positionSnapshots table
    Purpose: Historical tracking of positions
    """
    __tablename__ = "position_snapshots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Position data
    symbol = Column(String(20), nullable=False)
    side = Column(Enum(TradingSideEnum), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    leverage = Column(Float, nullable=False)
    mode = Column(Enum(TradingModeEnum), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="position_snapshots")
    
    # Composite indexes
    __table_args__ = (
        Index('idx_user_symbol', 'user_id', 'symbol'),
        Index('idx_user_created', 'user_id', 'created_at'),
    )

# ============================================================================
# PAPER POSITION MODEL
# ============================================================================

class PaperPosition(Base):
    """
    Replaces: Convex paperPositions table
    Purpose: Store active paper trading positions
    """
    __tablename__ = "paper_positions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Position data
    symbol = Column(String(20), nullable=False)
    side = Column(Enum(TradingSideEnum), nullable=False)
    size = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, nullable=False)
    realized_pnl = Column(Float, nullable=False, default=0.0)
    
    # Risk management
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    leverage = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="paper_positions")
    
    # Composite index
    __table_args__ = (
        Index('idx_user_symbol', 'user_id', 'symbol'),
    )

# ============================================================================
# PAPER ORDER MODEL
# ============================================================================

class PaperOrder(Base):
    """
    Replaces: Convex paperOrders table
    Purpose: Store paper trading orders
    """
    __tablename__ = "paper_orders"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Order data
    symbol = Column(String(20), nullable=False)
    side = Column(Enum(OrderSideEnum), nullable=False)
    type = Column(Enum(OrderTypeEnum), nullable=False)
    price = Column(Float, nullable=False)
    size = Column(Float, nullable=False)
    filled = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(OrderStatusEnum), nullable=False, default=OrderStatusEnum.OPEN)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="paper_orders")
    
    # Composite index
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),
    )

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

"""
USAGE:

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Create engine
DATABASE_URL = "postgresql://user:password@localhost:5432/dex_trading"
engine = create_engine(DATABASE_URL)

# Create all tables
Base.metadata.create_all(engine)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Use in FastAPI dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""
