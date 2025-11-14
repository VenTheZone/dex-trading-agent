# DeX Trading Agent - AI-Powered Perpetual Futures Trading System

![DeX CyberAgent](./public/logo.svg)

## 🚀 Overview

DeX Trading Agent is an advanced AI-driven trading system for **Hyperliquid perpetual futures**. It features live, paper, and demo trading modes with sophisticated risk management tailored for derivatives trading. The system leverages DeepSeek V3.1 and Qwen3 Max AI models for intelligent market analysis, incorporating funding rates, liquidation risk, and open interest data.

**Architecture:** Python FastAPI backend + React frontend (no authentication required for local use)

**Important:** Hyperliquid is an independent Layer 1 blockchain (Chain ID 998 for testnet). The platform uses its own consensus mechanism (HyperBFT) and native token (HYPE).

---

## 📊 System Workflow

The DeX Trading Agent follows a comprehensive system workflow designed to maximize profitability while minimizing risk in perpetual futures trading:

---

## ✨ Key Features

### 🤖 AI-Powered Perpetual Futures Analysis
- **DeepSeek V3.1** (Free) / **Qwen3 Max** (Paid) via OpenRouter
- Multi-chart correlation analysis (4 TradingView charts)
- **Derivatives-specific analysis:**
  - Funding rate impact on profitability
  - Liquidation price calculations with safety buffers
  - Mark price vs Index price monitoring
  - Open interest and long/short ratio analysis
  - Position sizing based on leverage multiplier

### 🛡️ Advanced Risk Management for Derivatives

The Trading Agent implements multi-layered risk management specifically designed for perpetual futures trading:

#### **1. Liquidation Risk Protection**
- **Real-time Liquidation Monitoring:** Calculates liquidation price based on leverage and position size
  - 5x leverage: ~20% price move buffer before liquidation
  - 10x leverage: ~10% price move buffer before liquidation
  - 20x leverage: ~5% price move buffer before liquidation
  - 40x leverage: ~2.5% price move buffer before liquidation
- **Safety Buffer Enforcement:** Stop losses are automatically placed with 15-20% buffer from liquidation price
- **Margin Usage Alerts:** System auto-pauses trading when margin usage exceeds 80%
- **Mark Price Monitoring:** Tracks mark price vs index price discrepancies to prevent unexpected liquidations

#### **2. Position Sizing & Leverage Control**
- **Maximum Risk Per Trade:** Limits risk to 2-5% of account balance per position
- **Leverage Amplification Awareness:** AI accounts for leverage multiplier when calculating position size
- **Dynamic Position Sizing:** Adjusts position size based on:
  - Account balance
  - Current volatility
  - Market conditions
  - Confidence level of AI analysis
- **AI Leverage Recommendations:** When enabled, AI can suggest optimal leverage (1x-40x) based on market conditions

#### **3. Funding Rate Management**
- **Funding Cost Tracking:** Monitors 8-hour funding rates and calculates impact on profitability
- **Crowded Position Detection:** Identifies when funding rates indicate overcrowded longs or shorts
  - Positive funding >0.05%: Many longs (bearish signal)
  - Negative funding <-0.05%: Many shorts (bullish signal)
- **Hold Duration Optimization:** Considers funding costs when determining position hold time
- **Funding Rate Alerts:** Warns when funding rates become extreme

#### **4. Stop Loss & Take Profit Strategy**
- **Smart Stop Loss Placement:**
  - Positioned at key technical levels (support/resistance)
  - Always tighter than liquidation distance
  - Accounts for market volatility and spread
  - Minimum 15-20% buffer from liquidation price
- **Take Profit Optimization:**
  - Minimum 1:2 risk/reward ratio enforced
  - Considers funding rate costs over expected hold time
  - Adjusts for market volatility
- **Trailing Stop Loss:** Dynamically adjusts stop loss as position moves into profit
  - Locks in gains while allowing position to run
  - Configurable trailing distance

#### **5. Market Structure Analysis**
- **Open Interest Monitoring:** Tracks total open interest to identify potential liquidation cascades
- **Long/Short Ratio Analysis:** Monitors market sentiment and crowded positions
- **Price Discrepancy Alerts:** Warns when mark price deviates significantly from index price
- **Liquidity Assessment:** Evaluates order book depth before executing trades

