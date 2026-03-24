"""
API Routes - All REST endpoints for DeX Trading Agent
Maps frontend API calls to backend services
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

# Import database
from database import get_db
from database.schema import TradingLog, BalanceHistory, PositionSnapshot, ChartSnapshot, TradingMode, TradingSide

# Import WebSocket manager
from api.websocket import manager

# Import services
from services.paper_trading_service import PaperTradingEngine
from services.market_data_service import MarketDataService
from services.hyperliquid_service import HyperliquidService
from services.crypto_news_service import CryptoNewsService
from services.price_stream_service import get_price_stream, PriceStreamService
from services.backtesting_service import BacktestingService, BacktestResult, BacktestTrade
from services.chart_snapshot_service import snapshot_service
from services.trading_service import analyze_market_single_chart, analyze_market_multi_chart

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Global service instances
paper_trading_engine = PaperTradingEngine(initial_balance=10000.0)
market_data_service = MarketDataService()
hyperliquid_testnet = HyperliquidService(is_testnet=True)
hyperliquid_mainnet = HyperliquidService(is_testnet=False)
crypto_news_service = CryptoNewsService()
price_stream = get_price_stream()

# ============================================
# STANDARD RESPONSE HELPER
# ============================================
def success_response(data: Any = None) -> Dict:
    """Create a success response"""
    return {"success": True, "data": data}

def error_response(error: str, status_code: int = 400) -> HTTPException:
    """Create an error response"""
    raise HTTPException(status_code=status_code, detail=error)

# ============================================
# TRADING LOGS API
# ============================================
@router.get("/trading-logs")
async def get_trading_logs(
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get trading logs with optional limit"""
    try:
        logs = db.query(TradingLog).order_by(TradingLog.created_at.desc()).limit(limit).all()
        return success_response([{
            "id": log.id,
            "action": log.action,
            "symbol": log.symbol,
            "reason": log.ai_reasoning,
            "details": log.error_message,
            "price": log.price,
            "size": log.size,
            "side": log.side.value if log.side else None,
            "mode": log.mode.value,
            "created_at": log.created_at.isoformat()
        } for log in logs])
    except Exception as e:
        logger.error(f"Error fetching trading logs: {e}")
        return error_response(f"Failed to fetch trading logs: {str(e)}")

