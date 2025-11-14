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
