# DeX Trading Agent - Documentation

Welcome to the comprehensive documentation for the DeX Trading Agent project.

## 📚 Documentation Structure

### 🏗️ Architecture
- **[System Architecture](./Architecture/SYSTEM_ARCHITECTURE.md)** - High-level system design and component interactions
- **[Data Flow](./Architecture/DATA_FLOW.md)** - How data moves through the system
- **[Technology Stack](./Architecture/TECH_STACK.md)** - Detailed breakdown of technologies used
- **[No Auth Architecture](./Architecture/NO_AUTH_ARCHITECTURE.md)** - Security model for local deployment

### 🔌 API Reference
- **[Python Backend API](./API/PYTHON_BACKEND_API.md)** - FastAPI endpoints and WebSocket documentation
- **[Frontend API Client](./API/FRONTEND_API_CLIENT.md)** - TypeScript API client usage
- **[Hyperliquid Integration](./API/HYPERLIQUID_INTEGRATION.md)** - Trading platform API integration
- **[OpenRouter AI API](./API/OPENROUTER_AI_API.md)** - AI model integration

### 📊 Trading Logic
- **[Trading Algorithms](./Trading/TRADING_ALGORITHMS.md)** - Core trading logic and pseudo code
- **[AI Analysis Engine](./Trading/AI_ANALYSIS_ENGINE.md)** - Multi-chart AI analysis workflow
- **[Risk Management](./Trading/RISK_MANAGEMENT.md)** - TP/SL, trailing stops, margin monitoring
- **[Paper Trading Engine](./Trading/PAPER_TRADING_ENGINE.md)** - Simulated trading implementation
- **[Position Management](./Trading/POSITION_MANAGEMENT.md)** - Position tracking and lifecycle

### 🚀 Deployment
- **[Docker Setup](./Deployment/DOCKER_SETUP.md)** - Containerized deployment guide
- **[Local Development](./Deployment/LOCAL_DEVELOPMENT.md)** - Setting up dev environment
- **[Production Deployment](./Deployment/PRODUCTION_DEPLOYMENT.md)** - Production best practices
- **[Environment Variables](./Deployment/ENVIRONMENT_VARIABLES.md)** - Configuration reference

### 📖 Guides
- **[Getting Started](./Guides/GETTING_STARTED.md)** - Quick start guide for new users
- **[API Key Setup](./Guides/API_KEY_SETUP.md)** - How to configure API keys
- **[Trading Modes](./Guides/TRADING_MODES.md)** - Live, Paper, and Demo mode explanations
- **[Troubleshooting](./Guides/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Migration Guide](./Guides/MIGRATION_GUIDE.md)** - Convex to Python backend migration

## 🎯 Quick Links

- [Main README](../README.md)
- [Migration Roadmap](../MIGRATION_ROADMAP.md)
- [Migration TODO](../MIGRATION_TODO.md)
- [Docker README](../README.Docker.md)

## 📝 Contributing to Documentation

When adding new documentation:
1. Follow the existing structure and formatting
2. Include code examples where applicable
3. Add pseudo code for complex algorithms
4. Update this README with links to new documents
5. Keep documentation in sync with code changes

## 🔄 Documentation Status

- ✅ Architecture documentation complete
- ✅ API reference complete
- ✅ Trading logic with pseudo code complete
- ✅ Deployment guides complete
- ✅ User guides complete
- ✅ Environment configuration documented
- ✅ Security model documented
- ✅ Local-only deployment enforced

Last Updated: 2024-01-XX

## 🔧 Recent Changes

- Removed all cloud deployment configurations (render.yaml)
- Clarified environment file priority (.env vs .env.local)
- Updated CORS configuration for local development
- Fixed Docker volume mounts for database persistence
- Removed all vly.ai references from codebase
- Added comprehensive API key configuration documentation
