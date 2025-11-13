# Migration TODO Checklist

## Phase 1: Backend Setup ✅
- [x] Create migration roadmap
- [x] Set up migration directory structure
- [ ] Review all pseudo-code documents
- [ ] Set up Python virtual environment
- [ ] Install core dependencies (FastAPI, SQLAlchemy, etc.)

## Phase 2: Database Migration
- [ ] Review `database_schema.py` pseudo-code
- [ ] Set up PostgreSQL database
- [ ] Implement SQLAlchemy models
- [ ] Create Alembic migrations
- [ ] Migrate existing data from Convex

## Phase 3: API Layer
- [ ] Review `api_routes.py` pseudo-code
- [ ] Implement FastAPI routes
- [ ] ~~Add authentication middleware~~ (NOT NEEDED - local use)
- [ ] Implement WebSocket endpoints
- [ ] Add CORS configuration (allow localhost only)

## Phase 4: Business Logic
- [ ] Review `trading_service.py` pseudo-code
- [ ] Implement AI trading logic (OpenRouter integration)
- [ ] Review `hyperliquid_service.py` pseudo-code
- [ ] Implement Hyperliquid API client
- [ ] Review `market_data_service.py` pseudo-code
- [ ] Implement multi-exchange price fetching
- [ ] Review `paper_trading_service.py` pseudo-code
- [ ] Implement paper trading engine

## Phase 5: Background Workers
- [ ] Review `celery_tasks.py` pseudo-code
- [ ] Set up Celery + Redis
- [ ] Implement scheduled AI analysis tasks
- [ ] Implement balance tracking tasks

## Phase 6: Frontend Integration
- [ ] Replace Convex hooks with REST API calls
- [ ] Implement WebSocket client for real-time updates
- [ ] Update environment variables
- [ ] Test all frontend features

## Phase 7: Testing & Deployment
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Set up Docker Compose
- [ ] Deploy to production
- [ ] Monitor and optimize

## Notes
- Each pseudo-code file in `migration_python/` provides implementation guidance
- Refer to `MIGRATION_ROADMAP.md` for detailed timeline and architecture
- Test each component thoroughly before moving to the next phase