# Frontend API Client - TypeScript Usage Guide

## Overview

The DeX Trading Agent frontend uses a **TypeScript API client** (`python-api-client.ts`) to communicate with the Python FastAPI backend. This document provides complete usage patterns, React hooks, error handling, and integration examples.

**Client Location:** `src/lib/python-api-client.ts`

**Base URL:** Configured via `VITE_PYTHON_API_URL` environment variable (default: `http://localhost:8000`)

**Last Updated:** November 14, 2025

---

## Table of Contents

1. [Core API Client](#core-api-client)
2. [React Hooks](#react-hooks)
3. [Trading Operations](#trading-operations)
4. [AI Analysis Integration](#ai-analysis-integration)
5. [Real-Time Updates](#real-time-updates)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

---

## 1. Core API Client

### PythonApiClient Class

The main client class provides methods for all backend operations.

**Import:**
```typescript
import { pythonApi } from '@/lib/python-api-client';
```

**Configuration:**
```typescript
// Default configuration (reads from environment)
const client = new PythonApiClient();

// Custom base URL
const client = new PythonApiClient('http://custom-api:8000');
```

**Response Format:**
All API methods return a consistent response structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 2. React Hooks

### useTradingLogs Hook

Fetches and auto-refreshes trading logs every 5 seconds.

**Import:**
```typescript
import { useTradingLogs } from '@/hooks/use-python-api';
```

**Usage:**
```typescript
function TradingLogsComponent() {
  const { logs, loading, error, refetch, clearLogs } = useTradingLogs(50);

  if (loading) return <div>Loading logs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <button onClick={clearLogs}>Clear All</button>
      {logs.map(log => (
        <div key={log.id}>
          {log.action} - {log.symbol} - {log.reason}
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `limit` (number, default: 50) - Maximum number of logs to fetch

**Returns:**
- `logs` (TradingLog[]) - Array of trading log entries
- `loading` (boolean) - Loading state
- `error` (string | null) - Error message if request failed
- `refetch` (function) - Manually trigger data refresh
- `clearLogs` (async function) - Clear all logs from database

**Auto-Refresh:** Polls every 5 seconds automatically

---

### useBalanceHistory Hook

Fetches account balance history with auto-refresh every 10 seconds.

**Import:**
```typescript
import { useBalanceHistory } from '@/hooks/use-python-api';
```

**Usage:**
```typescript
function BalanceChartComponent() {
  const { history, loading, error, refetch } = useBalanceHistory(100);

  if (loading) return <div>Loading balance history...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LineChart data={history.map(h => ({
      timestamp: h.created_at,
      balance: h.balance,
      mode: h.mode
    }))} />
  );
}
```

**Parameters:**
- `limit` (number, default: 100) - Maximum number of history entries

**Returns:**
- `history` (BalanceHistory[]) - Array of balance snapshots
- `loading` (boolean) - Loading state
- `error` (string | null) - Error message
- `refetch` (function) - Manual refresh trigger

**Auto-Refresh:** Polls every 10 seconds

---

### usePositionHistory Hook

Fetches position snapshots with optional symbol filtering.

**Import:**
```typescript
import { usePositionHistory } from '@/hooks/use-python-api';
```

**Usage:**
```typescript
function PositionHistoryComponent() {
  const { history, loading, error, refetch } = usePositionHistory('BTCUSD', 100);

  return (
    <div>
      {history.map(pos => (
        <div key={pos.id}>
          {pos.symbol} {pos.side} - P&L: ${pos.unrealized_pnl.toFixed(2)}
        </div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `symbol` (string, optional) - Filter by specific trading pair
- `limit` (number, default: 100) - Maximum entries to fetch

**Returns:**
- `history` (PositionSnapshot[]) - Array of position snapshots
- `loading` (boolean) - Loading state
- `error` (string | null) - Error message
- `refetch` (function) - Manual refresh

**Auto-Refresh:** Polls every 10 seconds

---

### useWebSocket Hook

Establishes WebSocket connection for real-time updates.

**Import:**
```typescript
import { useWebSocket } from '@/hooks/use-python-api';
```

**Usage:**
```typescript
function RealTimeUpdates() {
  const { connected, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket message:', lastMessage);
      
      // Handle different message types
      switch (lastMessage.type) {
        case 'price_update':
          updatePrice(lastMessage.data);
          break;
        case 'position_update':
          updatePosition(lastMessage.data);
          break;
        case 'balance_update':
          updateBalance(lastMessage.data);
          break;
      }
    }
  }, [lastMessage]);

  return (
    <div>
      Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

**Returns:**
- `connected` (boolean) - WebSocket connection status
- `lastMessage` (any) - Most recent WebSocket message

**Message Types:**
- `price_update` - Real-time price changes
- `position_update` - Position changes (open/close/modify)
- `balance_update` - Account balance updates
- `alert` - Trading alerts and notifications

---

## 3. Trading Operations

### Recording Trading Logs

**Method:** `pythonApi.createTradingLog(log)`

**Usage:**
```typescript
await pythonApi.createTradingLog({
  action: 'open_long',
  symbol: 'BTCUSD',
  side: 'long',
  price: 45000,
  size: 0.1,
  reason: 'AI recommendation - bullish breakout',
  details: 'SL: 44000, TP: 47000, Leverage: 5x',
});
```

**Parameters:**
```typescript
{
  action: string;           // 'open_long', 'open_short', 'close', 'ai_analysis', etc.
  symbol: string;           // Trading pair (e.g., 'BTCUSD')
  reason: string;           // Human-readable reason
  details?: string;         // Additional context
  price?: number;           // Execution price
  size?: number;            // Position size
  side?: 'long' | 'short';  // Position direction
  mode?: 'paper' | 'live' | 'demo'; // Trading mode
}
```

---

### Recording Balance Changes

**Method:** `pythonApi.recordBalance(balance, mode)`

**Usage:**
```typescript
// Record balance update
await pythonApi.recordBalance(10500.50, 'paper');

// In trading hook (automatic debouncing)
useEffect(() => {
  const timeout = setTimeout(() => {
    pythonApi.recordBalance(balance, mode);
  }, 2000); // 2-second debounce
  
  return () => clearTimeout(timeout);
}, [balance, mode]);
```

**Parameters:**
- `balance` (number) - Current account balance
- `mode` ('paper' | 'live' | 'demo') - Trading mode

**Note:** Balance recording is automatically debounced in `use-trading.ts` to prevent excessive database writes.

---

### Recording Position Snapshots

**Method:** `pythonApi.recordPositionSnapshot(snapshot)`

**Usage:**
```typescript
await pythonApi.recordPositionSnapshot({
  symbol: 'ETHUSD',
  side: 'long',
  size: 2.5,
  entry_price: 2500,
  current_price: 2550,
  unrealized_pnl: 125,
  leverage: 10,
  mode: 'live',
});
```

**Parameters:**
```typescript
{
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  leverage: number;
  mode: 'paper' | 'live' | 'demo';
}
```

---

### Executing Live Trades

**Method:** `pythonApi.executeLiveTrade(trade)`

**Usage:**
```typescript
const result = await pythonApi.executeLiveTrade({
  apiSecret: keys.hyperliquid.apiSecret,
  symbol: 'SOLUSD',
  side: 'buy',
  size: 10,
  price: 100.50,
  stopLoss: 95,
  takeProfit: 110,
  leverage: 5,
  isTestnet: false,
});

if (result.success) {
  toast.success('Trade executed successfully!');
} else {
  toast.error(`Trade failed: ${result.error}`);
}
```

**Parameters:**
```typescript
{
  apiSecret: string;      // Hyperliquid API secret
  symbol: string;         // Trading pair
  side: 'buy' | 'sell';   // Order side
  size: number;           // Position size
  price: number;          // Entry price
  stopLoss?: number;      // Stop loss price
  takeProfit?: number;    // Take profit price
  leverage: number;       // Leverage multiplier
  isTestnet: boolean;     // Use testnet or mainnet
}
```

---

### Fetching Market Prices

**Method:** `pythonApi.fetchPrice(symbol, isTestnet)`

**Usage:**
```typescript
try {
  const price = await pythonApi.fetchPrice('BTCUSD', false);
  console.log(`BTC Price: $${price.toLocaleString()}`);
} catch (error) {
  console.error('Failed to fetch price:', error);
}
```

**Parameters:**
- `symbol` (string) - Trading pair (e.g., 'BTCUSD', 'ETHUSD')
- `isTestnet` (boolean, default: false) - Use testnet or mainnet

**Returns:** `Promise<number>` - Current market price

**Data Source:** Binance API (fallback to Hyperliquid if unavailable)

---

## 4. AI Analysis Integration

### Single Chart Analysis

**Method:** `pythonApi.analyzeMarket(request)`

**Usage:**
```typescript
const analysis = await pythonApi.analyzeMarket({
  apiKey: openRouterKey,
  symbol: 'BTCUSD',
  chartData: `
    Symbol: BTCUSD
    Current Price: 45000
    Chart Type: Time-based
    Timeframe: 15m
  `,
  userBalance: 10000,
  settings: {
    takeProfitPercent: 2,
    stopLossPercent: 1,
    useAdvancedStrategy: true,
    leverage: 5,
    allowAILeverage: false,
  },
  isDemoMode: false,
  aiModel: 'deepseek/deepseek-chat-v3-0324:free',
  customPrompt: 'Focus on momentum indicators...',
});

console.log('AI Recommendation:', analysis.action);
console.log('Confidence:', analysis.confidence);
console.log('Reasoning:', analysis.reasoning);
```

**Request Parameters:**
```typescript
interface AIAnalysisRequest {
  apiKey: string;                    // OpenRouter API key
  symbol?: string;                   // Trading pair
  chartData?: string;                // Market context
  userBalance: number;               // Account balance
  settings: {
    takeProfitPercent: number;
    stopLossPercent: number;
    useAdvancedStrategy: boolean;
    leverage?: number;
    allowAILeverage?: boolean;
  };
  isDemoMode?: boolean;              // Demo mode flag
  aiModel?: string;                  // AI model selection
  customPrompt?: string;             // Custom analysis prompt
}
```

**Response:**
```typescript
interface AIAnalysisResponse {
  recommendedSymbol?: string;
  action: 'open_long' | 'open_short' | 'close' | 'hold';
  confidence: number;                // 0-100
  reasoning: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  marketContext?: string;
  liquidationPrice?: number;
  estimatedFundingCost?: number;
  riskRewardRatio?: number;
}
```

---

### Multi-Chart Analysis

**Method:** `pythonApi.analyzeMultiChart(request)`

**Usage:**
```typescript
const charts = [
  { symbol: 'BTCUSD', currentPrice: 45000 },
  { symbol: 'ETHUSD', currentPrice: 2500 },
  { symbol: 'SOLUSD', currentPrice: 100 },
];

const analysis = await pythonApi.analyzeMultiChart({
  apiKey: openRouterKey,
  charts: charts.map(chart => ({
    symbol: chart.symbol,
    currentPrice: chart.currentPrice,
    chartType: 'time',
    chartInterval: '15',
    technicalContext: `Price: ${chart.currentPrice}`,
  })),
  userBalance: 10000,
  settings: {
    takeProfitPercent: 2,
    stopLossPercent: 1,
    useAdvancedStrategy: true,
    leverage: 5,
    allowAILeverage: true,
  },
  isDemoMode: false,
  aiModel: 'qwen/qwen3-max',
});

// AI will recommend the best trading opportunity
console.log('Best Symbol:', analysis.recommendedSymbol);
console.log('Action:', analysis.action);
```

**Key Difference:** Multi-chart analysis compares multiple assets and recommends the best trading opportunity based on technical analysis across all charts.

---

## 5. Real-Time Updates

### WebSocket Connection

**Method:** `pythonApi.connectWebSocket(onMessage, onError)`

**Usage:**
```typescript
const ws = pythonApi.connectWebSocket(
  (data) => {
    console.log('WebSocket message:', data);
    
    // Update UI based on message type
    if (data.type === 'price_update') {
      updatePriceDisplay(data.symbol, data.price);
    }
  },
  (error) => {
    console.error('WebSocket error:', error);
    toast.error('Real-time connection lost');
  }
);

// Cleanup on component unmount
return () => {
  ws.close();
};
```

**Message Format:**
```typescript
{
  type: 'price_update' | 'position_update' | 'balance_update' | 'alert';
  timestamp: number;
  data: any;
}
```

---

## 6. Error Handling

### Standard Error Pattern

All API methods follow this error handling pattern:

```typescript
try {
  const result = await pythonApi.someMethod(params);
  
  if (!result.success) {
    // Handle API-level error
    toast.error(`Operation failed: ${result.error}`);
    return;
  }
  
  // Success - use result.data
  console.log('Success:', result.data);
} catch (error) {
  // Handle network/unexpected errors
  console.error('Unexpected error:', error);
  toast.error('Network error - please try again');
}
```

### Error Types

**1. Network Errors:**
```typescript
// Connection refused, timeout, etc.
{ success: false, error: 'Network request failed' }
```

**2. API Errors:**
```typescript
// Backend validation errors
{ success: false, error: 'Invalid API key format' }
```

**3. Validation Errors:**
```typescript
// Client-side validation
if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
  throw new Error('Invalid OpenRouter API key format');
}
```

---

## 7. Type Definitions

### Core Types

```typescript
// Trading Log
interface TradingLog {
  id: number;
  action: string;
  symbol: string;
  reason: string;
  details?: string;
  price?: number;
  size?: number;
  side?: 'long' | 'short';
  mode?: 'paper' | 'live' | 'demo';
  created_at: string;
}

// Balance History
interface BalanceHistory {
  id: number;
  balance: number;
  mode: 'paper' | 'live';
  created_at: string;
}

// Position Snapshot
interface PositionSnapshot {
  id: number;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  leverage: number;
  mode: 'paper' | 'live';
  created_at: string;
}
```

---

## 8. Usage Examples

### Complete Trading Flow

```typescript
import { pythonApi } from '@/lib/python-api-client';
import { toast } from 'sonner';

async function executeAITrade() {
  try {
    // 1. Fetch current price
    const price = await pythonApi.fetchPrice('BTCUSD', false);
    
    // 2. Run AI analysis
    const analysis = await pythonApi.analyzeMarket({
      apiKey: openRouterKey,
      symbol: 'BTCUSD',
      chartData: `Current Price: ${price}`,
      userBalance: 10000,
      settings: {
        takeProfitPercent: 2,
        stopLossPercent: 1,
        useAdvancedStrategy: true,
      },
    });
    
    // 3. Log AI decision
    await pythonApi.createTradingLog({
      action: 'ai_analysis',
      symbol: 'BTCUSD',
      reason: `AI Decision: ${analysis.action}`,
      details: analysis.reasoning,
    });
    
    // 4. Execute trade if recommended
    if (analysis.action === 'open_long' || analysis.action === 'open_short') {
      const result = await pythonApi.executeLiveTrade({
        apiSecret: hyperliquidKey,
        symbol: 'BTCUSD',
        side: analysis.action === 'open_long' ? 'buy' : 'sell',
        size: analysis.positionSize,
        price: analysis.entryPrice,
        stopLoss: analysis.stopLoss,
        takeProfit: analysis.takeProfit,
        leverage: 5,
        isTestnet: false,
      });
      
      if (result.success) {
        toast.success('Trade executed successfully!');
        
        // 5. Record position snapshot
        await pythonApi.recordPositionSnapshot({
          symbol: 'BTCUSD',
          side: analysis.action === 'open_long' ? 'long' : 'short',
          size: analysis.positionSize,
          entry_price: analysis.entryPrice,
          current_price: price,
          unrealized_pnl: 0,
          leverage: 5,
          mode: 'live',
        });
      }
    }
  } catch (error) {
    console.error('Trading flow error:', error);
    toast.error('Trade execution failed');
  }
}
```

---

## 9. Best Practices

### 1. Error Handling
```typescript
// ✅ Always check success flag
const result = await pythonApi.someMethod();
if (!result.success) {
  console.error(result.error);
  return;
}

// ❌ Don't assume success
const data = await pythonApi.someMethod().data; // May be undefined!
```

### 2. Debouncing
```typescript
// ✅ Debounce frequent updates
const debouncedRecord = useCallback(
  debounce((balance) => {
    pythonApi.recordBalance(balance, mode);
  }, 2000),
  [mode]
);

// ❌ Don't spam the API
useEffect(() => {
  pythonApi.recordBalance(balance, mode); // Called on every render!
}, [balance]);
```

### 3. WebSocket Cleanup
```typescript
// ✅ Always cleanup WebSocket connections
useEffect(() => {
  const ws = pythonApi.connectWebSocket(handleMessage);
  return () => ws.close();
}, []);

// ❌ Don't leave connections open
const ws = pythonApi.connectWebSocket(handleMessage); // Memory leak!
```

### 4. Type Safety
```typescript
// ✅ Use TypeScript types
const result: ApiResponse<TradingLog[]> = await pythonApi.getTradingLogs();

// ❌ Don't use 'any'
const result: any = await pythonApi.getTradingLogs();
```

### 5. Loading States
```typescript
// ✅ Show loading indicators
const [loading, setLoading] = useState(false);

async function fetchData() {
  setLoading(true);
  try {
    const result = await pythonApi.getTradingLogs();
    // Handle result
  } finally {
    setLoading(false);
  }
}

// ❌ Don't leave users waiting
await pythonApi.getTradingLogs(); // No feedback!
```

---

## Performance Considerations

### Polling Intervals
- **Trading Logs:** 5 seconds (frequent updates needed)
- **Balance History:** 10 seconds (less frequent changes)
- **Position Snapshots:** 10 seconds (moderate frequency)
- **Live Positions:** 5 seconds (critical for risk management)

### Request Optimization
- Use `limit` parameters to reduce payload size
- Implement client-side caching for static data
- Debounce balance recording (2-second delay)
- Batch multiple operations when possible

### WebSocket vs Polling
- **Use WebSocket for:** Real-time price updates, position changes, alerts
- **Use Polling for:** Historical data, logs, balance history

---

## Migration Notes

### From Convex to FastAPI

**Before (Convex):**
```typescript
const logs = useQuery(api.tradingLogs.list, { limit: 50 });
```

**After (FastAPI):**
```typescript
const { logs } = useTradingLogs(50);
```

**Key Changes:**
1. Replace `useQuery` with custom hooks (`useTradingLogs`, `useBalanceHistory`, etc.)
2. Replace `useMutation` with direct `pythonApi` method calls
3. Add explicit error handling (Convex handled this automatically)
4. Implement manual polling (Convex had real-time subscriptions)

---

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: Network request failed
```
**Solution:** Ensure Python backend is running on `http://localhost:8000`

**2. CORS Errors**
```
Access to fetch blocked by CORS policy
```
**Solution:** Backend must allow frontend origin in CORS settings

**3. Invalid API Response**
```
Error: Unexpected token < in JSON
```
**Solution:** Backend returned HTML error page - check backend logs

**4. WebSocket Disconnects**
```
WebSocket connection closed
```
**Solution:** Implement reconnection logic with exponential backoff

---

## Summary

The Frontend API Client provides a complete TypeScript interface for all backend operations:

- ✅ **Type-safe** - Full TypeScript definitions
- ✅ **React Hooks** - Easy integration with React components
- ✅ **Error Handling** - Consistent error patterns
- ✅ **Real-time Updates** - WebSocket support
- ✅ **Auto-refresh** - Polling hooks for live data
- ✅ **Performance** - Optimized polling intervals and debouncing

For backend API details, see [PYTHON_BACKEND_API.md](./PYTHON_BACKEND_API.md).
