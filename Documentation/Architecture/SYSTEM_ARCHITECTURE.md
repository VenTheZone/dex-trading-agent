# System Architecture

## Overview

The DeX Trading Agent is a full-stack AI-powered trading system with a React frontend and Python FastAPI backend, designed for automated cryptocurrency perpetual futures trading on Hyperliquid.

**Deployment Model:** Local-only deployment (no cloud configurations)

**Last Updated:** November 14, 2025

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                             USER INTERFACE                                                 │
│                                           (React 19 + TypeScript)                                          │
│                                           Port: 5173 (Frontend)                                            │
└────────────────────────────┬────────────────────────────────────┘
                                                            _______│_______
                                                          │ HTTP/WebSocket |
                                                           |_______________|
                                                                   │
┌────────────────────────────▼────────────────────────────────────┐
│                                                      PYTHON BACKEND                                        │
│                                                   (FastAPI + SQLAlchemy)                                   │
│                                                     Port: 8000 (Backend)                                   │
│                ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│                │   REST API             │  │      WebSockets        │  │      Background      │        │
│                │  Endpoints             │  │      Real-time         │  │        Tasks         │        │
│                └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                                 │                                  │
        ▼                                 ▼                                  ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Hyperliquid          │    │       OpenRouter       │    │       Binance         │
│     SDK               │    │        AI API          │    │         API           │
│  (Trading)            │    │      (DeepSeek/        │    │     (Price Data)      │
│                       │    │      Qwen3 Max)        │    │                       │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Component Architecture

### 1. Frontend Layer (React + TypeScript)

**Technology Stack:**
- React 19 with TypeScript
- Vite (build tool)
- React Router v7 (routing)
- Tailwind CSS v4 + Shadcn UI (styling)
- Framer Motion (animations)
- Zustand (state management)

**Key Components:**

#### Pages
- **Landing Page** (`/`): Hero section, features, token list, risk management overview
- **Dashboard** (`/dashboard`): Main trading interface with charts, controls, and monitoring
- **Documentation** (`/docs`): Comprehensive system documentation
- **NotFound** (`/*`): 404 error page

#### Core Components
- **TradingChart**: TradingView chart integration with technical indicators
- **TradingControls**: AI toggle, coin selection, leverage, TP/SL configuration
- **ApiKeySetup**: Secure browser-based API key management
- **AiThoughtsPanel**: Real-time AI analysis display
- **TradingLogs**: Historical trade log viewer
- **BalanceChart**: Account balance visualization
- **NewsFeed**: CryptoPanic news integration
- **WalletConnect**: Hyperliquid wallet connection

#### State Management
- **tradingStore** (Zustand): Global trading state
  - Trading mode (Live/Paper/Demo)
  - Network selection (Mainnet/Testnet)
  - AI auto-trading status
  - Position tracking
  - Balance history

#### Browser Storage
- **localStorage**: API keys (never sent to backend)
- **sessionStorage**: Temporary UI state

### 2. Backend Layer (Python FastAPI)

**Technology Stack:**
- Python 3.11+
- FastAPI (REST API + WebSockets)
- SQLAlchemy ORM
- SQLite (local) / PostgreSQL (production)
- Celery + Redis (background tasks)
- Uvicorn (ASGI server)

**Architecture Pattern:** Layered architecture with separation of concerns

#### API Layer (`migration_python/api/`)
- **REST Endpoints**: Trading operations, balance queries, AI analysis
- **WebSocket Endpoints**: Real-time price updates, position monitoring
- **CORS Configuration**: Allows localhost:5173 for development

#### Service Layer (`migration_python/services/`)
- **Trading Service**: Order execution, position management
- **AI Service**: Multi-chart analysis, decision making
- **Risk Service**: Liquidation monitoring, position sizing
- **Market Data Service**: Price feeds, funding rates, open interest