#### **6. AI-Driven Risk Assessment**
The AI model (DeepSeek V3.1 / Qwen3 Max) performs comprehensive risk analysis:
- **Multi-Factor Risk Scoring:** Combines technical, fundamental, and derivatives-specific factors
- **Confidence-Based Execution:** Only executes trades when confidence threshold is met
- **Market Condition Adaptation:** Reduces position size or avoids trading in high volatility
- **Confluence Requirement:** Requires multiple indicators to align before opening positions
- **"When in Doubt, HOLD" Philosophy:** Prioritizes capital preservation over aggressive gains

#### **7. Emergency Controls**
- **Auto-Pause Mechanism:** Automatically stops trading when:
  - Margin usage exceeds 80%
  - Consecutive losses exceed threshold
  - Extreme market volatility detected
  - API connection issues occur
- **Manual Override:** Users can instantly close all positions via emergency button
- **Position Limits:** Configurable maximum number of concurrent positions
- **Daily Loss Limits:** Optional daily loss cap to prevent catastrophic drawdowns

#### **8. Real-Time Monitoring & Alerts**
- **Live Position Tracking:** Real-time P&L, liquidation distance, and margin usage
- **Risk Metric Dashboard:** Visual display of all risk parameters
- **Alert System:** Notifications for:
  - Approaching liquidation levels
  - High funding rates
  - Significant price discrepancies
  - Margin usage warnings
  - Stop loss/take profit triggers

**Risk Management Philosophy:** The Trading Agent prioritizes capital preservation over aggressive gains. It's designed to survive market volatility and avoid catastrophic losses through disciplined risk management, proper position sizing, and AI-driven decision making that accounts for the unique risks of leveraged perpetual futures trading.

### 📊 Trading Modes
- **Live Trading:** Real funds on Hyperliquid Mainnet/Testnet with full derivatives features
- **Paper Trading:** Simulated trading with realistic execution and funding rate simulation
- **Demo Mode:** Practice environment with $10,000 virtual balance

### 🔒 Security & Storage
- **Browser-only API key storage** - Keys never leave your device
- **Agent Wallet Support** - Use Hyperliquid agent wallets (can trade but CANNOT withdraw)
- **No authentication required** - Local/private use only

### 📈 Real-Time Data & Monitoring
- Live balance tracking with unrealized PnL
- Position snapshots with liquidation warnings
- Comprehensive trading logs with AI reasoning
- Performance metrics and P&L history

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- React Router v7 for routing
- Tailwind CSS v4 + Shadcn UI
- Framer Motion for animations
- Zustand for state management

**Backend:**
- Python FastAPI (REST API + WebSockets)
- SQLite (local) / PostgreSQL (production)
- SQLAlchemy ORM
- Celery + Redis for background tasks

**Integrations:**
- Hyperliquid SDK (@nktkas/hyperliquid)
- OpenRouter API (DeepSeek V3.1 / Qwen3 Max)
- CryptoPanic News API (optional)
- Binance API (price data with fallback)

---

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

Run the full stack with Docker:

```bash
# Clone the repository
git clone https://github.com/your-username/de-x-trading-agent.git
cd de-x-trading-agent

# Start the application
docker-compose up --build
```

This will automatically:
- Build and run the React frontend
- Start the Python FastAPI backend
- Initialize the database
- Set up background services

---

## 📋 Prerequisites

**Required API Keys:**
- **OpenRouter API Key** (for AI analysis) - [Get it here](https://openrouter.ai)
- **Hyperliquid API Wallet** (for live trading) - [Generate here](https://app.hyperliquid.xyz/API)

**Optional:**
- **CryptoPanic API Key** (for news feed) - [Get it here](https://cryptopanic.com/developers/api/)

**For Local Development:**
- Node.js (v18+)
- pnpm (v8+)
- Python (v3.11+)
- Redis (for background tasks)
- Git

**Network Information:**
- Hyperliquid Mainnet: Independent L1 blockchain
- Hyperliquid Testnet: Chain ID 998, RPC: https://rpc.hyperliquid-testnet.xyz/evm

---

## 📚 Documentation

📖 **Full guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Note:** Free tier services sleep after 15min inactivity (~30s wake time).