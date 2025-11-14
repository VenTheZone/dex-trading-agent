# Python Backend API Reference

## Overview

The DeX Trading Agent uses a **Python FastAPI backend** to handle trading operations, AI analysis, market data, and real-time updates. This document provides complete API reference for all HTTP endpoints and WebSocket connections.

**Base URL:** `http://localhost:8000` (configurable via `VITE_PYTHON_API_URL`)

**API Version:** 1.0.0

**Last Updated:** November 15, 2025

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Trading Logs API](#trading-logs-api)
3. [Balance History API](#balance-history-api)
4. [Position Snapshots API](#position-snapshots-api)
5. [AI Trading Analysis API](#ai-trading-analysis-api)
6. [Hyperliquid Integration API](#hyperliquid-integration-api)
7. [Market Data API](#market-data-api)
8. [Paper Trading API](#paper-trading-api)
9. [Crypto News API](#crypto-news-api)
10. [WebSocket API](#websocket-api)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Authentication & Security

### Security Model

The API follows a **no-authentication architecture** for local deployment:

- **Network Isolation:** API only accessible on `localhost` (127.0.0.1)
- **CORS:** Restricted to frontend origin
- **API Keys:** Stored client-side, passed in request bodies (not headers)
- **No JWT/Sessions:** Direct API access for single-user operation

### Request Headers

```http
Content-Type: application/json
```

### Response Format

All endpoints return a consistent response structure:

```typescript
{
  "success": boolean,
  "data"?: any,
  "error"?: string
}
```

---

## Trading Logs API

### Get Trading Logs

Retrieve recent trading activity logs.

**Endpoint:** `GET /api/trading-logs`

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 50, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "open_long",
      "symbol": "BTCUSD",
      "reason": "AI Decision: open_long (Confidence: 85%)",
      "details": "Entry: $45000, SL: $44000, TP: $47000",
      "price": 45000.0,
      "size": 0.1,
      "side": "long",
      "mode": "paper",
      "created_at": "2025-11-14T10:30:00Z"
    }
  ]
}
```

**Example Request:**
```bash
curl http://localhost:8000/api/trading-logs?limit=100
```

---

### Create Trading Log

Record a new trading action.

**Endpoint:** `POST /api/trading-logs`

**Request Body:**
```json
{
  "action": "open_long",
  "symbol": "BTCUSD",
  "reason": "AI recommendation",
  "details": "Entry: $45000, SL: $44000, TP: $47000",
  "price": 45000.0,
  "size": 0.1,
  "side": "long",
  "mode": "paper"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "action": "open_long",
    "symbol": "BTCUSD",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

**Action Types:**
- `open_long` - Open long position
- `open_short` - Open short position
- `close_position` - Close existing position
- `ai_analysis` - AI analysis performed
- `ai_error` - AI analysis error
- `auto_pause` - Auto-trading paused
- `trailing_stop_update` - Trailing stop adjusted
- `risk_assessment` - Risk evaluation
- `trade_rejected` - Trade rejected by risk management

---

### Clear Trading Logs

Delete all trading logs (useful for testing).

**Endpoint:** `DELETE /api/trading-logs`

**Response:**
```json
{
  "success": true,
  "data": null
}
```

---

## Balance History API

### Get Balance History

Retrieve historical balance snapshots.

**Endpoint:** `GET /api/balance-history`

**Query Parameters:**
- `limit` (optional): Number of records (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "balance": 10500.50,
      "mode": "paper",
      "created_at": "2025-11-14T10:30:00Z"
    }
  ]
}
```

---

### Record Balance

Save current balance snapshot.

**Endpoint:** `POST /api/balance-history`

**Request Body:**
```json
{
  "balance": 10500.50,
  "mode": "paper"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "balance": 10500.50,
    "mode": "paper",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

**Notes:**
- Frontend debounces balance recording (2-second delay)
- Only records if balance changed by more than $0.01
- `demo` mode is converted to `paper` for backend compatibility

---

## Position Snapshots API

### Get Position History

Retrieve historical position snapshots.

**Endpoint:** `GET /api/position-snapshots`

**Query Parameters:**
- `symbol` (optional): Filter by trading pair (e.g., "BTCUSD")
- `limit` (optional): Number of records (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "BTCUSD",
      "side": "long",
      "size": 0.1,
      "entry_price": 45000.0,
      "current_price": 45500.0,
      "unrealized_pnl": 50.0,
      "leverage": 5,
      "mode": "paper",
      "created_at": "2025-11-14T10:30:00Z"
    }
  ]
}
```

---

### Record Position Snapshot

Save current position state.

**Endpoint:** `POST /api/position-snapshots`

**Request Body:**
```json
{
  "symbol": "BTCUSD",
  "side": "long",
  "size": 0.1,
  "entry_price": 45000.0,
  "current_price": 45500.0,
  "unrealized_pnl": 50.0,
  "leverage": 5,
  "mode": "paper"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "symbol": "BTCUSD",
    "created_at": "2025-11-14T10:30:00Z"
  }
}
```

---

## AI Trading Analysis API

### Single Chart Analysis

Analyze a single trading pair using AI.

**Endpoint:** `POST /api/ai/analyze`

**Request Body:**
```json
{
  "apiKey": "sk-or-v1-...",
  "symbol": "BTCUSD",
  "chartData": "Market data and technical context",
  "userBalance": 10000.0,
  "settings": {
    "takeProfitPercent": 2.0,
    "stopLossPercent": 1.0,
    "useAdvancedStrategy": false,
    "leverage": 5,
    "allowAILeverage": false
  },
  "isDemoMode": false,
  "aiModel": "deepseek/deepseek-chat-v3-0324:free",
  "customPrompt": "Optional custom AI prompt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "open_long",
    "confidence": 85,
    "reasoning": "Strong bullish momentum with RSI oversold...",
    "entryPrice": 45000.0,
    "stopLoss": 44000.0,
    "takeProfit": 47000.0,
    "positionSize": 0.1,
    "marketContext": "BTC showing strength against resistance",
    "liquidationPrice": 36000.0,
    "estimatedFundingCost": 5.0,
    "riskRewardRatio": 2.0
  }
}
```

**AI Models:**
- `deepseek/deepseek-chat-v3-0324:free` - DeepSeek V3 (free tier)
- `qwen/qwen3-max` - Qwen 3 Max (paid)

**Action Types:**
- `open_long` - Recommend opening long position
- `open_short` - Recommend opening short position
- `close` - Recommend closing position
- `hold` - No action recommended

---

### Multi-Chart Analysis

Analyze multiple trading pairs simultaneously.

**Endpoint:** `POST /api/ai/analyze-multi-chart`

**Request Body:**
```json
{
  "apiKey": "sk-or-v1-...",
  "charts": [
    {
      "symbol": "BTCUSD",
      "currentPrice": 45000.0,
      "chartType": "time",
      "chartInterval": "15",
      "technicalContext": "Price action analysis",
      "markPrice": 45010.0,
      "indexPrice": 45005.0,
      "fundingRate": 0.0001,
      "nextFundingTime": 1699999999000,
      "openInterest": 1000000.0,
      "longShortRatio": 1.2
    }
  ],
  "userBalance": 10000.0,
  "settings": {
    "takeProfitPercent": 2.0,
    "stopLossPercent": 1.0,
    "useAdvancedStrategy": false,
    "leverage": 5,
    "allowAILeverage": false
  },
  "isDemoMode": false,
  "aiModel": "deepseek/deepseek-chat-v3-0324:free",
  "customPrompt": "Optional custom AI prompt"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendedSymbol": "BTCUSD",
    "action": "open_long",
    "confidence": 85,
    "reasoning": "BTC shows strongest setup among analyzed pairs...",
    "entryPrice": 45000.0,
    "stopLoss": 44000.0,
    "takeProfit": 47000.0,
    "positionSize": 0.1,
    "marketContext": "Overall crypto market bullish",
    "liquidationPrice": 36000.0,
    "estimatedFundingCost": 5.0,
    "riskRewardRatio": 2.0
  }
}
```

**Notes:**
- AI selects best trading opportunity from multiple charts
- Filters by `allowedCoins` setting on frontend
- Returns `null` if no clear opportunity found

---

## Hyperliquid Integration API

### Test Connection

Test connectivity to Hyperliquid API.

**Endpoint:** `GET /api/hyperliquid/test-connection`

**Query Parameters:**
- `isTestnet` (optional): Use testnet (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Connected to Hyperliquid Mainnet",
  "apiEndpoint": "https://api.hyperliquid.xyz",
  "appUrl": "https://app.hyperliquid.xyz",
  "assetsCount": 50,
  "availableAssets": "BTC, ETH, SOL, DOGE, ..."
}
```

---

### Get Positions

Retrieve current open positions.

**Endpoint:** `POST /api/hyperliquid/positions`

**Request Body:**
```json
{
  "apiSecret": "0x...",
  "walletAddress": "0x...",
  "isTestnet": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assetPositions": [
      {
        "position": {
          "coin": "BTC",
          "szi": "0.1",
          "entryPx": "45000.0",
          "unrealizedPnl": "50.0",
          "liquidationPx": "36000.0"
        }
      }
    ],
    "marginSummary": {
      "accountValue": "10500.0",
      "totalMarginUsed": "900.0",
      "totalNtlPos": "4500.0"
    }
  }
}
```

---

### Get Order Book

Retrieve order book for a trading pair.

**Endpoint:** `GET /api/hyperliquid/orderbook`

**Query Parameters:**
- `coin`: Trading pair (e.g., "BTC")
- `isTestnet` (optional): Use testnet (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "coin": "BTC",
    "levels": [
      [
        { "px": "45000.0", "sz": "1.5", "n": 3 }
      ],
      [
        { "px": "44990.0", "sz": "2.0", "n": 5 }
      ]
    ],
    "time": 1699999999000
  }
}
```

---

### Get Account Info

Retrieve account information and margin details.

**Endpoint:** `POST /api/hyperliquid/account-info`

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "isTestnet": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "marginSummary": {
      "accountValue": "10500.0",
      "totalMarginUsed": "900.0",
      "totalNtlPos": "4500.0",
      "totalRawUsd": "10000.0"
    },
    "crossMarginSummary": {
      "accountValue": "10500.0",
      "totalMarginUsed": "900.0"
    }
  }
}
```

