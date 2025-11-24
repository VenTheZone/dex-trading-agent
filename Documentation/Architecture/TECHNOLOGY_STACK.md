# Technology Stack

## Overview

The DeX Trading Agent is built with a modern, full-stack architecture combining React 19 for the frontend and Python FastAPI for the backend. This document provides a detailed breakdown of all technologies, libraries, and tools used in the system.

**Last Updated:** November 14, 2025

---

## Frontend Stack

### Core Framework

#### React 19.1.0
- **Purpose:** UI library for building interactive user interfaces
- **Key Features:**
  - Component-based architecture
  - Virtual DOM for efficient rendering
  - Hooks for state management (useState, useEffect, useCallback)
  - Concurrent rendering for improved performance
- **Usage:** All UI components, pages, and interactive elements

#### TypeScript 5.7.2
- **Purpose:** Type-safe JavaScript superset
- **Key Features:**
  - Static type checking
  - Enhanced IDE support with IntelliSense
  - Interface definitions for API contracts
  - Compile-time error detection
- **Usage:** All frontend code (.tsx, .ts files)

#### Vite 6.0.11
- **Purpose:** Build tool and development server
- **Key Features:**
  - Lightning-fast hot module replacement (HMR)
  - Optimized production builds
  - Native ES modules support
  - Plugin ecosystem
- **Usage:** Development server (port 3000), production builds

---

### Routing & Navigation

#### React Router 7.6.1
- **Purpose:** Client-side routing for single-page application
- **Key Features:**
  - Declarative routing with `<Route>` components
  - Programmatic navigation with `useNavigate`
  - URL parameter handling
  - Browser history management
- **Routes:**
  - `/` - Landing page
  - `/dashboard` - Trading interface
  - `/docs` - Documentation
  - `*` - 404 error page

---

### State Management

#### Zustand 5.0.8
- **Purpose:** Lightweight state management library
- **Key Features:**
  - Simple API with minimal boilerplate
  - React hooks integration
  - Middleware support (persist)
  - TypeScript-first design
- **Usage:**
  - `tradingStore.ts` - Global trading state (balance, position, settings, AI model)
  - Persisted to localStorage for session continuity

#### Browser Storage
- **localStorage:**
  - API keys (Hyperliquid, OpenRouter, Binance)
  - Trading settings (leverage, TP/SL, allowed coins)
  - User preferences (chart type, interval)
- **sessionStorage:**
  - Temporary UI state (modal visibility, notifications)

---

### Styling & UI Components

#### Tailwind CSS 4.1.8
- **Purpose:** Utility-first CSS framework
- **Key Features:**
  - Rapid UI development with utility classes
  - Responsive design with breakpoint modifiers
  - Custom theme configuration (cyberpunk theme)
  - JIT (Just-In-Time) compilation
- **Theme:** Cyberpunk aesthetic with cyan/blue accents, dark backgrounds
- **Configuration:** `src/index.css` with OKLCH color space

#### Shadcn UI
- **Purpose:** Accessible, customizable component library
- **Components Used:**
  - `Button`, `Card`, `Dialog`, `Sheet`, `Tabs`
  - `Select`, `Input`, `Label`, `Switch`, `Slider`
  - `Alert`, `Badge`, `Tooltip`, `Separator`
  - `Accordion`, `Collapsible`, `Popover`
- **Customization:** Styled to match cyberpunk theme
- **Location:** `src/components/ui/`

#### Framer Motion 12.15.0
- **Purpose:** Animation library for React
- **Key Features:**
  - Declarative animations with `motion` components
  - Gesture recognition (drag, hover, tap)
  - Layout animations
  - Spring physics
- **Usage:**
  - Page transitions
  - Modal animations
  - Button hover effects
  - Chart loading states

---

### Data Visualization

#### Recharts 2.15.4
- **Purpose:** Composable charting library for React
- **Key Features:**
  - Responsive charts
  - Line, area, bar, pie charts
  - Customizable tooltips and legends
  - Animation support
- **Usage:**
  - Balance history chart (`BalanceChart.tsx`)
  - P&L visualization
  - Performance metrics

