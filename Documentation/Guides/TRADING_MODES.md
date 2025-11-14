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

