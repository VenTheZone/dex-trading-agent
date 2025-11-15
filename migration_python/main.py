from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from database import init_db

app = FastAPI(title="DeX Trading Agent API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("[STARTUP] Database initialized")

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "DeX Trading Agent API", "status": "running"}