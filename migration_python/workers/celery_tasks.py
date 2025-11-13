"""
Celery Background Tasks - Scheduled AI analysis and monitoring
"""
from workers import celery_app
from services.trading_service import TradingService
from services.market_data_service import MarketDataService
from database import SessionLocal
from database.schema import TradingLog
import logging
import os

logger = logging.getLogger(__name__)

trading_service = TradingService()
market_service = MarketDataService()


@celery_app.task(name='workers.celery_tasks.scheduled_ai_analysis')
def scheduled_ai_analysis():
    """
    Scheduled AI analysis task - runs every 5 minutes
    Analyzes market conditions and logs recommendations
    """
    try:
        logger.info("🤖 Starting scheduled AI analysis...")
        
        # Get API key from environment
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        if not openrouter_key:
            logger.warning("OpenRouter API key not configured, skipping AI analysis")
            return {'status': 'skipped', 'reason': 'No API key'}
        
        # Define coins to analyze
        coins = ['BTC', 'ETH', 'SOL']
        
        # Fetch current prices
        chart_data = []
        for symbol in coins:
            try:
                price = market_service.fetch_price_with_fallback(symbol)
                chart_data.append({
                    'symbol': symbol,
                    'currentPrice': price,
                    'chartType': 'time',
                    'chartInterval': '15',
                    'technicalContext': f'Price: {price}, Timeframe: 15m'
                })
            except Exception as e:
                logger.error(f"Failed to fetch price for {symbol}: {e}")
        
        if not chart_data:
            logger.warning("No market data available for analysis")
            return {'status': 'skipped', 'reason': 'No market data'}
        
        # Run AI analysis
        analysis = trading_service.analyze_multi_chart(
            api_key=openrouter_key,
            charts=chart_data,
            user_balance=10000.0,
            settings={
                'takeProfitPercent': 5.0,
                'stopLossPercent': 2.0,
                'useAdvancedStrategy': True,
                'leverage': 5,
                'allowAILeverage': False,
            },
            ai_model='deepseek/deepseek-chat-v3-0324:free'
        )
        
        # Log analysis result
        db = SessionLocal()
        try:
            log = TradingLog(
                action='scheduled_ai_analysis',
                symbol=analysis.get('recommendedSymbol', 'MULTI'),
                reason=f"AI Decision: {analysis['action']} (Confidence: {analysis['confidence']}%)",
                details=analysis.get('reasoning', ''),
            )
            db.add(log)
            db.commit()
            logger.info(f"✅ AI analysis complete: {analysis['action']}")
        finally:
            db.close()
        
        return {
            'status': 'success',
            'action': analysis['action'],
            'confidence': analysis['confidence'],
            'symbol': analysis.get('recommendedSymbol')
        }
        
    except Exception as e:
        logger.error(f"Scheduled AI analysis error: {e}")
        return {'status': 'error', 'error': str(e)}


@celery_app.task(name='workers.celery_tasks.update_balance_history')
def update_balance_history():
    """
    Update balance history - runs periodically
    Records current balance snapshots for tracking
    """
    try:
        logger.info("📊 Updating balance history...")
        # This would fetch live balance from Hyperliquid or paper trading engine
        # For now, just log the task execution
        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Balance history update error: {e}")
        return {'status': 'error', 'error': str(e)}
