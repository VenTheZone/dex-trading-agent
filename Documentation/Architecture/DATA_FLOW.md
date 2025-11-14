# Data Flow Architecture

## Overview

This document details how data flows through the DeX Trading Agent system, from user interactions to trade execution and real-time updates. Understanding these flows is crucial for debugging, optimization, and extending the system.

---

## 1. Trading Workflow Data Flow

### Complete Trading Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER ACTION                            │
│  (Enable AI Trading / Manual Trade / Adjust Settings)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                             │
│  • TradingControls: User toggles AI, selects coins             │
│  • tradingStore (Zustand): State management                    │
│  • use-trading.ts: Trading logic hook                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────┐
│                 PYTHON BACKEND (FastAPI)                        │
│  • REST API: /api/ai/analyze-multi-chart                       │
│  • Validates request, checks API keys                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Hyperliquid  │  │   Binance    │  │  OpenRouter  │
│   (Price,    │  │  (Price      │  │  (AI Model   │
│   Funding,   │  │   Fallback)  │  │   Analysis)  │
│   Positions) │  │              │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ANALYSIS RESULT                           │
│  • Action: open_long/open_short/close/hold                     │
│  • Confidence: 0-100%                                           │
│  • Entry/Exit prices, TP/SL levels                             │
│  • Position size recommendation                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              RISK MANAGEMENT VALIDATION                         │
│  • Liquidation protection checks                               │
│  • Leverage validation (asset-specific limits)                 │
│  • Position sizing (max 10x effective leverage)                │
│  • Margin usage monitoring (80% threshold)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRADE EXECUTION                               │
│  Live Mode: Hyperliquid SDK → Real order placement             │
│  Paper Mode: PaperTradingEngine → Simulated execution          │
│  Demo Mode: Mock execution with virtual balance                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE PERSISTENCE                           │
│  • trading_logs: Record AI decision and reasoning              │
│  • balance_history: Snapshot account balance                   │
│  • position_snapshots: Track position P&L                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ WebSocket / Polling
┌─────────────────────────────────────────────────────────────────┐
│                    UI UPDATE (Frontend)                         │
│  • Balance display refresh                                     │
│  • Position card update                                        │
│  • Trading log entry added                                     │
│  • AI thoughts panel updated                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Auto-Trading Loop Data Flow

### Continuous AI Trading Cycle (60-second intervals)

```
START: isAutoTrading = true
│
├─ STEP 1: Validation
│  ├─ Check allowed coins list (must have ≥1 coin)
│  ├─ Validate AI model (DeepSeek/Qwen3 Max)
│  ├─ Check OpenRouter API key (required for Live/Paper, optional for Demo)
│  └─ Verify margin usage < 80% (auto-pause if exceeded)
│
├─ STEP 2: Market Data Collection
│  ├─ Fetch prices for all allowed coins (Binance API)
│  ├─ Filter out failed price fetches
│  └─ Build multi-chart data array
│
├─ STEP 3: AI Analysis Request
│  ├─ Send multi-chart data to backend
│  ├─ Include: symbol, price, chart type, interval, leverage settings
│  ├─ Backend calls OpenRouter API with custom prompt
│  └─ Receive: action, confidence, reasoning, entry/exit levels
│
├─ STEP 4: Decision Validation
│  ├─ Check if recommended symbol is in allowed coins
│  ├─ Validate confidence threshold (typically >60%)
│  ├─ Verify action is not "hold" (skip if hold)
│  └─ Confirm position limits not exceeded
│
├─ STEP 5: Risk Assessment
│  ├─ Calculate liquidation price (Hyperliquid tiered margin)
│  ├─ Check effective leverage (max 10x)
│  ├─ Validate asset-specific max leverage (BTC: 50x, SOL: 40x, etc.)
│  ├─ Ensure margin usage < 80%
│  └─ Calculate max safe position size
│
├─ STEP 6: Trade Execution
│  ├─ If action = "open_long" or "open_short":
│  │  ├─ Execute trade with AI-recommended parameters
│  │  ├─ Set TP/SL based on settings
│  │  └─ Record trade in database
│  ├─ If action = "close":
│  │  ├─ Close existing position
│  │  ├─ Calculate realized P&L
│  │  └─ Update balance
│  └─ If action = "hold":
│     └─ Log decision and wait for next cycle
│
├─ STEP 7: Post-Trade Monitoring
│  ├─ Update position snapshot in database
│  ├─ Record balance change
│  ├─ Log AI reasoning and decision
│  └─ Update UI via state management
│
└─ STEP 8: Wait & Repeat
   ├─ Sleep for 60 seconds
   └─ Loop back to STEP 1 (if isAutoTrading still true)
```

