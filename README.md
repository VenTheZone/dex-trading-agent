# DeX Trading Agent - AI-Powered Trading System

![DeX CyberAgent](./public/logo.svg)

## 🚀 Overview

DeX Trading Agent is an advanced AI-driven trading system for Hyperliquid perpetual futures. It features live and paper trading modes, dynamic multi-chart analysis, interactive risk management, and secure browser-based API key storage. The system leverages DeepSeek and Qwen3 Max AI for intelligent market analysis and supports both mainnet and testnet trading.

**Important:** Hyperliquid is an independent Layer 1 blockchain (Chain ID 998 for testnet, not Arbitrum or Ethereum). The platform uses its own consensus mechanism (HyperBFT) and native token (HYPE).

## 📊 System Workflow

Here's a visual representation of how the DeX Trading Agent works:
DeX Trading Agent is an advanced AI-driven trading system for Hyperliquid perpetual futures. It features live and paper trading modes, dynamic multi-chart analysis, interactive risk management, and secure browser-based API key storage. The system leverages DeepSeek and Qwen3 Max AI for intelligent market analysis and supports both mainnet and testnet trading.

**Important:** Hyperliquid is an independent Layer 1 blockchain (Chain ID 998 for testnet, not Arbitrum or Ethereum). The platform uses its own consensus mechanism (HyperBFT) and native token (HYPE).

## 📊 System Workflow