---

### Execute Live Trade

Execute a trade on Hyperliquid.

**Endpoint:** `POST /api/hyperliquid/execute-trade`

**Request Body:**
```json
{
  "apiSecret": "0x...",
  "symbol": "BTC",
  "side": "buy",
  "size": 0.1,
  "price": 45000.0,
  "stopLoss": 44000.0,
  "takeProfit": 47000.0,
  "leverage": 5,
  "isTestnet": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "response": {
      "type": "order",
      "data": {
        "statuses": [
          {
            "filled": {
              "totalSz": "0.1",
              "avgPx": "45000.0",
              "oid": 123456
            }
          }
        ]
      }
    }
  }
}
```

**Side Values:**
- `buy` - Open long or close short
- `sell` - Open short or close long

---

## Market Data API

### Fetch Price

Get current market price for a symbol.

**Endpoint:** `GET /api/market/price`

**Query Parameters:**
- `symbol`: Trading pair (e.g., "BTCUSD")
- `isTestnet` (optional): Use testnet (default: false)

**Response:**
```json
{
  "success": true,
  "data": {
    "price": 45000.0
  }
}
```

**Notes:**
- Uses Binance API as price oracle
- Falls back to Hyperliquid if Binance unavailable
- Caches prices for 5 seconds to reduce API calls

