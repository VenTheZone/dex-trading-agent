# API Key Setup - Complete Configuration Guide

## Overview

This guide provides detailed instructions for obtaining and configuring all API keys required for the DeX Trading Agent. Whether you're setting up for demo mode, paper trading, testnet, or live trading, this guide covers everything you need to know about API key management.

**Configuration Methods:**
1. **Browser Configuration** - Set keys directly in the web UI (stored in localStorage)
2. **Backend Configuration** - Set keys in `.env` file before deployment

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [API Keys Overview](#api-keys-overview)
2. [Hyperliquid API Keys](#hyperliquid-api-keys)
3. [OpenRouter API Key](#openrouter-api-key)
4. [CryptoPanic API Key (Optional)](#cryptopanic-api-key-optional)
5. [Browser Configuration Method](#browser-configuration-method)
6. [Backend Configuration Method](#backend-configuration-method)
7. [API Key Validation](#api-key-validation)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## 1. API Keys Overview

### Required vs Optional Keys

| API Key | Required For | Optional For | Purpose |
|---------|-------------|--------------|---------|
| **Hyperliquid Wallet Address** | Live Trading, Testnet | Demo, Paper | Your Hyperliquid wallet where funds are stored |
| **Agent Wallet Private Key** | Live Trading, Testnet | Demo, Paper | Trading authorization (cannot withdraw funds) |
| **OpenRouter API Key** | AI Analysis | Demo (uses free tier) | Powers DeepSeek V3.1 and Qwen3 Max AI models |
| **CryptoPanic API Key** | - | All modes | Crypto news feed integration |

### Trading Mode Requirements

**🎮 Demo Mode:**
- ✅ No API keys required
- ✅ Optional: OpenRouter key for real AI analysis (otherwise uses free tier)
- ✅ Simulated trading with virtual balance

**📄 Paper Mode:**
- ✅ No API keys required
- ✅ Optional: OpenRouter key for AI analysis
- ✅ Simulated trading with real market data

**🔵 Testnet Mode:**
- ✅ Hyperliquid Wallet Address (testnet)
- ✅ Agent Wallet Private Key (testnet)
- ✅ OpenRouter API Key (for AI)
- ✅ Free testnet USDC from faucet

**🔴 Live Mode:**
- ✅ Hyperliquid Wallet Address (mainnet)
- ✅ Agent Wallet Private Key (mainnet)
- ✅ OpenRouter API Key (for AI)
- ⚠️ Real funds at risk

---

## 2. Hyperliquid API Keys

### Understanding Hyperliquid Authentication

Hyperliquid uses **wallet-based authentication** rather than traditional API keys. You need:
1. **Wallet Address** - Where your funds are stored (42 characters, starts with `0x`)
2. **Agent Wallet Private Key** - Allows trading but NOT withdrawals (64-66 characters)

### 2.1 Get Your Hyperliquid Wallet Address

#### For Mainnet (Live Trading):

**Step 1:** Visit [app.hyperliquid.xyz](https://app.hyperliquid.xyz)

**Step 2:** Connect your wallet (MetaMask, WalletConnect, etc.)

**Step 3:** Copy your wallet address from the top right corner
- Format: `0x1234...5678` (42 characters)
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Step 4:** Deposit USDC to your perpetual wallet
- Bridge USDC from Arbitrum One to Hyperliquid
- Use the "Deposit" button in the Hyperliquid app
- Minimum recommended: $100 for testing

#### For Testnet (Safe Testing):

**Step 1:** Visit [app.hyperliquid-testnet.xyz](https://app.hyperliquid-testnet.xyz)

**Step 2:** Connect your wallet

**Step 3:** Get free testnet USDC from the faucet:
- Go to [app.hyperliquid-testnet.xyz/drip](https://app.hyperliquid-testnet.xyz/drip)
- Request testnet USDC (free)
- Wait for confirmation

**Step 4:** Copy your testnet wallet address

### 2.2 Generate Agent Wallet Private Key

**⚠️ CRITICAL: Always use Agent Wallets for trading bots!**

Agent wallets can trade but **CANNOT withdraw funds**, making them much safer than using your main wallet's private key.

#### Generation Steps:

**Step 1:** Visit the API page
- **Mainnet:** [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API)
- **Testnet:** [app.hyperliquid-testnet.xyz/API](https://app.hyperliquid-testnet.xyz/API)

**Step 2:** Click "Generate" to create a new agent wallet

**Step 3:** Configure agent wallet settings:
- **Validity Period:** Up to 180 days (recommended: 30-90 days)
- **Permissions:** Trading only (withdrawals disabled by default)

**Step 4:** **CRITICAL - Copy the Private Key NOW**
- The private key is shown **ONLY ONCE**
- Format: `0xabcd...ef01` (66 characters) or `abcd...ef01` (64 characters)
- Store it securely (password manager recommended)

**Step 5:** Click "Authorize" to activate the agent wallet

**Step 6:** Verify the agent wallet appears in your authorized list

### Private Key Format Validation

✅ **Valid Formats:**
- `0x` + 64 hex characters (66 total) - Example: `0x1234567890abcdef...`
- 64 hex characters (no prefix) - Example: `1234567890abcdef...`

❌ **Invalid Formats:**
- 42 characters starting with `0x` - This is a wallet ADDRESS, not a private key!
- Non-hexadecimal characters (only 0-9 and a-f allowed)
- Wrong length (must be exactly 64 or 66 characters)

### Security Notes

🔒 **Agent Wallet Security:**
- ✅ Can execute trades on your behalf
- ✅ Can open/close positions
- ❌ **CANNOT withdraw funds** from your wallet
- ❌ **CANNOT transfer assets** out of your account
- ✅ Expires after validity period (auto-revoked)

⚠️ **Never Use Main Wallet Private Key:**
- Using your main wallet's private key gives full control
- If compromised, attacker can withdraw all funds
- Always use agent wallets for automated trading

---

## 3. OpenRouter API Key

### What is OpenRouter?

OpenRouter provides unified access to multiple AI models through a single API. The DeX Trading Agent uses it to access:
- **DeepSeek V3.1** (Free tier available)
- **Qwen3 Max** (Paid, ~$0.50-2.00 per 1M tokens)

### 3.1 Create OpenRouter Account

**Step 1:** Visit [openrouter.ai](https://openrouter.ai)

**Step 2:** Click "Sign Up" (top right)

**Step 3:** Sign up with:
- Email + Password
- Or: Google / GitHub OAuth

**Step 4:** Verify your email address

### 3.2 Generate API Key

**Step 1:** Log in to [openrouter.ai](https://openrouter.ai)

**Step 2:** Navigate to "API Keys" section
- Click your profile icon (top right)
- Select "API Keys" from dropdown

**Step 3:** Click "Create New Key"

**Step 4:** Configure key settings:
- **Name:** "DeX Trading Agent" (or any descriptive name)
- **Permissions:** Full access (default)
- **Rate Limits:** Default (sufficient for trading)

**Step 5:** Copy the API key
- Format: `sk-or-v1-...` (starts with `sk-or-v1-`)
- Store securely (shown only once)

### 3.3 Add Credits (For Paid Models)

**For DeepSeek V3.1 (Free):**
- No credits required
- Free tier with rate limits
- Sufficient for most trading scenarios

**For Qwen3 Max (Paid):**

**Step 1:** Go to "Billing" section

**Step 2:** Click "Add Credits"

**Step 3:** Choose amount:
- Minimum: $5
- Recommended for testing: $10-20
- Typical usage: $0.50-2.00 per 1M tokens

**Step 4:** Add payment method (credit card)

**Step 5:** Confirm purchase

### API Key Format Validation

✅ **Valid Format:**
- Must start with `sk-or-v1-`
- Example: `sk-or-v1-1234567890abcdef...`

❌ **Invalid Formats:**
- Missing `sk-or-v1-` prefix
- Spaces or special characters
- Truncated or incomplete key

### Cost Estimates

| Model | Cost per 1M Tokens | Typical Daily Usage | Estimated Monthly Cost |
|-------|-------------------|---------------------|----------------------|
| **DeepSeek V3.1** | Free | Unlimited (rate limited) | $0 |
| **Qwen3 Max** | $0.50-2.00 | 100K-500K tokens | $5-30 |

**Note:** Costs vary based on:
- Number of AI analysis runs per day
- Number of coins being analyzed
- Prompt complexity and length

---

## 4. CryptoPanic API Key (Optional)

### What is CryptoPanic?

CryptoPanic aggregates cryptocurrency news from multiple sources, providing real-time news feeds with sentiment analysis.

### 4.1 Create CryptoPanic Account

**Step 1:** Visit [cryptopanic.com/developers/api](https://cryptopanic.com/developers/api)

**Step 2:** Click "Sign Up" (top right)

**Step 3:** Create account with email + password

**Step 4:** Verify email address

### 4.2 Generate API Token

**Step 1:** Log in to CryptoPanic

**Step 2:** Navigate to API section:
- Click profile icon
- Select "API" or "Developers"

**Step 3:** Click "Generate New Token"

**Step 4:** Copy the authentication token
- Format: Alphanumeric string
- Store securely

### 4.3 Free vs Pro Tier

**Free Tier:**
- ✅ 100 requests per day
- ✅ Basic news feed
- ✅ Sufficient for casual use

**Pro Tier ($9.99/month):**
- ✅ 10,000 requests per day
- ✅ Advanced filtering
- ✅ Historical data access
- ✅ Priority support

**Recommendation:** Start with free tier, upgrade if needed.

---

## 5. Browser Configuration Method

### Overview

Configure API keys directly in the DeX Trading Agent web interface. Keys are stored in browser localStorage and never leave your device.

### Step-by-Step Guide

**Step 1:** Launch the DeX Trading Agent
```bash
# If using Docker
docker-compose up

# If using manual setup
pnpm dev
```

**Step 2:** Open the application in your browser
- URL: `http://localhost:5173` (or your configured port)

**Step 3:** You'll see the API Key Setup screen with 3 tabs:
- 🔗 **Wallet** - For wallet connection (future feature)
- 🔑 **API Keys** - Manual API key entry
- 🎮 **Demo** - Demo mode setup

**Step 4:** Select the **🔑 API Keys** tab

**Step 5:** Enter your Hyperliquid credentials:

**Field 1: Hyperliquid Wallet Address**
- Paste your wallet address (42 characters, starts with `0x`)
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Field 2: Agent Wallet Private Key**
- Paste your agent wallet private key (64-66 characters)
- Example: `0x1234567890abcdef...` or `1234567890abcdef...`
- The UI will validate the format and show character count

**Field 3: OpenRouter API Key**
- Paste your OpenRouter API key (starts with `sk-or-v1-`)
- Example: `sk-or-v1-1234567890abcdef...`

**Step 6:** Click "Save Configuration"

**Step 7:** Verify success:
- You should see a success toast notification
- The dashboard will load automatically
- Balance will be fetched from Hyperliquid

### Demo Mode Setup (Browser)

**Step 1:** Select the **🎮 Demo** tab

**Step 2:** Set initial balance (optional):
- Default: $10,000
- Range: $100 - $1,000,000
- Adjust based on your testing needs

**Step 3:** (Optional) Add OpenRouter API key:
- Leave blank to use DeepSeek free tier
- Add key for real AI analysis in demo mode

**Step 4:** Click "Start Demo Mode"

**Step 5:** Start trading with virtual funds!

### Validation & Error Messages

The UI performs real-time validation:

✅ **Wallet Address Validation:**
- Must be 42 characters
- Must start with `0x`
- Must contain only hexadecimal characters

✅ **Private Key Validation:**
- Must be 64 or 66 characters
- If 66 chars, must start with `0x`
- Must contain only hexadecimal characters
- Shows error if you paste a wallet address instead

✅ **OpenRouter Key Validation:**
- Must start with `sk-or-v1-`
- Shows format error if invalid

---

## 6. Backend Configuration Method

### Overview

Configure API keys in the backend `.env` file before deployment. Keys are loaded on server startup and used for all API calls.

### Step-by-Step Guide

**Step 1:** Navigate to the backend directory
```bash
cd migration_python
```

**Step 2:** Create `.env` file from template
```bash
cp .env.example .env
```

**Step 3:** Edit `.env` file
```bash
nano .env
# or
vim .env
# or use your preferred text editor
```

**Step 4:** Configure Hyperliquid keys:
```bash
# Hyperliquid Configuration
HYPERLIQUID_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
HYPERLIQUID_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
HYPERLIQUID_TESTNET=false  # Set to true for testnet
```

**Step 5:** Configure OpenRouter key:
```bash
# OpenRouter AI Configuration
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef
```

**Step 6:** (Optional) Configure CryptoPanic key:
```bash
# CryptoPanic News API (Optional)
CRYPTOPANIC_AUTH_TOKEN=your_cryptopanic_token_here
```

**Step 7:** Configure other settings:
```bash
# Database Configuration
DATABASE_URL=sqlite:///./dex_trading.db  # For local development
# DATABASE_URL=postgresql://user:pass@localhost/dex_trading  # For production

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Server Configuration
PORT=8000
DEBUG=false  # Set to true for development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Step 8:** Save and close the file

**Step 9:** Restart the backend server:
```bash
# If using Docker
docker-compose restart backend

# If using manual setup
# Stop the server (Ctrl+C) and restart:
uvicorn main:app --reload --port 8000
```

**Step 10:** Verify configuration:
```bash
# Check backend logs for successful key loading
docker-compose logs backend
# or
# Check terminal output for manual setup
```

### Environment File Security

🔒 **Security Best Practices:**

1. **Never commit `.env` to version control:**
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
```

2. **Use restrictive file permissions:**
```bash
chmod 600 migration_python/.env
```

3. **Backup `.env` securely:**
- Store in password manager
- Or encrypted backup location
- Never in plain text cloud storage

4. **Rotate keys regularly:**
- Generate new agent wallets every 30-90 days
- Rotate OpenRouter keys periodically
- Revoke old keys after rotation

---

## 7. API Key Validation

### Automatic Validation

The DeX Trading Agent performs automatic validation for all API keys:

#### Hyperliquid Wallet Address
```typescript
// Validation rules:
- Length: Exactly 42 characters
- Format: Must start with "0x"
- Characters: Only hexadecimal (0-9, a-f, A-F)
- Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

#### Agent Wallet Private Key
```typescript
// Validation rules:
- Length: 64 characters (no prefix) OR 66 characters (with 0x prefix)
- Format: Optional "0x" prefix
- Characters: Only hexadecimal (0-9, a-f, A-F)
- Example: 0x1234567890abcdef... (66 chars)
- Example: 1234567890abcdef... (64 chars)

// Common mistake detection:
- If 42 characters: Shows error "This is a wallet ADDRESS, not a private key!"
```

#### OpenRouter API Key
```typescript
// Validation rules:
- Format: Must start with "sk-or-v1-"
- Length: Variable (typically 50-100 characters)
- Example: sk-or-v1-1234567890abcdef...
```

### Manual Validation

You can manually test your API keys:

#### Test Hyperliquid Connection
```bash
# Using curl
curl -X POST http://localhost:8000/api/test-hyperliquid-connection \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "isTestnet": false
  }'
```

#### Test OpenRouter API Key
```bash
# Using curl
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer sk-or-v1-YOUR_KEY_HERE"
```

#### Test CryptoPanic API Key
```bash
# Using curl
curl "https://cryptopanic.com/api/v1/posts/?auth_token=YOUR_TOKEN_HERE&public=true"
```

### Validation Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid wallet address format" | Wrong length or format | Ensure 42 chars starting with 0x |
| "This is a wallet ADDRESS, not a private key!" | Used wallet address instead of private key | Use the agent wallet private key (64-66 chars) |
| "Invalid private key length" | Wrong character count | Must be 64 or 66 characters |
| "Invalid OpenRouter API key format" | Missing sk-or-v1- prefix | Copy the full key from OpenRouter |
| "Failed to fetch balance" | Invalid credentials or network issue | Verify keys and network connection |
| "AI analysis failed" | Invalid OpenRouter key or no credits | Check key format and account balance |

---

## 8. Security Best Practices

### 🔒 Golden Rules

1. **Always Use Agent Wallets**
   - ✅ Generate agent wallets at app.hyperliquid.xyz/API
   - ✅ Agent wallets can trade but CANNOT withdraw
   - ❌ Never use your main wallet's private key

2. **Use Dedicated Trading Wallets**
   - ✅ Create a separate wallet for AI trading
   - ✅ Only deposit funds you can afford to lose
   - ❌ Never use your main wallet with significant holdings

3. **Start with Testnet**
   - ✅ Test all strategies on testnet first
   - ✅ Verify bot behavior with fake funds
   - ✅ Only go live after thorough testing

4. **Secure Key Storage**
   - ✅ Store keys in password manager (1Password, Bitwarden, etc.)
   - ✅ Use browser localStorage (keys never leave your device)
   - ❌ Never share keys via email, chat, or screenshots
   - ❌ Never commit keys to version control

5. **Regular Key Rotation**
   - ✅ Generate new agent wallets every 30-90 days
   - ✅ Set agent wallet validity to match rotation schedule
   - ✅ Revoke old agent wallets after rotation

6. **Monitor Activity**
   - ✅ Check trading logs regularly
   - ✅ Set up balance alerts
   - ✅ Review AI decisions and reasoning
   - ✅ Monitor for unexpected behavior

7. **Limit Exposure**
   - ✅ Start with small position sizes
   - ✅ Use conservative leverage (1x-5x)
   - ✅ Set strict stop losses
   - ✅ Enable auto-pause at 80% margin usage

8. **Backup & Recovery**
   - ✅ Backup your `.env` file securely
   - ✅ Store agent wallet details in password manager
   - ✅ Document your configuration
   - ✅ Have a recovery plan

### 🚨 What NOT To Do

❌ **Never:**
- Share your private keys with anyone
- Use your main wallet's private key for trading bots
- Store keys in plain text files
- Commit `.env` files to Git
- Use the same keys across multiple bots
- Skip testnet testing before going live
- Trade with funds you can't afford to lose
- Ignore security warnings or validation errors

### 🛡️ Additional Security Measures

**For Browser Configuration:**
- Keys stored in localStorage (browser-only)
- Keys never transmitted to external servers
- Clear keys when switching devices
- Use private/incognito mode for extra privacy

**For Backend Configuration:**
- Use environment variables (never hardcode)
- Set restrictive file permissions (chmod 600)
- Use secrets management in production
- Rotate keys regularly
- Monitor access logs

**For Production Deployment:**
- Use Docker secrets or Kubernetes secrets
- Enable HTTPS/TLS for all connections
- Implement rate limiting
- Set up monitoring and alerting
- Regular security audits

---

## 9. Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Failed to fetch balance"

**Symptoms:**
- Error message when loading dashboard
- Balance shows as $0 or doesn't load

**Possible Causes:**
1. Invalid Hyperliquid wallet address
2. Invalid agent wallet private key
3. Network connectivity issues
4. Wrong network selected (mainnet vs testnet)

**Solutions:**
```bash
# 1. Verify wallet address format
# Should be 42 characters starting with 0x
# Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 2. Verify private key format
# Should be 64 or 66 characters (with or without 0x prefix)
# Example: 0x1234567890abcdef... (66 chars)

# 3. Check network selection
# Ensure you're on the correct network (mainnet or testnet)
# Toggle network badge in dashboard header

# 4. Test Hyperliquid connection
curl -X POST http://localhost:8000/api/test-hyperliquid-connection \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "YOUR_ADDRESS", "isTestnet": false}'

# 5. Check backend logs
docker-compose logs backend | grep -i error
```

#### Issue 2: "AI analysis failed"

**Symptoms:**
- AI analysis doesn't run
- Error in AI thoughts panel
- "AI analysis failed" toast notification

**Possible Causes:**
1. Invalid OpenRouter API key
2. Insufficient credits (for paid models)
3. Rate limit exceeded
4. Network connectivity issues

**Solutions:**
```bash
# 1. Verify OpenRouter key format
# Must start with sk-or-v1-
# Example: sk-or-v1-1234567890abcdef...

# 2. Test OpenRouter API key
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_KEY_HERE"

# 3. Check OpenRouter account balance
# Log in to openrouter.ai and check credits

# 4. Switch to DeepSeek free tier
# In Trading Controls, select "DeepSeek" model

# 5. Check backend logs for detailed error
docker-compose logs backend | grep -i openrouter
```

#### Issue 3: "Invalid private key format"

**Symptoms:**
- Error when saving API keys
- Red validation message in UI
- Character count shows wrong length

**Possible Causes:**
1. Used wallet address instead of private key
2. Copied key with extra spaces or characters
3. Truncated or incomplete key

**Solutions:**
```bash
# 1. Verify you're using the PRIVATE KEY, not wallet address
# Private key: 64-66 characters
# Wallet address: 42 characters (this is WRONG for private key field)

# 2. Check for extra spaces or line breaks
# Trim whitespace from copied key

# 3. Verify character count
# 64 characters (no prefix): 1234567890abcdef...
# 66 characters (with prefix): 0x1234567890abcdef...

# 4. Regenerate agent wallet if key is lost
# Visit app.hyperliquid.xyz/API and generate new agent wallet
```

#### Issue 4: "Backend keys not detected"

**Symptoms:**
- Green "Backend API Keys Detected" banner doesn't appear
- Keys configured in `.env` but not recognized

**Possible Causes:**
1. `.env` file not in correct location
2. Backend server not restarted after `.env` changes
3. Syntax errors in `.env` file

**Solutions:**
```bash
# 1. Verify .env file location
ls -la migration_python/.env

# 2. Check .env file syntax
cat migration_python/.env
# Ensure no spaces around = signs
# Correct: OPENROUTER_API_KEY=sk-or-v1-...
# Wrong: OPENROUTER_API_KEY = sk-or-v1-...

# 3. Restart backend server
docker-compose restart backend

# 4. Check backend logs for environment variable loading
docker-compose logs backend | grep -i "environment\|config"

# 5. Verify environment variables are loaded
docker-compose exec backend env | grep -i "OPENROUTER\|HYPERLIQUID"
```

#### Issue 5: "News feed not loading"

**Symptoms:**
- News tab shows "No news available"
- CryptoPanic news doesn't appear

**Possible Causes:**
1. CryptoPanic API key not configured
2. Invalid CryptoPanic token
3. Rate limit exceeded (free tier: 100 requests/day)

**Solutions:**
```bash
# 1. Verify CryptoPanic token is configured
# Check .env file or backend configuration

# 2. Test CryptoPanic API
curl "https://cryptopanic.com/api/v1/posts/?auth_token=YOUR_TOKEN&public=true"

# 3. Check rate limit status
# Log in to cryptopanic.com and check API usage

# 4. News feed is optional - app works without it
# Focus on trading functionality if news isn't critical
```

#### Issue 6: "Agent wallet expired"

**Symptoms:**
- Trades fail with authorization error
- "Invalid signature" or "Unauthorized" errors

**Possible Causes:**
1. Agent wallet validity period expired
2. Agent wallet was revoked

**Solutions:**
```bash
# 1. Check agent wallet status
# Visit app.hyperliquid.xyz/API
# View "Authorized Agent Wallets" list

# 2. Generate new agent wallet
# Click "Generate" on API page
# Copy new private key (shown only once)
# Update configuration with new key

# 3. Set longer validity period
# Recommended: 30-90 days
# Maximum: 180 days

# 4. Set calendar reminder to rotate keys before expiry
```

### Getting Help

If you're still experiencing issues:

1. **Check Documentation:**
   - Review [GETTING_STARTED.md](./GETTING_STARTED.md)
   - Read [ENVIRONMENT_VARIABLES.md](../Deployment/ENVIRONMENT_VARIABLES.md)
   - Check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) (if available)

2. **Check Logs:**
   ```bash
   # Backend logs
   docker-compose logs backend --tail=100
   
   # Frontend logs
   # Open browser console (F12) and check for errors
   ```

3. **Test Individual Components:**
   - Test Hyperliquid connection
   - Test OpenRouter API
   - Test CryptoPanic API
   - Verify network connectivity

4. **Contact Support:**
   - GitHub Issues: [github.com/VenTheZone/dex-trading-agent/issues](https://github.com/VenTheZone/dex-trading-agent/issues)
   - Discord: [Join our community](https://discord.gg/your-invite-link)
   - Email: support@dexagent.com

---

## 10. FAQ

### General Questions

**Q: Do I need all API keys to use the DeX Trading Agent?**

A: No! It depends on your trading mode:
- **Demo Mode:** No keys required (optional OpenRouter for AI)
- **Paper Mode:** No keys required (optional OpenRouter for AI)
- **Testnet Mode:** Hyperliquid + OpenRouter keys required
- **Live Mode:** Hyperliquid + OpenRouter keys required

**Q: Are my API keys safe?**

A: Yes, when using browser configuration:
- Keys stored in browser localStorage only
- Keys never transmitted to external servers
- Keys never leave your device
- You can clear keys anytime

For backend configuration:
- Keys stored in `.env` file on your local machine
- Never committed to version control
- Protected by file permissions

**Q: Can I use the same keys for testnet and mainnet?**

A: No! Testnet and mainnet use separate wallets and keys:
- Generate separate agent wallets for each network
- Use testnet wallet address for testnet
- Use mainnet wallet address for mainnet
- OpenRouter key can be shared across both

**Q: How much does it cost to run the AI?**

A: Costs depend on the AI model:
- **DeepSeek V3.1:** Free (with rate limits)
- **Qwen3 Max:** ~$0.50-2.00 per 1M tokens (~$5-30/month for active trading)

**Q: What happens if my agent wallet expires?**

A: Trades will fail with authorization errors. You need to:
1. Generate a new agent wallet
2. Update your configuration with the new private key
3. Restart the application

Set calendar reminders to rotate keys before expiry!

### Hyperliquid Questions

**Q: What's the difference between wallet address and private key?**

A: 
- **Wallet Address (42 chars):** Your public identifier, where funds are stored
- **Private Key (64-66 chars):** Secret key that authorizes transactions
- You need BOTH for the DeX Trading Agent

**Q: Can I use my main wallet's private key?**

A: **NO! Never use your main wallet's private key!**
- Always use agent wallets (generated at app.hyperliquid.xyz/API)
- Agent wallets can trade but CANNOT withdraw funds
- Much safer for automated trading

**Q: How do I get testnet USDC?**

A: Visit [app.hyperliquid-testnet.xyz/drip](https://app.hyperliquid-testnet.xyz/drip) and request free testnet USDC from the faucet.

**Q: Can agent wallets withdraw funds?**

A: **No!** Agent wallets have restricted permissions:
- ✅ Can open/close positions
- ✅ Can execute trades
- ❌ **Cannot withdraw funds**
- ❌ **Cannot transfer assets out**

This is a critical security feature!

### OpenRouter Questions

**Q: Do I need to pay for OpenRouter?**

A: Not necessarily:
- **DeepSeek V3.1:** Free tier available (sufficient for most users)
- **Qwen3 Max:** Paid model (~$0.50-2.00 per 1M tokens)

Start with DeepSeek free tier, upgrade to Qwen3 Max if you need better performance.

**Q: How do I check my OpenRouter usage?**

A: Log in to [openrouter.ai](https://openrouter.ai) and check:
- Dashboard → Usage
- View token consumption
- Check remaining credits
- Review cost breakdown

**Q: What if I run out of OpenRouter credits?**

A: 
- AI analysis will fail
- You'll see "AI analysis failed" errors
- Add more credits at openrouter.ai/billing
- Or switch to DeepSeek free tier

**Q: Can I use my own AI API instead of OpenRouter?**

A: Currently, the DeX Trading Agent is designed for OpenRouter. Custom AI integrations would require code modifications.

### CryptoPanic Questions

**Q: Is CryptoPanic required?**

A: No, it's completely optional. The news feed is a nice-to-have feature but not required for trading.

**Q: How many requests does the free tier allow?**

A: 100 requests per day, which is sufficient for casual use.

**Q: Should I upgrade to CryptoPanic Pro?**

A: Only if you need:
- More than 100 requests per day
- Advanced filtering options
- Historical data access

For most users, the free tier is sufficient.

---

## Summary

This guide covered everything you need to know about configuring API keys for the DeX Trading Agent:

✅ **Hyperliquid API Keys** - Wallet address and agent wallet private key  
✅ **OpenRouter API Key** - For AI-powered market analysis  
✅ **CryptoPanic API Key** - Optional news feed integration  
✅ **Browser Configuration** - Set keys directly in the web UI  
✅ **Backend Configuration** - Set keys in `.env` file  
✅ **Validation** - Automatic format checking and error messages  
✅ **Security Best Practices** - Protect your keys and funds  
✅ **Troubleshooting** - Common issues and solutions  
✅ **FAQ** - Answers to frequently asked questions  

**Next Steps:**
1. Obtain your API keys following this guide
2. Configure keys using browser or backend method
3. Test with Demo or Paper mode first
4. Move to Testnet for realistic testing
5. Go Live when ready (with proper risk management)

**Remember:** Always start with testnet, use agent wallets, and never risk more than you can afford to lose!

For more information, see:
- [Getting Started Guide](./GETTING_STARTED.md)
- [Environment Variables Reference](../Deployment/ENVIRONMENT_VARIABLES.md)
- [Security Best Practices](../SECURITY.md)

---

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone  
**Version:** 1.0.0
