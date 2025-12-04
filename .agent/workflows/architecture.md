---
description: Complete architectural overview and operational workflow of the DeX Trading Agent system
---

# DeX Trading Agent - Complete Architecture & Operational Workflow

## System Overview

**DeX Trading Agent** is an AI-powered perpetual futures trading system for Hyperliquid with a React frontend and Python FastAPI backend. It features live, paper, and demo trading modes with sophisticated 8-layer risk management.

**Deployment:** Local-only (no cloud, no authentication required)

---

## 1. Technology Stack

### Frontend
- **React 19** + TypeScript + Vite
- **React Router v7** for routing
- **Tailwind CSS v4** + Shadcn UI components
- **Framer Motion** for animations
- **Zustand** for state management
- **TradingView** charts integration

### Backend
- **Python 3.11+** with FastAPI
- **SQLAlchemy ORM** with SQLite (local) / PostgreSQL (production)
- **Celery + Redis** for background tasks
- **Uvicorn** ASGI server
- **WebSockets** for real-time updates

### Integrations
- **Hyperliquid SDK** (@nktkas/hyperliquid) - Trading execution
- **OpenRouter API** - AI analysis (DeepSeek V3.1 free / Qwen3 Max paid)
- **Binance API** - Price data fallback
- **CryptoPanic API** - News aggregation (optional)

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│              FRONTEND (React - Port 3000)                │
│  • TradingView Charts  • Controls  • AI Thoughts Panel  │
│  • Position Monitoring • Logs      • Balance Display    │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼─────────────────────────────────────┐
│           BACKEND (FastAPI - Port 8000)                  │
│  • REST API  • WebSockets  • Background Tasks (Celery)  │
└────────────────────┬─────────────────────────────────────┘
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   Hyperliquid   OpenRouter   Binance
   (Trading)     (AI Model)   (Prices)
