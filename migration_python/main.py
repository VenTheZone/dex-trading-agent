from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Initialize FastAPI app
app = FastAPI(
    title="DeX Trading Agent API",
    description="Python FastAPI backend for AI-powered perpetual futures trading",
    version="1.0.0"
)

# CORS Configuration - Allow all origins for production compatibility
# Note: For local-only deployment, this is acceptable. For public deployment, restrict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production/Docker deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dex-trading-agent-backend"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "DeX Trading Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Import and register API routes
# Note: These will be added as the migration progresses
# from api.routes import trading, ai, hyperliquid, news
# app.include_router(trading.router, prefix="/api")
# app.include_router(ai.router, prefix="/api/ai")
# app.include_router(hyperliquid.router, prefix="/api/hyperliquid")
# app.include_router(news.router, prefix="/api/news")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