#### TradingView Widget (react-tradingview-widget 1.3.2)
- **Purpose:** Professional trading charts
- **Key Features:**
  - Real-time price data
  - Technical indicators (RSI, MACD, MA, Bollinger Bands)
  - Drawing tools
  - Multiple timeframes (5M, 15M, 1H, 4H)
- **Usage:**
  - `TradingChart.tsx` - Main chart component
  - `TokenTradingModal.tsx` - Token-specific charts

---

### HTTP & WebSocket Communication

#### Axios 1.13.2
- **Purpose:** Promise-based HTTP client
- **Key Features:**
  - Request/response interceptors
  - Automatic JSON transformation
  - Error handling
  - Timeout configuration
- **Usage:**
  - Python backend API calls (`python-api-client.ts`)
  - Binance API integration
  - CryptoPanic news fetching

#### Native WebSocket API
- **Purpose:** Real-time bidirectional communication
- **Key Features:**
  - Low-latency updates
  - Event-driven architecture
  - Automatic reconnection logic
- **Usage:**
  - Real-time price updates
  - Position monitoring
  - AI analysis streaming

---

### Blockchain & Trading Integrations

#### @nktkas/hyperliquid 0.25.9
- **Purpose:** Hyperliquid SDK for perpetual futures trading
- **Key Features:**
  - Order placement (market, limit)
  - Position management
  - Account balance queries
  - Wallet signing (eth-account)
- **Usage:**
  - Live trading execution
  - Position monitoring
  - Liquidation price calculations

#### CCXT 4.5.18
- **Purpose:** Multi-exchange cryptocurrency trading library
- **Key Features:**
  - Unified API for 100+ exchanges
  - OHLCV data fetching
  - Order book access
  - Ticker information
- **Usage:**
  - Binance price feeds (fallback)
  - Market data aggregation
  - Historical data retrieval

#### Viem 2.38.6
- **Purpose:** TypeScript interface for Ethereum
- **Key Features:**
  - Wallet connection
  - Transaction signing
  - Smart contract interaction
- **Usage:**
  - Hyperliquid wallet authentication
  - Private key management

---

### AI Integration

#### OpenAI SDK 6.8.1
- **Purpose:** OpenRouter API client (OpenAI-compatible)
- **Key Features:**
  - Chat completions API
  - Streaming responses
  - Model selection (DeepSeek, Qwen3 Max)
  - Token usage tracking
- **Usage:**
  - AI market analysis (`deepseek.ts`)
  - Multi-chart decision making
  - Trading recommendations

---

### Form Handling & Validation

#### React Hook Form 7.57.0
- **Purpose:** Performant form library
- **Key Features:**
  - Uncontrolled components for performance
  - Built-in validation
  - Error handling
  - TypeScript support
- **Usage:**
  - API key setup forms
  - Trading control inputs
  - Settings configuration

#### Zod 3.25.46
- **Purpose:** TypeScript-first schema validation
- **Key Features:**
  - Runtime type checking
  - Schema composition
  - Error messages
  - Integration with React Hook Form
- **Usage:**
  - API request validation
  - Form input validation
  - Type-safe data parsing

#### @hookform/resolvers 5.0.1
- **Purpose:** Validation resolver for React Hook Form
- **Key Features:**
  - Zod integration
  - Yup support
  - Custom validators
- **Usage:** Connecting Zod schemas to React Hook Form

---

### Utilities & Helpers

#### date-fns 4.1.0
- **Purpose:** Modern JavaScript date utility library
- **Key Features:**
  - Immutable date operations
  - Timezone support
  - Formatting and parsing
  - Lightweight (tree-shakeable)
- **Usage:**
  - Trading log timestamps
  - Balance history dates
  - Funding rate schedules

#### clsx 2.1.1 & tailwind-merge 3.3.0
- **Purpose:** Conditional CSS class management
- **Key Features:**
  - Dynamic class names
  - Tailwind class merging
  - Conflict resolution
- **Usage:** `cn()` utility in `lib/utils.ts`

#### Lucide React 0.511.0
- **Purpose:** Icon library
- **Key Features:**
  - 1000+ icons
  - Customizable size and color
  - Tree-shakeable