#### Database Layer
**Tables:**
- `users`: User accounts (single default user for local deployment)
- `trades`: Trade history with entry/exit prices
- `positions`: Active positions with P&L tracking
- `balance_history`: Account balance snapshots
- `trading_logs`: AI analysis logs and decisions
- `api_keys`: Encrypted API key storage (backend only)

**Relationships:**
```
users (1) ──< (many) trades
users (1) ──< (many) positions
users (1) ──< (many) balance_history
users (1) ──< (many) trading_logs
```

#### Background Tasks (Celery)
- **Auto-trading loop**: Periodic AI analysis and trade execution
- **Balance updates**: Real-time balance synchronization
- **Position monitoring**: TP/SL trigger checks
- **Funding rate tracking**: 8-hour funding cost calculations

### 3. Integration Layer

#### Hyperliquid SDK Integration
**Purpose:** Direct trading on Hyperliquid perpetual futures exchange

**Features:**
- Order placement (market/limit orders)
- Position management (open/close/modify)
- Balance queries (USDC balance, margin usage)
- Funding rate retrieval
- Liquidation price calculations
- Mark price vs Index price monitoring

**Authentication:** Wallet-based (private key + wallet address)

**Networks:**
- Mainnet: Production trading with real funds
- Testnet: Risk-free testing with fake USDC

#### OpenRouter AI API Integration
**Purpose:** AI-powered market analysis

**Supported Models:**
- **DeepSeek V3.1** (Free tier): Cost-effective analysis
- **Qwen3 Max** (Paid tier): Advanced reasoning

**Analysis Workflow:**
1. Fetch 4 TradingView charts (5M, 15M, 1H, 4H)
2. Gather market data (price, volume, funding rate, open interest)
3. Send multi-chart prompt to AI model
4. Parse AI response for trading decision
5. Extract confidence score and reasoning

**Decision Types:**
- `OPEN_LONG`: Enter long position
- `OPEN_SHORT`: Enter short position
- `CLOSE`: Close existing position
- `HOLD`: No action

#### Binance API Integration
**Purpose:** Fallback price data and market information

**Use Cases:**
- Price feed redundancy
- Historical OHLCV data
- Volume analysis
- Market depth

#### CryptoPanic API Integration (Optional)
**Purpose:** Real-time cryptocurrency news aggregation

**Features:**
- Trending news feed
- Sentiment analysis
- Ticker-based filtering

## Data Flow

### Trading Workflow

```
1. User Action (Enable AI / Manual Trade)
   │
   ▼
2. Frontend → Backend API Request
   │
   ▼
3. Backend Fetches Market Data
   ├─ Hyperliquid: Price, Funding Rate, Open Interest
   ├─ Binance: Price Confirmation, Volume
   └─ TradingView: Chart Data (4 timeframes)
   │
   ▼
4. AI Analysis (OpenRouter)
   ├─ Multi-chart correlation
   ├─ Technical indicators (RSI, MACD, MA)
   ├─ Funding rate impact
   └─ Confidence scoring
   │
   ▼
5. Risk Assessment (8-Layer Framework)
   ├─ Liquidation distance check
   ├─ Position sizing calculation
   ├─ Funding rate evaluation
   ├─ TP/SL placement
   ├─ Market structure analysis
   ├─ AI confidence threshold
   ├─ Emergency controls check
   └─ Real-time monitoring
   │
   ▼
6. Trade Execution Decision
   ├─ HOLD → No action, continue monitoring
   └─ OPEN/CLOSE → Execute trade
       │
       ▼
7. Order Placement
   ├─ Live Mode: Hyperliquid SDK
   ├─ Paper Mode: Simulated execution
   └─ Demo Mode: Mock execution
   │
   ▼
8. Position Monitoring
   ├─ Real-time P&L tracking
   ├─ Liquidation distance alerts
   ├─ TP/SL trigger checks
   └─ Funding rate accumulation
   │
   ▼
9. UI Update (WebSocket)
   ├─ Balance update
   ├─ Position snapshot
   ├─ Trading log entry
   └─ AI thoughts display
```

### Real-Time Data Flow (WebSocket)

