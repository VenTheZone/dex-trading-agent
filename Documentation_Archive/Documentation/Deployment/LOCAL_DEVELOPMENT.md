# Local Development - Setting Up Dev Environment

## Overview

This guide provides complete instructions for setting up a local development environment for the DeX Trading Agent. It covers both frontend (React + TypeScript) and backend (Python FastAPI) setup, including all dependencies, configuration, and development workflows.

**Deployment Model:** Local development with hot reload  
**Architecture:** React frontend (port 3000) + Python backend (port 8000) + Redis (port 6379)  
**Development Tools:** Vite (frontend), Uvicorn (backend), pnpm (package manager)

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Frontend Setup (React + TypeScript)](#frontend-setup-react--typescript)
4. [Backend Setup (Python FastAPI)](#backend-setup-python-fastapi)
5. [Redis Setup](#redis-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Development Server](#running-the-development-server)
8. [Development Workflow](#development-workflow)
9. [IDE Configuration](#ide-configuration)
10. [Testing Setup](#testing-setup)
11. [Troubleshooting](#troubleshooting)
12. [Development Best Practices](#development-best-practices)

---

## 1. Prerequisites

### Required Software

#### Node.js & pnpm
```bash
# Install Node.js 18+ (LTS recommended)
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should be v18.0.0 or higher
npm --version

# Install pnpm globally
npm install -g pnpm

# Verify pnpm installation
pnpm --version  # Should be v8.0.0 or higher
```

#### Python 3.11+
```bash
# Install Python 3.11 or higher
# Download from: https://www.python.org/downloads/

# Verify installation
python --version  # Should be 3.11.0 or higher
# OR
python3 --version

# Verify pip
pip --version
# OR
pip3 --version
```

#### Git
```bash
# Install Git
# Download from: https://git-scm.com/downloads

# Verify installation
git --version
```

#### Redis
```bash
# macOS (using Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Windows (using Chocolatey)
choco install redis-64

# Verify installation
redis-cli --version
```

---

## 2. System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 2 GB free space
- **OS:** Windows 10+, macOS 10.15+, Ubuntu 20.04+

### Recommended Requirements
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 5+ GB free space (for dependencies and logs)
- **OS:** Latest stable version

### Network Requirements
- **Ports:** 3000 (frontend), 8000 (backend), 6379 (Redis) must be available
- **Internet:** Required for API calls (Hyperliquid, OpenRouter, Binance)

---

## 3. Frontend Setup (React + TypeScript)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

### Step 2: Install Dependencies

```bash
# Install frontend dependencies using pnpm
pnpm install

# This will install:
# - React 19 + React DOM
# - TypeScript 5.7.2
# - Vite 6.0.11
# - Tailwind CSS 4.1.8
# - Zustand 5.0.8
# - All UI libraries (Shadcn, Framer Motion, etc.)
```

**Installation Time:** ~2-5 minutes (depending on internet speed)

### Step 3: Verify Installation

```bash
# Check if node_modules exists
ls -la node_modules

# Verify key packages
pnpm list react
pnpm list vite
pnpm list typescript
```

### Step 4: Configure Environment Variables

Create `.env` file in the root directory:

```bash
# Frontend environment variables
VITE_PYTHON_API_URL=http://localhost:8000
```

**Note:** API keys (Hyperliquid, OpenRouter) are stored in browser localStorage, not in `.env` files.

---

## 4. Backend Setup (Python FastAPI)

### Step 1: Navigate to Backend Directory

```bash
cd migration_python
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv
# OR
python3 -m venv venv

# Activate virtual environment

# macOS/Linux
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Verify activation (should show (venv) prefix)
which python  # Should point to venv/bin/python
```

### Step 3: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# This will install:
# - FastAPI 0.104.1
# - Uvicorn 0.24.0
# - SQLAlchemy 2.0.23
# - Celery 5.3.4
# - Redis 5.0.1
# - CCXT 4.5.18
# - OpenAI 1.3.0
# - And all other dependencies
```

**Installation Time:** ~3-7 minutes

### Step 4: Verify Installation

```bash
# Check installed packages
pip list

# Verify key packages
pip show fastapi
pip show uvicorn
pip show sqlalchemy
```

### Step 5: Configure Backend Environment

Create `.env` file in `migration_python/` directory:

```bash
# Backend environment variables
DATABASE_URL=sqlite:///./trading.db
OPENROUTER_API_KEY=sk-or-v1-your-key-here
CRYPTOPANIC_AUTH_TOKEN=your-token-here
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
CORS_ORIGINS=http://localhost:3000
```

**Security Note:** Never commit `.env` files to version control. They are already in `.gitignore`.

---

## 5. Redis Setup

### Start Redis Server

#### macOS/Linux
```bash
# Start Redis in background
redis-server --daemonize yes

# Verify Redis is running
redis-cli ping
# Should return: PONG

# Check Redis status
redis-cli info server
```

#### Windows
```bash
# Start Redis server
redis-server

# In a new terminal, verify connection
redis-cli ping
# Should return: PONG
```

### Redis Configuration (Optional)

Create `redis.conf` for custom configuration:

```conf
# redis.conf
port 6379
bind 127.0.0.1
daemonize yes
logfile /var/log/redis/redis-server.log
dir /var/lib/redis
```

Start with custom config:
```bash
redis-server /path/to/redis.conf
```

---

## 6. Environment Configuration

### Frontend Environment Variables

**File:** `.env` (root directory)

```bash
# Python Backend API URL
VITE_PYTHON_API_URL=http://localhost:8000

# Optional: Enable debug mode
VITE_DEBUG=true
```

### Backend Environment Variables

**File:** `migration_python/.env`

```bash
# Database
DATABASE_URL=sqlite:///./trading.db
# For PostgreSQL (production):
# DATABASE_URL=postgresql://user:password@localhost:5432/trading_db

# API Keys
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
CRYPTOPANIC_AUTH_TOKEN=your-cryptopanic-token
BINANCE_API_KEY=your-binance-key (optional)
BINANCE_API_SECRET=your-binance-secret (optional)

# Hyperliquid Configuration
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
HYPERLIQUID_TESTNET_URL=https://api.hyperliquid-testnet.xyz

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO
# Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Obtaining API Keys

#### OpenRouter API Key (Required for AI)
1. Visit https://openrouter.ai
2. Sign up for an account
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy key (starts with `sk-or-v1-`)

#### CryptoPanic API Key (Optional for News)
1. Visit https://cryptopanic.com/developers/api/
2. Sign up for a free account
3. Generate API token
4. Copy token

#### Hyperliquid Wallet (Required for Live Trading)
1. Visit https://app.hyperliquid.xyz
2. Connect your wallet
3. Navigate to "API" section
4. Generate agent wallet private key
5. **Important:** Agent wallets can trade but CANNOT withdraw funds

---

## 7. Running the Development Server

### Option 1: Automated Start (Recommended)

The project includes automated start scripts for both platforms.

#### macOS/Linux
```bash
# From project root
./start.sh

# This will:
# 1. Start Redis server
# 2. Start Python backend (port 8000)
# 3. Start Celery worker
# 4. Start React frontend (port 3000)
```

#### Windows
```bash
# From project root
start.bat

# This will:
# 1. Start Redis server
# 2. Start Python backend (port 8000)
# 3. Start Celery worker
# 4. Start React frontend (port 5173)
```

### Option 2: Manual Start (Step-by-Step)

#### Terminal 1: Redis
```bash
redis-server
```

#### Terminal 2: Python Backend
```bash
cd migration_python
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete.
```

#### Terminal 3: Celery Worker (Background Tasks)
```bash
cd migration_python
source venv/bin/activate  # Windows: venv\Scripts\activate
celery -A celery_app worker --loglevel=info

# Expected output:
# [tasks]
#   . celery_app.auto_trading_loop
#   . celery_app.update_balance
```

#### Terminal 4: React Frontend
```bash
# From project root
pnpm dev

# Expected output:
# VITE v6.0.11  ready in 500 ms
# ➜  Local:   http://localhost:3000/
# ➜  Network: use --host to expose
```

### Verify All Services

```bash
# Check frontend
curl http://localhost:3000
# Should return HTML

# Check backend health
curl http://localhost:8000/health
# Should return: {"status":"ok"}

# Check Redis
redis-cli ping
# Should return: PONG
```

---

## 8. Development Workflow

### Hot Reload (Automatic)

Both frontend and backend support hot reload:

#### Frontend (Vite HMR)
- **File Changes:** Instant reload (<100ms)
- **Watched Files:** `src/**/*.tsx`, `src/**/*.ts`, `src/**/*.css`
- **No Restart Required:** Changes reflect immediately in browser

#### Backend (Uvicorn --reload)
- **File Changes:** Auto-restart (~1-2 seconds)
- **Watched Files:** `migration_python/**/*.py`
- **Restart Trigger:** Any `.py` file modification

### Development Commands

#### Frontend
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

#### Backend
```bash
# Start dev server with reload
python -m uvicorn main:app --reload --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=.

# Format code
black .

# Lint code
flake8 .

# Type check
mypy .
```

### Database Migrations

```bash
cd migration_python

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

---

## 9. IDE Configuration

### Visual Studio Code (Recommended)

#### Recommended Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "charliermarsh.ruff"
  ]
}
```

#### Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

#### Launch Configuration (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/migration_python",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/migration_python"
      }
    },
    {
      "name": "Frontend: Vite",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### PyCharm / IntelliJ IDEA

1. **Open Project:** File → Open → Select `dex-trading-agent` folder
2. **Configure Python Interpreter:**
   - File → Settings → Project → Python Interpreter
   - Add Interpreter → Existing Environment
   - Select `migration_python/venv/bin/python`
3. **Enable FastAPI Support:**
   - Settings → Languages & Frameworks → FastAPI
   - Enable FastAPI support
4. **Configure Run Configuration:**
   - Run → Edit Configurations
   - Add New → Python
   - Script path: `uvicorn`
   - Parameters: `main:app --reload --port 8000`
   - Working directory: `migration_python/`

---

## 10. Testing Setup

### Frontend Testing (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

**Test Files:**
- `src/lib/liquidation-protection.test.ts` (41 tests)
- `src/lib/testnet-trade-inputs.test.ts` (55 tests)
- `src/lib/trading-fees.test.ts` (21 tests)
- `src/lib/mainnet-tpsl.test.ts` (18 tests)

**Total:** 135 passing tests

### Backend Testing (pytest)

```bash
cd migration_python

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_trading.py

# Run with coverage
pytest --cov=. --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration
```

### End-to-End Testing

```bash
# Start all services
./start.sh

# In a new terminal, run E2E tests
pnpm test:e2e
```

---

## 11. Troubleshooting

### Common Issues

#### Issue 1: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
pnpm dev --port 5174
```

#### Issue 2: Python Virtual Environment Not Activated

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Activate virtual environment
cd migration_python
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows

# Verify activation
which python  # Should show venv path
```

#### Issue 3: Redis Connection Failed

**Error:**
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not running, start Redis
redis-server --daemonize yes  # macOS/Linux
redis-server  # Windows

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

#### Issue 4: Database Migration Error

**Error:**
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xyz'
```

**Solution:**
```bash
cd migration_python

# Reset database (WARNING: Deletes all data)
rm trading.db

# Recreate database
alembic upgrade head
```

#### Issue 5: CORS Error in Browser

**Error:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend .env file
cat migration_python/.env | grep CORS_ORIGINS

# Should include:
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Restart backend after changing .env
```

#### Issue 6: TypeScript Compilation Errors

**Error:**
```
TS2307: Cannot find module '@/components/ui/button'
```

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.vite

# Reinstall dependencies
pnpm install

# Restart dev server
pnpm dev
```

---

## 12. Development Best Practices

### Code Style

#### Frontend (TypeScript/React)
- **Formatting:** Prettier (automatic on save)
- **Linting:** ESLint with React rules
- **Naming:**
  - Components: PascalCase (`TradingChart.tsx`)
  - Hooks: camelCase with `use` prefix (`useTradingStore.ts`)
  - Utilities: camelCase (`calculatePnl`)
- **File Structure:**
  - One component per file
  - Co-locate tests with source files
  - Group related components in folders

#### Backend (Python)
- **Formatting:** Black (line length: 88)
- **Linting:** Flake8 + mypy
- **Naming:**
  - Functions: snake_case (`calculate_liquidation_price`)
  - Classes: PascalCase (`TradingService`)
  - Constants: UPPER_SNAKE_CASE (`MAX_LEVERAGE`)
- **Type Hints:** Always use type hints for function signatures

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: Add new trading feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

**Commit Message Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Performance Optimization

#### Frontend
- Use `React.memo` for expensive components
- Implement `useMemo` and `useCallback` for heavy computations
- Lazy load routes with `React.lazy`
- Optimize images (use WebP format)
- Minimize bundle size (check with `pnpm build --analyze`)

#### Backend
- Use async/await for I/O operations
- Implement database connection pooling
- Cache frequently accessed data in Redis
- Use background tasks (Celery) for long-running operations
- Monitor query performance with SQLAlchemy logging

### Security Checklist

- [ ] Never commit `.env` files
- [ ] Never commit API keys or secrets
- [ ] Use environment variables for sensitive data
- [ ] Validate all user inputs
- [ ] Sanitize database queries (use ORM)
- [ ] Enable CORS only for trusted origins
- [ ] Use HTTPS in production
- [ ] Implement rate limiting on API endpoints
- [ ] Keep dependencies up to date

### Debugging Tips

#### Frontend Debugging
```javascript
// Enable React DevTools
// Install: https://react.dev/learn/react-developer-tools

// Debug Zustand state
import { useTradingStore } from '@/store/tradingStore';
console.log('Trading State:', useTradingStore.getState());

// Debug API calls
// Check Network tab in browser DevTools
```

#### Backend Debugging
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Use pdb for breakpoints
import pdb; pdb.set_trace()

# Or use ipdb (better interface)
import ipdb; ipdb.set_trace()

# FastAPI debug mode
# uvicorn main:app --reload --log-level debug
```

---

## Quick Reference

### Essential Commands

```bash
# Start everything (automated)
./start.sh  # macOS/Linux
start.bat   # Windows

# Stop everything
./stop.sh   # macOS/Linux
stop.bat    # Windows

# Frontend only
pnpm dev

# Backend only
cd migration_python && python -m uvicorn main:app --reload

# Redis only
redis-server

# Run tests
pnpm test        # Frontend
pytest           # Backend

# Format code
pnpm format      # Frontend
black .          # Backend

# Build for production
pnpm build       # Frontend
```

### Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 3000 | http://localhost:3000 |
| Backend (FastAPI) | 8000 | http://localhost:8000 |
| Redis | 6379 | redis://localhost:6379 |
| API Docs (Swagger) | 8000 | http://localhost:8000/docs |

### File Structure Reference

```
dex-trading-agent/
├── src/                      # Frontend source
│   ├── components/           # React components
│   ├── pages/                # Route pages
│   ├── lib/                  # Utilities
│   ├── store/                # Zustand state
│   └── hooks/                # Custom hooks
├── migration_python/         # Backend source
│   ├── api/                  # FastAPI routes
│   ├── services/             # Business logic
│   ├── models/               # Database models
│   └── main.py               # Entry point
├── Documentation/            # Project docs
├── .env                      # Frontend env vars
├── migration_python/.env     # Backend env vars
└── package.json              # Frontend dependencies
```

---

## Support & Resources

- **GitHub Issues:** Report bugs and request features
- **Discord:** Join community for support
- **Documentation:** Full docs at `/docs` route
- **API Docs:** http://localhost:8000/docs (when backend running)

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Maintained By:** VenTheZone
