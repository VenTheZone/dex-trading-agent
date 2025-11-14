# Environment Variables - Configuration Reference

## Overview

The DeX Trading Agent uses environment variables for configuration across both the **React frontend** and **Python FastAPI backend**. This document provides a complete reference for all environment variables, their purposes, default values, validation rules, and configuration methods.

**Configuration Methods:**
1. **Backend Configuration:** `.env` file in `migration_python/` directory
2. **Frontend Configuration:** `.env.local` file in project root
3. **Browser Configuration:** API keys can be set via the web UI (stored in localStorage)
4. **Docker Configuration:** Environment variables in `docker-compose.yml`

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Frontend Environment Variables](#frontend-environment-variables)
2. [Backend Environment Variables](#backend-environment-variables)
3. [API Keys Configuration](#api-keys-configuration)
4. [Docker Environment Variables](#docker-environment-variables)
5. [Environment-Specific Configurations](#environment-specific-configurations)
6. [Validation & Security](#validation--security)
7. [Configuration Examples](#configuration-examples)
8. [Troubleshooting](#troubleshooting)

---

## 1. Frontend Environment Variables

### Location
- **Development:** `.env.local` (project root)
- **Production:** Set during Docker build or in hosting environment
- **Prefix:** All frontend variables must start with `VITE_`

### Available Variables

#### VITE_PYTHON_API_URL
- **Purpose:** Python backend API base URL
- **Type:** String (URL)
- **Required:** No
- **Default:** `http://localhost:8000`
- **Example:** `http://localhost:8000`
- **Usage:** Configures the frontend to communicate with the Python FastAPI backend
- **Notes:**
  - Must be accessible from the browser
  - No trailing slash
  - Use `http://localhost:8000` for local development
  - Use `http://backend:8000` for Docker internal networking

**Example:**
```bash
VITE_PYTHON_API_URL=http://localhost:8000
```

---

#### VITE_DOCKER_DEPLOYMENT
- **Purpose:** Indicates if running in Docker environment
- **Type:** String (boolean)
- **Required:** No
- **Default:** `false`
- **Example:** `true`
- **Usage:** Enables Docker-specific features (e.g., update notifications)
- **Valid Values:** `true`, `false`

**Example:**
```bash
VITE_DOCKER_DEPLOYMENT=true
```

---

### Frontend .env.local Template

```bash
# Frontend Environment Variables
# Copy this to .env.local and configure

# Python Backend API URL
VITE_PYTHON_API_URL=http://localhost:8000

# Docker Deployment Flag (set to true if running in Docker)
VITE_DOCKER_DEPLOYMENT=false
```

---

## 2. Backend Environment Variables

### Location
- **Development:** `migration_python/.env`
- **Production:** `migration_python/.env` or system environment
- **Docker:** Set in `docker-compose.yml` or `.env` file

### Available Variables

#### Application Settings

##### ENVIRONMENT
- **Purpose:** Application environment mode
- **Type:** String
- **Required:** No
- **Default:** `development`
- **Valid Values:** `development`, `production`, `testing`
- **Usage:** Controls logging verbosity, debug mode, error handling
- **Example:** `production`

**Example:**
```bash
ENVIRONMENT=production
```

---

##### HOST
- **Purpose:** Server bind address
- **Type:** String (IP address)
- **Required:** No
- **Default:** `0.0.0.0`
- **Valid Values:** `0.0.0.0` (all interfaces), `127.0.0.1` (localhost only)
- **Usage:** Controls which network interfaces the server listens on
- **Security:** Use `127.0.0.1` for local-only access, `0.0.0.0` for Docker

**Example:**
```bash
HOST=0.0.0.0
```

---

##### PORT
- **Purpose:** Server port number
- **Type:** Integer
- **Required:** No
- **Default:** `8000`
- **Valid Range:** `1024-65535`
- **Usage:** HTTP server listening port
- **Notes:** Must match `VITE_PYTHON_API_URL` port on frontend

**Example:**
```bash
PORT=8000
```

---

#### Database Configuration

##### DATABASE_URL
- **Purpose:** Database connection string
- **Type:** String (URL)
- **Required:** No
- **Default:** `sqlite:///./dex_trading.db`
- **Format:**
  - SQLite: `sqlite:///./database_name.db`
  - PostgreSQL: `postgresql://user:password@host:port/database`
- **Usage:** Configures database connection for SQLAlchemy ORM
- **Notes:**
  - SQLite for development (file-based, no setup required)
  - PostgreSQL for production (better performance, concurrent access)

**Examples:**
```bash
# SQLite (Development)
DATABASE_URL=sqlite:///./dex_trading.db

# PostgreSQL (Production)
DATABASE_URL=postgresql://dex_user:secure_password@localhost:5432/dex_trading

# PostgreSQL (Docker)
DATABASE_URL=postgresql://dex_user:secure_password@postgres:5432/dex_trading
```

---

#### Redis Configuration

##### REDIS_URL
- **Purpose:** Redis connection string for Celery message broker
- **Type:** String (URL)
- **Required:** No
- **Default:** `redis://localhost:6379/0`
- **Format:** `redis://host:port/db_number`
- **Usage:** Celery background task queue and result backend
- **Notes:**
  - Required for auto-trading and background tasks
  - Use `redis://redis:6379/0` for Docker

**Examples:**
```bash
# Local Development
REDIS_URL=redis://localhost:6379/0

# Docker
REDIS_URL=redis://redis:6379/0

# Redis with Password
REDIS_URL=redis://:password@localhost:6379/0
```

---

#### API Keys (Optional)

##### OPENROUTER_API_KEY
- **Purpose:** OpenRouter API key for AI analysis
- **Type:** String
- **Required:** No (can be set in browser UI)
- **Format:** `sk-or-v1-...` (64+ characters)
- **Usage:** AI-powered market analysis (DeepSeek V3.1, Qwen3 Max)
- **Obtain From:** https://openrouter.ai
- **Notes:**
  - Can be configured in browser UI instead
  - Required for AI auto-trading
  - Free tier available (DeepSeek V3.1)

**Example:**
```bash
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

##### CRYPTOPANIC_AUTH_TOKEN
- **Purpose:** CryptoPanic API token for news feed
- **Type:** String
- **Required:** No
- **Default:** `free` (limited access)
- **Usage:** Cryptocurrency news aggregation
- **Obtain From:** https://cryptopanic.com/developers/api/
- **Notes:**
  - Optional feature
  - Free tier available with rate limits
  - Pro tier for unlimited access

**Example:**
```bash
CRYPTOPANIC_AUTH_TOKEN=your_cryptopanic_token_here
```

---

##### HYPERLIQUID_MASTER_ADDRESS
- **Purpose:** Hyperliquid wallet address (where funds are stored)
- **Type:** String (Ethereum address)
- **Required:** No (can be set in browser UI)
- **Format:** `0x...` (42 characters)
- **Usage:** Live trading on Hyperliquid
- **Notes:**
  - Can be configured in browser UI instead
  - Required for live trading mode
  - Not required for paper/demo trading

**Example:**
```bash
HYPERLIQUID_MASTER_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

---

##### HYPERLIQUID_AGENT_PRIVATE_KEY
- **Purpose:** Hyperliquid agent wallet private key (for trading)
- **Type:** String (hex)
- **Required:** No (can be set in browser UI)
- **Format:** `0x...` (66 characters)
- **Usage:** Sign trading transactions on Hyperliquid
- **Security:** **NEVER commit to version control**
- **Obtain From:** https://app.hyperliquid.xyz/API
- **Notes:**
  - Agent wallet can trade but CANNOT withdraw funds
  - Can be configured in browser UI instead
  - Required for live trading mode

**Example:**
```bash
HYPERLIQUID_AGENT_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

#### CORS Configuration

##### CORS_ORIGINS
- **Purpose:** Allowed frontend origins for CORS
- **Type:** String (comma-separated URLs)
- **Required:** No
- **Default:** `http://localhost:5173,http://127.0.0.1:5173`
- **Usage:** Controls which domains can access the API
- **Security:** Restrict to trusted origins only
- **Notes:**
  - Multiple origins separated by commas
  - No trailing slashes
  - Include both `localhost` and `127.0.0.1` for development

**Examples:**
```bash
# Development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Production (custom domain)
CORS_ORIGINS=https://trading.example.com

# Docker
CORS_ORIGINS=http://localhost:5173,http://frontend:5173
```

---

#### Logging Configuration

##### LOG_LEVEL
- **Purpose:** Application logging verbosity
- **Type:** String
- **Required:** No
- **Default:** `INFO`
- **Valid Values:** `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Usage:** Controls log output detail level
- **Recommendations:**
  - `DEBUG` - Development (verbose)
  - `INFO` - Production (standard)
  - `WARNING` - Production (minimal)

**Example:**
```bash
LOG_LEVEL=INFO
```

---

##### DEBUG
- **Purpose:** Enable debug mode
- **Type:** String (boolean)
- **Required:** No
- **Default:** `false`
- **Valid Values:** `true`, `false`
- **Usage:** Enables SQLAlchemy query logging and detailed error messages
- **Security:** **NEVER enable in production** (exposes sensitive data)

**Example:**
```bash
DEBUG=false
```

---

### Backend .env Template

```bash
# Python Backend Environment Variables
# Copy this to migration_python/.env and configure

# Application Settings
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

# Database Configuration
# SQLite (default for local development)
DATABASE_URL=sqlite:///./dex_trading.db

# PostgreSQL (for production)
# DATABASE_URL=postgresql://user:password@localhost:5432/dex_trading

# Redis Configuration (for Celery background tasks)
REDIS_URL=redis://localhost:6379/0

# API Keys (Optional - can be configured in browser UI)
OPENROUTER_API_KEY=
CRYPTOPANIC_AUTH_TOKEN=

# Hyperliquid API (Optional - can be configured in browser UI)
# HYPERLIQUID_MASTER_ADDRESS=
# HYPERLIQUID_AGENT_PRIVATE_KEY=

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Logging
LOG_LEVEL=INFO
DEBUG=false
```

---

## 3. API Keys Configuration

### Configuration Methods

The DeX Trading Agent supports **two methods** for API key configuration:

#### Method 1: Backend Configuration (.env file)
- **Location:** `migration_python/.env`
- **Pros:**
  - Keys loaded on server startup
  - Persistent across browser sessions
  - Suitable for permanent installations
- **Cons:**
  - Requires server restart to update
  - Keys stored on disk (ensure proper file permissions)

#### Method 2: Browser Configuration (UI)
- **Location:** Browser localStorage
- **Pros:**
  - No server restart required
  - Easy to update via Settings UI
  - Keys never leave the browser
- **Cons:**
  - Lost if browser cache cleared
  - Must reconfigure per browser/device

### API Key Priority

When both methods are configured, the system uses the following priority:

1. **Browser localStorage** (highest priority)
2. **Backend .env file** (fallback)

### Required API Keys

| API Key | Required For | Free Tier | Obtain From |
|---------|--------------|-----------|-------------|
| OpenRouter | AI analysis | ✅ Yes (DeepSeek V3.1) | https://openrouter.ai |
| Hyperliquid Master Address | Live trading | N/A | Your wallet address |
| Hyperliquid Agent Private Key | Live trading | N/A | https://app.hyperliquid.xyz/API |
| CryptoPanic | News feed | ✅ Yes (limited) | https://cryptopanic.com/developers/api/ |

### API Key Validation

#### OpenRouter API Key
- **Format:** `sk-or-v1-` followed by 64+ characters
- **Validation:** Must start with `sk-or-v1-`
- **Example:** `sk-or-v1-1234567890abcdef...`

#### Hyperliquid Master Address
- **Format:** Ethereum address (42 characters)
- **Validation:** Must start with `0x` and be 42 characters long
- **Example:** `0x1234567890abcdef1234567890abcdef12345678`

#### Hyperliquid Agent Private Key
- **Format:** Hex string (66 characters)
- **Validation:** Must start with `0x` and be 66 characters long
- **Example:** `0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`

---

## 4. Docker Environment Variables

### docker-compose.yml Configuration

Environment variables can be set in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - ENVIRONMENT=production
      - HOST=0.0.0.0
      - PORT=8000
      - DATABASE_URL=postgresql://dex_user:secure_password@postgres:5432/dex_trading
      - REDIS_URL=redis://redis:6379/0
      - CORS_ORIGINS=http://localhost:5173
      - LOG_LEVEL=INFO
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - CRYPTOPANIC_AUTH_TOKEN=${CRYPTOPANIC_AUTH_TOKEN}

  frontend:
    environment:
      - VITE_PYTHON_API_URL=http://localhost:8000
      - VITE_DOCKER_DEPLOYMENT=true
```

### Using .env File with Docker

Create a `.env` file in the project root:

```bash
# .env (for Docker Compose)
OPENROUTER_API_KEY=sk-or-v1-...
CRYPTOPANIC_AUTH_TOKEN=your_token
POSTGRES_PASSWORD=secure_password
```

Docker Compose will automatically load these variables.

---

## 5. Environment-Specific Configurations

### Development Environment

```bash
# Frontend (.env.local)
VITE_PYTHON_API_URL=http://localhost:8000
VITE_DOCKER_DEPLOYMENT=false

# Backend (migration_python/.env)
ENVIRONMENT=development
HOST=127.0.0.1
PORT=8000
DATABASE_URL=sqlite:///./dex_trading.db
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LOG_LEVEL=DEBUG
DEBUG=true
```

### Production Environment

```bash
# Frontend (.env.local)
VITE_PYTHON_API_URL=http://localhost:8000
VITE_DOCKER_DEPLOYMENT=true

# Backend (migration_python/.env)
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://dex_user:secure_password@localhost:5432/dex_trading
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
DEBUG=false
OPENROUTER_API_KEY=sk-or-v1-...
CRYPTOPANIC_AUTH_TOKEN=...
```

### Docker Environment

```bash
# Frontend (.env.local)
VITE_PYTHON_API_URL=http://localhost:8000
VITE_DOCKER_DEPLOYMENT=true

# Backend (migration_python/.env)
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://dex_user:secure_password@postgres:5432/dex_trading
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
DEBUG=false
```

---

## 6. Validation & Security

### Environment Variable Validation

The application validates environment variables on startup:

#### Backend Validation (Python)
```python
# migration_python/main.py
import os
from dotenv import load_dotenv

load_dotenv()

# Validate required variables
if os.getenv("ENVIRONMENT") not in ["development", "production", "testing"]:
    raise ValueError("Invalid ENVIRONMENT value")

if not os.getenv("DATABASE_URL"):
    raise ValueError("DATABASE_URL is required")

if not os.getenv("REDIS_URL"):
    raise ValueError("REDIS_URL is required")
```

#### Frontend Validation (TypeScript)
```typescript
// src/lib/python-api-client.ts
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

if (!API_BASE_URL.startsWith('http')) {
  throw new Error('Invalid VITE_PYTHON_API_URL format');
}
```

### Security Best Practices

#### 1. Never Commit Secrets
```bash
# .gitignore (already configured)
.env
.env.local
.env.production
migration_python/.env
```

#### 2. Use Strong Passwords
```bash
# Bad
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Good
DATABASE_URL=postgresql://user:Xk9$mP2#vL8@qR5&nT7!@localhost:5432/db
```

#### 3. Restrict File Permissions
```bash
# Set restrictive permissions on .env files
chmod 600 migration_python/.env
chmod 600 .env.local
```

#### 4. Rotate API Keys Regularly
- **OpenRouter:** Rotate every 90 days
- **Hyperliquid Agent Key:** Rotate every 30 days
- **CryptoPanic:** Rotate every 180 days

#### 5. Use Environment-Specific Keys
- **Development:** Use test API keys
- **Production:** Use production API keys
- **Never mix environments**

---

## 7. Configuration Examples

### Example 1: Local Development (No Docker)

**Frontend (.env.local):**
```bash
VITE_PYTHON_API_URL=http://localhost:8000
VITE_DOCKER_DEPLOYMENT=false
```

**Backend (migration_python/.env):**
```bash
ENVIRONMENT=development
HOST=127.0.0.1
PORT=8000
DATABASE_URL=sqlite:///./dex_trading.db
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LOG_LEVEL=DEBUG
DEBUG=true
```

**Startup:**
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd migration_python
python -m uvicorn main:app --reload --port 8000

# Terminal 3: Start Frontend
pnpm dev
```

---

### Example 2: Docker Deployment

**docker-compose.yml:**
```yaml
services:
  backend:
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://dex_user:${POSTGRES_PASSWORD}@postgres:5432/dex_trading
      - REDIS_URL=redis://redis:6379/0
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - CRYPTOPANIC_AUTH_TOKEN=${CRYPTOPANIC_AUTH_TOKEN}
```

**.env (project root):**
```bash
OPENROUTER_API_KEY=sk-or-v1-...
CRYPTOPANIC_AUTH_TOKEN=...
POSTGRES_PASSWORD=secure_password
```

**Startup:**
```bash
docker-compose up --build
```

---

### Example 3: Production with PostgreSQL

**Backend (migration_python/.env):**
```bash
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://dex_user:secure_password@localhost:5432/dex_trading
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
DEBUG=false
OPENROUTER_API_KEY=sk-or-v1-...
CRYPTOPANIC_AUTH_TOKEN=...
HYPERLIQUID_MASTER_ADDRESS=0x...
HYPERLIQUID_AGENT_PRIVATE_KEY=0x...
```

**Startup:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start Redis
sudo systemctl start redis

# Start Backend
cd migration_python
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Start Frontend
pnpm build
pnpm preview
```

---

## 8. Troubleshooting

### Common Issues

#### Issue 1: Frontend Cannot Connect to Backend

**Symptoms:**
- API requests fail with network errors
- Console shows CORS errors

**Solution:**
```bash
# Check VITE_PYTHON_API_URL
echo $VITE_PYTHON_API_URL

# Verify backend is running
curl http://localhost:8000/health

# Check CORS_ORIGINS in backend .env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

#### Issue 2: Database Connection Failed

**Symptoms:**
- Backend fails to start
- Error: "Could not connect to database"

**Solution:**
```bash
# Check DATABASE_URL format
# SQLite
DATABASE_URL=sqlite:///./dex_trading.db

# PostgreSQL (verify credentials)
DATABASE_URL=postgresql://user:password@localhost:5432/dex_trading

# Test PostgreSQL connection
psql -U user -d dex_trading -h localhost
```

---

#### Issue 3: Redis Connection Failed

**Symptoms:**
- Celery workers fail to start
- Error: "Could not connect to Redis"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Verify REDIS_URL
REDIS_URL=redis://localhost:6379/0

# Start Redis if not running
redis-server
```

---

#### Issue 4: Invalid API Key Format

**Symptoms:**
- AI analysis fails
- Error: "Invalid OpenRouter API key format"

**Solution:**
```bash
# OpenRouter key must start with sk-or-v1-
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...

# Hyperliquid address must be 42 characters
HYPERLIQUID_MASTER_ADDRESS=0x1234567890abcdef1234567890abcdef12345678

# Hyperliquid private key must be 66 characters
HYPERLIQUID_AGENT_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

#### Issue 5: Environment Variables Not Loading

**Symptoms:**
- Variables show as `undefined`
- Default values used instead

**Solution:**
```bash
# Frontend: Restart Vite dev server
pnpm dev

# Backend: Verify .env file location
ls -la migration_python/.env

# Check file permissions
chmod 600 migration_python/.env

# Verify .env is not in .gitignore
cat .gitignore | grep -v "^#" | grep ".env"
```

---

### Verification Commands

```bash
# Check all environment variables (Backend)
cd migration_python
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.environ)"

# Check frontend environment variables
echo $VITE_PYTHON_API_URL

# Test backend health
curl http://localhost:8000/health

# Test API connection
curl http://localhost:8000/api/trading-logs?limit=1
```

---

## Quick Reference

### Frontend Variables
| Variable | Default | Required |
|----------|---------|----------|
| `VITE_PYTHON_API_URL` | `http://localhost:8000` | No |
| `VITE_DOCKER_DEPLOYMENT` | `false` | No |

### Backend Variables
| Variable | Default | Required |
|----------|---------|----------|
| `ENVIRONMENT` | `development` | No |
| `HOST` | `0.0.0.0` | No |
| `PORT` | `8000` | No |
| `DATABASE_URL` | `sqlite:///./dex_trading.db` | No |
| `REDIS_URL` | `redis://localhost:6379/0` | No |
| `OPENROUTER_API_KEY` | None | No* |
| `CRYPTOPANIC_AUTH_TOKEN` | `free` | No |
| `HYPERLIQUID_MASTER_ADDRESS` | None | No* |
| `HYPERLIQUID_AGENT_PRIVATE_KEY` | None | No* |
| `CORS_ORIGINS` | `http://localhost:5173,...` | No |
| `LOG_LEVEL` | `INFO` | No |
| `DEBUG` | `false` | No |

*Required for specific features (AI trading, live trading)

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Maintained By:** VenTheZone