---

## 3. Real-Time Position Monitoring Data Flow

### Live Mode Position Polling (5-second intervals)

```
┌─────────────────────────────────────────────────────────────────┐
│                    POLLING TRIGGER (Every 5s)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FETCH HYPERLIQUID POSITIONS                        │
│  • API: getHyperliquidPositions(apiSecret, walletAddress)      │
│  • Returns: assetPositions, marginSummary                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MARGIN USAGE CHECK                             │
│  • Calculate: (totalMarginUsed / accountValue) * 100           │
│  • If ≥80%: Auto-pause trading + show liquidation warning      │
│  • If ≥60%: Show high margin usage warning                     │
│  • If <70%: Reset warning flags                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 POSITION UPDATE                                 │
│  • Extract: symbol, size, entryPrice, unrealizedPnl            │
│  • Calculate: currentPrice = entryPrice + (pnl / size)         │
│  • Update tradingStore position state                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              TRAILING STOP LOSS LOGIC                           │
│  • If useTrailingStop enabled:                                 │
│    ├─ Calculate profit percentage                              │
│    ├─ If profit ≥ 50% of TP target:                            │
│    │  └─ Move SL to break-even (entry price)                   │
│    └─ Log trailing stop update                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              RECORD POSITION SNAPSHOT                           │
│  • Save to database: symbol, side, size, entry, current, pnl   │
│  • Used for historical P&L tracking                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI UPDATE                                    │
│  • Update balance display                                      │
│  • Refresh position card (P&L, liquidation distance)           │
│  • Update charts with current price                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. API Key Management Data Flow

### Secure Key Storage & Usage

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ENTERS API KEYS                         │
│  (Settings → API Key Setup Component)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND STORAGE (localStorage)                    │
│  • Hyperliquid: apiSecret, walletAddress                       │
│  • OpenRouter: API key (sk-or-v1-...)                          │
│  • CryptoPanic: Auth token (optional)                          │
│  ⚠️ NEVER sent to backend (frontend-only)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Hyperliquid  │  │  OpenRouter  │  │ CryptoPanic  │
│   Direct     │  │   Sent to    │  │   Sent to    │
│   Browser    │  │   Backend    │  │   Backend    │
│   Calls      │  │   for AI     │  │   for News   │
└──────────────┘  └──────────────┘  └──────────────┘

USAGE FLOW:
├─ Live Trading: Hyperliquid keys used directly from browser
├─ AI Analysis: OpenRouter key sent to backend in request body
└─ News Feed: CryptoPanic token sent to backend for news fetch
```

---

## 5. Paper Trading Engine Data Flow

### Simulated Trading Execution

