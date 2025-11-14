# Troubleshooting - Common Issues and Solutions

## Overview

This guide provides solutions to common issues encountered when using the DeX Trading Agent. Whether you're facing installation problems, API connection errors, trading execution issues, or performance problems, this comprehensive troubleshooting guide will help you resolve them quickly.

**Coverage:**
- Installation and setup issues
- API key and authentication problems
- Trading execution errors
- Connection and network issues
- Performance and UI problems
- Docker-specific issues
- Database and persistence errors

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [API Key Problems](#api-key-problems)
4. [Connection Errors](#connection-errors)
5. [Trading Execution Issues](#trading-execution-issues)
6. [UI and Display Problems](#ui-and-display-problems)
7. [Docker Issues](#docker-issues)
8. [Database and Persistence](#database-and-persistence)
9. [Performance Issues](#performance-issues)
10. [Network and Firewall](#network-and-firewall)
11. [AI Analysis Errors](#ai-analysis-errors)
12. [Emergency Procedures](#emergency-procedures)
13. [Getting Help](#getting-help)

---

## 1. Quick Diagnostics

### Health Check Commands

Run these commands to quickly diagnose system health:

```bash
# Check if services are running
docker-compose ps

# Check frontend logs
docker-compose logs frontend

# Check backend logs
docker-compose logs backend

# Check Redis logs
docker-compose logs redis

# Test Python backend connection
curl http://localhost:8000/health

# Test Hyperliquid connection
curl http://localhost:8000/api/hyperliquid/test-connection
```

### Common Error Patterns

| Error Message | Likely Cause | Quick Fix |
|--------------|--------------|-----------|
| `Connection refused` | Backend not running | Start backend: `docker-compose up backend` |
| `Invalid API key format` | Incorrect key format | Check key format in API Key Setup guide |
| `Failed to fetch` | CORS or network issue | Check CORS settings in `.env` |
| `Position not found` | State sync issue | Refresh page or clear localStorage |
| `Insufficient balance` | Not enough funds | Check balance or switch to Demo mode |
| `Rate limit exceeded` | Too many API calls | Wait 60 seconds and retry |

---

## 2. Installation Issues

### Issue: Docker Installation Fails

**Symptoms:**
- `docker: command not found`
- `docker-compose: command not found`

**Solutions:**

**For Windows:**
```bash
# Download Docker Desktop from docker.com
# Install and restart computer
# Verify installation
docker --version
docker-compose --version
```

**For macOS:**
```bash
# Install via Homebrew
brew install --cask docker

# Or download Docker Desktop from docker.com
# Verify installation
docker --version
```

**For Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

### Issue: `pnpm: command not found`

**Symptoms:**
- Cannot install frontend dependencies
- `pnpm install` fails

**Solutions:**

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version

# Alternative: Use npx
npx pnpm install
```

---

### Issue: Python Dependencies Fail to Install

**Symptoms:**
- `pip install -r requirements.txt` fails
- Missing system libraries

**Solutions:**

**For Ubuntu/Debian:**
```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-dev build-essential libpq-dev

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r migration_python/requirements.txt
```

**For macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install dependencies
brew install postgresql

# Install Python packages
pip install -r migration_python/requirements.txt
```

**For Windows:**
```bash
# Install Visual C++ Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Install requirements
pip install -r migration_python/requirements.txt
```

---

### Issue: Port Already in Use

**Symptoms:**
- `Error: Port 5173 is already in use`
- `Error: Port 8000 is already in use`

**Solutions:**

**Find and kill process using port:**

**Linux/macOS:**
```bash
# Find process on port 5173
lsof -i :5173

# Kill process
kill -9 <PID>

# Or for port 8000
lsof -i :8000
kill -9 <PID>
```

**Windows:**
```bash
# Find process on port 5173
netstat -ano | findstr :5173

# Kill process
taskkill /PID <PID> /F
```

**Alternative: Change port in configuration:**

```bash
# Frontend (.env)
VITE_PORT=5174

# Backend (migration_python/.env)
PORT=8001
```

---

## 3. API Key Problems

### Issue: "Invalid OpenRouter API Key Format"

**Symptoms:**
- Error when saving API keys
- "OpenRouter keys must start with 'sk-or-v1-'"

**Solutions:**

1. **Verify key format:**
   - Must start with `sk-or-v1-`
   - Example: `sk-or-v1-1234567890abcdef...`

2. **Check for extra spaces:**
   ```javascript
   // Remove leading/trailing spaces
   const cleanKey = apiKey.trim();
   ```

3. **Regenerate key:**
   - Go to [openrouter.ai](https://openrouter.ai)
   - Navigate to API Keys section
   - Delete old key and create new one

---

### Issue: "Invalid Private Key Length"

**Symptoms:**
- "Expected 64 or 66 characters"
- "This looks like a wallet ADDRESS, not a private key!"

**Solutions:**

1. **Verify private key format:**
   - ✅ Valid: `0x` + 64 hex characters (66 total)
   - ✅ Valid: 64 hex characters (no prefix)
   - ❌ Invalid: 42 characters (this is a wallet address!)

2. **Common mistake - Using wallet address instead of private key:**
   ```
   ❌ Wrong: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (42 chars - ADDRESS)
   ✅ Correct: 0x1234567890abcdef... (66 chars - PRIVATE KEY)
   ```

3. **Regenerate agent wallet:**
   - Go to [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
   - Click "Generate" for new agent wallet
   - **Copy private key immediately** (shown only once!)
   - Click "Authorize"

---

### Issue: "API Keys Not Persisting"

**Symptoms:**
- Keys disappear after page refresh
- Need to re-enter keys every time

**Solutions:**

1. **Check browser localStorage:**
   ```javascript
   // Open browser console (F12)
   console.log(localStorage.getItem('dex_api_keys'));
   ```

2. **Clear corrupted storage:**
   ```javascript
   // In browser console
   localStorage.clear();
   // Then re-enter API keys
   ```

3. **Check browser privacy settings:**
   - Ensure cookies/localStorage are enabled
   - Disable "Clear data on exit" for this site
   - Try different browser

4. **Use backend configuration instead:**
   ```bash
   # Edit migration_python/.env
   OPENROUTER_API_KEY=sk-or-v1-...
   HYPERLIQUID_WALLET_ADDRESS=0x...
   HYPERLIQUID_AGENT_PRIVATE_KEY=0x...
   ```

---

### Issue: "Backend API Keys Not Detected"

**Symptoms:**
- Green "Backend API Keys Detected" banner doesn't appear
- `/api/check-backend-keys` returns `hasBackendKeys: false`

**Solutions:**

1. **Verify .env file exists:**
   ```bash
   ls -la migration_python/.env
   ```

2. **Check .env format:**
   ```bash
   # migration_python/.env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   CRYPTOPANIC_AUTH_TOKEN=your-token-here
   
   # No quotes, no spaces around =
   ```

3. **Restart backend:**
   ```bash
   docker-compose restart backend
   # Or for manual setup
   cd migration_python
   uvicorn main:app --reload
   ```

4. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep "API key"
   ```

---

## 4. Connection Errors

### Issue: "Failed to Connect to Python Backend"

**Symptoms:**
- `Connection refused` errors
- `Failed to fetch` in browser console
- Trading logs/news feed not loading

**Solutions:**

1. **Verify backend is running:**
   ```bash
   # Check if backend is up
   curl http://localhost:8000/health
   
   # Should return: {"status":"healthy"}
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend --tail=50
   ```

3. **Verify VITE_PYTHON_API_URL:**
   ```bash
   # .env
   VITE_PYTHON_API_URL=http://localhost:8000
   
   # For Docker
   VITE_PYTHON_API_URL=http://backend:8000
   ```

4. **Check CORS settings:**
   ```bash
   # migration_python/.env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Restart services:**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

---

### Issue: "Hyperliquid Connection Test Failed"

**Symptoms:**
- "Connection test failed" message
- Cannot fetch positions or account info

**Solutions:**

1. **Test connection manually:**
   ```bash
   curl "http://localhost:8000/api/hyperliquid/test-connection?isTestnet=false"
   ```

2. **Check network selection:**
   - Ensure correct network (Mainnet vs Testnet)
   - Toggle network badge in dashboard

3. **Verify Hyperliquid API status:**
   - Check [status.hyperliquid.xyz](https://status.hyperliquid.xyz)
   - Try testnet if mainnet is down

4. **Check firewall/proxy:**
   ```bash
   # Test direct connection to Hyperliquid
   curl https://api.hyperliquid.xyz/info
   ```

5. **Use VPN if blocked:**
   - Some regions may have restricted access
   - Try connecting through VPN

---

### Issue: "WebSocket Connection Failed"

**Symptoms:**
- Real-time updates not working
- Position data not refreshing

**Solutions:**

1. **Check WebSocket endpoint:**
   ```javascript
   // Should connect to ws://localhost:8000/ws
   const ws = new WebSocket('ws://localhost:8000/ws');
   ```

2. **Verify backend WebSocket support:**
   ```bash
   # Check backend logs for WebSocket connections
   docker-compose logs backend | grep "WebSocket"
   ```

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Network tab
   - Filter by WS (WebSocket)
   - Check connection status

4. **Fallback to polling:**
   - System automatically falls back to HTTP polling
   - Refresh page to retry WebSocket connection

---

## 5. Trading Execution Issues

### Issue: "Insufficient Balance"

**Symptoms:**
- Cannot open positions
- "Insufficient balance" error

**Solutions:**

1. **Check current balance:**
   - View balance in dashboard stats
   - Verify mode (Live/Paper/Demo)

2. **For Live Mode:**
   ```bash
   # Check Hyperliquid wallet balance
   # Visit app.hyperliquid.xyz
   # Ensure USDC is in perpetual wallet (not spot)
   ```

3. **For Demo Mode:**
   ```javascript
   // Reset balance to initial amount
   // Click "Reset" button in Balance card
   ```

4. **For Paper Mode:**
   ```javascript
   // Check paper trading engine balance
   // Default: $10,000
   // Reset by clearing localStorage
   localStorage.removeItem('paper_trading_state');
   ```

5. **Reduce position size:**
   - Lower leverage setting
   - Reduce number of coins being traded
   - Adjust position size in AI settings

---

### Issue: "Position Not Found"

**Symptoms:**
- Cannot close position
- Position shows in UI but not in backend

**Solutions:**

1. **Refresh position data:**
   ```javascript
   // Refresh page
   window.location.reload();
   ```

2. **Check mode consistency:**
   - Ensure you're in the same mode where position was opened
   - Live positions don't appear in Paper mode and vice versa

3. **Verify position in Hyperliquid (Live mode):**
   - Go to [app.hyperliquid.xyz](https://app.hyperliquid.xyz)
   - Check "Positions" tab
   - Close manually if needed

4. **Clear corrupted state:**
   ```javascript
   // In browser console
   localStorage.removeItem('trading-store');
   // Then refresh page
   ```

---

### Issue: "AI Analysis Stuck on 'Thinking'"

**Symptoms:**
- "AI THINKING" badge stays active indefinitely
- No trade execution after analysis

**Solutions:**

1. **Check OpenRouter API key:**
   - Verify key is valid and has credits
   - Check [openrouter.ai](https://openrouter.ai) dashboard

2. **Check backend logs:**
   ```bash
   docker-compose logs backend | grep "AI analysis"
   ```

3. **Verify AI model selection:**
   - DeepSeek V3.1 (free) vs Qwen3 Max (paid)
   - Ensure sufficient credits for paid models

4. **Check rate limits:**
   - OpenRouter free tier has rate limits
   - Wait 60 seconds and retry

5. **Manual override:**
   ```javascript
   // Stop auto-trading
   // Toggle "Auto-Trading" switch off
   // Wait 30 seconds
   // Toggle back on
   ```

---

### Issue: "Stop Loss/Take Profit Not Triggering"

**Symptoms:**
- Position passes SL/TP levels but doesn't close
- Manual close required

**Solutions:**

1. **Verify SL/TP are set:**
   ```javascript
   // Check position object
   console.log(position.stopLoss, position.takeProfit);
   ```

2. **Check price monitoring:**
   - System polls prices every 5 seconds
   - Slight delay is normal

3. **For Paper Mode:**
   - Paper trading engine handles SL/TP automatically
   - Check `paper-trading-engine.ts` logs

4. **For Live Mode:**
   - Hyperliquid handles SL/TP orders
   - Verify orders exist in Hyperliquid UI

5. **Manual close if needed:**
   - Click "Close" button in position card
   - Or use "Close All" in emergency

---

## 6. UI and Display Problems

### Issue: "Blank White Screen"

**Symptoms:**
- Application shows blank white screen
- No error message visible

**Solutions:**

1. **Check browser console:**
   ```javascript
   // Open DevTools (F12)
   // Check Console tab for errors
   ```

2. **Common causes:**
   - JavaScript syntax error
   - Missing environment variables
   - Build issue

3. **Clear browser cache:**
   ```bash
   # Chrome: Ctrl+Shift+Delete
   # Firefox: Ctrl+Shift+Delete
   # Safari: Cmd+Option+E
   ```

4. **Rebuild frontend:**
   ```bash
   docker-compose down
   docker-compose up --build frontend
   ```

5. **Check for TypeScript errors:**
   ```bash
   cd frontend
   pnpm run type-check
   ```

---

### Issue: "Charts Not Loading"

**Symptoms:**
- TradingView charts show blank/loading state
- "Failed to load chart" error

**Solutions:**

1. **Check TradingView widget script:**
   ```html
   <!-- Should be in index.html -->
   <script src="https://s3.tradingview.com/tv.js"></script>
   ```

2. **Verify symbol format:**
   ```javascript
   // Correct format: BINANCE:BTCUSDT
   // Not: BTC, BTC-USD, etc.
   ```

3. **Check browser console:**
   - Look for CORS errors
   - Check network tab for failed requests

4. **Try different browser:**
   - Some ad blockers interfere with TradingView
   - Disable extensions temporarily

5. **Fallback to basic charts:**
   - System should show price data even if chart fails
   - Check if price updates are working

---

### Issue: "News Feed Not Loading"

**Symptoms:**
- News tab shows "No news available"
- Loading spinner indefinitely

**Solutions:**

1. **Check CryptoPanic API key:**
   ```bash
   # migration_python/.env
   CRYPTOPANIC_AUTH_TOKEN=your-token-here
   ```

2. **Test API manually:**
   ```bash
   curl "http://localhost:8000/api/news/crypto" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"filter":"rising","currencies":["BTC"],"limit":10}'
   ```

3. **Check rate limits:**
   - Free tier: 100 requests/day
   - Upgrade to Pro if needed

4. **Fallback behavior:**
   - News feed is optional
   - Trading works without it

---

### Issue: "Balance/P&L Not Updating"

**Symptoms:**
- Balance shows stale data
- P&L doesn't reflect current position

**Solutions:**

1. **Check mode:**
   - Live mode: Fetches from Hyperliquid every 5 seconds
   - Paper mode: Updates on price changes
   - Demo mode: Updates on simulated trades

2. **Verify price updates:**
   ```javascript
   // Check if prices are updating
   console.log('Current price:', position.currentPrice);
   ```

3. **Force refresh:**
   ```javascript
   // Refresh page
   window.location.reload();
   ```

4. **Check backend connection:**
   ```bash
   # Ensure backend is responding
   curl http://localhost:8000/api/hyperliquid/positions \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"apiSecret":"0x...","walletAddress":"0x...","isTestnet":false}'
   ```

---

## 7. Docker Issues

### Issue: "Docker Compose Build Fails"

**Symptoms:**
- `docker-compose up --build` fails
- Build errors in logs

**Solutions:**

1. **Clean Docker cache:**
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up --build
   ```

2. **Check Dockerfile syntax:**
   ```bash
   # Validate Dockerfile
   docker build -t test -f Dockerfile .
   ```

3. **Check disk space:**
   ```bash
   df -h
   # Ensure sufficient space (>5GB recommended)
   ```

4. **Update Docker:**
   ```bash
   # Check version
   docker --version
   # Update to latest version
   ```

---

### Issue: "Container Keeps Restarting"

**Symptoms:**
- `docker-compose ps` shows "Restarting"
- Container exits immediately after start

**Solutions:**

1. **Check container logs:**
   ```bash
   docker-compose logs backend --tail=100
   ```

2. **Common causes:**
   - Missing environment variables
   - Port conflicts
   - Database connection issues

3. **Test container manually:**
   ```bash
   docker run -it --rm \
     -e DATABASE_URL=sqlite:///./trading.db \
     dex-backend:latest \
     python -c "print('Test successful')"
   ```

4. **Check health status:**
   ```bash
   docker inspect <container_id> | grep Health
   ```

---

### Issue: "Volume Mount Permissions"

**Symptoms:**
- "Permission denied" errors
- Cannot write to mounted volumes

**Solutions:**

**For Linux:**
```bash
# Fix ownership
sudo chown -R $USER:$USER ./migration_python/data

# Or run with user flag
docker-compose run --user $(id -u):$(id -g) backend
```

**For Windows:**
```bash
# Enable file sharing in Docker Desktop
# Settings > Resources > File Sharing
# Add project directory
```

**For macOS:**
```bash
# Usually works by default
# If issues, check Docker Desktop preferences
```

---

## 8. Database and Persistence

### Issue: "Database Locked"

**Symptoms:**
- "Database is locked" error
- Cannot write to database

**Solutions:**

1. **For SQLite (development):**
   ```bash
   # Stop all services
   docker-compose down
   
   # Remove lock file
   rm migration_python/data/trading.db-journal
   
   # Restart
   docker-compose up
   ```

2. **Switch to PostgreSQL (production):**
   ```bash
   # migration_python/.env
   DATABASE_URL=postgresql://user:pass@localhost:5432/trading
   ```

3. **Check concurrent connections:**
   - SQLite doesn't handle concurrent writes well
   - Use PostgreSQL for production

---

### Issue: "Trading Logs Disappear"

**Symptoms:**
- Logs tab shows no data
- Previously visible logs are gone

**Solutions:**

1. **Check database:**
   ```bash
   # For SQLite
   sqlite3 migration_python/data/trading.db "SELECT COUNT(*) FROM trading_logs;"
   ```

2. **Verify backend connection:**
   ```bash
   curl http://localhost:8000/api/trading-logs?limit=50
   ```

3. **Check mode filter:**
   - Logs are mode-specific (live/paper/demo)
   - Switch modes to see different logs

4. **Restore from backup:**
   ```bash
   # If you have backups enabled
   cp migration_python/data/backups/trading.db.backup migration_python/data/trading.db
   ```

---

## 9. Performance Issues

### Issue: "Slow UI Response"

**Symptoms:**
- Laggy interface
- Delayed button clicks
- Slow chart rendering

**Solutions:**

1. **Reduce number of charts:**
   - Limit to 1-2 coins instead of 4
   - Improves rendering performance

2. **Disable animations:**
   ```javascript
   // In browser console
   document.body.style.animation = 'none';
   ```

3. **Clear browser data:**
   - Clear cache and cookies
   - Restart browser

4. **Check system resources:**
   ```bash
   # Monitor CPU/RAM usage
   docker stats
   ```

5. **Optimize Docker:**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

---

### Issue: "High CPU Usage"

**Symptoms:**
- Docker containers using 100% CPU
- System becomes slow

**Solutions:**

1. **Check which service:**
   ```bash
   docker stats
   ```

2. **Reduce polling frequency:**
   ```javascript
   // In use-trading.ts
   // Change from 5 seconds to 10 seconds
   const POLL_INTERVAL = 10000;
   ```

3. **Disable auto-trading temporarily:**
   - Toggle off "Auto-Trading" switch
   - Reduces AI analysis frequency

4. **Limit concurrent operations:**
   - Trade fewer coins simultaneously
   - Reduce AI analysis frequency

---

## 10. Network and Firewall

### Issue: "Firewall Blocking Connections"

**Symptoms:**
- Cannot connect to external APIs
- Timeout errors

**Solutions:**

1. **Check firewall rules:**
   ```bash
   # Linux
   sudo ufw status
   sudo ufw allow 5173
   sudo ufw allow 8000
   
   # Windows
   # Windows Defender Firewall > Allow an app
   ```

2. **Test external connectivity:**
   ```bash
   # Test Hyperliquid
   curl https://api.hyperliquid.xyz/info
   
   # Test OpenRouter
   curl https://openrouter.ai/api/v1/models
   ```

3. **Configure proxy (if needed):**
   ```bash
   # .env
   HTTP_PROXY=http://proxy.example.com:8080
   HTTPS_PROXY=http://proxy.example.com:8080
   ```

---

## 11. AI Analysis Errors

### Issue: "OpenRouter Rate Limit Exceeded"

**Symptoms:**
- "Rate limit exceeded" error
- AI analysis fails repeatedly

**Solutions:**

1. **Check rate limits:**
   - Free tier: Limited requests per minute
   - Paid tier: Higher limits

2. **Reduce analysis frequency:**
   ```javascript
   // In use-trading.ts
   // Change from 60 seconds to 120 seconds
   const AI_ANALYSIS_INTERVAL = 120000;
   ```

3. **Add credits to OpenRouter:**
   - Go to [openrouter.ai](https://openrouter.ai)
   - Add $10-20 credits

4. **Switch to DeepSeek free tier:**
   - Select "DeepSeek V3.1" in AI Model selector
   - Free tier with rate limits

---

### Issue: "AI Recommendations Don't Make Sense"

**Symptoms:**
- AI suggests illogical trades
- Contradictory reasoning

**Solutions:**

1. **Review custom prompt:**
   - Check if custom prompt is too restrictive
   - Reset to default prompt

2. **Verify market data:**
   - Ensure charts are loading correctly
   - Check if prices are updating

3. **Switch AI model:**
   - Try Qwen3 Max instead of DeepSeek
   - Different models have different strengths

4. **Provide more context:**
   - Add technical indicators to prompt
   - Include risk tolerance preferences

---

### Issue: "Failed to Fetch Prices for All Coins"

**Symptoms:**
- Auto-trading paused with "No market data available"
- Backend logs show "404 Not Found" for price fetches
- Error: "Failed to fetch prices for BTCUSD, ETHUSD, etc."

**Solutions:**

1. **Test frontend price fetching:**
   
   1. **Verify TradingView widget is loaded:**
      - Check if `tvWidget` object exists in browser console
      - Ensure TradingView script is loaded

   2. **Test individual coin price fetching:**
      
      ```javascript
      // In browser console
      // Test BTC price
      fetch('http://localhost:8000/api/hyperliquid/price?symbol=BTCUSD')
        .then(response => response.json())
        .then(data => console.log('BTC Price:', data))
        .catch(error => console.error('BTC Price Error:', error));
      
      // Test ETH price
      fetch('http://localhost:8000/api/hyperliquid/price?symbol=ETHUSD')
        .then(response => response.json())
        .then(data => console.log('ETH Price:', data))
        .catch(error => console.error('ETH Price Error:', error));
      ```

   3. **Check backend price endpoint:**
      ```bash
      # Test price endpoint
      curl "http://localhost:8000/api/hyperliquid/price?symbol=BTCUSD"
      curl "http://localhost:8000/api/hyperliquid/price?symbol=ETHUSD"
      ```

   4. **Verify Hyperliquid API status:**
      - Check [status.hyperliquid.xyz](https://status.hyperliquid.xyz)
      - Ensure Hyperliquid is not experiencing downtime

   5. **Check network connectivity:**
      ```bash
      # Test connection to Hyperliquid
      curl https://api.hyperliquid.xyz/info
      ```

   6. **Verify API key permissions:**
      - Ensure API key has read access to price data
      - Check key format and permissions in API Key Setup

   7. **Check backend logs for price fetch errors:**
      ```bash
      docker-compose logs backend | grep "price fetch"
      ```

   8. **Test with fewer coins:**
      - Temporarily disable trading for 3+ coins
      - Test if price fetching works with 1-2 coins

   9. **Check system resources:**
      - High CPU/RAM usage can cause price fetching failures
      - Monitor with `docker stats`

   10. **Clear browser cache and cookies:**
      - Clear localStorage related to price data
      - Restart browser

---

## 12. Emergency Procedures

### Emergency: Need to Close All Positions Immediately

**Procedure:**

1. **Use Emergency Close button:**
   - Click "All" button in Actions card
   - Confirm in dialog

2. **Manual close via Hyperliquid:**
   - Go to [app.hyperliquid.xyz](https://app.hyperliquid.xyz)
   - Navigate to Positions tab
   - Click "Close" on each position

3. **Stop auto-trading:**
   - Toggle "Auto-Trading" switch OFF
   - Prevents new positions from opening

---

### Emergency: System Behaving Erratically

**Procedure:**

1. **Stop all services:**
   ```bash
   docker-compose down
   ```

2. **Clear all state:**
   ```javascript
   // In browser console
   localStorage.clear();
   ```

3. **Restart fresh:**
   ```bash
   docker-compose up --build
   ```

4. **Verify API keys:**
   - Re-enter all API keys
   - Test connections before trading

---

### Emergency: Lost Access to Agent Wallet

**Procedure:**

1. **Revoke old agent wallet:**
   - Go to [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
   - Find old agent wallet in list
   - Click "Revoke"

2. **Generate new agent wallet:**
   - Click "Generate"
   - Copy private key immediately
   - Click "Authorize"

3. **Update configuration:**
   - Enter new private key in API setup
   - Test connection

---

## 13. Getting Help

### Before Asking for Help

**Gather this information:**

1. **System details:**
   ```bash
   # OS version
   uname -a  # Linux/macOS
   ver  # Windows
   
   # Docker version
   docker --version
   docker-compose --version
   
   # Node/pnpm version
   node --version
   pnpm --version
   ```

2. **Error logs:**
   ```bash
   # Backend logs
   docker-compose logs backend --tail=100 > backend_logs.txt
   
   # Frontend logs
   docker-compose logs frontend --tail=100 > frontend_logs.txt
   
   # Browser console
   # Copy errors from DevTools Console
   ```

3. **Configuration:**
   - Trading mode (Live/Paper/Demo)
   - Network (Mainnet/Testnet)
   - AI model being used
   - Number of coins being traded

### Support Channels

**GitHub Issues:**
- Report bugs: [github.com/VenTheZone/dex-trading-agent/issues](https://github.com/VenTheZone/dex-trading-agent/issues)
- Feature requests welcome
- Include logs and system details

**Community Discord:**
- Real-time help from community
- Share strategies and tips
- Get quick answers

**Documentation:**
- Check all guides in `Documentation/` folder
- Search for specific topics
- Review API references

### Reporting Bugs

**Include in bug report:**

1. **Title:** Clear, concise description
2. **Environment:** OS, Docker version, deployment method
3. **Steps to reproduce:** Exact steps to trigger bug
4. **Expected behavior:** What should happen
5. **Actual behavior:** What actually happens
6. **Logs:** Backend and frontend logs
7. **Screenshots:** If UI-related

**Example bug report:**

```markdown
**Title:** AI Analysis Stuck on "Thinking" in Demo Mode

**Environment:**
- OS: Ubuntu 22.04
- Docker: 24.0.7
- Deployment: Docker Compose

**Steps to Reproduce:**
1. Start application in Demo mode
2. Enable auto-trading
3. Select 4 coins (BTC, ETH, SOL, ARB)
4. Wait for AI analysis

**Expected:** AI completes analysis within 30 seconds
**Actual:** "AI THINKING" badge stays active indefinitely

**Logs:**
```
[Backend] ERROR: OpenRouter API timeout after 30s
[Backend] Retrying AI analysis...
```

**Screenshots:** [Attach screenshot of stuck UI]
```

---

## Quick Reference

### Essential Commands

```bash
# Restart everything
docker-compose restart

# View logs
docker-compose logs -f

# Clear all data
docker-compose down -v

# Rebuild from scratch
docker-compose down && docker-compose up --build

# Check service health
curl http://localhost:8000/health

# Test Hyperliquid connection
curl http://localhost:8000/api/hyperliquid/test-connection
```

### Common File Locations

```
Configuration:
- Frontend env: .env
- Backend env: migration_python/.env
- Docker compose: docker-compose.yml

Data:
- SQLite database: migration_python/data/trading.db
- Logs: docker-compose logs
- Browser storage: localStorage (F12 > Application > Local Storage)

Code:
- Frontend: src/
- Backend: migration_python/
- Documentation: Documentation/
```

### Emergency Contacts

- **Critical Issues:** Stop trading immediately, close all positions
- **Data Loss:** Check backups in `migration_python/data/backups/`
- **Security Concerns:** Revoke API keys, generate new ones

---

**Remember:** When in doubt, stop trading and seek help. It's better to miss opportunities than to lose capital due to unresolved issues.

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone