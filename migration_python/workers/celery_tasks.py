# ... keep existing imports

logger = logging.getLogger(__name__)

# Remove global service instances - they need db sessions
# trading_service = TradingService()
# market_service = MarketDataService()


@celery_app.task(name='workers.celery_tasks.scheduled_ai_analysis')
def scheduled_ai_analysis():
    """
    Scheduled AI analysis task - runs every 5 minutes
    Analyzes market conditions and logs recommendations
    """
    db = SessionLocal()
    try:
        logger.info("🤖 Starting scheduled AI analysis...")
        
        # Initialize services with db session
        trading_service = TradingService(db)
        market_service = MarketDataService()
        
        # Get API key from environment
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        if not openrouter_key:
            logger.warning("OpenRouter API key not configured, skipping AI analysis")
            return
        
        # ... keep existing code for the rest of the function
    finally:
        db.close()


@celery_app.task(name='workers.celery_tasks.update_balance_history')
def update_balance_history():
    """Update balance history snapshots"""
    db = SessionLocal()
    try:
        logger.info("💰 Updating balance history...")
        # Implementation here
    finally:
        db.close()


@celery_app.task(name='workers.celery_tasks.update_position_snapshots')
def update_position_snapshots():
    """Update position snapshots"""
    db = SessionLocal()
    try:
        logger.info("📊 Updating position snapshots...")
        # Implementation here
    finally:
        db.close()