- **Usage:** UI icons throughout the application

---

### Testing

#### Vitest 2.1.8
- **Purpose:** Vite-native unit testing framework
- **Key Features:**
  - Fast test execution
  - Jest-compatible API
  - TypeScript support
  - Coverage reporting
- **Usage:**
  - Unit tests for liquidation protection
  - TP/SL validation tests
  - Fee calculation tests
  - **Test Files:**
    - `liquidation-protection.test.ts` (41 tests)
    - `testnet-trade-inputs.test.ts` (55 tests)
    - `trading-fees.test.ts` (21 tests)
    - `mainnet-tpsl.test.ts` (18 tests)
  - **Total:** 135 passing tests

#### @vitest/coverage-v8 2.1.8
- **Purpose:** Code coverage reporting
- **Key Features:**
  - V8 coverage engine
  - HTML reports
  - Threshold enforcement
- **Usage:** `pnpm test:coverage`

---

### Development Tools

#### ESLint
- **Purpose:** JavaScript/TypeScript linter
- **Key Features:**
  - Code quality enforcement
  - Style consistency
  - Error detection
- **Usage:** `pnpm lint`

#### Prettier
- **Purpose:** Code formatter
- **Key Features:**
  - Automatic formatting
  - Consistent style
  - Editor integration
- **Usage:** `pnpm format`

---

## Backend Stack

### Core Framework

#### Python 3.11+
- **Purpose:** Backend programming language
- **Key Features:**
  - Async/await support
  - Type hints
  - Rich standard library
  - Performance optimizations

#### FastAPI 0.104.1
- **Purpose:** Modern web framework for building APIs
- **Key Features:**
  - Automatic OpenAPI documentation
  - Pydantic data validation
  - Async request handling
  - WebSocket support
- **Usage:**
  - REST API endpoints (`/api/*`)
  - WebSocket connections (`/ws`)
  - Background task scheduling

#### Uvicorn 0.24.0
- **Purpose:** ASGI server
- **Key Features:**
  - High performance
  - WebSocket support
  - Graceful shutdown
  - Hot reload (development)
- **Usage:** Backend server (port 8000)

---

### Database & ORM

#### SQLAlchemy 2.0.23
- **Purpose:** SQL toolkit and ORM
- **Key Features:**
  - Declarative models
  - Query builder
  - Connection pooling
  - Migration support
- **Usage:**
  - Database models (users, trades, positions, logs)
  - Query execution
  - Transaction management

#### Alembic 1.12.1
- **Purpose:** Database migration tool
- **Key Features:**
  - Version control for database schema
  - Auto-generation of migrations
  - Rollback support
- **Usage:** Schema migrations

#### SQLite (Development) / PostgreSQL (Production)
- **SQLite:**
  - File-based database
  - Zero configuration
  - Local development
- **PostgreSQL (psycopg2-binary 2.9.9):**
  - Production-grade RDBMS
  - ACID compliance
  - Advanced features (JSON, full-text search)

---

### Background Tasks

#### Celery 5.3.4
- **Purpose:** Distributed task queue
- **Key Features:**
  - Async task execution
  - Scheduled tasks (cron)
  - Task retries
  - Result backend
- **Usage:**
  - Auto-trading loop (60-second cycle)
  - Balance updates
  - Position monitoring
  - Funding rate tracking

#### Redis 5.0.1
- **Purpose:** In-memory data store (message broker)
- **Key Features:**
  - Fast message passing
  - Pub/sub support
  - Data persistence
  - Caching
- **Usage:**
  - Celery message broker
  - Market data caching
  - Session storage

---

### HTTP & WebSocket

#### HTTPX 0.25.1
- **Purpose:** Async HTTP client
- **Key Features:**
  - HTTP/2 support
  - Connection pooling
  - Timeout handling
  - Retry logic
- **Usage:**
  - OpenRouter API calls
  - Binance API requests
  - CryptoPanic news fetching

#### aiohttp 3.10.11
- **Purpose:** Async HTTP client/server
- **Key Features:**
  - WebSocket support
  - Streaming responses
  - Session management
