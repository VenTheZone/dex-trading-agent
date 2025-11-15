"""
FastAPI Routes - No Authentication Required
Replaces Convex actions/mutations/queries
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from database.schema import TradingLog, BalanceHistory, PositionSnapshot
from services.hyperliquid_service import HyperliquidService

# ============================================================================
# PYDANTIC MODELS (Request/Response schemas)
# ============================================================================

class TradingLogCreate(BaseModel):
    action: str
    symbol: str
    reason: str
    details: Optional[str] = None
    price: Optional[float] = None
    size: Optional[float] = None
    side: Optional[str] = None

class BalanceHistoryCreate(BaseModel):
    balance: float
    mode: str

class PositionSnapshotCreate(BaseModel):
    symbol: str
    side: str
    size: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    leverage: float
    mode: str

class PriceRequest(BaseModel):
    symbol: str
    is_testnet: Optional[bool] = False

class ExecuteTradeRequest(BaseModel):
    apiSecret: str
    symbol: str
    side: str  # "buy" or "sell"
    size: float
    price: Optional[float] = None
    stopLoss: Optional[float] = None
    takeProfit: Optional[float] = None
    leverage: int
    isTestnet: bool

# ============================================================================
# ROUTER SETUP
# ============================================================================

router = APIRouter(prefix="/api/v1", tags=["trading"])

# ============================================================================
# TRADING LOG ENDPOINTS
# ============================================================================

@router.post("/logs")
async def create_trading_log(
    log: TradingLogCreate,
    db: Session = Depends(get_db)
):
    """Create a new trading log entry"""
    try:
        db_log = TradingLog(**log.dict())
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return {"success": True, "id": db_log.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_trading_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Fetch trading logs"""
    try:
        logs = db.query(TradingLog).order_by(TradingLog.created_at.desc()).limit(limit).all()
        return {
            "success": True,
            "logs": [
                {
                    "id": log.id,
                    "action": log.action,
                    "symbol": log.symbol,
                    "reason": log.reason,
                    "details": log.details,
                    "price": log.price,
                    "size": log.size,
                    "side": log.side.value if log.side else None,
                    "created_at": log.created_at.isoformat(),
                }
                for log in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/logs")
async def clear_trading_logs(db: Session = Depends(get_db)):
    """Clear all trading logs"""
    try:
        db.query(TradingLog).delete()
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# BALANCE HISTORY ENDPOINTS
# ============================================================================

@router.post("/balance")
async def record_balance(
    balance: BalanceHistoryCreate,
    db: Session = Depends(get_db)
):
    """Record balance history"""
    try:
        db_balance = BalanceHistory(**balance.dict())
        db.add(db_balance)
        db.commit()
        db.refresh(db_balance)
        return {"success": True, "id": db_balance.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance/history")
async def get_balance_history(
    mode: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Fetch balance history"""
    try:
        query = db.query(BalanceHistory)
        if mode:
            query = query.filter(BalanceHistory.mode == mode)
        
        history = query.order_by(BalanceHistory.created_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "history": [
                {
                    "id": h.id,
                    "balance": h.balance,
                    "mode": h.mode.value,
                    "created_at": h.created_at.isoformat(),
                }
                for h in history
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# POSITION SNAPSHOT ENDPOINTS
# ============================================================================

@router.post("/positions/snapshot")
async def record_position_snapshot(
    snapshot: PositionSnapshotCreate,
    db: Session = Depends(get_db)
):
    """Record position snapshot"""
    try:
        db_snapshot = PositionSnapshot(**snapshot.dict())
        db.add(db_snapshot)
        db.commit()
        db.refresh(db_snapshot)
        return {"success": True, "id": db_snapshot.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions/history")
async def get_position_history(
    symbol: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Fetch position history"""
    try:
        query = db.query(PositionSnapshot)
        if symbol:
            query = query.filter(PositionSnapshot.symbol == symbol)
        
        snapshots = query.order_by(PositionSnapshot.created_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "snapshots": [
                {
                    "id": s.id,
                    "symbol": s.symbol,
                    "side": s.side.value,
                    "size": s.size,
                    "entry_price": s.entry_price,
                    "current_price": s.current_price,
                    "unrealized_pnl": s.unrealized_pnl,
                    "leverage": s.leverage,
                    "mode": s.mode.value,
                    "created_at": s.created_at.isoformat(),
                }
                for s in snapshots
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HYPERLIQUID TRADE EXECUTION
# ============================================================================

@router.post("/hyperliquid/execute-trade")
async def execute_hyperliquid_trade(trade: ExecuteTradeRequest):
    """Execute a live trade on Hyperliquid"""
    try:
        # Initialize Hyperliquid service
        hl_service = HyperliquidService(is_testnet=trade.isTestnet)
        
        # Place main order
        order_result = await hl_service.place_order(
            api_secret=trade.apiSecret,
            symbol=trade.symbol,
            side=trade.side,
            size=trade.size,
            price=trade.price,
            order_type="market" if not trade.price else "limit",
            leverage=trade.leverage
        )
        
        if not order_result["success"]:
            raise HTTPException(status_code=400, detail=order_result.get("error", "Order placement failed"))
        
        # Place stop loss if provided
        if trade.stopLoss:
            sl_side = "sell" if trade.side == "buy" else "buy"
            await hl_service.place_stop_loss(
                api_secret=trade.apiSecret,
                symbol=trade.symbol,
                side=sl_side,
                size=trade.size,
                trigger_price=trade.stopLoss
            )
        
        # Place take profit if provided
        if trade.takeProfit:
            tp_side = "sell" if trade.side == "buy" else "buy"
            await hl_service.place_take_profit(
                api_secret=trade.apiSecret,
                symbol=trade.symbol,
                side=tp_side,
                size=trade.size,
                trigger_price=trade.takeProfit
            )
        
        return {
            "success": True,
            "data": order_result,
            "message": f"Trade executed successfully on {'Testnet' if trade.isTestnet else 'Mainnet'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trade execution failed: {str(e)}")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }
