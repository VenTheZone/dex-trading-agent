# Getting Started - Quick Start Guide

## Welcome to DeX Trading Agent! 🚀

This guide will help you get started with the DeX Trading Agent in **under 10 minutes**. Whether you're new to trading or an experienced trader, this step-by-step guide will walk you through everything you need to know.

**What You'll Learn:**
- How to install and run the Trading Agent
- How to configure your API keys
- How to choose between Live, Testnet, Paper, and Demo modes
- How to execute your first trade
- Essential tips for safe trading

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [First Launch](#first-launch)
4. [Choosing Your Trading Mode](#choosing-your-trading-mode)
5. [API Key Setup](#api-key-setup)
6. [Understanding the Dashboard](#understanding-the-dashboard)
7. [Your First Trade](#your-first-trade)
8. [Essential Settings](#essential-settings)
9. [Safety Tips](#safety-tips)
10. [Next Steps](#next-steps)
11. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### What You Need

**For Demo Mode (No Setup Required):**
- ✅ Nothing! Just run the application

**For Paper Trading (Simulated Trading):**
- ✅ Nothing! Just run the application

**For Testnet Trading (Safe Testing with Fake Funds):**
- 🔑 Hyperliquid Testnet wallet
- 🔑 OpenRouter API key (for AI analysis)
- 💰 Free testnet USDC from [Hyperliquid Testnet Faucet](https://app.hyperliquid-testnet.xyz/drip)

**For Live Trading (Real Money):**
- 🔑 Hyperliquid Mainnet wallet with USDC
- 🔑 Agent wallet private key (generated at [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API))
- 🔑 OpenRouter API key (for AI analysis)
- ⚠️ **IMPORTANT:** Only use a dedicated wallet with funds you can afford to lose

### System Requirements

- **Operating System:** Windows 10+, macOS 10.15+, or Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 2GB free space
- **Internet:** Stable broadband connection

---

## 2. Installation

### Option A: Docker Installation (Recommended) 🐳

**Fastest and easiest method - everything is pre-configured!**

#### Step 1: Install Docker Desktop

Download and install Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

#### Step 2: Clone the Repository

```bash
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

#### Step 3: Start the Application

```bash
docker-compose up --build
```

**That's it!** The application will automatically:
- Build the frontend and backend
- Set up the database
- Start all services
- Open at `http://localhost:3000`

**First-time build takes 3-5 minutes. Subsequent starts take ~30 seconds.**

---

### Option B: Manual Installation (Advanced Users)

**For developers who want full control over the setup.**

#### Step 1: Install Prerequisites

**Node.js & pnpm:**
```bash
# Install Node.js v18+ from nodejs.org
# Then install pnpm
npm install -g pnpm
```

**Python 3.11+:**
```bash
# Download from python.org
# Verify installation
python --version
```

**Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

#### Step 2: Clone and Setup Frontend

```bash
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent

# Install frontend dependencies
pnpm install
```

#### Step 3: Setup Backend

```bash
cd migration_python

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables

**Frontend (.env.local in project root):**
```bash
VITE_PYTHON_API_URL=http://localhost:8000
```

**Backend (migration_python/.env):**
```bash
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./dex_trading.db
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LOG_LEVEL=INFO
```

#### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd migration_python
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

**Terminal 3 - Celery Worker (Optional - for background tasks):**
```bash
cd migration_python
source venv/bin/activate
celery -A workers worker --loglevel=info
```

**Access the application at:** `http://localhost:3000`

---

## 3. First Launch

### What You'll See

When you first open the application, you'll land on the **Landing Page** with:

1. **Hero Section** - Project overview and branding
2. **Feature Cards** - AI Analysis, Multi-Chart, Security, Risk Control
3. **Available Trading Pairs** - BTC, ETH, SOL, AVAX, etc.
4. **Risk Management Framework** - 8-layer protection system
5. **Getting Started Guide** - Quick setup instructions

### Navigation Options

- **ENTER DASHBOARD** - Go directly to the trading interface
- **PREVIEW DASHBOARD** - See a demo of the dashboard without setup
- **DOCUMENTATION** - Browse full documentation

---

## 4. Choosing Your Trading Mode

The DeX Trading Agent offers **4 trading modes** to suit different needs:

### 🎮 Demo Mode (Recommended for Beginners)

**Best for:** Learning the interface, testing strategies risk-free

**Features:**
- ✅ No API keys required
- ✅ $10,000 virtual balance (customizable)
- ✅ Real-time market data
- ✅ All features available
- ✅ Zero risk

**How to Enable:**
1. Click "ENTER DASHBOARD"
2. Select "🎮 Demo" tab
3. Set initial balance (default: $10,000)
4. Click "Start Demo Mode"

---

### 📄 Paper Trading Mode

**Best for:** Testing strategies with realistic execution

**Features:**
- ✅ No API keys required
- ✅ Simulated order execution
- ✅ Real-time market data
- ✅ Realistic slippage and fees
- ✅ Zero risk

**How to Enable:**
1. Click "ENTER DASHBOARD"
2. Dashboard will default to Paper mode
3. Toggle "📄 PAPER TRADING" badge in header to switch modes

---

### 🔵 Testnet Mode (Safe Testing with Hyperliquid)

**Best for:** Testing with real Hyperliquid infrastructure using fake funds

**Features:**
- ✅ Real Hyperliquid Testnet integration
- ✅ Free testnet USDC
- ✅ Realistic order execution
- ✅ Test AI trading safely
- ⚠️ Requires Hyperliquid Testnet wallet

**How to Enable:**
1. Get testnet USDC from [Hyperliquid Testnet Faucet](https://app.hyperliquid-testnet.xyz/drip)
2. Click "ENTER DASHBOARD"
3. Select "🔑 API Keys" tab
4. Enter your Hyperliquid wallet address and agent private key
5. Enter OpenRouter API key
6. Click "Save Configuration"
7. Toggle network badge to "🔵 TESTNET"

---

### 🔴 Live Trading Mode (Real Money)

**Best for:** Experienced traders ready for real trading

**Features:**
- ✅ Real Hyperliquid Mainnet integration
- ✅ Real USDC trading
- ✅ Full AI automation
- ⚠️ **REAL MONEY AT RISK**
- ⚠️ Requires Hyperliquid Mainnet wallet with USDC

**How to Enable:**
1. Deposit USDC to your Hyperliquid wallet at [app.hyperliquid.xyz](https://app.hyperliquid.xyz)
2. Generate agent wallet at [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
3. Click "ENTER DASHBOARD"
4. Select "🔑 API Keys" tab
5. Enter your Hyperliquid wallet address and agent private key
6. Enter OpenRouter API key
7. Click "Save Configuration"
8. Toggle mode badge to "🔴 LIVE TRADING"

---

## 5. API Key Setup

### Understanding API Keys

The DeX Trading Agent uses **3 types of API keys**:

1. **Hyperliquid Wallet Address** - Your main wallet (where funds are stored)
2. **Agent Wallet Private Key** - Trading-only key (cannot withdraw funds)
3. **OpenRouter API Key** - For AI-powered market analysis

### Getting Your API Keys

#### 1. Hyperliquid Wallet Address

**What it is:** Your Ethereum-compatible wallet address on Hyperliquid

**How to get it:**
1. Go to [app.hyperliquid.xyz](https://app.hyperliquid.xyz)
2. Connect your wallet (MetaMask, WalletConnect, etc.)
3. Copy your wallet address from the top-right corner
4. **Format:** `0x1234...5678` (42 characters)

---

#### 2. Agent Wallet Private Key (Recommended)

**What it is:** A special trading-only key that **CANNOT withdraw funds**

**Why use it:** Much safer than using your main wallet's private key

**How to generate:**
1. Go to [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
2. Click "Generate" to create an agent wallet
3. Set validity period (up to 180 days)
4. **IMPORTANT:** Copy the private key (shown only once!)
5. Click "Authorize" to activate
6. **Format:** `0xabcd...ef01` (66 characters with `0x` prefix)

**Security Notes:**
- ✅ Agent wallets can trade but CANNOT withdraw
- ✅ Expires after set period (30-180 days)
- ✅ Can be revoked anytime
- ⚠️ Private key shown only once - save it securely!

---

#### 3. OpenRouter API Key

**What it is:** API key for accessing AI models (DeepSeek V3.1, Qwen3 Max)

**How to get it:**
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy the key (starts with `sk-or-v1-`)
6. **Format:** `sk-or-v1-...` (starts with this prefix)

**Pricing:**
- **DeepSeek V3.1:** $0.27 per 1M input tokens, $1.10 per 1M output tokens (cheap!)
- **Qwen3 Max:** $1.20 per 1M input tokens, $6.00 per 1M output tokens (premium)
- **Free tier available** for testing

---

### Entering API Keys

#### Method 1: Browser UI (Recommended for Testing)

1. Click "ENTER DASHBOARD"
2. Select "🔑 API Keys" tab
3. Follow the step-by-step guide on screen:
   - **Step 1:** Enter Hyperliquid Wallet Address
   - **Step 2:** Enter Agent Wallet Private Key
   - **Step 3:** Enter OpenRouter API Key
4. Click "Save Configuration"

**Storage:** Keys are stored in browser localStorage (never sent to any server)

---

#### Method 2: Backend .env File (Recommended for Production)

**Frontend (.env.local):**
```bash
VITE_PYTHON_API_URL=http://localhost:8000
```

**Backend (migration_python/.env):**
```bash
# API Keys (Optional - can be configured in browser UI)
OPENROUTER_API_KEY=sk-or-v1-your-key-here
CRYPTOPANIC_AUTH_TOKEN=your-token-here

# Hyperliquid API (Optional - can be configured in browser UI)
# HYPERLIQUID_MASTER_ADDRESS=0x1234...5678
# HYPERLIQUID_AGENT_PRIVATE_KEY=0xabcd...ef01
```

**Storage:** Keys are loaded on server startup (more secure for permanent installations)

---

### API Key Validation

The system automatically validates your API keys:

✅ **Hyperliquid Wallet Address:**
- Must be 42 characters
- Must start with `0x`
- Must be valid Ethereum address format

✅ **Agent Wallet Private Key:**
- Must be 64 or 66 characters
- If 66 chars, must start with `0x`
- Must be valid hexadecimal

✅ **OpenRouter API Key:**
- Must start with `sk-or-v1-`
- Must be valid format

**If validation fails, you'll see an error message with specific guidance.**

---

## 6. Understanding the Dashboard

### Dashboard Layout

The dashboard is divided into **4 main sections**:

#### 1. Header (Top Bar)

**Left Side:**
- **Logo & Title** - "DeX TRADING AGENT"
- **AI THINKING Badge** - Shows when AI is analyzing markets
- **Breadcrumb** - Navigation path (Home > Dashboard)

**Right Side:**
- **Balance History** - View historical balance and P&L charts
- **Network Toggle** - Switch between 🟣 MAINNET and 🔵 TESTNET
- **Mode Toggle** - Switch between 📄 PAPER and 🔴 LIVE trading
- **Settings** - Clear API keys and reset configuration

---

#### 2. Stats Row (Key Metrics)

Four cards displaying critical trading information:

**Balance Card:**
- Current account balance
- "Reset" button (Demo mode only)

**P&L Card:**
- Current Profit & Loss
- P&L percentage
- Liquidation price (if position open)
- Distance to liquidation

**Status Card:**
- "IN POSITION" or "READY"
- Current trading status

**Actions Card:**
- "Close" button - Close current position
- "All" button - Close all positions
- Only visible when positions are open

---

#### 3. Main Content Area

**Left Side (2/3 width) - Trading Charts:**
- Up to 4 TradingView charts
- Real-time price data
- Technical indicators
- Position details overlay

**Right Side (1/3 width) - Tabs:**
- **📊 Logs** - Trading activity and AI decisions
- **📰 News** - Crypto news feed from CryptoPanic
- **🧠 AI** - AI thought process and analysis

---

#### 4. Floating Controls (Top Right)

**Trading Controls Panel:**
- Hyperliquid connection test
- AI model selector (DeepSeek / Qwen)
- Auto-trading toggle
- Allowed coins selection (up to 4)
- Chart type and interval
- Leverage settings
- Risk management (TP/SL)
- AI prompt customization

---

### Key Dashboard Features

#### Liquidation Risk Warning

When a position is at risk, a warning banner appears:

- 🟡 **Warning** - Liquidation distance < 10%
- 🟠 **Danger** - Liquidation distance < 5%
- 🔴 **Critical** - Liquidation distance < 2%

**Displays:**
- Liquidation price
- Distance to liquidation (%)
- Maintenance margin required

---

#### Real-Time Updates

The dashboard updates automatically:

- **Balance** - Every 5 seconds (Live mode)
- **Position P&L** - Real-time
- **Charts** - Real-time price updates
- **Logs** - Instant when actions occur
- **News** - Every 5 minutes

---

## 7. Your First Trade

### Step-by-Step: Manual Trade

#### Step 1: Select Your Coin

1. Click "Trading Controls" (floating button, top-right)
2. Scroll to "Allowed Coins"
3. Select 1-4 coins (e.g., BTC, ETH, SOL)
4. Click "Apply Settings"

**Charts will appear for selected coins.**

---

#### Step 2: Configure Risk Settings

1. In Trading Controls, scroll to "Risk Management"
2. Set **Take Profit %** (e.g., 5%)
3. Set **Stop Loss %** (e.g., 2%)
4. Set **Leverage** (e.g., 5x)
5. Click "Apply Settings"

**Recommended for beginners:**
- Take Profit: 3-5%
- Stop Loss: 1-2%
- Leverage: 2-5x

---

#### Step 3: Analyze the Market

1. Watch the TradingView charts
2. Check the **📰 News** tab for market sentiment
3. Look for clear trends or patterns

**Manual trading requires your own analysis.**

---

#### Step 4: Execute Trade (Paper/Demo Mode)

**Note:** Manual trade execution is currently handled through the AI system. For manual trades, you can:

1. Use the AI analysis to get trade recommendations
2. Review the AI's reasoning in the **🧠 AI** tab
3. The AI will execute trades based on your settings

**For full manual control, use the Hyperliquid web interface directly.**

---

### Step-by-Step: AI-Powered Auto-Trading

#### Step 1: Enable AI Auto-Trading

1. Click "Trading Controls"
2. Toggle "AI Auto-Trading" to **ON**
3. Confirm you have:
   - ✅ OpenRouter API key configured
   - ✅ At least 1 coin selected
   - ✅ Risk settings configured

---

#### Step 2: Select AI Model

**DeepSeek V3.1 (Recommended for Beginners):**
- ✅ Free tier available
- ✅ Fast analysis
- ✅ Good accuracy
- 💰 $0.27 per 1M input tokens

**Qwen3 Max (Premium):**
- ✅ Higher accuracy
- ✅ More detailed analysis
- ⚠️ More expensive
- 💰 $1.20 per 1M input tokens

---

#### Step 3: Customize AI Prompt (Optional)

1. In Trading Controls, scroll to "AI Prompt Template"
2. Edit the prompt to match your strategy
3. Example additions:
   - "Focus on momentum trades"
   - "Prefer long positions in uptrends"
   - "Avoid trading during high volatility"
4. Click "Apply Settings"

---

#### Step 4: Monitor AI Activity

**Watch the AI work:**

1. **AI THINKING Badge** - Appears when analyzing
2. **🧠 AI Tab** - Shows thought process and reasoning
3. **📊 Logs Tab** - Records all actions and decisions
4. **Stats Row** - Updates with position and P&L

**AI analyzes markets every 60 seconds when auto-trading is enabled.**

---

#### Step 5: Review AI Decisions

**In the 🧠 AI Tab, you'll see:**

- **Market Context** - Current market conditions
- **Technical Analysis** - Chart patterns and indicators
- **Recommended Action** - Open long, open short, close, or hold
- **Confidence Level** - AI's confidence in the decision (0-100%)
- **Entry/Exit Prices** - Recommended prices
- **Stop Loss & Take Profit** - Risk management levels
- **Position Size** - Recommended size based on risk
- **Reasoning** - Detailed explanation of the decision

---

#### Step 6: Let AI Trade or Override

**AI will automatically:**
- ✅ Open positions when confidence > 70%
- ✅ Close positions at TP/SL levels
- ✅ Avoid trading in high-risk conditions
- ✅ Log all actions with reasoning

**You can override anytime:**
- Click "Close" to close current position
- Click "All" to close all positions
- Toggle "AI Auto-Trading" to OFF to stop

---

## 8. Essential Settings

### Leverage Settings

**What is leverage?**
Leverage multiplies your position size. For example:
- **5x leverage** - $1,000 balance = $5,000 position
- **10x leverage** - $1,000 balance = $10,000 position

**Recommended leverage by experience:**
- **Beginners:** 2-5x
- **Intermediate:** 5-10x
- **Advanced:** 10-20x
- **Expert:** 20-40x (high risk!)

**Configure in Trading Controls:**
- **Leverage** - Your default leverage
- **Max Leverage** - Maximum allowed leverage
- **Allow AI Leverage** - Let AI choose optimal leverage

---

### Risk Management Settings

**Take Profit (TP):**
- Percentage gain to automatically close position
- **Recommended:** 3-5% for beginners, 5-10% for advanced

**Stop Loss (SL):**
- Percentage loss to automatically close position
- **Recommended:** 1-2% for beginners, 2-5% for advanced

**Advanced Strategy:**
- **Partial Profit %** - Take partial profits early
- **Trailing Stop** - Move stop loss as position profits

---

### Chart Settings

**Chart Type:**
- **Time** - Traditional time-based charts
- **Range** - Range bars (filters noise)

**Chart Interval:**
- **1m, 5m, 15m** - Scalping (very short-term)
- **1h, 4h** - Day trading (short-term)
- **1D** - Swing trading (medium-term)

**Recommended for beginners:** 15m or 1h

---

## 9. Safety Tips

### 🛡️ Critical Safety Rules

#### 1. Start Small
- ✅ Begin with Demo or Paper mode
- ✅ Test strategies for at least 1 week
- ✅ Move to Testnet before Live
- ✅ Start Live trading with small amounts ($100-500)

#### 2. Use Agent Wallets
- ✅ Always use Hyperliquid agent wallets for Live trading
- ✅ Agent wallets CANNOT withdraw funds
- ⚠️ Never use your main wallet's private key

#### 3. Set Strict Risk Limits
- ✅ Never risk more than 2-5% per trade
- ✅ Use stop losses on every trade
- ✅ Set daily loss limits
- ⚠️ Lower leverage = lower risk

#### 4. Monitor Liquidation Risk
- ✅ Watch the liquidation distance in P&L card
- ✅ Close positions if distance < 10%
- ⚠️ System auto-pauses at 80% margin usage

#### 5. Understand Funding Rates
- ✅ Check funding rates before opening positions
- ✅ Positive funding = longs pay shorts (bearish signal)
- ✅ Negative funding = shorts pay longs (bullish signal)
- ⚠️ High funding rates (>0.05%) indicate crowded positions

#### 6. Secure Your API Keys
- ✅ Store keys securely (password manager)
- ✅ Never share keys with anyone
- ✅ Rotate keys every 30-180 days
- ⚠️ Revoke compromised keys immediately

#### 7. Test Before Going Live
- ✅ Test all strategies in Paper mode first
- ✅ Verify AI behavior in Demo mode
- ✅ Use Testnet to test real execution
- ⚠️ Only go Live when confident

#### 8. Monitor Your Trades
- ✅ Check dashboard regularly
- ✅ Review AI reasoning in 🧠 AI tab
- ✅ Verify trades in 📊 Logs tab
- ⚠️ Don't leave auto-trading unattended for long periods

---

### ⚠️ Common Mistakes to Avoid

❌ **Using too much leverage** - Start with 2-5x, not 20x+  
❌ **Ignoring stop losses** - Always set stop losses  
❌ **Trading without testing** - Test strategies first  
❌ **Using main wallet key** - Use agent wallets only  
❌ **Chasing losses** - Stick to your risk limits  
❌ **Ignoring liquidation risk** - Monitor distance to liquidation  
❌ **Trading during high volatility** - AI may pause, respect that  
❌ **Not understanding funding rates** - Learn how they affect profitability  

---

## 10. Next Steps

### After Your First Trade

**Congratulations! You've completed your first trade. Here's what to do next:**

#### 1. Review Your Performance
- Check the **📊 Logs** tab for trade history
- Analyze P&L in the **Balance History** chart
- Review AI reasoning in the **🧠 AI** tab

#### 2. Optimize Your Strategy
- Adjust leverage based on results
- Fine-tune TP/SL percentages
- Experiment with different AI prompts
- Test different chart intervals

#### 3. Learn More
- Read the full documentation at `/docs`
- Study the **Risk Management** guide
- Understand **AI Analysis Engine** workflow
- Learn about **Position Management**

#### 4. Expand Your Trading
- Add more coins to your watchlist
- Try different AI models (DeepSeek vs Qwen)
- Enable advanced strategies (trailing stops, partial profits)
- Experiment with different timeframes

#### 5. Join the Community
- Share your results and strategies
- Ask questions and get help
- Report bugs or suggest features
- Contribute to the project

---

### Recommended Learning Path

**Week 1: Demo Mode**
- Learn the interface
- Test AI auto-trading
- Experiment with settings
- Track virtual performance

**Week 2: Paper Trading**
- Simulate realistic execution
- Test risk management
- Refine your strategy
- Build confidence

**Week 3: Testnet**
- Test with real Hyperliquid infrastructure
- Verify order execution
- Test funding rate impact
- Ensure everything works

**Week 4+: Live Trading**
- Start with small amounts ($100-500)
- Gradually increase position sizes
- Monitor performance closely
- Scale up as you gain confidence

---

## 11. Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Failed to fetch balance"

**Symptoms:**
- Error message when loading dashboard
- Balance shows $0 or doesn't update

**Solutions:**
1. Verify API keys are correct
2. Check network toggle (Mainnet vs Testnet)
3. Ensure wallet has USDC deposited
4. Test Hyperliquid connection in Trading Controls
5. Check backend logs for errors

---

#### Issue 2: "AI analysis failed"

**Symptoms:**
- AI THINKING badge disappears immediately
- No AI thoughts in 🧠 AI tab
- Error in logs

**Solutions:**
1. Verify OpenRouter API key is correct (starts with `sk-or-v1-`)
2. Check OpenRouter account has credits
3. Try switching AI models (DeepSeek vs Qwen)
4. Check backend logs for API errors
5. Ensure internet connection is stable

---

#### Issue 3: "Cannot connect to backend"

**Symptoms:**
- Dashboard shows loading forever
- "Network error" messages
- Charts don't load

**Solutions:**
1. Verify backend is running (`http://localhost:8000`)
2. Check `VITE_PYTHON_API_URL` in `.env.local`
3. Restart backend: `python migration_python/main.py`
4. Check firewall isn't blocking port 8000
5. Try accessing `http://localhost:8000/docs` directly

---

#### Issue 4: "Liquidation risk warning"

**Symptoms:**
- Red/orange warning banner appears
- "CRITICAL LIQUIDATION RISK" message

**Solutions:**
1. **Immediate:** Close position or reduce size
2. Add more margin to your account
3. Lower leverage on future trades
4. Set tighter stop losses
5. Monitor liquidation distance more closely

---

#### Issue 5: "Auto-trading not starting"

**Symptoms:**
- Toggle AI Auto-Trading but nothing happens
- No AI analysis running

**Solutions:**
1. Verify OpenRouter API key is configured
2. Ensure at least 1 coin is selected in Allowed Coins
3. Check risk settings are configured (TP/SL)
4. Look for error messages in 📊 Logs tab
5. Try toggling off and on again

---

#### Issue 6: "Charts not loading"

**Symptoms:**
- TradingView charts show blank or error
- "Failed to load chart" message

**Solutions:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Check internet connection
4. Try a different browser
5. Verify TradingView isn't blocked by firewall

---

### Getting Help

**If you're still stuck:**

1. **Check the Logs:**
   - Frontend: Browser console (F12)
   - Backend: Terminal running `python main.py`

2. **Read the Documentation:**
   - Full docs at `/docs` in the application
   - Or browse `Documentation/` folder in the repository

3. **Search for Similar Issues:**
   - Check GitHub Issues
   - Search Discord/community forums

4. **Ask for Help:**
   - Open a GitHub Issue with:
     - Detailed description of the problem
     - Steps to reproduce
     - Error messages (screenshots)
     - Your environment (OS, browser, Docker/manual)
   - Join the community Discord/forum

5. **Report Bugs:**
   - Include logs from frontend and backend
   - Describe expected vs actual behavior
   - Provide reproduction steps

---

## Conclusion

**Congratulations!** You've completed the Getting Started guide. You now know how to:

✅ Install and run the DeX Trading Agent  
✅ Configure API keys for different trading modes  
✅ Navigate the dashboard and understand key metrics  
✅ Execute manual and AI-powered trades  
✅ Configure risk management settings  
✅ Monitor liquidation risk and funding rates  
✅ Troubleshoot common issues  

### Remember the Golden Rules:

1. **Start small** - Demo → Paper → Testnet → Live
2. **Use agent wallets** - Never use your main wallet's private key
3. **Set stop losses** - Protect your capital
4. **Monitor liquidation risk** - Stay safe from liquidations
5. **Test thoroughly** - Verify everything before going live

### Next Steps:

- 📚 Read the [Risk Management Guide](../Trading/RISK_MANAGEMENT.md)
- 🤖 Learn about the [AI Analysis Engine](../Trading/AI_ANALYSIS_ENGINE.md)
- 📊 Understand [Position Management](../Trading/POSITION_MANAGEMENT.md)
- 🐳 Deploy with [Docker Setup](../Deployment/DOCKER_SETUP.md)

**Happy Trading! 🚀**

---

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone  
**Version:** 1.0.0