```

---

## 3. Complete Trading Workflow

### Step 1: User Initiates Trading
**User Action:** Enable AI auto-trading or manual trade
**Frontend:** TradingControls component → tradingStore (Zustand)
**Validation:** Check API keys, allowed coins, trading mode

### Step 2: Market Data Collection
**Sources:**
- **Binance API:** Current prices for all allowed coins
- **Hyperliquid API:** Funding rates, open interest, positions
- **TradingView:** Chart data (5-minute + 1000-range charts)

**Data Gathered:**
```javascript
{
  symbol: "BTCUSD",
  price: 95000,
  fundingRate: 0.0001,
  openInterest: 1500000000,
  chartType: "5m" | "1000-range",
  volume: 2500000
}
```

### Step 3: AI Analysis (Multi-Chart)
**Endpoint:** `POST /api/ai/analyze-multi-chart`

**Process:**
1. Frontend sends array of charts (up to 8 snapshots: 2 per coin × 4 coins)
2. Backend validates OpenRouter API key
3. Constructs comprehensive prompt with:
   - Multi-chart price data
   - Technical indicators (RSI, MACD, MA)
   - Risk parameters (leverage, balance, TP/SL)
   - Trading rules (confluence, risk/reward)
4. Calls OpenRouter API (DeepSeek V3.1 or Qwen3 Max)
5. Parses AI response

**AI Response Format:**
```json
{
  "action": "open_long" | "open_short" | "close" | "hold",
  "confidence": 75,
  "reasoning": "BTC showing bullish divergence on 5m chart...",
  "recommendedSymbol": "BTCUSD",
  "entryPrice": 95000,
  "stopLoss": 94000,
  "takeProfit": 97000,
  "positionSize": 0.1,
  "riskRewardRatio": 2.0
}
```

### Step 4: 8-Layer Risk Management Validation

**LAYER 1: Leverage Validation**
- Check asset-specific max leverage (BTC: 50x, SOL: 40x, ETH: 50x)
- Reject if requested leverage > asset maximum

**LAYER 2: Position Sizing Check**
- Calculate total notional value (existing + new positions)
- Ensure effective leverage ≤ 10x (conservative limit)
- Formula: `effectiveLeverage = totalNotional / accountBalance`

**LAYER 3: Margin Usage Validation**
- Calculate maintenance margin requirement (tiered)
- Check: `marginUsage = (maintenanceMargin / balance) * 100`
- Reject if > 90%, warn if > 80%

**LAYER 4: Liquidation Distance Assessment**
- Calculate liquidation price using Hyperliquid formula
- Determine distance to liquidation (percentage)
- Risk levels: Safe (>20%), Warning (>10%), Danger (<5%)

**LAYER 5: TP/SL Validation**
- Ensure TP is in profit direction (long: above entry, short: below)
- Ensure SL is in loss direction (long: below entry, short: above)
- Validate minimum risk/reward ratio (1.5:1 for mainnet)
- Check SL has 15-20% buffer from liquidation price

**LAYER 6: Allowed Coins Filter**
- Check if symbol is in user's allowed coins list
- Reject trade if not whitelisted

**LAYER 7: AI Confidence Threshold**
- Check AI confidence score (0-100%)
- Typically require >60% confidence for auto-trading
- Log low-confidence decisions for review

**LAYER 8: Real-Time Monitoring**
- Continuous margin usage monitoring (5s polling)
- Auto-pause trading if margin usage ≥ 80%
- Trailing stop loss activation at 50% of TP target
- Emergency position closure on critical risk

### Step 5: Trade Execution

**Live Mode:**
```javascript
// Direct Hyperliquid SDK call
await hyperliquid.placeOrder({
  coin: "BTC",
  is_buy: true,
  sz: 0.1,
  limit_px: 95000,
  order_type: { limit: { tif: "Gtc" } }
})
```

**Paper Mode:**
```javascript
// PaperTradingEngine simulation
paperEngine.placeOrder({
  symbol: "BTCUSD",
  side: "long",
  size: 0.1,
  price: 95000,
  type: "market"
})
```

**Demo Mode:**
- Mock execution with virtual $10,000 balance
- No real API calls

### Step 6: Position Monitoring (5-second polling in Live mode)

**Continuous Checks:**
1. Fetch current positions from Hyperliquid
2. Calculate unrealized P&L
3. Check margin usage (auto-pause if ≥80%)
4. Monitor liquidation distance
5. Check TP/SL triggers
6. Update trailing stop loss if enabled
7. Record position snapshot to database

**Trailing Stop Logic:**
```javascript
if (useTrailingStop && profitPercentage >= 50% of TP target) {
  // Move SL to break-even (entry price)
  updateStopLoss(entryPrice)
}
```

### Step 7: Database Persistence

**Tables Updated:**
- `trading_logs`: AI decision, reasoning, action
- `balance_history`: Account balance snapshot
- `position_snapshots`: Position P&L, liquidation distance
- `trades`: Entry/exit prices, realized P&L

### Step 8: UI Update (WebSocket/Polling)

**Real-Time Updates:**
- Balance display refresh
- Position card update (P&L, liquidation %)
- Trading log entry added
- AI thoughts panel updated
- Charts updated with current price

---

## 4. Auto-Trading Loop (60-second cycle)

**Continuous Operation When `isAutoTrading = true`:**

```
START → Validation → Market Data → AI Analysis → Risk Check → Execute → Monitor → Wait 60s → LOOP
```

**Detailed Steps:**

1. **Validation**
   - Check allowed coins list (≥1 coin required)
   - Validate AI model selection
   - Check OpenRouter API key
   - Verify margin usage < 80%

2. **Market Data Collection**
   - Fetch prices for all allowed coins (Binance)
   - Filter out failed fetches
   - Build multi-chart data array

3. **AI Analysis Request**
   - Send multi-chart data to backend
   - Include: symbol, price, chart type, leverage settings
   - Receive: action, confidence, reasoning, levels

4. **Decision Validation**
   - Check if recommended symbol is in allowed coins
   - Validate confidence threshold (>60%)
   - Verify action is not "hold"
   - Confirm position limits not exceeded

5. **Risk Assessment**
   - Calculate liquidation price
   - Check effective leverage (max 10x)
   - Validate asset-specific max leverage
   - Ensure margin usage < 80%

6. **Trade Execution**
   - Execute if all checks pass
   - Set TP/SL based on settings
   - Record trade in database

7. **Post-Trade Monitoring**
   - Update position snapshot
   - Record balance change
   - Log AI reasoning
   - Update UI

8. **Wait & Repeat**
   - Sleep 60 seconds
   - Loop back if `isAutoTrading` still true

---

## 5. Data Flow Architecture

### Trading Workflow Data Flow

```
User Action
    ↓