---

## Paper Trading API

### Execute Paper Trade

Simulate a trade in paper trading mode.

**Endpoint:** `POST /api/paper-trading/execute`

**Request Body:**
```json
{
  "symbol": "BTCUSD",
  "side": "buy",
  "size": 0.1,
  "price": 45000.0,
  "type": "market",
  "stopLoss": 44000.0,
  "takeProfit": 47000.0,
  "leverage": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_1699999999_abc123",
    "status": "filled",
    "filled": 0.1,
    "avgPrice": 45000.0
  }
}
```

---

### Get Paper Positions

Retrieve current paper trading positions.

**Endpoint:** `GET /api/paper-trading/positions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSD",
      "side": "long",
      "size": 0.1,
      "entryPrice": 45000.0,
      "currentPrice": 45500.0,
      "unrealizedPnl": 50.0,
      "realizedPnl": 0.0,
      "stopLoss": 44000.0,
      "takeProfit": 47000.0
    }
  ]
}
```

---

### Close Paper Position

Close a paper trading position.

**Endpoint:** `POST /api/paper-trading/close-position`

**Request Body:**
```json
{
  "symbol": "BTCUSD",
  "price": 45500.0,
  "reason": "Take profit hit"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "pnl": 50.0,
    "reason": "Take profit hit"
  }
}
```

