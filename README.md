# DeX Trading Agent - AI-Powered Trading System

![DeX CyberAgent](./public/logo.svg)

## 🚀 Overview

DeX Trading Agent is an advanced AI-driven trading system for Hyperliquid perpetual futures. It features live and paper trading modes, dynamic multi-chart analysis, interactive risk management, and secure browser-based API key storage. The system leverages DeepSeek and Qwen3 Max AI for intelligent market analysis and supports both mainnet and testnet trading.

**Important:** Hyperliquid is an independent Layer 1 blockchain (Chain ID 998 for testnet, not Arbitrum or Ethereum). The platform uses its own consensus mechanism (HyperBFT) and native token (HYPE).

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
- Dynamic CTA button that adapts based on authentication status
- Responsive design optimized for all screen sizes

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
- **Backend**: Convex (serverless backend & database)
- **Authentication**: Convex Auth with Email OTP
- **AI**: Both DeepSeek and Qwen3 Max via OpenRouter API
- **Trading**: Hyperliquid SDK (@nktkas/hyperliquid)
- **State Management**: Zustand

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Git**

You'll also need API keys for:
- **Hyperliquid API Wallet** (Recommended - Agent wallet with no withdrawal permissions)
  - Generate at https://app.hyperliquid.xyz/API
  - Provides: Master Account Address + Agent Wallet Private Key
  - **Security**: Agent wallets can trade but CANNOT withdraw funds
- **OpenRouter** (for AI analysis)

**Network Information:**
- **Hyperliquid Mainnet**: Independent L1 blockchain
- **Hyperliquid Testnet**: Chain ID 998, RPC: https://rpc.hyperliquid-testnet.xyz/evm

## 🚀 Deployment Options

### Option 1: Local Development (Native)

### 1. Clone the Repository

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

VITE_CONVEX_URL=<your-convex-deployment-url>
OPENROUTER_API_KEY=<your-openrouter-api-key>


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

### 6. Configure API Keys (In-App)

Once the app is running:

1. Navigate to the application in your browser
2. You'll be prompted to set up API keys on first launch
3. Choose your connection method:
   - **🔗 Wallet Connection** (Read-only): Connect MetaMask to view positions without exposing private keys
     - Supports Ethereum, Arbitrum, and Hyperliquid Testnet (Chain ID 998)
   - **🔑 API Keys** (Full Trading - RECOMMENDED): Enter credentials for automated AI trading
     - **Master Account Address** (Your main wallet address from https://app.hyperliquid.xyz)
     - **Agent Wallet Private Key** (Generated at https://app.hyperliquid.xyz/API - starts with "0x", 66 characters)
     - **Agent Wallet Address** (Optional, for tracking)
     - **OpenRouter API Key** (from https://openrouter.ai)
     - **Security**: Agent wallets can trade but CANNOT withdraw funds - much safer!
   - **🎮 Demo Mode**: Try the platform with simulated perpetual futures trading

**Security Note:** All API keys are stored locally in your browser's localStorage and never sent to any server.

**Network Clarification:** 
- Hyperliquid operates on its own Layer 1 blockchain, not on Ethereum or Arbitrum
- Testnet Chain ID: 998
- Mainnet and Testnet can be toggled in the Dashboard header

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
- **Never share your private keys** with anyone
- Use **Hyperliquid Agent Wallets** (recommended) - they can trade but CANNOT withdraw funds
- API keys are stored locally in browser localStorage only
- Start with **Paper Trading** to test strategies risk-free
- Use **Testnet** before trading on Mainnet
- Regularly **review trading logs** and performance metrics

### Risk Controls
- **Margin Monitoring**: Real-time margin usage calculation including unrealized PnL
- **Auto-Trading Pause**: System automatically pauses when margin exceeds 80%
- **Confirmation Dialogs**: All position closures require explicit confirmation
- **Liquidation Warnings**: Alerts when approaching dangerous margin levels
- **Position Limits**: Configurable maximum position sizes and leverage caps

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