Here's a visual representation of how the DeX Trading Agent works:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Landing    │───▶│     Auth     │───▶│  Dashboard   │                  │
│  │     Page     │    │   (Optional) │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘                  │
│                                                   │                           │
│                                                   ▼                           │
│                                    ┌──────────────────────┐                  │
│                                    │  Trading Controls    │                  │
│                                    │  - Mode Selection    │                  │
│                                    │  - Network Toggle    │                  │
│                                    │  - Coin Selection    │                  │
│                                    │  - Risk Settings     │                  │
│                                    └──────────┬───────────┘                  │
└───────────────────────────────────────────────┼──────────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA COLLECTION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐         ┌─────────────────┐         ┌────────────────┐│
│  │  TradingView    │         │   Binance API   │         │  CryptoPanic   ││
│  │    Charts       │         │  (Price Data)   │         │     News       ││
│  │  (4 Symbols)    │         │   + Fallback    │         │   Sentiment    ││
│  └────────┬────────┘         └────────┬────────┘         └────────┬───────┘│
│           │                           │                            │         │
│           └───────────────────────────┼────────────────────────────┘         │
│                                       │                                      │
│                                       ▼                                      │
│                          ┌────────────────────────┐                         │
│                          │   Market Data Cache    │                         │
│                          │  (Convex Database)     │                         │
│                          └────────────┬───────────┘                         │
└─────────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI ANALYSIS LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Multi-Chart AI Analysis                           │   │
│  │                                                                      │   │
│  │  ┌────────────────┐              ┌────────────────┐                │   │
│  │  │   DeepSeek     │              │   Qwen3 Max    │                │   │
│  │  │   V3.1 Model   │      OR      │     Model      │                │   │
│  │  │  (via OpenRouter)             │ (via OpenRouter)                │   │
│  │  └────────┬───────┘              └────────┬───────┘                │   │
│  │           │                               │                         │   │
│  │           └───────────────┬───────────────┘                         │   │
│  │                           ▼                                         │   │
│  │              ┌────────────────────────┐                             │   │
│  │              │  AI Decision Engine    │                             │   │
│  │              │  - Analyze 4 charts    │                             │   │
│  │              │  - Market correlation  │                             │   │
│  │              │  - Risk assessment     │                             │   │
│  │              │  - Position sizing     │                             │   │
│  │              └────────────┬───────────┘                             │   │
│  │                           │                                         │   │
│  │                           ▼                                         │   │
│  │              ┌────────────────────────┐                             │   │
│  │              │   Trade Decision       │                             │   │
│  │              │   - Action: LONG/SHORT │                             │   │
│  │              │   - Symbol: BTC/ETH... │                             │   │
│  │              │   - Size & Leverage    │                             │   │
│  │              │   - TP/SL Levels       │                             │   │
│  │              │   - Confidence Score   │                             │   │
│  │              └────────────┬───────────┘                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TRADE EXECUTION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                    ┌────────────────────────┐                                │
│                    │  Trade Confirmation    │                                │
│                    │  Modal (User Approval) │                                │
│                    └────────────┬───────────┘                                │
│                                 │                                             │
│                    ┌────────────▼───────────┐                                │
│                    │   Execution Router     │                                │
│                    └────────────┬───────────┘                                │
│                                 │                                             │
│         ┌───────────────────────┼───────────────────────┐                    │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │    LIVE     │        │    PAPER    │        │    DEMO     │             │
│  │   Trading   │        │   Trading   │        │    Mode     │             │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘             │
│         │                      │                       │                     │
│         ▼                      ▼                       ▼                     │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐             │
│  │ Hyperliquid │        │   Local     │        │  Simulated  │             │
│  │  Mainnet/   │        │  Paper      │        │   Trading   │             │
│  │   Testnet   │        │  Engine     │        │   Engine    │             │
│  │             │        │             │        │             │             │
│  │ - Real API  │        │ - Virtual   │        │ - No API    │             │
│  │ - Real $$$  │        │   Balance   │        │ - Practice  │             │
│  │ - TP/SL     │        │ - Realistic │        │ - Learning  │             │
│  │ - Trailing  │        │   Execution │        │             │             │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘             │
│         │                      │                       │                     │
│         └──────────────────────┼───────────────────────┘                     │
│                                │                                             │
│                                ▼                                             │
│                    ┌────────────────────────┐                                │
│                    │   Position Manager     │                                │
│                    │   - Track Positions    │                                │
│                    │   - Monitor P&L        │                                │
│                    │   - Trailing Stops     │                                │
│                    │   - Risk Management    │                                │
│                    └────────────┬───────────┘                                │
└─────────────────────────────────────────┼──────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MONITORING & LOGGING LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Trading    │  │   Balance    │  │   Position   │  │   System     │   │
│  │     Logs     │  │   History    │  │  Snapshots   │  │    Alerts    │   │
│  │              │  │              │  │              │  │              │   │
│  │ - Actions    │  │ - P&L Track  │  │ - Real-time  │  │ - Margin     │   │
│  │ - Reasoning  │  │ - Performance│  │ - Historical │  │ - Liquidation│   │
│  │ - Timestamps │  │ - Charts     │  │ - Analytics  │  │ - Errors     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │                 │            │
│         └─────────────────┴──────────────────┴─────────────────┘            │
│                                     │                                        │
│                                     ▼                                        │
│                        ┌────────────────────────┐                           │
│                        │   Convex Database      │                           │
│                        │   (Real-time Sync)     │                           │
│                        └────────────────────────┘                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   Dashboard Display    │
                        │   - Live Charts        │
                        │   - Balance Updates    │
                        │   - Position Status    │
                        │   - Trading Logs       │
                        │   - Performance Metrics│
                        └────────────────────────┘
```

### 🔄 Auto-Trading Loop (Every 10 seconds when enabled)

```
START
  │
  ├─▶ Fetch Market Data (4 selected coins)
  │     │
  │     ├─▶ Binance API (Primary)
  │     └─▶ Fallback Sources (if needed)
  │
  ├─▶ Run Multi-Chart AI Analysis
  │     │
  │     ├─▶ Send data to DeepSeek/Qwen3 Max
  │     ├─▶ Analyze correlations & trends
  │     └─▶ Generate trade recommendation
  │
  ├─▶ Validate Trade Decision
  │     │
  │     ├─▶ Check allowed coins
  │     ├─▶ Verify margin availability
  │     ├─▶ Assess risk parameters
  │     └─▶ Confirm confidence threshold
  │
  ├─▶ Execute Trade (if approved)
  │     │
  │     ├─▶ Show confirmation modal
  │     ├─▶ Place order on Hyperliquid/Paper
  │     ├─▶ Set TP/SL levels
  │     └─▶ Log trade details
  │
  ├─▶ Monitor Active Positions
  │     │
  │     ├─▶ Track P&L in real-time
  │     ├─▶ Update trailing stops
  │     ├─▶ Check margin usage
  │     └─▶ Auto-pause if risk threshold hit
  │
  └─▶ Wait 10 seconds → REPEAT
