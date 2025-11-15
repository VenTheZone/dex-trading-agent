"""
API Routes - FastAPI endpoints
Replaces Convex backend functions
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import re

from migration_python.database import get_db
from migration_python.database.schema import TradingLog, BalanceHistory, PositionSnapshot, TradingMode, TradingSide
from migration_python.services.market_data_service import MarketDataService
from migration_python.services.hyperliquid_service import HyperliquidService

router = APIRouter()

# ============================================================================
# TRADING LOGS ENDPOINTS
# ============================================================================

@router.get("/api/trading-logs")
async def get_trading_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent trading logs"""
    try:
        logs = db.query(TradingLog).order_by(TradingLog.created_at.desc()).limit(limit).all()
        return [
            {
                "id": log.id,
                "action": log.action,
                "symbol": log.symbol,
                "reason": log.reason,
                "details": log.details,
                "price": log.price,
                "size": log.size,
                "side": log.side.value if log.side else None,
                "mode": log.mode.value,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/trading-logs")
async def create_trading_log(log_data: dict, db: Session = Depends(get_db)):
    """Create a new trading log entry"""
    try:
        log = TradingLog(
            action=log_data.get("action"),
            symbol=log_data.get("symbol"),
            reason=log_data.get("reason"),
            details=log_data.get("details"),
            price=log_data.get("price"),
            size=log_data.get("size"),
            side=TradingSide(log_data["side"]) if log_data.get("side") else None,
            mode=TradingMode(log_data.get("mode", "paper")),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return {
            "id": log.id,
            "action": log.action,
            "symbol": log.symbol,
            "created_at": log.created_at.isoformat(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/trading-logs")
async def clear_trading_logs(db: Session = Depends(get_db)):
    """Clear all trading logs"""
    try:
        db.query(TradingLog).delete()
        db.commit()
        return {"message": "All trading logs cleared"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# BALANCE HISTORY ENDPOINTS
# ============================================================================

@router.get("/api/balance-history")
async def get_balance_history(limit: int = 100, db: Session = Depends(get_db)):
    """Get balance history"""
    try:
        history = db.query(BalanceHistory).order_by(BalanceHistory.created_at.desc()).limit(limit).all()
        return [
            {
                "id": h.id,
                "balance": h.balance,
                "mode": h.mode.value,
                "created_at": h.created_at.isoformat(),
            }
            for h in history
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/balance-history")
async def record_balance(balance_data: dict, db: Session = Depends(get_db)):
    """Record balance snapshot"""
    try:
        history = BalanceHistory(
            balance=balance_data.get("balance"),
            mode=TradingMode(balance_data.get("mode", "paper")),
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return {
            "id": history.id,
            "balance": history.balance,
            "mode": history.mode.value,
            "created_at": history.created_at.isoformat(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# POSITION SNAPSHOTS ENDPOINTS
# ============================================================================

@router.get("/api/v1/positions/history")
async def get_position_history(symbol: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    """Get position history"""
    try:
        query = db.query(PositionSnapshot)
        if symbol:
            query = query.filter(PositionSnapshot.symbol == symbol)
        snapshots = query.order_by(PositionSnapshot.created_at.desc()).limit(limit).all()
        return [
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/v1/positions/snapshot")
async def record_position_snapshot(snapshot_data: dict, db: Session = Depends(get_db)):
    """Record position snapshot"""
    try:
        snapshot = PositionSnapshot(
            symbol=snapshot_data.get("symbol"),
            side=TradingSide(snapshot_data.get("side")),
            size=snapshot_data.get("size"),
            entry_price=snapshot_data.get("entry_price"),
            current_price=snapshot_data.get("current_price"),
            unrealized_pnl=snapshot_data.get("unrealized_pnl"),
            leverage=snapshot_data.get("leverage"),
            mode=TradingMode(snapshot_data.get("mode", "paper")),
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return {
            "id": snapshot.id,
            "symbol": snapshot.symbol,
            "created_at": snapshot.created_at.isoformat(),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# MARKET DATA ENDPOINTS
# ============================================================================

@router.get("/api/v1/market/price")
async def get_market_price(symbol: str, isTestnet: bool = False):
    """Fetch current market price from Hyperliquid"""
    try:
        market_service = MarketDataService()
        price = await market_service.fetch_price_with_fallback(symbol, isTestnet)
        return {"price": price}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# AI ANALYSIS ENDPOINTS
# ============================================================================

@router.post("/api/ai/analyze")
async def analyze_market(request: dict):
    """AI analysis for single chart - delegates to OpenRouter"""
    try:
        api_key = request.get("apiKey")
        symbol = request.get("symbol")
        chart_data = request.get("chartData", "")
        user_balance = request.get("userBalance", 10000)
        settings = request.get("settings", {})
        ai_model = request.get("aiModel", "deepseek/deepseek-chat-v3-0324:free")
        custom_prompt = request.get("customPrompt", "")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenRouter API key required")
        
        from openai import OpenAI
        
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        system_prompt = custom_prompt if custom_prompt else "You are a cryptocurrency trading analyst."
        user_prompt = f"{chart_data}\n\nProvide trading analysis in JSON format with: action, confidence, reasoning, entryPrice, stopLoss, takeProfit, positionSize"
        
        completion = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
        )
        
        response_text = completion.choices[0].message.content
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            analysis = {
                "action": "hold",
                "confidence": 50,
                "reasoning": response_text,
                "entryPrice": 0,
                "stopLoss": 0,
                "takeProfit": 0,
                "positionSize": 0
            }
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.post("/api/ai/analyze-multi-chart")
async def analyze_multi_chart(request: dict):
    """AI analysis for multiple charts - delegates to OpenRouter"""
    try:
        api_key = request.get("apiKey")
        charts = request.get("charts", [])
        user_balance = request.get("userBalance", 10000)
        settings = request.get("settings", {})
        ai_model = request.get("aiModel", "deepseek/deepseek-chat-v3-0324:free")
        custom_prompt = request.get("customPrompt", "")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenRouter API key required")
        
        if not charts:
            raise HTTPException(status_code=400, detail="No charts provided for analysis")
        
        from openai import OpenAI
        
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        chart_summaries = []
        for chart in charts:
            summary = f"Symbol: {chart.get('symbol')}, Price: {chart.get('currentPrice')}, Chart: {chart.get('chartType')} {chart.get('chartInterval')}"
            if chart.get('technicalContext'):
                summary += f"\nContext: {chart.get('technicalContext')}"
            chart_summaries.append(summary)
        
        charts_text = "\n\n".join(chart_summaries)
        
        system_prompt = custom_prompt if custom_prompt else "You are a cryptocurrency trading analyst analyzing multiple trading pairs."
        user_prompt = f"""Analyze the following trading pairs and recommend the BEST trading opportunity:

{charts_text}

Account Balance: ${user_balance}
Risk Management: TP {settings.get('takeProfitPercent', 2)}%, SL {settings.get('stopLossPercent', 1)}%

Provide your analysis in JSON format with:
- recommendedSymbol: which coin to trade
- action: open_long, open_short, close, or hold
- confidence: 0-100
- reasoning: detailed step-by-step analysis
- entryPrice: recommended entry price
- stopLoss: stop loss price
- takeProfit: take profit price
- positionSize: position size in USD
- marketContext: overall market conditions summary
"""
        
        completion = client.chat.completions.create(
            model=ai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
        )
        
        response_text = completion.choices[0].message.content
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            analysis = {
                "recommendedSymbol": charts[0].get('symbol') if charts else "BTCUSD",
                "action": "hold",
                "confidence": 50,
                "reasoning": response_text,
                "entryPrice": charts[0].get('currentPrice', 0) if charts else 0,
                "stopLoss": 0,
                "takeProfit": 0,
                "positionSize": 0,
                "marketContext": "Analysis completed"
            }
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-chart AI analysis failed: {str(e)}")

# ============================================================================
# HYPERLIQUID ENDPOINTS
# ============================================================================

@router.post("/api/hyperliquid/test-connection")
async def test_hyperliquid_connection(isTestnet: bool = False):
    """Test connection to Hyperliquid API"""
    try:
        service = HyperliquidService(is_testnet=isTestnet)
        meta = service.info.meta()
        
        if meta and 'universe' in meta:
            assets = [asset['name'] for asset in meta['universe'][:5]]
            return {
                "success": True,
                "message": "Connection successful",
                "apiEndpoint": "https://api.hyperliquid-testnet.xyz" if isTestnet else "https://api.hyperliquid.xyz",
                "appUrl": "https://app.hyperliquid-testnet.xyz" if isTestnet else "https://app.hyperliquid.xyz",
                "assetsCount": len(meta['universe']),
                "availableAssets": ", ".join(assets)
            }
        else:
            return {
                "success": False,
                "message": "Connection failed",
                "error": "Unable to fetch market metadata"
            }
    except Exception as e:
        return {
            "success": False,
            "message": "Connection failed",
            "error": str(e)
        }

@router.post("/api/hyperliquid/positions")
async def get_hyperliquid_positions(request: dict):
    """Get Hyperliquid positions"""
    try:
        api_secret = request.get("apiSecret")
        wallet_address = request.get("walletAddress")
        is_testnet = request.get("isTestnet", False)
        
        if not api_secret or not wallet_address:
            raise HTTPException(status_code=400, detail="API secret and wallet address required")
        
        service = HyperliquidService(is_testnet=is_testnet)
        positions = await service.get_positions(wallet_address)
        
        return {"success": True, "data": positions}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/api/hyperliquid/execute-trade")
async def execute_live_trade(request: dict):
    """Execute live trade on Hyperliquid"""
    try:
        api_secret = request.get("apiSecret")
        symbol = request.get("symbol")
        side = request.get("side")
        size = request.get("size")
        price = request.get("price")
        leverage = request.get("leverage", 1)
        is_testnet = request.get("isTestnet", False)
        
        if not all([api_secret, symbol, side, size, price]):
            raise HTTPException(status_code=400, detail="Missing required trade parameters")
        
        service = HyperliquidService(is_testnet=is_testnet)
        
        # Get asset index
        asset_index = await service.get_asset_index(symbol)
        
        # Place order
        result = await service.place_order(
            api_secret=api_secret,
            asset_index=asset_index,
            is_buy=(side == "buy"),
            size=size,
            price=price,
            leverage=leverage
        )
        
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "DeX Trading Agent API"}
