# DeX Trading Agent - AI-Powered Perpetual Futures Trading System

![DeX CyberAgent](./public/logo.svg)

## 🚀 Overview

DeX Trading Agent is an advanced AI-driven trading system for **Hyperliquid perpetual futures**. It features live, paper, and demo trading modes with sophisticated risk management tailored for derivatives trading. The system leverages DeepSeek V3.1 and Qwen3 Max AI models for intelligent market analysis, incorporating funding rates, liquidation risk, and open interest data.

**Architecture:** Python FastAPI backend + React frontend (no authentication required for local use)

**Important:** Hyperliquid is an independent Layer 1 blockchain (Chain ID 998 for testnet). The platform uses its own consensus mechanism (HyperBFT) and native token (HYPE).

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
- **Liquidation Risk Monitoring:** Real-time calculation based on leverage (5x = ~20% buffer, 10x = ~10% buffer, etc.)
- **Funding Rate Tracking:** Monitor funding costs and crowded positions
- **Margin Usage Alerts:** Auto-pause at 80% margin usage
- **Smart Stop Loss:** Placement with safety buffer from liquidation price
- **Take Profit Optimization:** Considers funding rate costs over time
- **Trailing Stops:** Dynamic adjustment as position moves in profit

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

## 📋 Prerequisites

**Required Software:**
- Node.js (v18+)
- pnpm (v8+)
- Python (v3.11+)
- Redis (for background tasks)
- Git

**Required API Keys:**
- **Hyperliquid API Wallet** (Agent wallet recommended - cannot withdraw funds)
  - Generate at https://app.hyperliquid.xyz/API
  - Provides: Master Account Address + Agent Wallet Private Key
- **OpenRouter API Key** (for AI analysis) - https://openrouter.ai
- **CryptoPanic API Key** (optional, for news feed)

**Network Information:**
- Hyperliquid Mainnet: Independent L1 blockchain
- Hyperliquid Testnet: Chain ID 998, RPC: https://rpc.hyperliquid-testnet.xyz/evm

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

See [README.Docker.md](./README.Docker.md) for full Docker setup instructions.