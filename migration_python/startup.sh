#!/bin/sh
# Startup script to clear Python bytecode cache before running the app
# This prevents import errors from stale __pycache__ files

echo "[STARTUP] Clearing Python bytecode cache..."

# Remove all __pycache__ directories
find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Remove all .pyc files
find /app -type f -name "*.pyc" -delete 2>/dev/null || true

# Remove all .pyo files
find /app -type f -name "*.pyo" -delete 2>/dev/null || true

echo "[STARTUP] Cache cleared successfully"

# Initialize database and start the application
echo "[STARTUP] Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