---

## Crypto News API

### Fetch Crypto News

Retrieve cryptocurrency news from CryptoPanic.

**Endpoint:** `POST /api/news/crypto`

**Request Body:**
```json
{
  "filter": "rising",
  "currencies": ["BTC", "ETH", "SOL"],
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 20,
    "results": [
      {
        "id": 123456,
        "title": "Bitcoin breaks $45,000 resistance",
        "url": "https://...",
        "source": {
          "title": "CoinDesk",
          "domain": "coindesk.com"
        },
        "published_at": "2025-11-14T10:30:00Z",
        "currencies": [
          { "code": "BTC", "title": "Bitcoin" }
        ],
        "votes": {
          "positive": 150,
          "negative": 10,
          "important": 50
        }
      }
    ]
  }
}
```

**Filter Options:**
- `rising` - Trending news
- `hot` - Most voted
- `bullish` - Positive sentiment
- `bearish` - Negative sentiment
- `important` - High impact
- `saved` - Bookmarked (requires auth)
- `lol` - Humorous content

---

## WebSocket API

### Connection

Establish WebSocket connection for real-time updates.

**Endpoint:** `ws://localhost:8000/ws`

**Connection Example:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

---

### Message Types

#### Price Update
```json
{
  "type": "price_update",
  "symbol": "BTCUSD",
  "price": 45000.0,
  "timestamp": 1699999999000
}
```

#### Position Update
```json
{
  "type": "position_update",
  "symbol": "BTCUSD",
  "side": "long",
  "size": 0.1,
  "unrealizedPnl": 50.0,
  "timestamp": 1699999999000
}
```

#### Balance Update
```json
{
  "type": "balance_update",
  "balance": 10500.0,
  "mode": "paper",
  "timestamp": 1699999999000
}
```

#### Trade Execution
```json
{
  "type": "trade_executed",
  "symbol": "BTCUSD",
  "action": "open_long",
  "price": 45000.0,
  "size": 0.1,
  "timestamp": 1699999999000
}
```

#### System Alert
```json
{
  "type": "system_alert",
  "level": "warning",
  "message": "High margin usage: 75%",
  "timestamp": 1699999999000
}
```

---

### Heartbeat

WebSocket sends heartbeat every 30 seconds:

```json
{
  "type": "heartbeat",
  "timestamp": 1699999999000
}
```