Frontend (React) → tradingStore (Zustand)
    ↓ HTTP Request
Backend (FastAPI) → Validate request
    ↓
Market Data Collection
    ├─ Hyperliquid (Price, Funding, Positions)
    ├─ Binance (Price Fallback)
    └─ TradingView (Charts)
    ↓
AI Analysis (OpenRouter)
    ├─ Multi-chart correlation
    ├─ Technical indicators
    ├─ Funding rate impact
    └─ Confidence scoring
    ↓
Risk Management (8 Layers)
    ├─ Leverage validation
    ├─ Position sizing
    ├─ Margin usage
    ├─ Liquidation distance
    ├─ TP/SL validation
    ├─ Allowed coins filter
    ├─ AI confidence threshold
    └─ Real-time monitoring
    ↓
Trade Execution
    ├─ Live: Hyperliquid SDK
    ├─ Paper: PaperTradingEngine
    └─ Demo: Mock execution
    ↓
Database Persistence
    ├─ trading_logs
    ├─ balance_history
    └─ position_snapshots
    ↓
UI Update (WebSocket/Polling)
    ├─ Balance display
    ├─ Position card
    ├─ Trading log
    └─ AI thoughts panel
```

### Real-Time Data Flow (WebSocket)

```
Backend (FastAPI WebSocket)
    ├─ Price Updates (every 1s)
    ├─ Position Updates (on change)
    ├─ Balance Updates (on trade)
    └─ AI Analysis (on completion)
    ↓
Frontend (React WebSocket Client)
    ├─ Update TradingView charts
    ├─ Refresh position cards
    ├─ Update balance display
    └─ Show AI thoughts panel
