# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    print("[STARTUP] Initializing database...")
    init_db()
    print("[STARTUP] Database initialized successfully")
    print("[STARTUP] API ready to accept connections")

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker healthcheck"""
    return {"status": "healthy", "service": "dex-trading-agent"}