Client should respond with:
```json
{
  "type": "pong",
  "timestamp": 1699999999000
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - API key invalid or missing
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

### Common Error Messages

| Error | Description | Solution |
|-------|-------------|----------|
| `OpenRouter API key required` | Missing or invalid API key | Add valid OpenRouter key in Settings |
| `Invalid OpenRouter API key format` | Key doesn't start with `sk-or-v1-` | Check API key format |
| `Hyperliquid API keys not configured` | Missing Hyperliquid credentials | Configure API keys in Settings |
| `Failed to fetch price for {symbol}` | Price data unavailable | Check symbol format or try again |
| `Insufficient margin` | Not enough balance for trade | Reduce position size or add funds |
| `Excessive leverage` | Leverage exceeds safe limits | Reduce leverage setting |
| `Position size too large` | Trade size exceeds risk limits | Reduce position size |
| `AI analysis failed` | AI service error | Check API key and try again |

---

## Rate Limiting

### Limits

- **Trading Logs:** 100 requests/minute
- **AI Analysis:** 10 requests/minute (free tier), 60 requests/minute (paid)
- **Market Data:** 60 requests/minute
- **Hyperliquid API:** 20 requests/minute
- **WebSocket:** 1 connection per client

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 30 seconds.",
  "retryAfter": 30
}
```

---

## Performance Metrics

### Response Times (Target)

- **Trading Logs:** < 50ms
- **Balance/Position History:** < 100ms
- **AI Analysis (Single):** 2-5 seconds
- **AI Analysis (Multi):** 5-10 seconds
- **Hyperliquid API:** 200-500ms
- **Market Data:** < 200ms
- **Paper Trading:** < 50ms
- **WebSocket Latency:** < 100ms

### Optimization Tips

1. **Batch Requests:** Use multi-chart analysis instead of multiple single-chart calls
2. **Cache Prices:** Frontend caches prices for 5 seconds
3. **Debounce Balance:** Balance recording debounced by 2 seconds
4. **WebSocket:** Use WebSocket for real-time updates instead of polling
5. **Limit Queries:** Use `limit` parameter to reduce data transfer

---

## Development & Testing

### Local Development

```bash
# Start backend server
cd migration_python
python -m uvicorn main:app --reload --port 8000

# Test endpoint
curl http://localhost:8000/health
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Get trading logs
curl http://localhost:8000/api/trading-logs?limit=10

# Test Hyperliquid connection
curl "http://localhost:8000/api/hyperliquid/test-connection?isTestnet=true"

# Fetch price
curl "http://localhost:8000/api/market/price?symbol=BTCUSD&isTestnet=false"
```

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=sqlite:///./trading.db
OPENROUTER_API_KEY=sk-or-v1-...
CRYPTOPANIC_AUTH_TOKEN=...
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
CORS_ORIGINS=http://localhost:5173

# Frontend (.env)
VITE_PYTHON_API_URL=http://localhost:8000
```

---

## Migration Notes

### From Convex to FastAPI

The API maintains compatibility with the previous Convex backend:

- **Trading Logs:** `convex.tradingLogs.*` → `/api/trading-logs`
- **Balance History:** `convex.balanceHistory.*` → `/api/balance-history`
- **Position Snapshots:** `convex.positionSnapshots.*` → `/api/position-snapshots`
- **AI Analysis:** `convex.ai.analyze` → `/api/ai/analyze`

### Breaking Changes

1. **Mode Conversion:** `demo` mode converted to `paper` on backend
2. **Response Format:** All responses wrapped in `{ success, data, error }`
3. **WebSocket URL:** Changed from Convex realtime to `/ws` endpoint
4. **API Keys:** Now passed in request body instead of Convex auth

---

## Support & Resources

- **GitHub Issues:** Report bugs and request features
- **Discord:** Join community for support
- **Documentation:** Full docs at `/docs` route
- **API Status:** Check `/health` endpoint

---

**Last Updated:** November 15, 2025  
**API Version:** 1.0.0  
**Maintained By:** VenTheZone