- **Usage:**
  - Hyperliquid API integration
  - Real-time data streaming

#### Requests 2.31.0
- **Purpose:** Simple HTTP library
- **Key Features:**
  - Synchronous requests
  - Easy API
  - Session support
- **Usage:**
  - Health checks
  - Simple HTTP requests

#### WebSockets 12.0
- **Purpose:** WebSocket protocol implementation
- **Key Features:**
  - Low-latency communication
  - Bidirectional messaging
  - Connection management
- **Usage:**
  - Real-time price updates to frontend
  - Position monitoring streams

---

### Trading & Blockchain

#### CCXT 4.5.18
- **Purpose:** Multi-exchange trading library
- **Key Features:**
  - Unified API for exchanges
  - Order execution
  - Market data fetching
- **Usage:**
  - Binance integration
  - Price feeds
  - Order book data

#### eth-account 0.9.0
- **Purpose:** Ethereum account management
- **Key Features:**
  - Private key handling
  - Transaction signing
  - Address derivation
- **Usage:**
  - Hyperliquid wallet signing
  - Order authentication

---

### AI Integration

#### OpenAI 1.3.0
- **Purpose:** OpenRouter API client
- **Key Features:**
  - Chat completions
  - Streaming responses
  - Model selection
- **Models:**
  - **DeepSeek V3.1** (`deepseek/deepseek-chat-v3-0324:free`) - Free tier
  - **Qwen3 Max** (`qwen/qwen3-max`) - Paid tier
- **Usage:**
  - Market analysis
  - Trading recommendations
  - Multi-chart decision making

---

### Data Validation

#### Pydantic 2.5.0
- **Purpose:** Data validation using Python type hints
- **Key Features:**
  - Automatic validation
  - JSON schema generation
  - Settings management
  - Error messages
- **Usage:**
  - API request/response models
  - Configuration validation
  - Type safety

#### pydantic-settings 2.1.0
- **Purpose:** Settings management
- **Key Features:**
  - Environment variable loading
  - .env file support
  - Type validation
- **Usage:** Backend configuration (API keys, database URL)

---

### Security & Authentication

#### python-jose[cryptography] 3.3.0
- **Purpose:** JWT token handling
- **Key Features:**
  - Token generation
  - Token verification
  - Encryption support
- **Usage:** Future authentication (currently no-auth for local deployment)

#### passlib[bcrypt] 1.7.4
- **Purpose:** Password hashing
- **Key Features:**
  - Bcrypt algorithm
  - Salt generation
  - Hash verification
- **Usage:** Future user authentication

---

### Utilities

#### python-dotenv 1.0.0
- **Purpose:** Environment variable management
- **Key Features:**
  - .env file loading
  - Variable parsing
  - Development/production separation
- **Usage:** Loading API keys and configuration

#### python-multipart 0.0.6
- **Purpose:** Form data parsing
- **Key Features:**
  - Multipart form handling
  - File uploads
  - Streaming support
- **Usage:** API endpoint form data

---

### Development & Testing

#### pytest 7.4.3
- **Purpose:** Testing framework
- **Key Features:**
  - Simple test syntax
  - Fixtures
  - Parametrized tests
  - Coverage integration
- **Usage:** Backend unit tests

#### pytest-asyncio 0.21.1
- **Purpose:** Async test support
- **Key Features:**
  - Async fixture support
  - Event loop management
  - Async test execution
- **Usage:** Testing async functions

#### Black 23.11.0
- **Purpose:** Code formatter
- **Key Features:**
  - Opinionated formatting
  - Consistent style
  - Fast execution
- **Usage:** `black .`

#### Flake8 6.1.0
- **Purpose:** Linter
- **Key Features:**
  - PEP 8 compliance
  - Error detection
  - Plugin support
- **Usage:** Code quality checks

#### mypy 1.7.0
- **Purpose:** Static type checker
- **Key Features:**
  - Type hint validation
  - Error detection
  - Gradual typing
- **Usage:** Type safety enforcement

---

## Infrastructure & Deployment

### Containerization

#### Docker
- **Purpose:** Application containerization
- **Key Features:**
  - Isolated environments
  - Reproducible builds
  - Multi-stage builds