```

### 🔐 Security & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LocalStorage (Encrypted)                   │   │
│  │  - Hyperliquid API Keys (never sent to server)      │   │
│  │  - OpenRouter API Key (only sent to OpenRouter)     │   │
│  │  - User Preferences                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application                       │   │
│  │  - UI Components                                     │   │
│  │  - State Management (Zustand)                       │   │
│  │  - Real-time Subscriptions                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONVEX BACKEND (Serverless)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Convex Functions                        │   │
│  │  - Queries (Real-time subscriptions)                │   │
│  │  - Mutations (Database updates)                     │   │
│  │  - Actions (External API calls)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│                           ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Convex Database (Real-time)                │   │
│  │  - Trading Logs                                      │   │
│  │  - Balance History                                   │   │
│  │  - Position Snapshots                                │   │
│  │  - User Settings                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Hyperliquid  │  │  OpenRouter  │  │  CryptoPanic │      │
│  │     API      │  │  (AI Models) │  │    (News)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Key Features

- **🤖 AI-Powered Analysis**: DeepSeek V3.1 / Qwen3 Max powered market decisions with multi-chart correlation analysis
- **📊 Multi-Chart Trading**: 4 TradingView charts with time-based and range-based analysis
- **🔒 Secure Storage**: Browser-only API key storage with format validation - keys never leave your device
- **⚡ Advanced Risk Control**: 
  - Real-time margin monitoring with unrealized PnL calculation
  - Auto-pause at 80% margin usage
  - Confirmation dialogs for all position closures
  - Advanced TP/SL management with trailing stops
- **🌐 Network Selection**: Trade on Hyperliquid Mainnet or Testnet
- **📄 Paper Trading**: Risk-free testing with simulated trading environment
- **🎯 Coin Selection**: Choose up to 5 coins for AI to trade (including high-volume meme coins)
- **📈 Performance Tracking**: Real-time balance history and P&L tracking with adaptive polling
- **🛡️ Reliability**: Binance API fallback mechanism with price caching for uninterrupted data

## 🎨 Landing Page

The landing page features a cyberpunk-themed design with:
- Animated trading background with grid patterns and glowing effects
- Prominent logo with pulsing glow animation
- Feature showcase highlighting AI Analysis, Multi-Chart capabilities, Security, and Risk Control
- Direct access buttons to enter the dashboard or preview it
- Responsive design optimized for all screen sizes

## 🔒 Authentication

**No authentication required!** The application provides direct access to all features without any login or sign-up process. Simply navigate to the dashboard and start trading.

**API Key Storage Options:**
- **Client-Side (Default)**: API keys stored in browser localStorage - ideal for personal use
- **Backend Environment Variables**: Configure keys in `.env` or Convex Dashboard - ideal for self-hosted/production deployments
- **Hybrid**: Client-side keys take priority, with backend keys as fallback

## 🔔 Trade Confirmation & Safety Features

- **Trade Confirmation Modal**: Every trade requires explicit confirmation before execution
  - Displays complete trade details including symbol, action, price, size, leverage, and total value
  - Shows stop loss and take profit levels
  - Clear visual warnings for live trading vs paper trading
  - Network indicator (Mainnet/Testnet)
- **Close All Positions Dialog**: Confirmation required before closing multiple positions
  - Shows position count and mode-specific warnings
  - Prevents accidental mass position closure
  - Different styling for live vs paper/demo modes
- **Trade History Logging**: Comprehensive logging system tracks all trading activity
  - Real-time trade logs with timestamps
  - Detailed information including entry/exit prices, P&L, and reasoning
  - Filterable and searchable trade history
  - Export capabilities for analysis

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Animations**: Framer Motion
- **Backend**: Python FastAPI (REST API + WebSockets)
- **Database**: SQLite (local) / PostgreSQL (production)
- **Background Tasks**: Celery + Redis
- **Authentication**: None (local/private use only)
- **AI**: Both DeepSeek and Qwen3 Max via OpenRouter API
- **Trading**: Hyperliquid SDK (@nktkas/hyperliquid)
- **State Management**: Zustand

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Python** (v3.11 or higher)
- **Redis** (for Celery background tasks)
- **Git**

You'll also need API keys for:
- **Hyperliquid API Wallet** (Recommended - Agent wallet with no withdrawal permissions)
  - Generate at https://app.hyperliquid.xyz/API
  - Provides: Master Account Address + Agent Wallet Private Key
  - **Security**: Agent wallets can trade but CANNOT withdraw funds
- **OpenRouter** (for AI analysis)
- **CryptoPanic** (for news feed - optional)

**Network Information:**
- **Hyperliquid Mainnet**: Independent L1 blockchain
- **Hyperliquid Testnet**: Chain ID 998, RPC: https://rpc.hyperliquid-testnet.xyz/evm

## 🚀 Deployment Options

### Option 1: Docker (Recommended for Local Development)

Docker provides an isolated, consistent environment for running the DeX Trading Agent locally with your API keys.

#### Prerequisites
- **Docker Desktop** installed (https://www.docker.com/products/docker-desktop)
- **Docker Compose** (included with Docker Desktop)
- **Convex account** with your project deployed
- **API Keys** (OpenRouter, CryptoPanic)

#### Quick Start

1. **Clone the Repository**

### 2. Install Dependencies
```
pnpm install
```

### 3. Set Up Convex

Install Convex CLI globally (if not already installed)
```
pnpm add -g convex
```

If convex fails to start try
```
export PNPM_HOME="~/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm add -g convex
```

Initialize and deploy Convex backend
```
npx convex dev
```

This will:
- Create a new Convex project (if first time)
- Generate your `CONVEX_DEPLOYMENT` URL
- Start the Convex development server
- Watch for changes in your `src/convex/` directory

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:
```
OPENROUTER_API_KEY=
HYPERLIQUID_MASTER_ADDRESS= # Wallet private key
HYPERLIQUID_AGENT_PRIVATE_KEY= # From https://openrouter.ai
```

**Note:** The `VITE_CONVEX_URL` is automatically generated when you run `npx convex dev`. You can find it in the Convex dashboard or in the terminal output.

### 5. Run the Development Server

In a new terminal (keep Convex dev running):
```
pnpm dev
```

Within VITE, in order to show the webapp
```
--host
```


The application will be available at `http://localhost:5173`

