# Migration Away from Convex - TODO List

## Overview
This document tracks the migration from Convex to a traditional backend stack. This is a major undertaking that will require significant development effort.

**Estimated Time**: 40-80 hours
**Status**: Planning Phase
**Last Updated**: 2025-01-13

---

## Phase 1: Backend Infrastructure Setup

### 1.1 Choose Backend Stack
- [ ] Decide on backend framework:
  - [ ] Option A: Node.js + Express + TypeScript
  - [ ] Option B: Python + FastAPI
  - [ ] Option C: Other (specify)
- [ ] Choose database:
  - [ ] PostgreSQL (recommended for relational data)
  - [ ] MongoDB (if preferring NoSQL)
  - [ ] Other (specify)
- [ ] Choose hosting platform:
  - [ ] Railway
  - [ ] Render
  - [ ] AWS (EC2/Lambda)
  - [ ] Vercel (for serverless functions)
  - [ ] Other (specify)

### 1.2 Database Setup
- [ ] Set up database instance
- [ ] Design database schema for:
  - [ ] Users table
  - [ ] Trading logs table
  - [ ] Balance history table
  - [ ] Position snapshots table
  - [ ] API keys storage (encrypted)
- [ ] Set up database migrations system
- [ ] Configure database connection pooling
- [ ] Set up database backups

### 1.3 Authentication System
- [ ] Choose auth solution:
  - [ ] Implement custom JWT auth
  - [ ] Use Auth0
  - [ ] Use Clerk
  - [ ] Use Supabase Auth
  - [ ] Other (specify)
- [ ] Implement email OTP system:
  - [ ] Choose email service (SendGrid, Resend, etc.)
  - [ ] Build OTP generation logic
  - [ ] Build OTP verification logic
  - [ ] Implement session management
- [ ] Set up password hashing (if using passwords)
- [ ] Implement CSRF protection
- [ ] Set up rate limiting for auth endpoints

---

## Phase 2: Backend API Development

### 2.1 Core API Endpoints
- [ ] Set up Express/FastAPI server
- [ ] Configure CORS
- [ ] Set up middleware (logging, error handling, auth)
- [ ] Implement API versioning

### 2.2 Trading Functions Migration
Migrate these Convex actions to REST/GraphQL endpoints:

- [ ] `analyzeSingleMarket` → `/api/trading/analyze-single`
- [ ] `analyzeMultipleCharts` → `/api/trading/analyze-multiple`
- [ ] `executeHyperliquidTrade` → `/api/trading/execute-live`
- [ ] `fetchHyperliquidPositions` → `/api/trading/positions`
- [ ] `executePaperTrade` → `/api/trading/execute-paper`
- [ ] `logTradeExecution` → `/api/trading/log`
- [ ] `updatePositionStopLoss` → `/api/trading/update-stop-loss`

### 2.3 Market Data Functions Migration
- [ ] `fetchPriceWithFallback` → `/api/market/price`
- [ ] `fetchMultiplePrices` → `/api/market/prices`
- [ ] Implement multi-source fallback system (Hyperliquid → 8 CEX fallbacks)

### 2.4 Logging Functions Migration
- [ ] `createLog` → `/api/logs/create`
- [ ] `getUserLogs` → `/api/logs/user`
- [ ] `getRecentLogs` → `/api/logs/recent`

### 2.5 Balance & Position Tracking Migration
- [ ] `recordBalance` → `/api/balance/record`
- [ ] `getBalanceHistory` → `/api/balance/history`
- [ ] `recordSnapshot` → `/api/positions/snapshot`
- [ ] `getPositionSnapshots` → `/api/positions/snapshots`

### 2.6 News Integration Migration
- [ ] `fetchCryptoNews` → `/api/news/crypto`
- [ ] Set up CryptoPanic API integration
- [ ] Implement caching for news data

### 2.7 User Management Migration
- [ ] `getCurrentUser` → `/api/users/me`
- [ ] `updateUser` → `/api/users/update`
- [ ] User preferences storage

---

## Phase 3: Real-time Features

### 3.1 WebSocket Setup (for real-time updates)
- [ ] Set up WebSocket server (Socket.io or native WebSockets)
- [ ] Implement connection authentication
- [ ] Create rooms/channels for:
  - [ ] Position updates
  - [ ] Balance updates
  - [ ] Trading logs
  - [ ] Market data streams

### 3.2 Alternative: Polling System
- [ ] Implement efficient polling endpoints
- [ ] Set up client-side polling intervals
- [ ] Optimize for minimal server load

---

## Phase 4: Scheduled Jobs & Background Tasks

### 4.1 Cron Job System
- [ ] Choose cron solution:
  - [ ] node-cron (for Node.js)
  - [ ] APScheduler (for Python)
  - [ ] External service (GitHub Actions, etc.)
- [ ] Migrate scheduled AI analysis job
- [ ] Set up job monitoring and error handling
- [ ] Implement job logging

### 4.2 Background Task Queue
- [ ] Set up task queue (Bull, BullMQ, Celery)
- [ ] Implement async trade execution
- [ ] Implement async AI analysis
- [ ] Set up worker processes

---

## Phase 5: Frontend Migration

### 5.1 API Client Setup
- [ ] Remove Convex React hooks
- [ ] Set up Axios or Fetch wrapper
- [ ] Implement API error handling
- [ ] Set up request interceptors (auth tokens)

### 5.2 State Management
- [ ] Choose state management:
  - [ ] Keep Zustand (current)
  - [ ] Add React Query for server state
  - [ ] Use Redux Toolkit
  - [ ] Other (specify)