@router.post("/trading-logs")
async def create_trading_log(
    action: str,
    symbol: str,
    reason: str,
    details: Optional[str] = None,
    price: Optional[float] = None,
    size: Optional[float] = None,
    side: Optional[str] = None,
    mode: str = "paper",
    db: Session = Depends(get_db)
):
    """Create a new trading log"""
    try:
        log = TradingLog(
            action=action,
            symbol=symbol,
            ai_reasoning=reason,
            error_message=details,
            price=price,
            size=size,
            side=TradingSide(side) if side else None,
            mode=TradingMode(mode)
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return success_response({
            "id": log.id,
            "action": log.action,
            "symbol": log.symbol,
            "reason": log.ai_reasoning,
            "details": log.error_message,
            "price": log.price,
            "size": log.size,
            "side": log.side.value if log.side else None,
            "mode": log.mode.value,
            "created_at": log.created_at.isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating trading log: {e}")
        return error_response(f"Failed to create trading log: {str(e)}")

@router.delete("/trading-logs")
async def clear_trading_logs(db: Session = Depends(get_db)):
    """Clear all trading logs"""
    try:
        db.query(TradingLog).delete()
        db.commit()
        return success_response({"message": "All trading logs cleared"})
    except Exception as e:
        logger.error(f"Error clearing trading logs: {e}")
        return error_response(f"Failed to clear trading logs: {str(e)}")

# ============================================
# BALANCE HISTORY API
# ============================================
@router.get("/balance-history")
async def get_balance_history(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get balance history"""
    try:
        history = db.query(BalanceHistory).order_by(BalanceHistory.created_at.desc()).limit(limit).all()
        return success_response([{
            "id": h.id,
            "balance": h.balance,
            "mode": h.mode.value,
            "created_at": h.created_at.isoformat()
        } for h in history])
    except Exception as e:
        logger.error(f"Error fetching balance history: {e}")
        return error_response(f"Failed to fetch balance history: {str(e)}")

@router.post("/balance-history")
async def create_balance_history(
    balance: float,
    mode: str = "paper",
    db: Session = Depends(get_db)
):
    """Record a new balance entry"""
    try:
        # Convert demo to paper
        if mode == "demo":
            mode = "paper"
        
        entry = BalanceHistory(
            balance=balance,
            mode=TradingMode(mode)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return success_response({
            "id": entry.id,
            "balance": entry.balance,
            "mode": entry.mode.value,
            "created_at": entry.created_at.isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating balance history: {e}")
        return error_response(f"Failed to create balance history: {str(e)}")

# ============================================
# POSITION HISTORY API
# ============================================
@router.get("/v1/positions/history")
async def get_position_history(
    symbol: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get position history with optional filtering"""
    try:
        query = db.query(PositionSnapshot).order_by(PositionSnapshot.created_at.desc())
        if symbol:
            query = query.filter(PositionSnapshot.symbol == symbol)
        positions = query.limit(limit).all()
        return success_response([{
            "id": p.id,
            "symbol": p.symbol,
            "side": p.side.value,
            "size": p.size,
            "entry_price": p.entry_price,
            "current_price": p.current_price,
            "unrealized_pnl": p.unrealized_pnl,
            "leverage": p.leverage,
            "mode": p.mode.value,
            "created_at": p.created_at.isoformat()
        } for p in positions])
    except Exception as e:
        logger.error(f"Error fetching position history: {e}")
        return error_response(f"Failed to fetch position history: {str(e)}")

@router.post("/v1/positions/snapshot")
async def create_position_snapshot(
    symbol: str,
    side: str,
    size: float,
    entry_price: float,
    current_price: float,
    unrealized_pnl: float,
    leverage: float,
    mode: str = "paper",
    db: Session = Depends(get_db)
):
    """Record a position snapshot"""
    try:
        # Convert demo to paper
        if mode == "demo":
            mode = "paper"
        
        snapshot = PositionSnapshot(
            symbol=symbol,
            side=TradingSide(side),
            size=size,
            entry_price=entry_price,
            current_price=current_price,
            unrealized_pnl=unrealized_pnl,
            leverage=leverage,
            mode=TradingMode(mode)
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return success_response({
            "id": snapshot.id,
            "symbol": snapshot.symbol,
            "side": snapshot.side.value,
            "size": snapshot.size,
            "entry_price": snapshot.entry_price,
            "current_price": snapshot.current_price,
            "unrealized_pnl": snapshot.unrealized_pnl,
            "leverage": snapshot.leverage,
            "mode": snapshot.mode.value,
            "created_at": snapshot.created_at.isoformat()
        })
    except Exception as e:
        logger.error(f"Error creating position snapshot: {e}")
        return error_response(f"Failed to create position snapshot: {str(e)}")

# ============================================
# AI ANALYSIS API
# ============================================
@router.post("/ai/analyze")
async def analyze_single_chart(
    apiKey: str,
    userBalance: float,
    settings: Dict[str, Any],
    symbol: Optional[str] = None,
    chartData: Optional[str] = None,
    isDemoMode: bool = False,
    aiModel: Optional[str] = None,
    customPrompt: Optional[str] = None,
    network: str = "mainnet"
):
    """Perform AI market analysis for single chart"""
    try:
        result = await analyze_market_single_chart(
            api_key=apiKey,
            symbol=symbol or "BTC",
            chart_data=chartData or "",
            user_balance=userBalance,
            settings=settings,
            is_demo_mode=isDemoMode,
            ai_model=aiModel or "deepseek-v3",
            custom_prompt=customPrompt
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error in AI analysis: {e}")
        return error_response(f"AI analysis failed: {str(e)}")

@router.post("/ai/analyze-multi-chart")
async def analyze_multi_chart(
    apiKey: str,
    userBalance: float,
    settings: Dict[str, Any],
    charts: List[Dict[str, Any]],
    isDemoMode: bool = False,
    aiModel: Optional[str] = None,
    customPrompt: Optional[str] = None,
    network: str = "mainnet"
):
    """Perform AI analysis on multiple charts"""
    try:
        if not charts or len(charts) == 0:
            return error_response("At least one chart is required for multi-chart analysis")
        
        result = await analyze_market_multi_chart(
            api_key=apiKey,
            charts=charts,
            user_balance=userBalance,
            settings=settings,
            is_demo_mode=isDemoMode,
            ai_model=aiModel or "deepseek-v3",
            custom_prompt=customPrompt
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error in multi-chart AI analysis: {e}")
        return error_response(f"Multi-chart AI analysis failed: {str(e)}")

# ============================================
# HYPERLIQUID INTEGRATION API
# ============================================
@router.get("/hyperliquid/testnet/test-connection")
async def test_hyperliquid_testnet_connection():
    """Test Hyperliquid testnet connection"""
    try:
        result = await hyperliquid_testnet.test_connection()
        return success_response(result)
    except Exception as e:
        logger.error(f"Error testing Hyperliquid testnet: {e}")
        return error_response(f"Failed to test connection: {str(e)}")

@router.get("/hyperliquid/mainnet/test-connection")
async def test_hyperliquid_mainnet_connection():
    """Test Hyperliquid mainnet connection"""
    try:
        result = await hyperliquid_mainnet.test_connection()
        return success_response(result)
    except Exception as e:
        logger.error(f"Error testing Hyperliquid mainnet: {e}")
        return error_response(f"Failed to test connection: {str(e)}")

@router.post("/hyperliquid/testnet/positions")
async def get_hyperliquid_testnet_positions(
    apiSecret: str,
    walletAddress: str
):
    """Fetch positions from Hyperliquid testnet"""
    try:
        result = await hyperliquid_testnet.get_positions(apiSecret, walletAddress)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching testnet positions: {e}")
        return error_response(f"Failed to fetch positions: {str(e)}")

@router.post("/hyperliquid/mainnet/positions")
async def get_hyperliquid_mainnet_positions(
    apiSecret: str,
    walletAddress: str
):
    """Fetch positions from Hyperliquid mainnet"""
    try:
        result = await hyperliquid_mainnet.get_positions(apiSecret, walletAddress)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching mainnet positions: {e}")
        return error_response(f"Failed to fetch positions: {str(e)}")

@router.get("/hyperliquid/testnet/orderbook")
async def get_hyperliquid_testnet_orderbook(coin: str):
    """Get order book for a coin on testnet"""
    try:
        result = await hyperliquid_testnet.get_orderbook(coin)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching testnet orderbook: {e}")
        return error_response(f"Failed to fetch orderbook: {str(e)}")

@router.get("/hyperliquid/mainnet/orderbook")
async def get_hyperliquid_mainnet_orderbook(coin: str):
    """Get order book for a coin on mainnet"""
    try:
        result = await hyperliquid_mainnet.get_orderbook(coin)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching mainnet orderbook: {e}")
        return error_response(f"Failed to fetch orderbook: {str(e)}")

@router.post("/hyperliquid/testnet/account-info")
async def get_hyperliquid_testnet_account_info(walletAddress: str):
    """Get account information from testnet"""
    try:
        result = await hyperliquid_testnet.get_account_info(walletAddress)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching testnet account info: {e}")
        return error_response(f"Failed to fetch account info: {str(e)}")

@router.post("/hyperliquid/mainnet/account-info")
async def get_hyperliquid_mainnet_account_info(walletAddress: str):
    """Get account information from mainnet"""
    try:
        result = await hyperliquid_mainnet.get_account_info(walletAddress)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching mainnet account info: {e}")
        return error_response(f"Failed to fetch account info: {str(e)}")

@router.post("/hyperliquid/testnet/execute-trade")
async def execute_hyperliquid_testnet_trade(
    apiSecret: str,
    symbol: str,
    side: str,
    size: float,
    price: float,
    leverage: float = 1.0,
    stopLoss: Optional[float] = None,
    takeProfit: Optional[float] = None
):
    """Execute a live trade on testnet"""
    try:
        result = await hyperliquid_testnet.place_order(
            api_secret=apiSecret,
            symbol=symbol.upper(),
            side=side,
            size=size,
            price=price,
            leverage=int(leverage)
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error executing testnet trade: {e}")
        return error_response(f"Failed to execute trade: {str(e)}")

@router.post("/hyperliquid/mainnet/execute-trade")
async def execute_hyperliquid_mainnet_trade(
    apiSecret: str,
    symbol: str,
    side: str,
    size: float,
    price: float,
    leverage: float = 1.0,
    stopLoss: Optional[float] = None,
    takeProfit: Optional[float] = None
):
    """Execute a live trade on mainnet"""
    try:
        result = await hyperliquid_mainnet.place_order(
            api_secret=apiSecret,
            symbol=symbol.upper(),
            side=side,
            size=size,
            price=price,
            leverage=int(leverage)
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error executing mainnet trade: {e}")
        return error_response(f"Failed to execute trade: {str(e)}")

# ============================================
# NEWS API
# ============================================
@router.post("/news/crypto")
async def fetch_crypto_news(
    filter: Optional[str] = None,
    currencies: Optional[List[str]] = None,
    limit: int = 20
):
    """Fetch cryptocurrency news"""
    try:
        result = await crypto_news_service.fetch_crypto_news(
            filter_type=filter,
            currencies=currencies,
            limit=limit
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error fetching crypto news: {e}")
        return error_response(f"Failed to fetch news: {str(e)}")

# ============================================
# MARKET DATA API
# ============================================
@router.get("/v1/market/testnet/price")
async def get_testnet_price(symbol: str):
    """Fetch current price for a symbol on testnet"""
    try:
        price = await market_data_service.fetch_price_with_fallback(symbol, is_testnet=True)
        return success_response({"price": price})
    except Exception as e:
        logger.error(f"Error fetching testnet price: {e}")
        return error_response(f"Failed to fetch price: {str(e)}")

@router.get("/v1/market/mainnet/price")
async def get_mainnet_price(symbol: str):
    """Fetch current price for a symbol on mainnet"""
    try:
        price = await market_data_service.fetch_price_with_fallback(symbol, is_testnet=False)
        return success_response({"price": price})
    except Exception as e:
        logger.error(f"Error fetching mainnet price: {e}")
        return error_response(f"Failed to fetch price: {str(e)}")

# ============================================
# PAPER TRADING API
# ============================================
@router.post("/paper-trading/execute")
async def execute_paper_trade(
    symbol: str,
    side: str,
    size: float,
    price: float,
    type: str = "market",
    stopLoss: Optional[float] = None,
    takeProfit: Optional[float] = None,
    leverage: float = 1.0
):
    """Execute a paper trade"""
    try:
        result = await paper_trading_engine.place_order(
            symbol=symbol,
            side=side,
            size=size,
            price=price,
            order_type=type
        )
        return success_response(result)
    except Exception as e:
        logger.error(f"Error executing paper trade: {e}")
        return error_response(f"Failed to execute paper trade: {str(e)}")

@router.get("/paper-trading/positions")
async def get_paper_trading_positions():
    """Get all paper trading positions"""
    try:
        positions = paper_trading_engine.get_all_positions()
        return success_response(positions)
    except Exception as e:
        logger.error(f"Error fetching paper positions: {e}")
        return error_response(f"Failed to fetch positions: {str(e)}")

@router.post("/paper-trading/close-position")
async def close_paper_trading_position(
    symbol: str,
    price: float,
    reason: str
):
    """Close a paper trading position"""
    try:
        result = await paper_trading_engine.close_position(symbol, price, reason)
        return success_response(result)
    except Exception as e:
        logger.error(f"Error closing paper position: {e}")
        return error_response(f"Failed to close position: {str(e)}")

@router.get("/paper-trading/balance")
async def get_paper_trading_balance():
    """Get paper trading balance"""
    try:
        balance = paper_trading_engine.get_balance()
        return success_response({"balance": balance})
    except Exception as e:
        logger.error(f"Error fetching paper balance: {e}")
        return error_response(f"Failed to fetch balance: {str(e)}")

@router.post("/paper-trading/reset")
async def reset_paper_trading(initialBalance: float = 10000.0):
    """Reset paper trading engine"""
    try:
        paper_trading_engine.reset(initialBalance)
        return success_response({"message": "Paper trading reset", "balance": initialBalance})
    except Exception as e:
        logger.error(f"Error resetting paper trading: {e}")
        return error_response(f"Failed to reset: {str(e)}")

# ============================================
# CHART SNAPSHOTS API
# ============================================
@router.get("/v1/snapshots/latest")
async def get_latest_snapshots(
    symbols: Optional[str] = None,
    snapshot_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get latest chart snapshots"""
    try:
        symbol_list = symbols.split(",") if symbols else None
        snapshots = await snapshot_service.get_latest_snapshots(
            db=db,
            symbols=symbol_list,
            snapshot_type=snapshot_type,
            limit=limit
        )
        return success_response([{
            "id": s.id,
            "symbol": s.symbol,
            "snapshot_type": s.snapshot_type.value,
            "price": s.price,
            "created_at": s.created_at.isoformat()
        } for s in snapshots])
    except Exception as e:
        logger.error(f"Error fetching snapshots: {e}")
        return error_response(f"Failed to fetch snapshots: {str(e)}")

@router.get("/v1/snapshots/testnet/ai-analysis")
async def get_testnet_ai_analysis_snapshots(
    symbols: str,
    snapshot_type: str,
    db: Session = Depends(get_db)
):
    """Get snapshots optimized for AI analysis on testnet"""
    try:
        symbol_list = symbols.split(",")
        snapshots = await snapshot_service.get_snapshot_for_ai_analysis(
            db=db,
            symbols=symbol_list
        )
        return success_response(snapshots)
    except Exception as e:
        logger.error(f"Error fetching AI analysis snapshots: {e}")
        return error_response(f"Failed to fetch snapshots: {str(e)}")

@router.get("/v1/snapshots/mainnet/ai-analysis")
async def get_mainnet_ai_analysis_snapshots(
    symbols: str,
    snapshot_type: str,
    db: Session = Depends(get_db)
):
    """Get snapshots optimized for AI analysis on mainnet"""
    try:
        symbol_list = symbols.split(",")
        snapshots = await snapshot_service.get_snapshot_for_ai_analysis(
            db=db,
            symbols=symbol_list
        )
        return success_response(snapshots)
    except Exception as e:
        logger.error(f"Error fetching AI analysis snapshots: {e}")
        return error_response(f"Failed to fetch snapshots: {str(e)}")

@router.post("/snapshots/start")
async def start_snapshot_service():
    """Start chart snapshot service"""
    try:
        snapshot_service.start()
        return success_response({"message": "Snapshot service started"})
    except Exception as e:
        logger.error(f"Error starting snapshot service: {e}")
        return error_response(f"Failed to start service: {str(e)}")

@router.post("/snapshots/stop")
async def stop_snapshot_service():
    """Stop chart snapshot service"""
    try:
        snapshot_service.stop()
        return success_response({"message": "Snapshot service stopped"})
    except Exception as e:
        logger.error(f"Error stopping snapshot service: {e}")
        return error_response(f"Failed to stop service: {str(e)}")

@router.post("/snapshots/cleanup")
async def cleanup_old_snapshots(
    days_to_keep: int = 30,
    db: Session = Depends(get_db)
):
    """Remove old snapshots"""
    try:
        count = await snapshot_service.cleanup_old_snapshots(db, days_to_keep)
        return success_response({"message": f"Cleaned up {count} old snapshots"})
    except Exception as e:
        logger.error(f"Error cleaning up snapshots: {e}")
        return error_response(f"Failed to cleanup: {str(e)}")

# ============================================
# BACKTESTING API
# ============================================
@router.post("/backtest/run")
async def run_backtest_simulation(
    symbol: str,
    startDate: str,
    endDate: str,
    intervalMinutes: int,
    initialBalance: float,
    settings: Dict[str, Any],
    priceData: List[Dict[str, Any]]
):
    """Run a backtest simulation"""
    try:
        if not priceData:
            return error_response("Price data is required for backtesting")
        
        if initialBalance <= 0:
            return error_response("Initial balance must be positive")
        
        # Parse dates
        start = datetime.fromisoformat(startDate)
        end = datetime.fromisoformat(endDate)
        
        # Create backtest service
        backtest_service = BacktestingService(initial_balance=initialBalance)
        
        # Run backtest (async wrapper for sync function)
        import asyncio
        result = await asyncio.to_thread(
            backtest_service.run_backtest,
            symbol=symbol,
            start_date=start,
            end_date=end,
            interval_minutes=intervalMinutes,
            settings=settings,
            ai_service=None,  # Will use default AI service
            price_data=priceData
        )
        
        return success_response({
            "initial_balance": result.initial_balance,
            "final_balance": result.final_balance,
            "total_trades": result.total_trades,
            "winning_trades": result.winning_trades,
            "losing_trades": result.losing_trades,
            "total_pnl": result.total_pnl,
            "total_pnl_percent": result.total_pnl_percent,
            "max_drawdown": result.max_drawdown,
            "win_rate": result.win_rate,
            "trades": result.trades,
            "equity_curve": result.equity_curve
        })
    except Exception as e:
        logger.error(f"Error running backtest: {e}")
        return error_response(f"Failed to run backtest: {str(e)}")

@router.get("/backtest/sample-data")
async def get_backtest_sample_data(symbol: str, days: int = 30):
    """Reject synthetic sample data requests for backtesting."""
    try:
        logger.warning(
            "Rejected synthetic backtest sample data request for %s over %s days",
            symbol,
            days,
        )
        return {
            "success": False,
            "status": "unavailable",
            "error": "historical data unavailable: sample-data endpoint is disabled; use a real upstream data source",
            "symbol": symbol,
            "days": days,
        }
    except Exception as e:
        logger.error(f"Error fetching sample data: {e}")
        return error_response(f"Failed to fetch sample data: {str(e)}")

@router.get("/backtest/logs")
async def get_backtest_logs():
    """Get backtest execution logs"""
    try:
        # Return mock logs (in production, store in database)
        return success_response([])
    except Exception as e:
        logger.error(f"Error fetching backtest logs: {e}")
        return error_response(f"Failed to fetch logs: {str(e)}")

# ============================================
# PRICE STREAM API
# ============================================
@router.post("/stream/start")
async def start_price_stream(symbols: List[str], isTestnet: bool = False):
    """Start price stream service"""
    try:
        price_stream.start(symbols=symbols, is_testnet=isTestnet)
        return success_response({"message": "Price stream started", "symbols": symbols})
    except Exception as e:
        logger.error(f"Error starting price stream: {e}")
        return error_response(f"Failed to start stream: {str(e)}")

@router.post("/stream/stop")
async def stop_price_stream():
    """Stop price stream service"""
    try:
        price_stream.stop()
        return success_response({"message": "Price stream stopped"})
    except Exception as e:
        logger.error(f"Error stopping price stream: {e}")
        return error_response(f"Failed to stop stream: {str(e)}")

@router.get("/stream/price/{symbol}")
async def get_stream_price(symbol: str):
    """Get current price from stream"""
    try:
        price = price_stream.get_price(symbol)
        if price is None:
            return error_response(f"No price data for {symbol}")
        return success_response({"symbol": symbol, "price": price})
    except Exception as e:
        logger.error(f"Error fetching stream price: {e}")
        return error_response(f"Failed to fetch price: {str(e)}")

@router.get("/stream/snapshot/{symbol}")
async def get_stream_snapshot(symbol: str):
    """Get price snapshot from stream"""
    try:
        snapshot = price_stream.get_snapshot(symbol)
        if snapshot is None:
            return error_response(f"No snapshot for {symbol}")
        return success_response({
            "symbol": snapshot.symbol,
            "price": snapshot.price,
            "timestamp": snapshot.timestamp.isoformat()
        })
    except Exception as e:
        logger.error(f"Error fetching snapshot: {e}")
        return error_response(f"Failed to fetch snapshot: {str(e)}")

@router.get("/stream/snapshots")
async def get_all_stream_snapshots():
    """Get all price snapshots from stream"""
    try:
        snapshots = price_stream.get_all_snapshots()
        return success_response({
            symbol: {
                "symbol": s.symbol,
                "price": s.price,
                "timestamp": s.timestamp.isoformat()
            }
            for symbol, s in snapshots.items()
        })
    except Exception as e:
        logger.error(f"Error fetching all snapshots: {e}")
        return error_response(f"Failed to fetch snapshots: {str(e)}")