```

---

## 6. Security Architecture (No Authentication Model)

### Design Philosophy
**Local-only deployment for private use**

### What's Removed
- ❌ No user authentication system
- ❌ No JWT tokens
- ❌ No login/signup flows
- ❌ No session management
- ❌ No auth middleware

### What's Included
- ✅ Direct API access (localhost only)
- ✅ Browser-based API key storage (frontend)
- ✅ Environment variable API keys (backend)
- ✅ CORS restrictions (localhost:3000)
- ✅ Network-level security (firewall)

### API Key Management

**Frontend (Browser localStorage):**
- Hyperliquid: `apiSecret`, `walletAddress`
- OpenRouter: API key (`sk-or-v1-...`)
- CryptoPanic: Auth token (optional)
- **NEVER sent to backend** (frontend-only)

**Backend (.env file):**
- `OPENROUTER_API_KEY`
- `BINANCE_API_KEY` (optional)
- `CRYPTOPANIC_API_KEY` (optional)
- `HYPERLIQUID_PRIVATE_KEY` (for server-side trading)

---

## 7. Database Schema

### Tables

**users**
- `id` (primary key)
- `username`
- `created_at`

**trades**
- `id` (primary key)
- `user_id` (foreign key)
- `symbol`
- `side` (long/short)
- `entry_price`
- `exit_price`
- `size`
- `realized_pnl`
- `mode` (live/paper/demo)
- `timestamp`

**positions**
- `id` (primary key)
- `user_id` (foreign key)
- `symbol`
- `side`
- `size`
- `entry_price`
- `unrealized_pnl`
- `leverage`
- `mode`
- `timestamp`

**balance_history**
- `id` (primary key)
- `user_id` (foreign key)
- `balance`
- `mode`
- `timestamp`

**trading_logs**
- `id` (primary key)
- `user_id` (foreign key)
- `action` (open_long/open_short/close/hold)
- `symbol`
- `reason` (AI reasoning)
- `details` (JSON)
- `price`
- `size`
- `side`
- `mode`
- `timestamp`

---

## 8. Component Architecture

### Frontend Components

**Pages:**
- `/` - Landing page with features overview
- `/dashboard` - Main trading interface
- `/docs` - Documentation
- `/*` - 404 error page

**Core Components:**
- `TradingChart` - TradingView integration
- `TradingControls` - AI toggle, coin selection, leverage, TP/SL
- `ApiKeySetup` - Secure browser-based key management
- `AiThoughtsPanel` - Real-time AI analysis display
- `TradingLogs` - Historical trade log viewer
- `BalanceChart` - Account balance visualization
- `NewsFeed` - CryptoPanic news integration
- `WalletConnect` - Hyperliquid wallet connection

**State Management (Zustand):**
```javascript
tradingStore {
  mode: 'live' | 'paper' | 'demo',
  network: 'mainnet' | 'testnet',
  isAutoTrading: boolean,
  position: Position | null,
  balance: number,
  balanceHistory: BalanceEntry[],
  settings: {
    leverage: number,
    allowedCoins: string[],
    aiModel: string,
    customPrompt: string,
    takeProfitPercent: number,
    stopLossPercent: number,
    useTrailingStop: boolean
  }
}
```

### Backend Services

**API Layer (`migration_python/api/`):**
- REST endpoints for trading operations
- WebSocket endpoints for real-time updates
- CORS configuration (localhost:3000)

**Service Layer (`migration_python/services/`):**
- `TradingService` - Order execution, position management
- `AIService` - Multi-chart analysis, decision making
- `RiskService` - Liquidation monitoring, position sizing
- `MarketDataService` - Price feeds, funding rates

**Background Tasks (Celery):**
- Auto-trading loop (60s intervals)
- Balance updates (real-time)
- Position monitoring (5s intervals)
- Funding rate tracking (8-hour cycles)

---

## 9. Deployment Architecture

### Docker Compose Stack

```yaml
services:
  frontend:
    - React app (Vite build)
    - Port: 3000
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
├── src/                    # Frontend (React)
│   ├── components/         # UI components
│   ├── pages/              # Route pages
│   ├── lib/                # Utilities
│   ├── store/              # Zustand state
│   └── hooks/              # Custom hooks
│
├── migration_python/       # Backend (Python)
│   ├── api/                # FastAPI routes
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   └── main.py             # Entry point
│
├── Documentation/          # Project docs
│   ├── Architecture/       # System design
│   ├── Trading/            # Trading logic
│   └── API/                # API reference
│
└── docker-compose.yml      # Docker orchestration
```

---

## 10. Error Handling & Recovery

### Error Detection & Logging
- Console.error() with detailed context
- Toast notifications (sonner)
- Log to `trading_logs` with `action="error"`

### Recovery Strategies
- **API timeout:** Retry with exponential backoff
- **Invalid API key:** Prompt user to reconfigure
- **Insufficient balance:** Pause auto-trading
- **High margin usage:** Auto-pause + warning
- **Network failure:** Queue request for retry

### Fallback Mechanisms
- **Price fetch failure:** Use cached price or skip cycle
- **AI analysis failure:** Skip trade, log error, continue
- **Database write failure:** Retry 3x, then log to console
- **WebSocket disconnect:** Reconnect automatically

---

## 11. Performance Metrics

**Key Timings:**
- Auto-trading cycle: 60 seconds
- Position polling: 5 seconds (live mode only)
- Balance recording: Debounced 2 seconds
- AI analysis latency: 3-10 seconds (model-dependent)
- Risk validation: <100ms (synchronous checks)

**Optimization Techniques:**
- Code splitting (React.lazy)
- Memoization (React.memo, useMemo)
- Debounced API calls
- WebSocket connection pooling
- Database connection pooling
- Redis caching for market data
- Async/await for I/O operations

---

## 12. Quick Start Guide

### Option 1: Docker Deployment (Recommended)

```bash
# Clone repository
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent

# Start application
docker-compose up --build
```

**Access:**
- Frontend: http://127.0.0.1:3000
- Backend API: http://127.0.0.1:8000
- Redis: 127.0.0.1:6379

### Option 2: Local Development

**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd migration_python
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Redis + Celery:**
```bash
redis-server
celery -A migration_python.celery_app worker --loglevel=info
```

---

## 13. Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL=sqlite:///./data/trading.db

# APIs
OPENROUTER_API_KEY=sk-or-v1-...
BINANCE_API_KEY=your_binance_key
CRYPTOPANIC_API_KEY=your_cryptopanic_key

# Hyperliquid (server-side)
HYPERLIQUID_PRIVATE_KEY=0x...
HYPERLIQUID_WALLET_ADDRESS=0x...

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:3000
```

**Frontend (localStorage):**
- Managed via Settings UI
- Never committed to version control

---

## 14. Trading Modes Explained

### Live Mode
- **Real funds** on Hyperliquid Mainnet/Testnet
- Full derivatives features (funding rates, liquidation)
- Requires Hyperliquid API keys
- 5-second position polling
- Real-time margin monitoring

### Paper Mode
- **Simulated trading** with realistic execution
- Uses real market prices
- Simulates funding rate costs
- No real funds at risk
- Perfect for strategy testing

### Demo Mode
- **Practice environment** with $10,000 virtual balance
- Mock execution (no API calls)
- Instant fills
- No funding rate simulation
- Ideal for learning the interface

---

## 15. Risk Management Philosophy

**Core Principle:** Capital preservation over aggressive gains

**Key Strategies:**
1. **Liquidation Protection:** 15-20% buffer from liquidation price
2. **Position Sizing:** Max 2-5% risk per trade
3. **Leverage Control:** Effective leverage ≤ 10x
4. **Margin Monitoring:** Auto-pause at 80% usage
5. **TP/SL Enforcement:** Minimum 1.5:1 risk/reward
6. **AI Confidence:** Only trade when confidence >60%
7. **Emergency Controls:** Manual override + auto-pause
8. **Real-Time Alerts:** Liquidation warnings, margin alerts

**"When in Doubt, HOLD" Philosophy:**
- Prioritizes capital preservation
- Requires multiple indicators to align
- Avoids trading in extreme volatility
- Logs all decisions for review

---

## 16. Troubleshooting Common Issues

### Issue: AI not analyzing
**Solution:** Check OpenRouter API key in Settings

### Issue: Positions not updating
**Solution:** Verify Hyperliquid API keys, check network selection

### Issue: High margin usage warning
**Solution:** Close positions or reduce leverage

### Issue: Trades not executing
**Solution:** Check allowed coins list, verify balance sufficiency

### Issue: WebSocket disconnected
**Solution:** Automatic reconnection, refresh page if persists

---

## 17. Future Enhancements

**Planned Improvements:**
- [ ] Multi-user support (optional authentication)
- [ ] Cloud deployment configurations
- [ ] Advanced backtesting engine
- [ ] Portfolio management across multiple exchanges
- [ ] Machine learning model training pipeline
- [ ] Advanced risk analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Telegram bot integration

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Maintainer:** VenTheZone

---

## Summary

This architectural workflow provides a complete operational understanding of the DeX Trading Agent system, covering:

✅ **Technology Stack** - Frontend, backend, and integrations  
✅ **Architecture** - High-level system design  
✅ **Trading Workflow** - Complete step-by-step process  
✅ **Auto-Trading Loop** - 60-second cycle details  
✅ **Data Flow** - How data moves through the system  
✅ **Security** - No-auth model and API key management  
✅ **Database Schema** - Data persistence structure  
✅ **Components** - Frontend and backend architecture  
✅ **Deployment** - Docker and local development  
✅ **Error Handling** - Recovery strategies  
✅ **Performance** - Metrics and optimization  
✅ **Quick Start** - Getting up and running  
✅ **Risk Management** - 8-layer protection system  
✅ **Troubleshooting** - Common issues and solutions

For detailed API documentation, see the original `Documentation/` folder (archived).