### 6. Configure API Keys

You have two options for configuring API keys:

#### Option A: Client-Side Storage (Browser LocalStorage)
1. Navigate to the application in your browser
2. You'll be prompted to set up API keys on first launch
3. Choose your connection method:
   - **🔗 Wallet Connection** (Read-only): Connect MetaMask to view positions without exposing private keys
     - Supports Ethereum, Arbitrum, and Hyperliquid Testnet (Chain ID 998)
   - **🔑 API Keys** (Full Trading - RECOMMENDED): Enter credentials for automated AI trading
     - **Master Account Address** (Your main wallet address from https://app.hyperliquid.xyz)
     - **Agent Wallet Private Key** (Generated at https://app.hyperliquid.xyz/API - starts with "0x", 66 characters)
     - **OpenRouter API Key** (from https://openrouter.ai)
     - **Security**: 
       - ⚠️ **ALWAYS use a separate/dedicated wallet for AI trading - NEVER your main wallet!**
       - Agent wallets can trade but CANNOT withdraw funds - much safer!
       - Only 2 keys needed: Master Address + Agent Private Key (agent address is auto-derived)
   - **🎮 Demo Mode**: Try the platform with simulated perpetual futures trading

**Security Note:** All API keys are stored locally in your browser's localStorage and never sent to any server.

#### Option B: Backend Environment Variables (For Self-Hosted/Local Deployment)

For local or self-hosted deployments, you can configure API keys in the backend environment:

1. **Create a `.env` file** in the root directory (copy from `.env.example`):
```
VITE_CONVEX_URL=<your-convex-deployment-url>
OPENROUTER_API_KEY=<your-openrouter-api-key>
```
**Note:** The `VITE_CONVEX_URL` is automatically generated when you run `npx convex dev`. You can find it in the Convex dashboard or in the terminal output.

### 7. Run the Development Server

In a new terminal (keep Convex dev running):
```
pnpm dev
```

Within VITE, in order to show the webapp
```
--host
```


The application will be available at `http://localhost:5173`

## 📦 Building for Production
```
pnpm build
pnpm preview
```

## 🪙 Available Trading Coins

The system supports trading on the following assets:

**Major Cryptocurrencies:**
- BTCUSD, ETHUSD, SOLUSD, AVAXUSD, BNBUSD, ADAUSD, DOTUSD, MATICUSD

**High-Volume Meme Coins:**
- DOGEUSD 🐕, SHIBUSD 🐕, PEPEUSD 🐕, WIFUSD 🐕, BONKUSD 🐕

You can select up to 5 coins for the AI to actively trade.

## 📖 Usage

1. **Select Trading Mode**: Choose between Paper Trading (risk-free) or Live Trading (real funds)
2. **Select Network**: Choose Hyperliquid Mainnet or Testnet
3. **Configure Risk Settings**: Set leverage, take profit %, stop loss %, and other risk parameters
4. **Select Allowed Coins**: Choose up to 5 coins for AI trading
5. **Enable AI Auto-Trading**: Toggle the AI ON button to start automated analysis and trading
6. **Monitor Performance**: View real-time charts, balance history, and trading logs

## 🔒 Security & Risk Management

### Security Best Practices
- **CRITICAL: Always use a separate/dedicated wallet for AI trading**
- **NEVER use your main wallet with significant funds**
- Use **Hyperliquid Agent Wallets** (recommended) - they can trade but CANNOT withdraw funds
- **Never share your private keys** with anyone
- API keys are stored locally in browser localStorage only
- Start with **Paper Trading** to test strategies risk-free
- Use **Testnet** before trading on Mainnet
- Regularly **review trading logs** and performance metrics
- Consider using a fresh wallet with only trading capital (not your savings!)

### Risk Controls
- **Margin Monitoring**: Real-time margin usage calculation including unrealized PnL
- **Auto-Trading Pause**: System automatically pauses when margin exceeds 80%
- **Confirmation Dialogs**: All position closures require explicit confirmation
- **Liquidation Warnings**: Alerts when approaching dangerous margin levels
- **Position Limits**: Configurable maximum position sizes and leverage caps

## 🔄 Auto-Update Feature

The application automatically checks for updates from the GitHub repository every hour. When a new version is available:

1. **Update Notification**: A notification banner appears at the top of the dashboard
2. **Version Information**: Shows current version vs. latest available version
3. **Release Notes**: Displays a preview of the latest release notes
4. **Update Instructions**: Provides deployment-specific update commands

### Manual Update Check

To manually check for updates or force an update:

**For Standard Deployment:**

## 📁 Project Structure
```
src/
├── components/ # React components
│ ├── ApiKeySetup.tsx
│ ├── TradingChart.tsx
│ ├── TradingControls.tsx
│ └── ...
├── convex/ # Backend functions & schema
│ ├── schema.ts
│ ├── trading.ts
│ ├── hyperliquid.ts
│ └── ...
├── hooks/ # Custom React hooks
├── lib/ # Utility libraries
├── pages/ # Page components
└── store/ # State management
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This software is for educational purposes only. Trading cryptocurrencies carries significant risk. Never trade with funds you cannot afford to lose. The developers are not responsible for any financial losses incurred while using this software.

## 📄 License

MIT License - see LICENSE file for details

---

## Comment

inspired by Nof1's Alpha Arena 
https://nof1.ai/

I saw how well DeepSeek V3.1 and Qwen3 Max did during the competition...

But it's obvious People at Nof1 have never traded before in their life. since I didn't see any Take Profit or Stop Loss being set at all.
They just YOLOed $60k between 6 LLMs.

So I figured I'd make one myself..

Feel free to review the source code or fork it.
I even added the repo to DeepWiki
> https://deepwiki.com/VenTheZone/dex-trading-agent

Reviews and suggestions are appreciated.