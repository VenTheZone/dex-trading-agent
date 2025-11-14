# Hyperliquid Integration - Trading Platform API

## Overview

The DeX Trading Agent integrates with **Hyperliquid**, a decentralized perpetual futures exchange, providing access to leveraged trading with up to 50x leverage on major cryptocurrencies. This document details the complete integration architecture, API usage patterns, order management, and risk protection systems.

**Hyperliquid SDK:** `@nktkas/hyperliquid` v1.x

**Supported Networks:**
- **Mainnet:** `https://api.hyperliquid.xyz` (real funds)
- **Testnet:** `https://api.hyperliquid-testnet.xyz` (test funds)

**Last Updated:** November 15, 2025

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [HyperliquidService Class](#hyperliquidservice-class)
3. [Order Management](#order-management)
4. [Position Management](#position-management)
5. [Risk Management & Liquidation Protection](#risk-management--liquidation-protection)
6. [Account & Balance Operations](#account--balance-operations)
7. [Market Data](#market-data)
8. [Error Handling](#error-handling)
9. [Integration Patterns](#integration-patterns)
10. [Testing & Validation](#testing--validation)

---

## 1. Architecture Overview

### Integration Layers

