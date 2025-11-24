# Workflows

## 🛠️ Development Workflow

### 1. Setup
- **Frontend**: React + Vite (`pnpm dev` on port 3000)
- **Backend**: Python FastAPI (`python main.py` on port 8000)
- **Database**: SQLite (Local), Redis (Background tasks)

### 2. Iteration Cycle
1.  **Code**: Modify React components or Python services.
2.  **Hot Reload**: Changes reflect immediately (Vite HMR / Uvicorn reload).
3.  **Test**: Run specific tests for modified components.
    *   Frontend: `pnpm test`
    *   Backend: `pytest`
4.  **Commit**: Follow conventional commits (`feat:`, `fix:`, `chore:`).

## 📈 Trading Workflow

### 1. Analysis Phase
1.  **Data Collection**: Backend fetches prices (Hyperliquid), charts (TradingView), and news.
2.  **AI Processing**: Data sent to OpenRouter (DeepSeek/Qwen) for analysis.
3.  **Decision**: AI generates signal (OPEN_LONG, OPEN_SHORT, HOLD, CLOSE).

### 2. Execution Phase
1.  **Risk Check**: Validate against 8-layer risk framework (Liquidation, Size, Funding).
2.  **Order Placement**:
    *   **Live**: Execute via Hyperliquid SDK (Agent Wallet).
    *   **Paper**: Simulate execution in local database.
3.  **Monitoring**: Real-time P&L tracking via WebSockets.

## 🚀 Deployment Workflow

### Docker Compose
1.  **Build**: `docker compose build`
2.  **Run**: `docker compose up -d`
3.  **Verify**: Check health endpoints (`/health`).