```
┌─────────────────────────────────────────────────────────────────┐
│                  PAPER TRADE REQUEST                            │
│  (User or AI triggers trade in Paper mode)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            PAPER TRADING ENGINE (Frontend)                      │
│  • Initialized with virtual balance (default: $10,000)         │
│  • Maintains in-memory positions map                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ORDER PLACEMENT                               │
│  • placeOrder(symbol, side, size, price, type)                 │
│  • Check virtual balance sufficiency                           │
│  • Execute immediately if market order                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 POSITION MANAGEMENT                             │
│  • Create new position or update existing                      │
│  • Calculate entry price (weighted average if adding)          │
│  • Set TP/SL levels if provided                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              REAL-TIME P&L CALCULATION                          │
│  • updateMarketPrice(symbol, currentPrice)                     │
│  • Calculate unrealized P&L:                                   │
│    - Long: (currentPrice - entryPrice) * size                  │
│    - Short: (entryPrice - currentPrice) * size                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                TP/SL TRIGGER CHECK                              │
│  • If price hits stopLoss: Auto-close position                 │
│  • If price hits takeProfit: Auto-close position               │
│  • Calculate realized P&L and update balance                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STATE PERSISTENCE                              │
│  • Update tradingStore balance                                 │
│  • Update tradingStore position                                │
│  • Record in backend database (trading_logs, balance_history)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Risk Management Data Flow

### 8-Layer Risk Protection System

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADE REQUEST INITIATED                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Leverage Validation                                  │
│  • Check asset-specific max leverage (BTC: 50x, SOL: 40x)      │
│  • Reject if requested leverage > asset max                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Position Sizing Check                                │
│  • Calculate total notional value (existing + new)             │
│  • Ensure effective leverage ≤ 10x (conservative limit)        │
│  • Calculate max safe position size if exceeded                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Margin Usage Validation                              │
│  • Calculate maintenance margin requirement (tiered)           │
│  • Check margin usage: (maintenanceMargin / balance) * 100     │
│  • Reject if margin usage > 90%                                │
│  • Warn if margin usage > 80%                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: Liquidation Distance Assessment                      │
│  • Calculate liquidation price using Hyperliquid formula       │
│  • Determine distance to liquidation (percentage)              │
│  • Risk levels: safe (>20%), warning (>10%), danger (>5%)      │
│  • Show critical warning if distance < 5%                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: TP/SL Validation                                     │
│  • Ensure TP is in profit direction (long: above, short: below)│
│  • Ensure SL is in loss direction (long: below, short: above)  │
│  • Validate minimum risk/reward ratio (1.5:1 for mainnet)     │
│  • Check TP/SL spread reasonableness                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 6: Allowed Coins Filter                                 │
│  • Check if symbol is in user's allowed coins list             │
│  • Reject trade if not in whitelist                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 7: AI Confidence Threshold                              │
│  • Check AI confidence score (0-100%)                          │
│  • Typically require >60% confidence for auto-trading          │
│  • Log low-confidence decisions for review                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 8: Real-Time Monitoring                                 │
│  • Continuous margin usage monitoring (5s polling)             │
│  • Auto-pause trading if margin usage ≥ 80%                    │
│  • Trailing stop loss activation at 50% of TP target           │
│  • Emergency position closure on critical risk                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ✅ ALL CHECKS PASSED → EXECUTE TRADE               │
│              ❌ ANY CHECK FAILED → REJECT & LOG                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. AI Analysis Data Flow

### Multi-Chart AI Decision Making

```
┌─────────────────────────────────────────────────────────────────┐
│              USER ENABLES AI AUTO-TRADING                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           FETCH MARKET DATA (All Allowed Coins)                 │
│  • Binance API: Current prices for BTC, ETH, SOL, etc.         │
│  • Hyperliquid API: Funding rates, open interest (optional)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              BUILD MULTI-CHART REQUEST                          │
│  • Array of charts: [{symbol, price, chartType, interval}]     │
│  • Include: balance, leverage, TP/SL settings                  │
│  • Attach: custom AI prompt (or default)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ POST /api/ai/analyze-multi-chart
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND AI SERVICE                             │
│  • Validate OpenRouter API key                                 │
│  • Select AI model (DeepSeek V3.1 free / Qwen3 Max paid)       │
│  • Build comprehensive prompt with market context              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              OPENROUTER API CALL                                │
│  • Model: deepseek/deepseek-chat-v3-0324:free (default)        │
│  • Prompt includes:                                            │
│    - Multi-chart price data                                    │
│    - Technical context (RSI, MACD, volume)                     │
│    - Risk parameters (leverage, balance, TP/SL)                │
│    - Trading rules (confluence, risk/reward, position sizing)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AI RESPONSE PARSING                            │
│  • Extract JSON response:                                      │
│    {                                                            │
│      "action": "open_long" | "open_short" | "close" | "hold",  │
│      "confidence": 0-100,                                       │
│      "reasoning": "Step-by-step analysis...",                  │
│      "recommendedSymbol": "BTCUSD",                            │
│      "entryPrice": 95000,                                       │
│      "stopLoss": 94000,                                         │
│      "takeProfit": 97000,                                       │
│      "positionSize": 0.1,                                       │
│      "riskRewardRatio": 2.0,                                    │
│      "marketContext": "Bullish momentum..."                    │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND RECEIVES AI DECISION                      │
│  • Update AI Thoughts Panel with reasoning                     │
│  • Display confidence score and recommended action             │
│  • Log decision to trading_logs database                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXECUTE TRADE (If not "hold")                      │
│  • Pass through 8-layer risk management                        │
│  • Execute via Hyperliquid (live) or PaperEngine (paper)       │
│  • Update UI with trade result                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Database Persistence Data Flow

### Data Storage & Retrieval

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADING EVENT OCCURS                         │
│  (Trade execution, balance change, AI analysis, etc.)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ trading_logs │  │balance_history│ │position_snapshots│
│              │  │              │  │              │
│ • action     │  │ • balance    │  │ • symbol     │
│ • symbol     │  │ • mode       │  │ • side       │
│ • reason     │  │ • timestamp  │  │ • size       │
│ • details    │  │              │  │ • entry_price│
│ • price      │  │              │  │ • current_price│
│ • size       │  │              │  │ • unrealized_pnl│
│ • side       │  │              │  │ • leverage   │
│ • mode       │  │              │  │ • mode       │
│ • timestamp  │  │              │  │ • timestamp  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PYTHON BACKEND (FastAPI)                           │
│  • SQLAlchemy ORM for database operations                      │
│  • SQLite (local) or PostgreSQL (production)                   │
│  • Automatic timestamp generation                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA RETRIEVAL                                 │
│  • GET /api/trading-logs?limit=50                              │
│  • GET /api/balance-history?limit=100                          │
│  • GET /api/position-snapshots?symbol=BTC&limit=100            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND DISPLAY                               │
│  • TradingLogs component: Show recent trades                   │
│  • BalanceChart component: Plot balance over time              │
│  • Dashboard stats: Calculate total P&L, win rate              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Error Handling & Recovery Data Flow

### Graceful Degradation

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR OCCURS                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Error   │  │ Network Error│  │ Validation   │
│              │  │              │  │   Error      │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ERROR DETECTION & LOGGING                          │
│  • Console.error() with detailed context                       │
│  • Toast notification to user (sonner)                         │
│  • Log to trading_logs with action="error"                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              RECOVERY STRATEGY                                  │
│  • API timeout: Retry with exponential backoff                 │
│  • Invalid API key: Prompt user to reconfigure                 │
│  • Insufficient balance: Pause auto-trading                    │
│  • High margin usage: Auto-pause + warning                     │
│  • Network failure: Queue request for retry                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              FALLBACK MECHANISMS                                │
│  • Price fetch failure: Use cached price or skip cycle         │
│  • AI analysis failure: Skip trade, log error, continue        │
│  • Database write failure: Retry 3x, then log to console       │
│  • WebSocket disconnect: Reconnect automatically               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER NOTIFICATION                                  │
│  • Toast: Error message with actionable guidance               │
│  • Trading Logs: Detailed error entry for debugging            │
│  • Auto-pause: If critical error (e.g., margin risk)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. State Management Data Flow

### Zustand Store (tradingStore)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                             │
│  (Change mode, adjust leverage, toggle AI, etc.)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ZUSTAND STORE UPDATE                               │
│  • setMode('paper' | 'live' | 'demo')                          │
│  • setNetwork('mainnet' | 'testnet')                           │
│  • setAutoTrading(true | false)                                │
│  • updateSettings({ leverage: 5, allowedCoins: [...] })        │
│  • setPosition(position | null)                                │
│  • setBalance(newBalance)                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PERSISTENCE (localStorage)                         │
│  • Key: 'trading-storage'                                      │
│  • Auto-saved on every state change                            │
│  • Restored on page reload                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              REACTIVE UI UPDATES                                │
│  • All components using useTradingStore() re-render            │
│  • TradingControls: Update UI controls                         │
│  • Dashboard: Refresh stats and charts                         │
│  • TradingLogs: Show mode-specific logs                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SIDE EFFECTS (useEffect hooks)                     │
│  • Auto-trading loop: Start/stop based on isAutoTrading        │
│  • Position polling: Start/stop based on mode                  │
│  • Balance recording: Debounced database write                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This data flow architecture ensures:

✅ **Separation of Concerns**: Frontend handles UI/UX, backend handles business logic  
✅ **Real-Time Updates**: WebSocket + polling for live position monitoring  
✅ **Robust Error Handling**: Graceful degradation with fallback mechanisms  
✅ **Security**: API keys stored locally, never exposed to backend unnecessarily  
✅ **Scalability**: Modular design allows easy addition of new features  
✅ **Auditability**: Comprehensive logging of all trading decisions and actions  

**Key Performance Metrics:**
- Auto-trading cycle: 60 seconds
- Position polling: 5 seconds (live mode only)
- Balance recording: Debounced 2 seconds
- AI analysis latency: 3-10 seconds (depends on model)
- Risk validation: <100ms (synchronous checks)

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Maintainer:** VenTheZone