- **Usage:**
  - Frontend container (Nginx)
  - Backend container (Uvicorn)
  - Redis container
  - Celery worker container

#### Docker Compose
- **Purpose:** Multi-container orchestration
- **Key Features:**
  - Service definition
  - Network management
  - Volume mounting
- **Services:**
  - `frontend` (port 3000)
  - `backend` (port 8000)
  - `redis` (port 6379)
  - `celery-worker`

---

### Version Control

#### Git
- **Purpose:** Source code management
- **Key Features:**
  - Branching and merging
  - Commit history
  - Collaboration
- **Usage:** Code versioning

#### GitHub
- **Purpose:** Remote repository hosting
- **Key Features:**
  - Pull requests
  - Issue tracking
  - CI/CD integration
- **Usage:** Code collaboration and deployment

---

## External APIs & Services

### Trading Platforms

#### Hyperliquid
- **Purpose:** Perpetual futures exchange
- **Networks:**
  - Mainnet (production)
  - Testnet (risk-free testing)
- **Features:**
  - 50x leverage (BTC, ETH)
  - Tiered margin system
  - Funding rates
  - Liquidation engine

#### Binance
- **Purpose:** Fallback price data
- **Features:**
  - Real-time price feeds
  - Historical OHLCV data
  - Market depth
- **Usage:** Price validation and redundancy

---

### AI Services

#### OpenRouter
- **Purpose:** Multi-model AI API gateway
- **Models:**
  - DeepSeek V3.1 (free tier)
  - Qwen3 Max (paid tier)
- **Features:**
  - Model selection
  - Token tracking
  - Cost optimization

---

### News & Data

#### CryptoPanic
- **Purpose:** Cryptocurrency news aggregator
- **Features:**
  - Real-time news feed
  - Sentiment analysis
  - Ticker filtering
- **Usage:** Market sentiment tracking

---

## Development Workflow

### Package Managers

#### pnpm (Frontend)
- **Purpose:** Fast, disk-efficient package manager
- **Key Features:**
  - Symlinked node_modules
  - Monorepo support
  - Strict dependency resolution
- **Commands:**
  - `pnpm dev` - Start dev server
  - `pnpm build` - Production build
  - `pnpm test` - Run tests

#### pip (Backend)
- **Purpose:** Python package installer
- **Key Features:**
  - Virtual environment support
  - Requirements.txt
  - Dependency resolution
- **Commands:**
  - `pip install -r requirements.txt`
  - `pip freeze > requirements.txt`

---

### Build & Bundling

#### Vite Build
- **Output:** Optimized static files
- **Features:**
  - Code splitting
  - Tree shaking
  - Minification
  - Asset optimization

#### TypeScript Compiler (tsc)
- **Purpose:** Type checking and compilation
- **Features:**
  - Type validation
  - ES module output
  - Source maps
- **Command:** `tsc -b --noEmit`

---

## Performance Metrics

### Frontend
- **Initial Load:** < 2 seconds
- **HMR Update:** < 100ms
- **Chart Render:** < 500ms
- **API Response:** < 200ms (local backend)

### Backend
- **API Latency:** < 50ms (local)
- **WebSocket Latency:** < 10ms
- **AI Analysis:** 2-5 seconds (DeepSeek), 3-7 seconds (Qwen3 Max)
- **Database Query:** < 10ms (SQLite), < 20ms (PostgreSQL)

---

## Security Considerations

### Frontend
- ✅ API keys stored in localStorage (never sent to backend)
- ✅ HTTPS enforcement (production)
- ✅ Content Security Policy (CSP)
- ✅ XSS protection via React

### Backend
- ✅ CORS restrictions (localhost:3000)
- ✅ Environment variable secrets
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ Rate limiting (future)

---

## Future Technology Additions

### Planned Integrations
- [ ] PostgreSQL for production database
- [ ] Nginx reverse proxy
- [ ] Prometheus + Grafana monitoring
- [ ] Sentry error tracking
- [ ] GitHub Actions CI/CD
- [ ] Multi-user authentication (JWT)

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0  
**Maintainer:** VenTheZone
