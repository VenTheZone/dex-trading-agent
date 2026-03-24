"""
DeX Trading Agent - FastAPI Backend
Main application entry point with full FastAPI initialization
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Import database
from database import init_db, get_db, engine
from database.schema import TradingLog, BalanceHistory, PositionSnapshot, ChartSnapshot

# Import WebSocket handler
from api.websocket import manager, handle_websocket

# Import services
from services.trading_service import analyze_market_single_chart, analyze_market_multi_chart
from services.market_data_service import MarketDataService
from services.paper_trading_service import PaperTradingEngine as PaperTradingService
from services.hyperliquid_service import HyperliquidService
from services.backtesting_service import BacktestingService, get_backtest_service
from services.chart_snapshot_service import snapshot_service
from services.crypto_news_service import CryptoNewsService
from services.price_stream_service import get_price_stream

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global service instances
market_data_service = MarketDataService()
paper_trading_service = PaperTradingService(initial_balance=10000.0)
hyperliquid_testnet = HyperliquidService(is_testnet=True)
hyperliquid_mainnet = HyperliquidService(is_testnet=False)
crypto_news_service = CryptoNewsService()
price_stream_service = get_price_stream()

# ============================================
# LIFESPAN CONTEXT MANAGER (Modern FastAPI)
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown events"""
    # Startup
    logger.info("[STARTUP] Initializing DeX Trading Agent API...")
    
    try:
        # Initialize database
        init_db()
        logger.info("[STARTUP] Database initialized successfully")
        
        # Start price stream service
        await price_stream_service.start(
            symbols=["BTC", "ETH", "SOL", "AVAX"],
            is_testnet=False
        )
        logger.info("[STARTUP] Price stream service started")
        
        # Start chart snapshot service
        await snapshot_service.start()
        logger.info("[STARTUP] Chart snapshot service started")
        
        logger.info("[STARTUP] API ready to accept connections")
        
    except Exception as e:
        logger.error(f"[STARTUP] Error during initialization: {e}", exc_info=True)
        raise
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("[SHUTDOWN] Cleaning up resources...")
    try:
        await price_stream_service.stop()
        await snapshot_service.stop()
        logger.info("[SHUTDOWN] Services stopped successfully")
    except Exception as e:
        logger.error(f"[SHUTDOWN] Error during cleanup: {e}", exc_info=True)

# ============================================
# FASTAPI APP INITIALIZATION
# ============================================
app = FastAPI(
    title="DeX Trading Agent API",
    version="1.0.0",
    description="AI-powered perpetual futures trading platform for Hyperliquid",
    lifespan=lifespan
)

# ============================================
# CORS MIDDLEWARE
# ============================================
# Allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK ENDPOINT
# ============================================
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "dex-trading-agent",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================
# API STATUS ENDPOINT
# ============================================
@app.get("/api/status")
async def api_status():
    """Get API status and available services"""
    return {
        "status": "operational",
        "services": {
            "trading": True,
            "market_data": True,
            "paper_trading": True,
            "hyperliquid": True,
            "backtesting": True,
            "chart_snapshots": True,
            "crypto_news": True,
            "price_stream": True,
            "websocket": True
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================
# ROUTER IMPORTS
# ============================================
from api.routes import router as main_router

# ============================================
# ROUTER REGISTRATION
# ============================================
app.include_router(main_router, prefix="/api")

# ============================================
# WEBSOCKET ENDPOINT
# ============================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await handle_websocket(websocket)

# ============================================
# ERROR HANDLERS
# ============================================
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "status_code": 500
        }
    )

# ============================================
# MAIN ENTRY POINT
# ============================================
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
