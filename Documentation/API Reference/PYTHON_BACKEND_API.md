# Python Backend API Reference

## Overview

The DeX Trading Agent uses a **Python FastAPI backend** to handle trading operations, AI analysis, market data, and real-time updates. This document provides complete API reference for all HTTP endpoints and WebSocket connections.

**Base URL:** `http://localhost:8000` (configurable via `VITE_PYTHON_API_URL`)

**API Version:** 1.0.0

**Last Updated:** November 14, 2025

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Trading Logs API](#trading-logs-api)
3. [Balance History API](#balance-history-api)
4. [Position Snapshots API](#position-snapshots-api)
5. [AI Trading Analysis API](#ai-trading-analysis-api)
6. [Hyperliquid Integration API](#hyperliquid-integration-api)
7. [Market Data API](#market-data-api)
8. [Paper Trading API](#paper-trading-api)
9. [Crypto News API](#crypto-news-api)
10. [WebSocket API](#websocket-api)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Authentication & Security

### Security Model

The API follows a **no-authentication architecture** for local deployment:

- **Network Isolation:** API only accessible on `localhost` (127.0.0.1)
- **CORS:** Restricted to frontend origin
- **API Keys:** Stored client-side, passed in request bodies (not headers)
- **No JWT/Sessions:** Direct API access for single-user operation

### Request Headers

