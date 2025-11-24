@echo off
REM DeX Trading Agent - Automated Launcher Script (Windows)
REM This script automates the startup of all required services

echo ========================================
echo DeX Trading Agent - Automated Launcher
echo ========================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: No .env file found. Creating from template...
    (
        echo # OpenRouter API Key ^(Required for AI trading^)
        echo OPENROUTER_API_KEY=your_openrouter_key_here
        echo.
        echo # CryptoPanic API Key ^(Optional - for news feed^)
        echo CRYPTOPANIC_AUTH_TOKEN=your_cryptopanic_key_here
        echo.
        echo # Python Backend Configuration
        echo PYTHON_ENV=development
        echo DATABASE_URL=sqlite:///./dex_trading.db
        echo REDIS_URL=redis://localhost:6379/0
    ) > .env
    echo Created .env file. Please edit it with your API keys.
    echo Then run this script again.
    pause
    exit /b 1
)

REM Check if Redis is running
echo Checking Redis...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo WARNING: Redis is not running. Please start Redis manually.
    echo Download Redis for Windows: https://github.com/microsoftarchive/redis/releases
    pause
    exit /b 1
) else (
    echo Redis is running
)

REM Check Python virtual environment
echo.
echo Setting up Python environment...
if not exist "migration_python\venv" (
    echo Creating virtual environment...
    cd migration_python
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo Python environment created
) else (
    echo Python environment exists
)

REM Check Node.js dependencies
echo.
echo Checking Node.js dependencies...
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call pnpm install
    echo Node.js dependencies installed
) else (
    echo Node.js dependencies installed
)

REM Create logs directory
if not exist "logs" mkdir logs

REM Start all services
echo.
echo Starting all services...
echo.

REM Start Celery worker
echo Starting Celery worker...
cd migration_python
call venv\Scripts\activate.bat
start /B celery -A workers.celery_app worker --loglevel=info > ..\logs\celery.log 2>&1
cd ..
echo Celery worker started

REM Start FastAPI backend
echo Starting FastAPI backend...
cd migration_python
call venv\Scripts\activate.bat
start /B uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ..\logs\backend.log 2>&1
cd ..
echo FastAPI backend started

REM Wait for backend to be ready
echo Waiting for backend to be ready...
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend...
start /B pnpm dev > logs\frontend.log 2>&1
echo Frontend started

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Service URLs:
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo Logs:
echo    Celery:    logs\celery.log
echo    Backend:   logs\backend.log
echo    Frontend:  logs\frontend.log
echo.
echo To stop all services, run: stop.bat
echo.
pause
