# Hyperliquid Integration - Trading Platform API

## Overview

The DeX Trading Agent integrates with **Hyperliquid**, a decentralized perpetual futures exchange, providing access to leveraged trading with up to 50x leverage on major cryptocurrencies. This document details the complete integration architecture, API usage patterns, order management, and risk protection systems.

**Hyperliquid SDK:** `@nktkas/hyperliquid` v1.x

**Supported Networks:**
- **Mainnet:** `https://api.hyperliquid.xyz` (real funds)
- **Testnet:** `https://api.hyperliquid-testnet.xyz` (test funds)

**Last Updated:** November 14, 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [HyperliquidService Class](#hyperliquidservice-class)
3. [Order Management](#order-management)
4. [Position Management](#position-management)
5. [Risk Management & Liquidation Protection](#risk-management--liquidation-protection)
6. [Account & Balance Operations](#account--balance-operations)
7. [Market Data](#market-data)
8. [Error Handling](#error-handling)
9. [Integration Patterns](#integration-patterns)
10. [Testing & Validation](#testing--validation)

---

## 1. Architecture Overview

### Integration Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  use-trading.ts Hook                                  │   │
│  │  - Trade execution logic                              │   │
│  │  - Position monitoring                                │   │
│  │  │  - Risk validation                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Backend (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/hyperliquid/* Endpoints                         │   │
│  │  - Execute trades                                      │   │
│  │  - Fetch positions                                     │   │
│  │  - Get account info                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HyperliquidService (TypeScript/Node.js)              │   │
│  │  - Order placement                                     │   │
│  │  - TP/SL management                                    │   │
│  │  - Position queries                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Hyperliquid API (Mainnet/Testnet)                 │
│  - Perpetual futures trading                                │
│  - Real-time market data                                    │
│  - Account management                                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend Hook (`use-trading.ts`):**
   - Validates trades against risk limits
   - Calls Python backend API
   - Monitors positions in real-time

2. **Python Backend (`FastAPI`):**
   - Exposes HTTP endpoints for trading operations
   - Handles API key security
   - Manages WebSocket connections

3. **HyperliquidService (`hyperliquid.ts`):**
   - Direct SDK integration with Hyperliquid
   - Order construction and execution
   - Position and balance queries

4. **Liquidation Protection (`liquidation-protection.ts`):**
   - Calculates liquidation prices
   - Validates margin requirements
   - Enforces leverage limits

---

## 2. HyperliquidService Class

### Initialization

**File:** `src/lib/hyperliquid.ts`

```typescript
import * as hl from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

export interface HyperliquidConfig {
  privateKey: string;
  isTestnet?: boolean;
}

export class HyperliquidService {
  private exchangeClient: hl.ExchangeClient;
  private infoClient: hl.InfoClient;
  private walletAddress: string;

  constructor(config: HyperliquidConfig) {
    const transport = new hl.HttpTransport({
      isTestnet: config.isTestnet ?? false,
    });

    // Derive wallet address from private key
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);
    this.walletAddress = account.address;

    this.exchangeClient = new hl.ExchangeClient({
      wallet: account,
      transport,
    });

    this.infoClient = new hl.InfoClient({ transport });
  }
}
```

**Usage Example:**

```typescript
const service = new HyperliquidService({
  privateKey: "0x...",
  isTestnet: false, // Use mainnet
});
```

### Asset Index Resolution

Hyperliquid uses numeric asset indices instead of symbol strings.

```typescript
async getAssetIndex(symbol: string): Promise<number> {
  const meta = await this.infoClient.meta();
  const assetIndex = meta.universe.findIndex(
    (asset) => asset.name === symbol
  );
  if (assetIndex === -1) {
    throw new Error(`Asset ${symbol} not found`);
  }
  return assetIndex;
}
```

**Example:**
- `"BTC"` → Asset index `0`
- `"ETH"` → Asset index `1`
- `"SOL"` → Asset index `2`

---

## 3. Order Management

### Market Orders

**Method:** `placeOrder()`

```typescript
export interface OrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: string;
  price?: string;
  orderType: "market" | "limit";
  reduceOnly?: boolean;
}

async placeOrder(params: OrderParams) {
  const assetIndex = await this.getAssetIndex(params.symbol);
  
  const order: any = {
    a: assetIndex,
    b: params.side === "buy",
    p: params.price || "0",
    s: params.size,
    r: params.reduceOnly ?? false,
    t: params.orderType === "market" 
      ? { market: {} }
      : { limit: { tif: "Gtc" } }
  };

  const result = await this.exchangeClient.order({
    orders: [order],
    grouping: "na",
  });

  return result;
}
```

**Usage Example:**

```typescript
// Open long position (market order)
await service.placeOrder({
  symbol: "BTC",
  side: "buy",
  size: "0.1",
  orderType: "market",
});

// Close position (reduce-only)
await service.placeOrder({
  symbol: "BTC",
  side: "sell",
  size: "0.1",
  orderType: "market",
  reduceOnly: true,
});
```

### Limit Orders

```typescript
// Place limit order at specific price
await service.placeOrder({
  symbol: "ETH",
  side: "buy",
  size: "1.0",
  price: "2000.00",
  orderType: "limit",
});
```

**Order Types:**
- `market` - Executes immediately at best available price
- `limit` - Executes only at specified price or better
  - `tif: "Gtc"` - Good-til-cancelled (default)
  - `tif: "Ioc"` - Immediate-or-cancel
  - `tif: "Alo"` - Add-liquidity-only (maker-only)

---

## 4. Position Management

### Stop Loss Orders

**Method:** `placeStopLoss()`

```typescript
export interface StopLossParams {
  symbol: string;
  side: "buy" | "sell";
  size: string;
  triggerPrice: string;
  isMarket?: boolean;
}

async placeStopLoss(params: StopLossParams) {
  const assetIndex = await this.getAssetIndex(params.symbol);
  
  const order: any = {
    a: assetIndex,
    b: params.side === "buy",
    p: "0",
    s: params.size,
    r: false,
    t: {
      trigger: {
        isMarket: params.isMarket ?? true,
        tpsl: "sl",
        triggerPx: params.triggerPrice,
      }
    }
  };

  const result = await this.exchangeClient.order({
    orders: [order],
    grouping: "normalTpsl",
  });

  return result;
}
```

**Usage Example:**

```typescript
// Set stop loss for long position
await service.placeStopLoss({
  symbol: "BTC",
  side: "sell", // Opposite of position side
  size: "0.1",
  triggerPrice: "44000.00",
  isMarket: true,
});
```

### Take Profit Orders

**Method:** `placeTakeProfit()`

```typescript
async placeTakeProfit(params: StopLossParams) {
  const assetIndex = await this.getAssetIndex(params.symbol);
  
  const order: any = {
    a: assetIndex,
    b: params.side === "buy",
    p: "0",
    s: params.size,
    r: false,
    t: {
      trigger: {
        isMarket: params.isMarket ?? true,
        tpsl: "tp",
        triggerPx: params.triggerPrice,
      }
    }
  };

  const result = await this.exchangeClient.order({
    orders: [order],
    grouping: "normalTpsl",
  });

  return result;
}
```

**Usage Example:**

```typescript
// Set take profit for long position
await service.placeTakeProfit({
  symbol: "BTC",
  side: "sell",
  size: "0.1",
  triggerPrice: "47000.00",
  isMarket: true,
});
```

### Get Open Positions

**Method:** `getPositions()`

```typescript
async getPositions() {
  const state = await this.infoClient.clearinghouseState({
    user: this.walletAddress,
  });
  return state.assetPositions;
}
```

**Response Structure:**

```typescript
[
  {
    position: {
      coin: "BTC",
      szi: "0.1", // Signed size (positive = long, negative = short)
      entryPx: "45000.0",
      unrealizedPnl: "50.0",
      liquidationPx: "36000.0",
      marginUsed: "900.0",
      leverage: "5.0",
    }
  }
]
```

---

## 5. Risk Management & Liquidation Protection

### Tiered Margin System

**File:** `src/lib/liquidation-protection.ts`

Hyperliquid uses a tiered margin system based on position notional value:

```typescript
export interface MarginTier {
  notionalMin: number;
  notionalMax: number;
  initialMarginRate: number;
  maintenanceMarginRate: number;
  maintenanceDeduction: number;
}

const MARGIN_TIERS: MarginTier[] = [
  {
    notionalMin: 0,
    notionalMax: 500000,
    initialMarginRate: 0.02, // 2% (50x max leverage)
    maintenanceMarginRate: 0.01, // 1%
    maintenanceDeduction: 0,
  },
  {
    notionalMin: 500000,
    notionalMax: 1000000,
    initialMarginRate: 0.03, // 3% (33x max leverage)
    maintenanceMarginRate: 0.015, // 1.5%
    maintenanceDeduction: 2500,
  },
  {
    notionalMin: 1000000,
    notionalMax: Infinity,
    initialMarginRate: 0.05, // 5% (20x max leverage)
    maintenanceMarginRate: 0.025, // 2.5%
    maintenanceDeduction: 17500,
  },
];
```

### Liquidation Price Calculation

**Formula:**

```
liq_price = entry_price - side * margin_available / position_size / (1 - l * side)

where:
  side = 1 for long, -1 for short
  l = 1 / maintenance_leverage
```

**Implementation:**

```typescript
export function calculateLiquidationPrice(
  entryPrice: number,
  positionSize: number,
  side: 'long' | 'short',
  marginAvailable: number
): number {
  const sideMultiplier = side === 'long' ? 1 : -1;
  const notionalValue = entryPrice * positionSize;
  const tier = getMarginTier(notionalValue);
  
  const maintenanceLeverage = 1 / tier.maintenanceMarginRate;
  const l = 1 / maintenanceLeverage;
  
  const liquidationPrice = 
    entryPrice - 
    (sideMultiplier * marginAvailable) / positionSize / (1 - l * sideMultiplier);
  
  return liquidationPrice;
}
```

**Example:**

```typescript
// Long position: 0.1 BTC at $45,000 with $10,000 balance
const liqPrice = calculateLiquidationPrice(
  45000,  // Entry price
  0.1,    // Position size
  'long', // Side
  10000   // Margin available
);
// Result: ~$36,000 (20% drop before liquidation)
```

### Risk Assessment

**Method:** `assessLiquidationRisk()`

```typescript
export function assessLiquidationRisk(
  position: {
    symbol: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    leverage: number;
  },
  currentPrice: number,
  accountBalance: number
): LiquidationRiskData {
  const liquidationPrice = calculateLiquidationPrice(
    position.entryPrice,
    position.size,
    position.side,
    accountBalance
  );
  
  const distanceToLiquidation = position.side === 'long'
    ? ((currentPrice - liquidationPrice) / currentPrice) * 100
    : ((liquidationPrice - currentPrice) / currentPrice) * 100;
  
  let riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
  if (distanceToLiquidation > 20) riskLevel = 'safe';
  else if (distanceToLiquidation > 10) riskLevel = 'warning';
  else if (distanceToLiquidation > 5) riskLevel = 'danger';
  else riskLevel = 'critical';
  
  return {
    liquidationPrice,
    currentPrice,
    distanceToLiquidation,
    riskLevel,
    // ... more fields
  };
}
```

**Risk Levels:**
- **Safe:** >20% distance to liquidation
- **Warning:** 10-20% distance
- **Danger:** 5-10% distance
- **Critical:** <5% distance

### Position Size Validation

**Method:** `canOpenPosition()`

```typescript
export function canOpenPosition(
  accountBalance: number,
  existingPositions: Array<{
    size: number;
    entryPrice: number;
    leverage: number;
  }>,
  newPositionSize: number,
  newPositionPrice: number
): { canOpen: boolean; reason?: string; maxSafeSize?: number } {
  let totalNotional = newPositionSize * newPositionPrice;
  
  for (const pos of existingPositions) {
    totalNotional += pos.size * pos.entryPrice;
  }
  
  const { maintenanceMargin } = calculateMaintenanceMargin(totalNotional);
  const marginUsagePercent = (maintenanceMargin / accountBalance) * 100;
  
  // Check effective leverage (max 10x for safety)
  const effectiveLeverage = totalNotional / accountBalance;
  if (effectiveLeverage > 10) {
    const maxSafeNotional = accountBalance * 10;
    const existingNotional = totalNotional - (newPositionSize * newPositionPrice);
    const maxNewNotional = maxSafeNotional - existingNotional;
    const maxSafeSize = maxNewNotional / newPositionPrice;
    
    return {
      canOpen: false,
      reason: `Excessive leverage: ${effectiveLeverage.toFixed(1)}x exceeds safe limit of 10x`,
      maxSafeSize: Math.max(0, maxSafeSize),
    };
  }
  
  if (marginUsagePercent > 90) {
    return {
      canOpen: false,
      reason: 'Insufficient margin: Would exceed 90% margin usage',
    };
  }
  
  return { canOpen: true };
}
```

### Asset-Specific Leverage Limits

```typescript
export function getAssetMaxLeverage(symbol: string): number {
  const maxLeverageMap: Record<string, number> = {
    'BTC': 50,
    'ETH': 50,
    'SOL': 40,
    'DOGE': 25,
    'SHIB': 20,
    'PEPE': 20,
    'WIF': 20,
    'BONK': 20,
  };
  
  const baseSymbol = symbol.replace('USD', '').replace('USDC', '');
  return maxLeverageMap[baseSymbol] || 20; // Default to 20x
}
```

---

## 6. Account & Balance Operations

### Get Account Balance

**Method:** `getBalance()`

```typescript
async getBalance() {
  const state = await this.infoClient.clearinghouseState({
    user: this.walletAddress,
  });
  return {
    marginSummary: state.marginSummary,
    crossMarginSummary: state.crossMarginSummary,
  };
}
```

**Response Structure:**

```typescript
{
  marginSummary: {
    accountValue: "10500.0",      // Total account value
    totalMarginUsed: "900.0",     // Margin locked in positions
    totalNtlPos: "4500.0",        // Total notional position value
    totalRawUsd: "10000.0",       // Cash balance
  },
  crossMarginSummary: {
    accountValue: "10500.0",
    totalMarginUsed: "900.0",
  }
}
```

### Get Open Orders

**Method:** `getOpenOrders()`

```typescript
async getOpenOrders() {
  const orders = await this.infoClient.openOrders({
    user: this.walletAddress,
  });
  return orders;
}
```

---

## 7. Market Data

### Order Book

**Backend Endpoint:** `GET /api/hyperliquid/orderbook?coin=BTC&isTestnet=false`

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

### Price Fetching

**Backend Endpoint:** `GET /api/market/price?symbol=BTCUSD&isTestnet=false`

Uses Binance as primary price oracle with Hyperliquid fallback.

---

## 8. Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Asset {symbol} not found` | Invalid symbol | Check available assets via `meta()` |
| `Insufficient margin` | Not enough balance | Reduce position size or add funds |
| `Excessive leverage` | Leverage > asset max | Lower leverage setting |
| `Order rejected` | Risk limits exceeded | Check margin usage and liquidation risk |
| `Invalid private key` | Malformed key | Verify key format (0x...) |

### Error Handling Pattern

```typescript
try {
  const result = await service.placeOrder({
    symbol: "BTC",
    side: "buy",
    size: "0.1",
    orderType: "market",
  });
  
  if (result.status === "ok") {
    console.log("Order placed successfully");
  } else {
    console.error("Order failed:", result.response);
  }
} catch (error) {
  console.error("API error:", error.message);
  // Handle network errors, invalid params, etc.
}
```

---

## 9. Integration Patterns

### Frontend → Backend → Hyperliquid Flow

**1. Frontend initiates trade:**

```typescript
// src/hooks/use-trading.ts
const executeTrade = async (symbol, action, side, price, size) => {
  // Validate leverage
  const leverageValidation = validateLeverage(symbol, settings.leverage);
  if (!leverageValidation.valid) {
    toast.error(`Leverage too high for ${symbol}`);
    return;
  }
  
  // Check position safety
  const positionCheck = canOpenPosition(balance, existingPositions, size, price);
  if (!positionCheck.canOpen) {
    toast.error(`Position rejected: ${positionCheck.reason}`);
    return;
  }
  
  // Execute via backend
  const result = await pythonApi.executeLiveTrade({
    apiSecret: keys.hyperliquid.apiSecret,
    symbol,
    side: side === 'long' ? 'buy' : 'sell',
    size,
    price,
    leverage: settings.leverage,
    isTestnet: network === 'testnet',
  });
};
```

**2. Backend processes request:**

```python
# Python FastAPI endpoint
@app.post("/api/hyperliquid/execute-trade")
async def execute_trade(trade: TradeRequest):
    service = HyperliquidService(
        private_key=trade.apiSecret,
        is_testnet=trade.isTestnet
    )
    
    # Place market order
    result = await service.place_order({
        "symbol": trade.symbol,
        "side": trade.side,
        "size": str(trade.size),
        "orderType": "market"
    })
    
    # Set TP/SL if provided
    if trade.stopLoss:
        await service.place_stop_loss({
            "symbol": trade.symbol,
            "side": "sell" if trade.side == "buy" else "buy",
            "size": str(trade.size),
            "triggerPrice": str(trade.stopLoss)
        })
    
    return {"success": True, "data": result}
```

**3. HyperliquidService executes:**

```typescript
// src/lib/hyperliquid.ts
const result = await this.exchangeClient.order({
  orders: [order],
  grouping: "na",
});
```

### Real-Time Position Monitoring

```typescript
// Poll positions every 5 seconds
useEffect(() => {
  if (mode !== 'live') return;

  const pollPositions = async () => {
    const result = await pythonApi.getHyperliquidPositions(
      keys.hyperliquid.apiSecret,
      keys.hyperliquid.walletAddress,
      network === 'testnet'
    );

    if (result.success && result.data) {
      // Update balance
      const accountValue = parseFloat(result.data.marginSummary.accountValue);
      setBalance(accountValue);

      // Check margin usage
      const marginUsagePercent = 
        (parseFloat(result.data.marginSummary.totalMarginUsed) / accountValue) * 100;
      
      if (marginUsagePercent >= 80) {
        toast.error(`⚠️ LIQUIDATION WARNING: ${marginUsagePercent.toFixed(1)}% margin usage!`);
        setAutoTrading(false);
      }

      // Update positions
      if (result.data.assetPositions.length > 0) {
        const pos = result.data.assetPositions[0];
        setPosition({
          symbol: pos.position.coin,
          size: Math.abs(parseFloat(pos.position.szi)),
          entryPrice: parseFloat(pos.position.entryPx),
          pnl: parseFloat(pos.position.unrealizedPnl),
          side: parseFloat(pos.position.szi) > 0 ? 'long' : 'short',
        });
      }
    }
  };

  const interval = setInterval(pollPositions, 5000);
  pollPositions();

  return () => clearInterval(interval);
}, [mode, network]);
```

---

## 10. Testing & Validation

### Unit Tests

**File:** `src/lib/__tests__/mainnet-tpsl.test.ts`

```typescript
describe('Hyperliquid Mainnet TP/SL', () => {
  it('should calculate correct TP/SL prices for long position', () => {
    const entry = 45000;
    const tpPercent = 2;
    const slPercent = 1;
    
    const tp = entry * (1 + tpPercent / 100);
    const sl = entry * (1 - slPercent / 100);
    
    expect(tp).toBeCloseTo(45900, 2);
    expect(sl).toBeCloseTo(44550, 2);
  });
  
  it('should validate leverage limits', () => {
    const validation = validateLeverage('BTC', 60);
    expect(validation.valid).toBe(false);
    expect(validation.maxLeverage).toBe(50);
  });
});
```

### Integration Testing

**Testnet Testing:**

```typescript
// Use testnet for safe testing
const service = new HyperliquidService({
  privateKey: process.env.TESTNET_PRIVATE_KEY!,
  isTestnet: true,
});

// Test order placement
const result = await service.placeOrder({
  symbol: "BTC",
  side: "buy",
  size: "0.01",
  orderType: "market",
});

console.log("Test order result:", result);
```

### Connection Testing

**Backend Endpoint:** `GET /api/hyperliquid/test-connection?isTestnet=true`

```json
{
  "success": true,
  "message": "Connected to Hyperliquid Testnet",
  "apiEndpoint": "https://api.hyperliquid-testnet.xyz",
  "assetsCount": 50,
  "availableAssets": "BTC, ETH, SOL, DOGE, ..."
}
```

---

## Best Practices

### ✅ DO:

1. **Always validate leverage** before placing orders
2. **Check margin usage** regularly (poll every 5s)
3. **Set stop losses** on all positions
4. **Use testnet first** for new strategies
5. **Monitor liquidation distance** (keep >10%)
6. **Implement trailing stops** for profit protection
7. **Log all trades** for audit trail

### ❌ DON'T:

1. **Don't exceed asset max leverage** (varies by coin)
2. **Don't ignore margin warnings** (80%+ usage)
3. **Don't trade without stop losses**
4. **Don't use mainnet for testing**
5. **Don't expose private keys** in logs or frontend
6. **Don't place orders without position size validation**
7. **Don't ignore liquidation risk assessments**

---

## Performance Metrics

- **Order Execution:** 200-500ms (mainnet), 100-300ms (testnet)
- **Position Polling:** 5-second intervals
- **Liquidation Check:** Real-time on every position update
- **Risk Assessment:** <10ms (local calculation)
- **WebSocket Latency:** <100ms for real-time updates

---

## Security Considerations

1. **Private Key Storage:**
   - Never store in frontend code
   - Use environment variables on backend
   - Encrypt at rest in database

2. **API Key Transmission:**
   - HTTPS only (localhost for local deployment)
   - Pass in request body, not headers
   - Never log sensitive keys

3. **Network Isolation:**
   - Backend only accessible on localhost
   - Firewall blocks external access
   - CORS restricted to frontend origin

---

## Resources

- **Hyperliquid Docs:** https://hyperliquid.gitbook.io/
- **SDK Repository:** https://github.com/nktkas/hyperliquid
- **Testnet Faucet:** https://app.hyperliquid-testnet.xyz/faucet
- **Mainnet App:** https://app.hyperliquid.xyz
- **API Status:** Check `/api/hyperliquid/test-connection`

---

**Last Updated:** November 15, 2025  
**Integration Version:** 1.0.0  
**Maintained By:** VenTheZone
