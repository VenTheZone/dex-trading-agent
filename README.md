# DeX Trading Agent - AI-Powered Trading System

![DeX CyberAgent](./public/logo.svg)

## 🚀 Overview

DeX CyberAgent is an advanced AI-driven trading system for Hyperliquid perpetual futures. It features live and paper trading modes, dynamic multi-chart analysis, interactive risk management, and secure browser-based API key storage. The system leverages DeepSeek AI for intelligent market analysis and supports both mainnet and testnet trading.

## ✨ Key Features

- **🤖 AI-Powered Analysis**: DeepSeek V3.1 powered market decisions with multi-chart correlation analysis
- **📊 Multi-Chart Trading**: 4 TradingView charts with time-based and range-based analysis
- **🔒 Secure Storage**: Browser-only API key storage - keys never leave your device
- **⚡ Risk Control**: Advanced TP/SL management with trailing stops and partial profit taking
- **🌐 Network Selection**: Trade on Hyperliquid Mainnet or Testnet
- **📄 Paper Trading**: Risk-free testing with simulated trading environment
- **🎯 Coin Selection**: Choose up to 5 coins for AI to trade (including high-volume meme coins)
- **📈 Performance Tracking**: Real-time balance history and P&L tracking

## 🎨 Landing Page

The landing page features a cyberpunk-themed design with:
- Animated trading background with grid patterns and glowing effects
- Prominent logo with pulsing glow animation
- Feature showcase highlighting AI Analysis, Multi-Chart capabilities, Security, and Risk Control
- Dynamic CTA button that adapts based on authentication status
- Responsive design optimized for all screen sizes

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Animations**: Framer Motion
- **Backend**: Convex (serverless backend & database)
- **Authentication**: Convex Auth with Email OTP
- **AI**: DeepSeek via OpenRouter API
- **Trading**: Hyperliquid SDK (@nktkas/hyperliquid)
- **State Management**: Zustand

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Git**

You'll also need API keys for:
- **Hyperliquid** (API Key + Private Key for trading)
- **OpenRouter** (for AI analysis)

## 🚀 Local Deployment Instructions

### 1. Clone the Repository
```
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

### 2. Install Dependencies
```
pnpm install
```

### 3. Set Up Convex

Install Convex CLI globally (if not already installed)
```
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

The application will be available at `http://localhost:5173`

### 6. Configure API Keys (In-App)

Once the app is running:

1. Navigate to the application in your browser
2. You'll be prompted to set up API keys on first launch
3. Enter your:
   - **Hyperliquid API Key** (from https://app.hyperliquid.xyz)
   - **Hyperliquid API Secret** (your wallet's private key - starts with "0x", 66 characters)
   - **Wallet Address** (optional, for position tracking)
   - **OpenRouter API Key** (from https://openrouter.ai)

**Security Note:** All API keys are stored locally in your browser's localStorage and never sent to any server.

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

## 🔒 Security Best Practices

- **Never share your private keys** with anyone
- Use **read-only or trading-restricted API keys** when possible
- Start with **Paper Trading** to test strategies risk-free
- Use **Testnet** before trading on Mainnet
- Keep your **leverage low** until you're comfortable with the system
- Regularly **review trading logs** and performance metrics

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

**Made by VenTheZone**
