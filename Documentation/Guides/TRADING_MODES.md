# Trading Modes - Live, Paper, and Demo Mode Explanations

## Overview

The DeX Trading Agent offers **three distinct trading modes** designed to accommodate different experience levels, risk tolerances, and use cases. Each mode provides a unique balance between realism, safety, and learning opportunities for perpetual futures trading on Hyperliquid.

**Available Modes:**
- 🎮 **Demo Mode** - Risk-free practice with simulated balance
- 📄 **Paper Mode** - Realistic simulation with real market data
- 🔴 **Live Mode** - Real trading with actual capital

This guide will help you understand each mode's features, requirements, and when to use them.

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Trading Modes Comparison](#trading-modes-comparison)
2. [Demo Mode](#demo-mode)
3. [Paper Mode](#paper-mode)
4. [Live Mode](#live-mode)
5. [Switching Between Modes](#switching-between-modes)
6. [Mode Selection Guide](#mode-selection-guide)
7. [Best Practices by Mode](#best-practices-by-mode)
8. [Common Misconceptions](#common-misconceptions)
9. [FAQ](#faq)

---

## 1. Trading Modes Comparison

### Quick Reference Table

| Feature | Demo Mode 🎮 | Paper Mode 📄 | Live Mode 🔴 |
|---------|-------------|--------------|-------------|
| **Real Money Risk** | ❌ None | ❌ None | ✅ Yes |
| **Real Market Data** | ✅ Yes | ✅ Yes | ✅ Yes |
| **AI Analysis** | ✅ Optional* | ✅ Optional* | ✅ Required |
| **Order Execution** | Simulated | Simulated | Real |
| **Slippage** | ❌ No | ❌ No | ✅ Yes |
| **Trading Fees** | ❌ No | ❌ No | ✅ Yes |
| **Funding Rates** | ❌ No | ❌ No | ✅ Yes |
| **Liquidation Risk** | ❌ No | ❌ No | ✅ Yes |
| **API Keys Required** | ❌ None | ❌ None | ✅ All |
| **Initial Balance** | Customizable | $10,000 default | Your funds |
| **Balance Persistence** | ✅ Saved | ✅ Saved | ✅ Real-time |
| **Position Tracking** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto-Trading** | ✅ Yes* | ✅ Yes* | ✅ Yes |
| **Best For** | Learning basics | Strategy testing | Real trading |

*AI analysis in Demo/Paper modes requires OpenRouter API key (optional). Without it, AI features are disabled but manual trading works.

### Key Differences Explained

**Execution:**
- **Demo/Paper:** Instant execution at current market price (no slippage)
- **Live:** Real order execution with potential slippage and partial fills

**Costs:**
- **Demo/Paper:** No fees, no funding rates, no liquidation
- **Live:** Trading fees (~0.02-0.035%), 8-hour funding rates, liquidation risk

**Data:**
- **All Modes:** Use real-time market data from Binance/Hyperliquid
- **Live:** Additional data like order book depth, funding rates, open interest

**Risk:**
- **Demo/Paper:** Zero financial risk, perfect for learning
- **Live:** Real capital at risk, requires careful risk management

---

## 2. Demo Mode 🎮

### What is Demo Mode?

Demo Mode is a **fully simulated trading environment** designed for beginners to learn the platform without any API keys or real market connections. It provides a safe sandbox to explore features, test strategies, and understand perpetual futures trading mechanics.

### Key Features

✅ **Zero Setup Required**
- No API keys needed
- No wallet connection
- No registration
- Start trading immediately

✅ **Customizable Starting Balance**
- Default: $10,000 virtual USDC
- Adjustable from $1,000 to $1,000,000
- Reset balance anytime with one click

✅ **Full Feature Access**
- All trading controls available
- Position management (open/close)
- Stop loss and take profit orders
- Leverage adjustment (1x-40x)
- Multi-chart analysis (up to 4 coins)

✅ **Optional AI Analysis**
- Works without OpenRouter key (AI disabled)
- Add OpenRouter key for real AI analysis
- Uses DeepSeek V3.1 free tier or Qwen3 Max (paid)

✅ **Realistic Simulation**
- Real-time market prices from Binance
- Simulated order execution
- Position tracking with P&L
- Balance history and performance metrics

### How Demo Mode Works

**Architecture:**

```
User Interface
     ↓
Demo Mode Engine (Frontend)
     ↓
Real Market Data (Binance API)
     ↓
Simulated Execution
     ↓
Local Storage (Balance/Positions)
```

**Execution Flow:**

1. **Order Placement:** User places buy/sell order
2. **Price Fetch:** System fetches current market price
3. **Instant Execution:** Order executes immediately at market price
4. **Balance Update:** Virtual balance adjusted instantly
5. **Position Tracking:** Position stored in browser localStorage
6. **P&L Calculation:** Unrealized P&L updated in real-time

**Data Persistence:**

Demo mode stores all data in browser localStorage:
- Current balance
- Open positions
- Trading settings
- Performance history

**Note:** Clearing browser data will reset your demo account.

### When to Use Demo Mode

✅ **Perfect For:**
- **Complete Beginners:** Never traded crypto before
- **Platform Exploration:** Learning the interface and features
- **Risk-Free Testing:** Trying extreme leverage or risky strategies
- **Feature Discovery:** Understanding AI analysis, auto-trading, etc.
- **Quick Demos:** Showing the platform to others

❌ **Not Suitable For:**
- **Realistic Strategy Testing:** No fees, slippage, or funding rates
- **Live Trading Preparation:** Doesn't simulate real market conditions
- **Performance Validation:** Results won't match live trading

### Demo Mode Limitations

**What's Missing:**

1. **No Trading Costs:**
   - No maker/taker fees (live: ~0.02-0.035%)
   - No funding rates (live: paid every 8 hours)
   - No gas fees or network costs

2. **No Market Impact:**
   - Instant execution (no slippage)
   - No partial fills
   - No order book depth consideration
   - No liquidity constraints

3. **No Real Risk:**
   - Can't lose real money
   - No emotional pressure
   - No liquidation consequences
   - Unlimited retries

4. **Simplified Mechanics:**
   - No margin calls
   - No insurance fund
   - No ADL (Auto-Deleveraging)
   - No position limits

### Demo Mode Setup

**Step 1: Launch Application**

Open the DeX Trading Agent in your browser.

**Step 2: Select Demo Mode**

On the API Key Setup screen:
- Click **"Demo Mode"** tab
- Set your initial balance (default: $10,000)
- Optionally add OpenRouter API key for AI analysis
- Click **"Start Demo Trading"**

**Step 3: Start Trading**

You're immediately ready to trade:
- Select coins to trade (up to 4)
- Adjust leverage (1x-40x)
- Place manual trades or enable auto-trading
- Monitor positions and P&L

**Step 4: Reset Anytime**

Reset your demo balance:
- Click **"Reset"** button in Balance card
- Confirms reset to initial balance
- Closes all open positions
- Clears trading history

### Demo Mode Best Practices

**Learning Strategy:**

1. **Start Small:** Begin with low leverage (1x-3x) to understand basics
2. **Experiment Freely:** Try different strategies without fear
3. **Test AI Analysis:** Add OpenRouter key to see AI recommendations
4. **Learn Risk Management:** Practice setting stop losses and take profits
5. **Understand Leverage:** See how leverage amplifies gains AND losses
6. **Track Performance:** Monitor your win rate and P&L patterns

**Common Mistakes to Avoid:**

❌ **Over-Leveraging:** Using 40x leverage unrealistically (you'll be more conservative in live)
❌ **Ignoring Risk Management:** Not setting stop losses (critical in live trading)
❌ **Unrealistic Expectations:** Demo results won't match live due to fees/slippage
❌ **Skipping Paper Mode:** Jump straight to live without realistic testing

**Graduation Path:**

```
Demo Mode (1-2 weeks)
    ↓
Learn platform basics
    ↓
Paper Mode (2-4 weeks)
    ↓
Test strategies with realistic simulation
    ↓
Live Mode (Testnet first!)
    ↓
Real trading with small capital
```

---

## 3. Paper Mode 📄

### What is Paper Mode?

Paper Mode is a **realistic trading simulator** that uses real market data and simulates order execution with the same logic as live trading, but without risking real capital. It's the bridge between Demo Mode and Live Mode, providing a safe environment to validate strategies before going live.

### Key Features

✅ **Realistic Simulation**
- Real-time market data from Binance/Hyperliquid
- Simulated order execution with realistic logic
- Position tracking identical to live mode
- Stop loss and take profit automation
- Leverage and margin calculations

✅ **Full Paper Trading Engine**
- Market and limit order support
- Position netting (long/short)
- Unrealized and realized P&L tracking
- Automatic SL/TP triggers
- Balance and equity management

✅ **No API Keys Required**
- Works without Hyperliquid wallet
- Optional: OpenRouter key for AI analysis
- No wallet connection needed
- Zero setup friction

✅ **Persistent State**
- Positions saved across sessions
- Balance history tracked
- Performance metrics recorded
- Trading logs maintained

✅ **Identical Interface**
- Same UI as live trading
- Same risk management tools
- Same AI analysis features
- Same auto-trading capabilities

### How Paper Mode Works

**Architecture:**

```
User Interface
     ↓
Paper Trading Engine (src/lib/paper-trading-engine.ts)
     ↓
Real Market Data (Binance/Hyperliquid API)
     ↓
Simulated Order Execution
     ↓
Position Management
     ↓
Zustand Store (State Persistence)
```

**Paper Trading Engine Components:**

1. **Order Manager:**
   - Validates order parameters
   - Checks balance sufficiency
   - Executes market/limit orders
   - Tracks order status

2. **Position Manager:**
   - Creates/updates positions
   - Calculates entry price (weighted average)
   - Tracks position size and side
   - Manages position lifecycle

3. **P&L Calculator:**
   - Unrealized P&L: `(currentPrice - entryPrice) * size` (long)
   - Realized P&L: Accumulated from closed positions
   - Total P&L: Unrealized + Realized

4. **Risk Manager:**
   - Stop loss monitoring
   - Take profit monitoring
   - Automatic position closure
   - Balance protection

**Execution Logic:**

```typescript
// Simplified Paper Trading Execution
function executePaperTrade(order) {
  // 1. Validate balance
  if (order.side === 'buy' && cost > balance) {
    return { status: 'rejected', reason: 'Insufficient balance' };
  }
  
  // 2. Update balance
  balance -= (order.side === 'buy' ? cost : -cost);
  
  // 3. Create or update position
  if (existingPosition) {
    // Position netting logic
    if (opposingSide) {
      closePosition(order.size);
    } else {
      addToPosition(order.size, order.price);
    }
  } else {
    createPosition(order);
  }
  
  // 4. Set risk parameters
  setStopLoss(order.stopLoss);
  setTakeProfit(order.takeProfit);
  
  return { status: 'filled', position };
}
```

**Real-Time Price Updates:**

```typescript
// Price monitoring loop (every 5 seconds)
setInterval(() => {
  positions.forEach(position => {
    const currentPrice = fetchMarketPrice(position.symbol);
    
    // Update unrealized P&L
    position.unrealizedPnl = calculatePnl(position, currentPrice);
    
    // Check stop loss
    if (shouldTriggerStopLoss(position, currentPrice)) {
      closePosition(position, 'stop_loss');
    }
    
    // Check take profit
    if (shouldTriggerTakeProfit(position, currentPrice)) {
      closePosition(position, 'take_profit');
    }
  });
}, 5000);
```

### When to Use Paper Mode

✅ **Perfect For:**
- **Strategy Validation:** Testing trading strategies before live deployment
- **AI Model Testing:** Evaluating AI analysis accuracy over time
- **Risk Management Tuning:** Finding optimal stop loss and take profit levels
- **Performance Benchmarking:** Tracking win rate, average P&L, drawdown
- **Auto-Trading Testing:** Validating automated trading logic
- **Learning Curve:** Transitioning from demo to live trading

❌ **Not Suitable For:**
- **Absolute Beginners:** Start with Demo Mode first
- **Final Validation:** Paper mode lacks fees, slippage, and funding rates
- **Emotional Training:** No real money = no real emotions

### Paper Mode Limitations

**What's Still Missing:**

1. **Trading Costs:**
   - No maker/taker fees (~0.02-0.035% in live)
   - No funding rates (can be significant in live)
   - No gas fees

2. **Market Realities:**
   - No slippage (instant execution at market price)
   - No partial fills (orders always fill completely)
   - No order book depth (assumes infinite liquidity)
   - No market impact (your orders don't move the market)

3. **Psychological Factors:**
   - No emotional pressure (not real money)
   - No fear of loss (can reset anytime)
   - No greed management (easier to stick to plan)

4. **Exchange-Specific Features:**
   - No margin calls (simulated liquidation only)
   - No insurance fund interactions
   - No ADL (Auto-Deleveraging)
   - No position limits

**Realism Comparison:**

| Aspect | Paper Mode | Live Mode |
|--------|-----------|-----------|
| Price Data | ✅ Real | ✅ Real |
| Execution | ⚠️ Instant | ✅ Real |
| Fees | ❌ None | ✅ Yes |
| Slippage | ❌ None | ✅ Yes |
| Funding | ❌ None | ✅ Yes |
| Emotions | ❌ None | ✅ Yes |
| **Realism Score** | **60%** | **100%** |

### Paper Mode Setup

**Step 1: Launch Application**

Open the DeX Trading Agent.

**Step 2: Select Paper Mode**

On the API Key Setup screen:
- Click **"API Keys"** tab
- Leave Hyperliquid fields empty (or enter dummy values)
- Optionally add OpenRouter API key for AI analysis
- Click **"Save & Continue"**

**Alternative:** Switch from Demo/Live mode:
- Click the mode badge in the header
- Select **"📄 PAPER"**
- Confirm the switch

**Step 3: Configure Settings**

Open Trading Controls panel:
- Select coins to trade (up to 4)
- Set leverage (1x-40x)
- Configure risk management (TP/SL percentages)
- Enable/disable AI auto-trading

**Step 4: Start Trading**

Begin paper trading:
- Place manual trades
- Enable auto-trading for AI-driven trades
- Monitor positions and P&L
- Review trading logs

### Paper Mode Best Practices

**Strategy Development:**

1. **Define Clear Rules:**
   - Entry conditions (technical indicators, AI signals)
   - Exit conditions (TP/SL levels, time-based)
   - Position sizing (% of balance per trade)
   - Risk limits (max drawdown, daily loss limit)

2. **Track Performance Metrics:**
   - Win rate (% of profitable trades)
   - Average P&L per trade
   - Risk/reward ratio
   - Maximum drawdown
   - Sharpe ratio (if tracking over time)

3. **Test Different Scenarios:**
   - Bull market conditions
   - Bear market conditions
   - High volatility periods
   - Low volatility periods
   - Different leverage levels

4. **Validate AI Recommendations:**
   - Track AI confidence vs actual outcomes
   - Identify which market conditions AI performs best
   - Compare AI trades vs manual trades
   - Adjust AI prompt template based on results

**Realistic Testing Guidelines:**

✅ **Do:**
- Trade as if it's real money
- Follow your risk management rules strictly
- Track every trade and analyze results
- Test for at least 2-4 weeks before going live
- Aim for consistent profitability (not just lucky wins)

❌ **Don't:**
- Over-leverage unrealistically (stick to 3x-10x max)
- Ignore stop losses (you'll need them in live)
- Chase losses (revenge trading)
- Skip trade journaling
- Rush to live mode after one good day

**Graduation Criteria:**

Before moving to Live Mode, ensure:
- ✅ Consistent profitability over 2-4 weeks
- ✅ Win rate >50% (or high risk/reward ratio)
- ✅ Maximum drawdown <20%
- ✅ Comfortable with leverage and risk management
- ✅ Understand AI recommendations and when to override
- ✅ Tested in different market conditions

---

## 4. Live Mode 🔴

### What is Live Mode?

Live Mode is **real trading with actual capital** on Hyperliquid perpetual futures markets. Every trade involves real money, real fees, real funding rates, and real liquidation risk. This mode requires careful preparation, proper API key setup, and disciplined risk management.

### Key Features

✅ **Real Trading Execution**
- Orders executed on Hyperliquid exchange
- Real order book interaction
- Actual slippage and partial fills
- Market maker/taker fees applied

✅ **Full Derivatives Features**
- 8-hour funding rates (paid/received)
- Real liquidation risk and margin calls
- Mark price vs index price tracking
- Open interest and long/short ratio data

✅ **Complete Risk Management**
- Real-time liquidation monitoring
- Margin usage alerts (auto-pause at 80%)
- Position size validation
- Leverage limits per asset

✅ **Dual Network Support**
- **Mainnet:** Real USDC, real profits/losses
- **Testnet:** Free testnet USDC for safe testing

✅ **Agent Wallet Security**
- Use agent wallets (can trade but CANNOT withdraw)
- Automatic expiration after validity period
- Revocable at any time
- No withdrawal permissions

### How Live Mode Works

**Architecture:**

```
User Interface
     ↓
Python FastAPI Backend
     ↓
Hyperliquid SDK (@nktkas/hyperliquid)
     ↓
Hyperliquid Exchange (Mainnet/Testnet)
     ↓
Real Order Execution
     ↓
Position Tracking (5-second polling)
```

**Live Trading Flow:**

1. **Order Submission:**
   - User places order via UI
   - Frontend sends request to Python backend
   - Backend validates order parameters
   - Order submitted to Hyperliquid via SDK

2. **Order Execution:**
   - Hyperliquid matches order with order book
   - Execution may have slippage
   - Partial fills possible for large orders
   - Fees deducted (maker: ~0.02%, taker: ~0.035%)

3. **Position Tracking:**
   - Backend polls Hyperliquid every 5 seconds
   - Fetches open positions and margin summary
   - Updates balance, P&L, and liquidation distance
   - Triggers alerts if margin usage high

4. **Risk Monitoring:**
   - Calculates liquidation price in real-time
   - Monitors funding rate impact
   - Checks margin usage percentage
   - Auto-pauses trading if risk too high

5. **Position Closure:**
   - User closes position manually or via AI
   - Backend submits closing order
   - Realized P&L calculated
   - Balance updated with profit/loss

**Hyperliquid Integration:**

```typescript
// Simplified Live Trade Execution
async function executeLiveTrade(order) {
  // 1. Validate API keys and connection
  const client = new HyperliquidClient(apiSecret, isTestnet);
  
  // 2. Check account balance and margin
  const accountInfo = await client.getAccountInfo();
  if (accountInfo.marginUsage > 0.8) {
    throw new Error('Margin usage too high');
  }
  
  // 3. Submit order to Hyperliquid
  const result = await client.placeOrder({
    symbol: order.symbol,
    side: order.side,
    size: order.size,
    price: order.price,
    leverage: order.leverage,
    stopLoss: order.stopLoss,
    takeProfit: order.takeProfit,
  });
  
  // 4. Log trade execution
  await logTrade({
    action: 'open_position',
    symbol: order.symbol,
    orderId: result.orderId,
    status: result.status,
  });
  
  return result;
}
```

**Position Polling:**

```typescript
// Real-time position monitoring (every 5 seconds)
setInterval(async () => {
  const positions = await hyperliquid.getPositions();
  const marginSummary = await hyperliquid.getMarginSummary();
  
  // Update balance
  setBalance(marginSummary.accountValue);
  
  // Check margin usage
  const marginUsage = marginSummary.totalMarginUsed / marginSummary.accountValue;
  if (marginUsage > 0.8) {
    // Auto-pause trading
    setAutoTrading(false);
    alert('⚠️ LIQUIDATION WARNING: High margin usage!');
  }
  
  // Update positions
  positions.forEach(pos => {
    const liquidationPrice = calculateLiquidationPrice(pos);
    const distanceToLiq = Math.abs((pos.currentPrice - liquidationPrice) / pos.currentPrice);
    
    if (distanceToLiq < 0.1) {
      alert(`⚠️ Position ${pos.symbol} near liquidation!`);
    }
  });
}, 5000);
```

### When to Use Live Mode

✅ **Ready For Live When:**
- ✅ Profitable in Paper Mode for 2-4+ weeks
- ✅ Understand leverage and liquidation mechanics
- ✅ Comfortable with risk management
- ✅ Have tested strategy in different market conditions
- ✅ Understand trading costs (fees, funding rates)
- ✅ Prepared for emotional pressure of real money
- ✅ Have capital you can afford to lose

❌ **Not Ready If:**
- ❌ New to crypto trading
- ❌ Haven't tested in Paper Mode
- ❌ Don't understand liquidation risk
- ❌ Using money you can't afford to lose
- ❌ Expecting guaranteed profits
- ❌ Haven't set up proper risk management

### Live Mode Requirements

**API Keys:**

1. **Hyperliquid Wallet Address:**
   - Your main wallet where funds are stored
   - Format: `0x...` (42 characters)
   - Get from [app.hyperliquid.xyz](https://app.hyperliquid.xyz)

2. **Agent Wallet Private Key:**
   - Generated at [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
   - Format: `0x...` (66 characters) or 64 hex characters
   - Can trade but CANNOT withdraw funds
   - Expires after validity period (30-180 days)

3. **OpenRouter API Key:**
   - Required for AI analysis
   - Get from [openrouter.ai](https://openrouter.ai)
   - Format: `sk-or-v1-...`
   - Costs: DeepSeek (free) or Qwen3 Max (~$0.50-2/1M tokens)

**Capital Requirements:**

- **Minimum:** $100 (for testing)
- **Recommended:** $500-1,000 (for meaningful trading)
- **Risk Capital Only:** Never trade with money you can't afford to lose

**Network Selection:**

- **Testnet (Recommended First):**
  - Free testnet USDC from faucet
  - Identical to mainnet (same features)
  - Zero financial risk
  - Perfect for final validation

- **Mainnet (Real Trading):**
  - Real USDC required
  - Real profits and losses
  - All trading costs apply
  - Use after testnet success

### Live Mode Setup

**Step 1: Prepare API Keys**

Follow the [API Key Setup Guide](./API_KEY_SETUP.md):
- Generate Hyperliquid agent wallet
- Get OpenRouter API key
- Store keys securely (password manager)

**Step 2: Fund Your Account**

**For Testnet:**
- Visit [app.hyperliquid-testnet.xyz/drip](https://app.hyperliquid-testnet.xyz/drip)
- Request free testnet USDC
- Wait for confirmation

**For Mainnet:**
- Bridge USDC from Arbitrum One to Hyperliquid
- Use the "Deposit" button at [app.hyperliquid.xyz](https://app.hyperliquid.xyz)
- Start with small amount ($100-500)

**Step 3: Configure Live Mode**

In the DeX Trading Agent:
- Click **"API Keys"** tab
- Enter Hyperliquid wallet address
- Enter agent wallet private key
- Enter OpenRouter API key
- Click **"Save & Continue"**

**Step 4: Select Network**

- Click network badge in header
- Choose **🔵 TESTNET** (recommended first) or **🟣 MAINNET**
- Confirm selection

**Step 5: Switch to Live Mode**

- Click mode badge in header
- Select **🔴 LIVE**
- Read and confirm warning
- Mode switches to live trading

**Step 6: Configure Risk Settings**

Open Trading Controls:
- Set conservative leverage (1x-5x recommended)
- Configure stop loss (1-2% recommended)
- Configure take profit (2-5% recommended)
- Enable trailing stop loss
- Select coins to trade (start with 1-2)

**Step 7: Test Connection**

- Click **"Test Hyperliquid Connection"** in Trading Controls
- Verify successful connection
- Check balance displays correctly

**Step 8: Start Trading**

- Place a small test trade manually
- Verify execution on Hyperliquid
- Monitor position and P&L
- Once comfortable, enable auto-trading

### Live Mode Best Practices

**Risk Management (CRITICAL):**

1. **Position Sizing:**
   - Risk only 1-2% of balance per trade
   - Example: $1,000 balance → max $10-20 risk per trade
   - Use stop losses to enforce risk limits

2. **Leverage Control:**
   - Start with 1x-3x leverage
   - Max 5x-10x for experienced traders
   - Never use 40x leverage (extremely risky)

3. **Stop Loss Discipline:**
   - Always set stop losses
   - Place 15-20% away from liquidation price
   - Never move stop loss further away

4. **Take Profit Strategy:**
   - Set realistic targets (2-5% gains)
   - Use trailing stops to lock in profits
   - Don't be greedy (take profits when available)

5. **Margin Monitoring:**
   - Keep margin usage <50%
   - System auto-pauses at 80%
   - Close positions if approaching 70%

**Trading Discipline:**

✅ **Do:**
- Follow your trading plan strictly
- Keep a trading journal
- Review trades regularly
- Start small and scale gradually
- Take breaks after losses
- Use testnet first

❌ **Don't:**
- Revenge trade after losses
- Over-leverage positions
- Ignore stop losses
- Trade emotionally
- Risk more than you can afford
- Skip risk management

**Funding Rate Management:**

Funding rates are paid/received every 8 hours:
- **Positive funding (>0.01%):** Longs pay shorts (many longs = bearish signal)
- **Negative funding (<-0.01%):** Shorts pay longs (many shorts = bullish signal)
- **High funding (>0.05%):** Consider closing position or switching side
- **Cost impact:** 0.03% funding × 3 times/day = 0.09%/day = 2.7%/month

**Performance Tracking:**

Monitor these metrics:
- **Win Rate:** Aim for >50%
- **Average P&L:** Positive expectancy
- **Risk/Reward:** Minimum 1:2 ratio
- **Maximum Drawdown:** Keep <20%
- **Sharpe Ratio:** Risk-adjusted returns

**Emergency Procedures:**

If things go wrong:
1. **Close All Positions:** Use "Close All" button
2. **Disable Auto-Trading:** Turn off AI trading immediately
3. **Review Logs:** Check what went wrong
4. **Reduce Leverage:** Lower risk for next trades
5. **Take a Break:** Don't trade emotionally

### Live Mode Costs

**Trading Fees (Hyperliquid):**
- **Maker Fee:** ~0.02% (adding liquidity)
- **Taker Fee:** ~0.035% (taking liquidity)
- **Example:** $1,000 trade = $0.20-0.35 fee

**Funding Rates:**
- **Typical Range:** -0.01% to +0.05% per 8 hours
- **Paid 3x Daily:** Every 8 hours (00:00, 08:00, 16:00 UTC)
- **Example:** 0.03% × 3 = 0.09%/day = $0.90/day on $1,000 position

**AI Analysis Costs:**
- **DeepSeek V3.1:** Free (rate limited)
- **Qwen3 Max:** ~$0.50-2.00 per 1M tokens
- **Typical Usage:** $5-30/month for active trading

**Total Cost Example:**

$1,000 position, 5x leverage, held 1 day:
- Entry fee: $1.75 (0.035% × $5,000)
- Funding: $4.50 (0.09% × $5,000)
- Exit fee: $1.75 (0.035% × $5,000)
- **Total:** $8.00 (0.8% of position)

**Breakeven Calculation:**

To break even, your trade must profit more than total costs:
- Fees + Funding = 0.8% (1-day hold)
- Minimum profit target: 1-2% (covers costs + small profit)

---

## 5. Switching Between Modes

### How to Switch Modes

**Method 1: Mode Badge (Header)**

1. Click the mode badge in the header:
   - **📄 PAPER** (green)
   - **🔴 LIVE** (red)
   - **🎮 DEMO** (blue)

2. Select new mode from dropdown

3. Confirm switch (warning shown for Live mode)

**Method 2: API Key Setup**

1. Click **Settings** icon (gear) in header

2. Select **"Clear All Settings"**

3. Confirm reset

4. Choose new mode in API Key Setup screen

### What Happens When Switching

**From Demo → Paper:**
- Balance resets to $10,000 (default)
- Open positions closed
- Trading history cleared
- Settings preserved

**From Demo → Live:**
- Requires API key configuration
- Balance fetched from Hyperliquid
- No open positions initially
- Settings preserved

**From Paper → Live:**
- Requires API key configuration
- Balance fetched from Hyperliquid
- Paper positions closed
- Settings preserved

**From Live → Paper/Demo:**
- **WARNING:** Open live positions remain on Hyperliquid!
- Must manually close live positions first
- Balance resets to paper/demo balance
- Settings preserved

**Important:** Always close live positions before switching away from Live mode!

### Mode-Specific Data

Each mode maintains separate data:

| Data Type | Demo | Paper | Live |
|-----------|------|-------|------|
| Balance | Separate | Separate | Separate |
| Positions | Separate | Separate | Separate |
| History | Separate | Separate | Separate |
| Settings | Shared | Shared | Shared |

**Settings Shared Across Modes:**
- Leverage
- Take profit %
- Stop loss %
- Allowed coins
- Chart type/interval
- AI model selection
- Custom prompt

---

## 6. Mode Selection Guide

### Decision Tree

```
Are you new to crypto trading?
├─ YES → Start with Demo Mode
│         Learn basics for 1-2 weeks
│         ↓
│         Ready to test strategies?
│         ├─ YES → Move to Paper Mode
│         │         Test for 2-4 weeks
│         │         ↓
│         │         Consistently profitable?
│         │         ├─ YES → Try Live Mode (Testnet)
│         │         │         Test with free testnet USDC
│         │         │         ↓
│         │         │         Still profitable?
│         │         │         ├─ YES → Live Mode (Mainnet)
│         │         │         │         Start with small capital
│         │         │         └─ NO → Back to Paper Mode
│         │         └─ NO → Stay in Paper Mode
│         └─ NO → Stay in Demo Mode
└─ NO → Do you have a tested strategy?
          ├─ YES → Start with Paper Mode
          │         Validate strategy for 2-4 weeks
          │         ↓
          │         Profitable?
          │         ├─ YES → Live Mode (Testnet first)
          │         └─ NO → Refine strategy in Paper Mode
          └─ NO → Start with Paper Mode
                    Develop strategy for 2-4 weeks
```

### Recommended Learning Path

**Week 1-2: Demo Mode**
- Learn platform interface
- Understand leverage mechanics
- Practice placing trades
- Test AI analysis features
- Experiment with different strategies

**Week 3-6: Paper Mode**
- Develop trading strategy
- Test risk management rules
- Track performance metrics
- Validate AI recommendations
- Aim for consistent profitability

**Week 7-8: Live Mode (Testnet)**
- Test with free testnet USDC
- Experience real execution
- Validate strategy with fees/slippage
- Build confidence

**Week 9+: Live Mode (Mainnet)**
- Start with small capital ($100-500)
- Scale gradually as profitable
- Maintain strict risk management
- Continue learning and improving

### Mode Selection by Goal

**Goal: Learn Trading Basics**
→ **Demo Mode** (1-2 weeks)

**Goal: Test Trading Strategy**
→ **Paper Mode** (2-4 weeks)

**Goal: Validate Before Live**
→ **Live Mode (Testnet)** (1-2 weeks)

**Goal: Real Trading**
→ **Live Mode (Mainnet)** (ongoing)

**Goal: Show Platform to Others**
→ **Demo Mode** (instant)

**Goal: Backtest AI Model**
→ **Paper Mode** (2-4 weeks)

---

## 7. Best Practices by Mode

### Demo Mode Best Practices

✅ **Focus on Learning:**
- Understand interface and features
- Learn leverage mechanics
- Practice risk management
- Test AI analysis

✅ **Experiment Freely:**
- Try extreme leverage (to see consequences)
- Test different strategies
- Make mistakes without cost
- Learn from failures

❌ **Don't:**
- Expect demo results to match live
- Skip Paper Mode before going live
- Develop bad habits (ignoring risk management)

### Paper Mode Best Practices

✅ **Treat as Real Money:**
- Follow risk management strictly
- Set stop losses always
- Track every trade
- Maintain trading journal

✅ **Test Systematically:**
- Define clear strategy rules
- Track performance metrics
- Test in different market conditions
- Validate AI recommendations

✅ **Aim for Consistency:**
- 2-4 weeks of testing minimum
- Positive expectancy (average P&L > 0)
- Win rate >50% or high risk/reward
- Maximum drawdown <20%

❌ **Don't:**
- Rush to live mode
- Ignore losses (analyze them)
- Over-leverage unrealistically
- Skip trade journaling

### Live Mode Best Practices

✅ **Risk Management (CRITICAL):**
- Risk only 1-2% per trade
- Use stop losses always
- Keep leverage low (1x-5x)
- Monitor margin usage
- Close positions if margin >70%

✅ **Trading Discipline:**
- Follow your trading plan
- Don't revenge trade
- Take breaks after losses
- Review trades regularly
- Scale gradually

✅ **Cost Awareness:**
- Account for fees in profit targets
- Monitor funding rates
- Close positions before high funding
- Calculate breakeven points

❌ **Don't:**
- Trade emotionally
- Over-leverage (>10x)
- Ignore stop losses
- Risk more than you can afford
- Chase losses

---

## 8. Common Misconceptions

### Misconception 1: "Demo Mode is Realistic"

**Reality:** Demo mode lacks fees, slippage, funding rates, and emotional pressure. It's great for learning but not for strategy validation.

**Solution:** Use Paper Mode for realistic testing.

### Misconception 2: "Paper Mode Results = Live Results"

**Reality:** Paper mode still lacks fees, slippage, and emotions. Expect 10-20% worse performance in live trading.

**Solution:** Account for costs in your profit targets. Test on testnet before mainnet.

### Misconception 3: "I Can Use 40x Leverage Safely"

**Reality:** 40x leverage means a 2.5% price move liquidates your position. Extremely risky.

**Solution:** Start with 1x-3x leverage. Max 5x-10x for experienced traders.

### Misconception 4: "AI Will Make Me Rich"

**Reality:** AI is a tool, not a guarantee. It can help but requires proper risk management and human oversight.

**Solution:** Use AI as decision support, not autopilot. Always validate recommendations.

### Misconception 5: "I Can Skip Paper Mode"

**Reality:** Paper mode is essential for strategy validation. Skipping it often leads to losses.

**Solution:** Test in Paper Mode for 2-4 weeks minimum before going live.

### Misconception 6: "Testnet is Unnecessary"

**Reality:** Testnet provides final validation with real execution but no financial risk.

**Solution:** Always test on testnet before mainnet, especially for new strategies.

### Misconception 7: "Stop Losses are Optional"

**Reality:** Stop losses are mandatory for risk management. Without them, one bad trade can wipe out your account.

**Solution:** Always set stop losses, 15-20% away from liquidation price.

### Misconception 8: "I Can Recover Losses by Increasing Leverage"

**Reality:** This is revenge trading and often leads to larger losses.

**Solution:** Take a break after losses. Stick to your risk management plan.

---

## 9. FAQ

### General Questions

**Q: Which mode should I start with?**

A: Start with **Demo Mode** if you're new to trading (1-2 weeks), then move to **Paper Mode** for strategy testing (2-4 weeks), then **Live Mode (Testnet)** for final validation (1-2 weeks), and finally **Live Mode (Mainnet)** with small capital.

**Q: Can I switch modes anytime?**

A: Yes, but always close live positions before switching away from Live mode.

**Q: Do I need API keys for Demo/Paper mode?**

A: No API keys required for Demo/Paper mode. OpenRouter key is optional for AI analysis.

**Q: Is my data saved when switching modes?**

A: Each mode has separate balance, positions, and history. Settings are shared across modes.

### Demo Mode Questions

**Q: How do I reset my demo balance?**

A: Click the "Reset" button in the Balance card on the dashboard.

**Q: Can I use AI in Demo mode?**

A: Yes, if you add an OpenRouter API key. Without it, AI features are disabled.

**Q: Does demo mode use real market data?**

A: Yes, demo mode uses real-time prices from Binance.

**Q: Why are my demo results better than paper/live?**

A: Demo mode has no fees, slippage, or funding rates. It's less realistic.

### Paper Mode Questions

**Q: How realistic is Paper Mode?**

A: About 60% realistic. It has real market data and simulated execution but lacks fees, slippage, and emotions.

**Q: How long should I test in Paper Mode?**

A: Minimum 2-4 weeks. Aim for consistent profitability before going live.

**Q: Can I use auto-trading in Paper Mode?**

A: Yes, auto-trading works in Paper Mode (requires OpenRouter API key).

**Q: What's a good win rate in Paper Mode?**

A: Aim for >50% win rate or high risk/reward ratio (1:2 or better).

### Live Mode Questions

**Q: Should I start with testnet or mainnet?**

A: Always start with **testnet** first. It's identical to mainnet but uses free testnet USDC.

**Q: How much capital do I need for live trading?**

A: Minimum $100 for testing, recommended $500-1,000 for meaningful trading.

**Q: What leverage should I use?**

A: Start with 1x-3x leverage. Max 5x-10x for experienced traders. Never use 40x.

**Q: How do I avoid liquidation?**

A: Use low leverage (1x-5x), set stop losses 15-20% from liquidation price, and keep margin usage <50%.

**Q: What are funding rates?**

A: Fees paid/received every 8 hours between longs and shorts. Typically -0.01% to +0.05%.

**Q: Can I withdraw funds using the agent wallet?**

A: No, agent wallets can trade but CANNOT withdraw. This is a security feature.

**Q: What happens if I lose my agent wallet private key?**

A: You can revoke the old agent wallet and generate a new one at [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API).

**Q: How do I know if I'm ready for live trading?**

A: You're ready if you're consistently profitable in Paper Mode for 2-4+ weeks, understand risk management, and have capital you can afford to lose.

### Risk Management Questions

**Q: How much should I risk per trade?**

A: Risk only 1-2% of your balance per trade. Example: $1,000 balance → max $10-20 risk.

**Q: What's a safe leverage level?**

A: 1x-3x for beginners, 5x-10x for experienced traders. Avoid >10x leverage.

**Q: Should I always use stop losses?**

A: Yes, always. Stop losses are mandatory for risk management.

**Q: What's a good take profit target?**

A: 2-5% gains are realistic. Use trailing stops to lock in profits.

**Q: How do I calculate liquidation price?**

A: Liquidation price ≈ Entry Price × (1 ± 1/Leverage). Example: $50,000 entry, 5x leverage → liquidation at ~$40,000 (long) or ~$60,000 (short).

### AI Trading Questions

**Q: Is AI trading profitable?**

A: AI is a tool, not a guarantee. It can help but requires proper risk management and human oversight.

**Q: Which AI model should I use?**

A: **DeepSeek V3.1** (free) for most users. **Qwen3 Max** (paid) for potentially better analysis.

**Q: Can I customize the AI prompt?**

A: Yes, in Trading Controls → AI Prompt Template. Advanced users can customize the analysis framework.

**Q: Should I trust AI recommendations blindly?**

A: No, always validate AI recommendations. Use AI as decision support, not autopilot.

**Q: How often does AI analyze the market?**

A: Every 60 seconds when auto-trading is enabled.

---

## Summary

The DeX Trading Agent offers three distinct trading modes, each designed for specific use cases:

- **🎮 Demo Mode:** Risk-free learning environment for beginners
- **📄 Paper Mode:** Realistic simulation for strategy testing
- **🔴 Live Mode:** Real trading with actual capital

**Recommended Path:**
1. Start with **Demo Mode** (1-2 weeks) to learn basics
2. Move to **Paper Mode** (2-4 weeks) to test strategies
3. Validate on **Live Mode (Testnet)** (1-2 weeks) with free testnet USDC
4. Graduate to **Live Mode (Mainnet)** with small capital

**Key Takeaways:**
- Always start with lower-risk modes before going live
- Test strategies thoroughly in Paper Mode (2-4 weeks minimum)
- Use testnet before mainnet for final validation
- Maintain strict risk management in all modes
- Never risk more than you can afford to lose

**Remember:** The goal is not to rush to live trading, but to develop a profitable strategy through systematic testing and disciplined risk management.

---

**Need Help?**
- [Getting Started Guide](./GETTING_STARTED.md)
- [API Key Setup Guide](./API_KEY_SETUP.md)
- [Risk Management Documentation](../Trading/RISK_MANAGEMENT.md)
- [Paper Trading Engine Documentation](../Trading/PAPER_TRADING_ENGINE.md)

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone
