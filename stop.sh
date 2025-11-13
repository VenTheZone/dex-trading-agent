#!/bin/bash

# DeX Trading Agent - Stop Script (Linux/Mac)
# This script stops all running services

echo "🛑 Stopping DeX Trading Agent services..."
echo ""

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ Frontend stopped"
    fi
    rm logs/frontend.pid
fi

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ Backend stopped"
    fi
    rm logs/backend.pid
fi

# Stop Celery worker
if [ -f "logs/celery.pid" ]; then
    CELERY_PID=$(cat logs/celery.pid)
    if ps -p $CELERY_PID > /dev/null 2>&1; then
        kill $CELERY_PID
        echo "✅ Celery worker stopped"
    fi
    rm logs/celery.pid
fi

echo ""
echo "✅ All services stopped"