- [ ] Implement data fetching hooks
- [ ] Replace `useQuery` with new data fetching
- [ ] Replace `useMutation` with new mutation logic
- [ ] Replace `useAction` with API calls

### 5.3 Real-time Updates
- [ ] Implement WebSocket client
- [ ] Connect to real-time channels
- [ ] Handle reconnection logic
- [ ] Update UI components for new data flow

### 5.4 Component Updates
Files to update:
- [ ] `src/hooks/use-trading.ts` - Replace Convex actions
- [ ] `src/hooks/use-auth.ts` - Replace Convex auth
- [ ] `src/components/TradingControls.tsx` - Update data fetching
- [ ] `src/components/TradingLogs.tsx` - Update data fetching
- [ ] `src/components/BalanceChart.tsx` - Update data fetching
- [ ] `src/components/NewsFeed.tsx` - Update data fetching
- [ ] `src/pages/Dashboard.tsx` - Update all data fetching
- [ ] `src/pages/Auth.tsx` - Replace auth flow

---

## Phase 6: Security & Environment

### 6.1 Environment Variables
- [ ] Set up `.env` files for backend
- [ ] Migrate all Convex env vars:
  - [ ] `OPENROUTER_API_KEY`
  - [ ] `CRYPTOPANIC_AUTH_TOKEN`
  - [ ] Database credentials
  - [ ] Auth secrets
  - [ ] Email service keys
- [ ] Set up secrets management (AWS Secrets Manager, etc.)

### 6.2 Security Hardening
- [ ] Implement rate limiting
- [ ] Set up API key encryption at rest
- [ ] Configure HTTPS/SSL
- [ ] Set up security headers
- [ ] Implement input validation
- [ ] Set up SQL injection prevention
- [ ] Configure CORS properly
- [ ] Set up DDoS protection

---

## Phase 7: Data Migration

### 7.1 Export from Convex
- [ ] Export all user data
- [ ] Export all trading logs
- [ ] Export all balance history
- [ ] Export all position snapshots
- [ ] Verify data integrity

### 7.2 Import to New Database
- [ ] Write migration scripts
- [ ] Test migration on staging
- [ ] Run production migration
- [ ] Verify all data migrated correctly
- [ ] Set up data validation checks

---

## Phase 8: Testing

### 8.1 Backend Testing
- [ ] Unit tests for all endpoints
- [ ] Integration tests for trading flow
- [ ] Load testing for API
- [ ] Security testing
- [ ] Test error handling

### 8.2 Frontend Testing
- [ ] Test all user flows
- [ ] Test real-time updates
- [ ] Test authentication flow
- [ ] Test trading execution
- [ ] Test on multiple browsers
- [ ] Mobile responsiveness testing

### 8.3 End-to-End Testing
- [ ] Test complete trading cycle
- [ ] Test auto-trading system
- [ ] Test AI analysis pipeline
- [ ] Test position management
- [ ] Test error recovery

---

## Phase 9: Deployment

### 9.1 Staging Environment
- [ ] Set up staging server
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Run full test suite
- [ ] Performance testing

### 9.2 Production Deployment
- [ ] Set up production server
- [ ] Configure production database
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Set up logging (CloudWatch, Loggly, etc.)
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Set up health checks
- [ ] Configure auto-scaling (if needed)

### 9.3 DNS & Domain
- [ ] Update DNS records
- [ ] Configure SSL certificates
- [ ] Set up CDN (if needed)

---

## Phase 10: Monitoring & Maintenance

### 10.1 Monitoring Setup
- [ ] Set up application monitoring
- [ ] Set up error tracking
- [ ] Set up performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### 10.2 Documentation
- [ ] Document new API endpoints
- [ ] Update README
- [ ] Document deployment process
- [ ] Document environment setup
- [ ] Create runbook for common issues

---

## Phase 11: Cleanup

- [ ] Remove Convex dependencies from `package.json`
- [ ] Remove Convex configuration files
- [ ] Remove old Convex code
- [ ] Archive Convex project (don't delete immediately)
- [ ] Update project documentation

---

## Rollback Plan

### In Case of Issues
- [ ] Keep Convex project active for 30 days post-migration
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Keep database backups from both systems

---

## Cost Comparison

### Current (Convex)
- Convex: $X/month
- Total: $X/month

### New Stack (Estimate)
- Database hosting: $X/month
- Backend hosting: $X/month
- Email service: $X/month
- Monitoring: $X/month
- Total: $X/month

---

## Decision Checkpoint

**Before proceeding, answer these questions:**

1. Is the migration worth the 40-80 hours of development time?
2. Have you tried fixing the current Convex issue (missing OPENROUTER_API_KEY)?
3. Do you have the technical expertise to maintain a custom backend?
4. Have you budgeted for the new infrastructure costs?
5. Do you have a staging environment for testing?

**If you answered "No" to any of these, consider fixing the current issue first.**

---

## Notes

- This migration is a **major undertaking** and should not be taken lightly
- The current Convex issue is a simple environment variable configuration
- Consider the maintenance burden of a custom backend vs. managed platform
- Budget at least 2-3 weeks for a complete migration with testing

---

## Quick Fix Alternative

**Instead of migrating, you can fix the current issue in 5 minutes:**

1. Go to Convex Dashboard: https://dashboard.convex.dev
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `OPENROUTER_API_KEY` = `your-openrouter-api-key`
5. Save and redeploy

This will resolve the 401 Unauthorized error immediately.
