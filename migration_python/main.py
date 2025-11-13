# ... keep existing code (imports and setup)

# ============================================================================
# Include API Routes
# ============================================================================

from api.routes import router as api_router
app.include_router(api_router)

# ============================================================================
# Error Handlers
# ============================================================================

# ... keep existing code (error handlers)

# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("🚀 DeX Trading Agent backend starting...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Host: {os.getenv('HOST', '127.0.0.1')}:{os.getenv('PORT', '8000')}")
    
    # Initialize database
    from database import init_db
    logger.info("📊 Initializing database...")
    init_db()
    logger.info("✅ Database initialized!")
    
    logger.info("✅ Backend ready!")

# ... keep existing code (shutdown event and run application)
