#!/bin/bash

# DeX Trading Agent - Automated Launcher Script (Linux/Mac)
# This script automates the startup of all required services

set -e

echo "🚀 DeX Trading Agent - Automated Launcher"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << 'EOF'
# OpenRouter API Key (Required for AI trading)
OPENROUTER_API_KEY=your_openrouter_key_here

# CryptoPanic API Key (Optional - for news feed)
CRYPTOPANIC_AUTH_TOKEN=your_cryptopanic_key_here

# Python Backend Configuration
PYTHON_ENV=development
DATABASE_URL=sqlite:///./dex_trading.db
REDIS_URL=redis://localhost:6379/0
EOF
    echo "✅ Created .env file. Please edit it with your API keys."
    echo "   Then run this script again."
    exit 1
fi

# Check if Redis is running
echo "🔍 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."
    if command -v redis-server > /dev/null 2>&1; then
        redis-server --daemonize yes
        sleep 2
        echo "✅ Redis started"
    else
        echo "❌ Redis not installed. Please install Redis:"
        echo "   - Ubuntu/Debian: sudo apt-get install redis-server"
        echo "   - macOS: brew install redis"
        exit 1
    fi
else
    echo "✅ Redis is running"
fi

# Check Python virtual environment
echo ""
echo "🐍 Setting up Python environment..."
if [ ! -d "migration_python/venv" ]; then
    echo "Creating virtual environment..."
    cd migration_python
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo "✅ Python environment created"
else
    echo "✅ Python environment exists"
fi

# Check Node.js dependencies
echo ""
echo "📦 Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    pnpm install
    echo "✅ Node.js dependencies installed"
else
    echo "✅ Node.js dependencies installed"
fi

# Start all services
echo ""
echo "🚀 Starting all services..."
echo ""

# Start Celery worker in background
echo "Starting Celery worker..."
cd migration_python
source venv/bin/activate
celery -A workers.celery_app worker --loglevel=info > ../logs/celery.log 2>&1 &
CELERY_PID=$!
cd ..
echo "✅ Celery worker started (PID: $CELERY_PID)"

# Start FastAPI backend in background
echo "Starting FastAPI backend..."
cd migration_python
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "✅ FastAPI backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 3

# Start frontend
echo "Starting frontend..."
pnpm dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Create logs directory if it doesn't exist
mkdir -p logs

# Save PIDs for cleanup
echo "$CELERY_PID" > logs/celery.pid
echo "$BACKEND_PID" > logs/backend.pid
echo "$FRONTEND_PID" > logs/frontend.pid

echo ""
echo "=========================================="
echo "✅ All services started successfully!"
echo "=========================================="
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Celery:    logs/celery.log"
echo "   Backend:   logs/backend.log"
echo "   Frontend:  logs/frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo ""