```
Backend (FastAPI WebSocket)
   │
   ├─ Price Updates (every 1s)
   ├─ Position Updates (on change)
   ├─ Balance Updates (on trade)
   └─ AI Analysis (on completion)
   │
   ▼
Frontend (React WebSocket Client)
   │
   ├─ Update TradingView charts
   ├─ Refresh position cards
   ├─ Update balance display
   └─ Show AI thoughts panel
```

## Security Architecture

### No Authentication Model

**Design Philosophy:** Local-only deployment for private use

**What's Removed:**
- ❌ No user authentication system
- ❌ No JWT tokens
- ❌ No login/signup flows
- ❌ No session management
- ❌ No auth middleware

**What's Included:**
- ✅ Direct API access (localhost only)
- ✅ Browser-based API key storage (frontend)
- ✅ Environment variable API keys (backend)
- ✅ CORS restrictions (localhost:5173)
- ✅ Network-level security (firewall)

### API Key Management

**Frontend (Browser Storage):**
- Stored in `localStorage`
- Never sent to backend
- Used for direct Hyperliquid SDK calls from browser
- User-managed via Settings UI

**Backend (.env file):**
- OpenRouter API key
- Binance API key (optional)
- CryptoPanic API key (optional)
- Hyperliquid private key (for server-side trading)

### Network Security

**Development:**
- CORS: `localhost:5173` only
- Firewall: Not required (localhost)

**Production (Docker):**
- CORS: Configurable via environment variable
- Firewall: Recommended (block external access)
- Reverse proxy: Optional (Nginx/Caddy)

## Deployment Architecture

### Docker Compose Stack

```yaml
services:
  frontend:
    - React app (Vite build)
    - Port: 5173
    - Volume: None (stateless)
  
  backend:
    - FastAPI server
    - Port: 8000
    - Volume: ./data (database persistence)
    - Depends on: redis
  
  redis:
    - Background task queue
    - Port: 6379 (internal)
    - Volume: redis_data
  
  celery-worker:
    - Background task processor
    - Depends on: redis, backend
```

### File Structure

```
dex-trading-agent/
├── src/                          # Frontend (React)
│   ├── components/               # UI components
│   ├── pages/                    # Route pages
│   ├── lib/                      # Utilities
│   ├── store/                    # Zustand state
│   └── hooks/                    # Custom hooks
│
├── migration_python/             # Backend (Python)
│   ├── api/                      # FastAPI routes
│   ├── services/                 # Business logic
│   ├── models/                   # Database models
│   └── main.py                   # Entry point
│
├── Documentation/                # Project docs
│   ├── Architecture/             # System design
│   ├── Trading/                  # Trading logic
│   └── API/                      # API reference
│
└── docker-compose.yml            # Docker orchestration
```

## Performance Considerations

### Frontend Optimization
- Code splitting (React.lazy)
- Memoization (React.memo, useMemo)
- Debounced API calls
- WebSocket connection pooling

### Backend Optimization
- Database connection pooling
- Redis caching for market data
- Async/await for I/O operations
- Background task offloading (Celery)

### Scalability
- Horizontal scaling: Multiple Celery workers
- Vertical scaling: Increase worker threads
- Database: SQLite → PostgreSQL for production

## Monitoring & Logging

### Frontend Logging
- Console logs (development)
- Error boundary (production)
- User action tracking

### Backend Logging
- FastAPI access logs
- Application logs (Python logging)
- Celery task logs
- Database query logs (SQLAlchemy)

### Metrics
- Trade execution latency
- AI analysis response time
- WebSocket connection count
- Database query performance

## Future Architecture Enhancements

### Planned Improvements
- [ ] Multi-user support (optional authentication)
- [ ] Cloud deployment configurations
- [ ] Advanced backtesting engine
- [ ] Portfolio management across multiple exchanges
- [ ] Machine learning model training pipeline
- [ ] Advanced risk analytics dashboard

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0  
**Maintainer:** DeX Trading Agent Team
