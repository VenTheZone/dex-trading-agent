# Debug Log

This document tracks bugs discovered during development and debugging sessions, along with their resolution status.

---

## Bug #1: Network Parameter Hardcoded in Price Service
**Status:** ✅ FIXED  
**Date Found:** 2025-01-XX  
**Severity:** Critical  
**Component:** `src/lib/price-service.ts`

### Description
The `fetchPriceWithFallback` function was hardcoded to always fetch mainnet prices, ignoring the user's selected network (mainnet/testnet). This caused incorrect pricing data to be displayed on the landing page for testnet users.

### Root Cause
The `price-service.ts` module was stateless and didn't have access to the network context from the trading store. The function was calling `pythonApi.fetchPrice(symbol, false)` with a hardcoded `false` (mainnet).

### Impact
- Testnet users saw mainnet prices instead of testnet prices
- Price discrepancies between landing page and actual trading prices
- Confusion for users testing on testnet

### Fix
1. Added `network: NetworkType = 'mainnet'` parameter to `fetchPriceWithFallback`
2. Updated cache keys to be network-specific: `${symbol}_${network}`
3. Modified `use-live-market-data.ts` to pass network from trading store
4. Updated all price fetching calls to include network parameter

### Files Modified
- `src/lib/price-service.ts`
- `src/hooks/use-live-market-data.ts`

---

## Bug #3: Snapshot Cache Missing Network Context
**Status:** ✅ FIXED  
**Date Found:** 2025-01-XX  
**Severity:** Critical  
**Component:** `src/lib/python-api-client.ts`

### Description
The `getSnapshotsForAI` function and `SnapshotCache` interface were missing network-awareness. The cache only tracked symbols and snapshot type, but not which network (mainnet/testnet) the data came from. This caused cross-network cache pollution when users switched networks.

### Root Cause
The `SnapshotCache` interface didn't include a `network` field, and the cache validation logic only checked `symbols`, `type`, and `age`, but not the network. This meant:
- Mainnet snapshot data could be returned when on testnet
- Testnet snapshot data could be returned when on mainnet
- AI analysis would use incorrect market data for trading decisions

### Impact
- AI trading decisions based on wrong network data
- Potential incorrect trades due to price/market condition mismatches
- Confusion when snapshot data doesn't match the selected network
- Risk of trading with stale or incorrect market context

### Fix
1. Added `network: NetworkType` field to `SnapshotCache` interface
2. Added `network` parameter to `getSnapshotsForAI` function (defaults to 'mainnet')
3. Updated cache validation to check `networkMatch` alongside other conditions
4. Modified API endpoint to be network-specific: `/api/v1/snapshots/{network}/ai-analysis`
5. Enhanced cache invalidation logging to include network mismatch reason
6. Store network in cache when caching snapshot data

### Files Modified
- `src/lib/python-api-client.ts`

### Related Bugs
- Similar to Bug #1 (Network Parameter Hardcoded in Price Service)
- Both involved missing network context in caching systems

---

## Bug #4: Missing Network Parameter in Live/Paper Auto-Trading
**Status:** ✅ FIXED  
**Date Found:** 2025-01-XX  
**Severity:** Critical  
**Component:** `src/hooks/use-trading.ts`

### Description
The auto-trading loop for Live/Paper mode was missing the `network` parameter when calling `pythonApi.getSnapshotsForAI()` at line 1061. This caused it to always fetch mainnet snapshots, even when users were trading on testnet.

### Root Cause
While the Demo mode path (line 931) correctly passed the `network` parameter, the Live/Paper mode path (line 1061) was missing it, defaulting to 'mainnet'. This inconsistency was introduced when the network parameter was added to `getSnapshotsForAI`.

### Impact
- Live/Paper mode auto-trading used wrong network data on testnet
- AI analysis based on mainnet prices when user expected testnet prices
- Potential incorrect trades due to price mismatches between networks
- Inconsistent behavior between Demo and Live/Paper modes

### Fix
Added `network` parameter to the `pythonApi.getSnapshotsForAI()` call at line 1061:

### Files Modified
- `src/hooks/use-trading.ts`

---

## Bug #5: Missing Network Parameter in AI Analysis
**Status:** ✅ FIXED  
**Date Found:** 2025-01-XX  
**Severity:** High  
**Component:** `src/lib/python-api-client.ts`, `src/hooks/use-trading.ts`

### Description
The AI analysis functions (`analyzeMarket` and `analyzeMultiChart`) were not receiving the `network` parameter (Mainnet/Testnet). This could lead to the backend using incorrect market data context (e.g., fetching Mainnet funding rates while the user is on Testnet) or failing to distinguish between environments.

### Root Cause
The `AIAnalysisRequest` interface and the calling functions in `use-trading.ts` did not include the `network` field.

### Impact
- Potential for AI to make decisions based on incorrect network data.
- Inconsistency with other API calls that are network-aware.

### Fix
1. Updated `AIAnalysisRequest` interface in `src/lib/python-api-client.ts` to include `network?: 'mainnet' | 'testnet'`.
2. Updated `runAIAnalysis` and `runMultiChartAIAnalysis` in `src/hooks/use-trading.ts` to pass the current `network` from the store.
3. Added regression test `src/__tests__/ai-network-param.test.ts`.

### Files Modified
- `src/lib/python-api-client.ts`
- `src/hooks/use-trading.ts`
- `src/__tests__/ai-network-param.test.ts`