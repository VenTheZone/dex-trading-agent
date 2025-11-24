# Operational Checklists

## ✅ Setup & Installation
- [ ] **Prerequisites Installed**: Node.js 18+, Python 3.11+, Redis.
- [ ] **Repository Cloned**: `git clone ...`
- [ ] **Dependencies Installed**: `pnpm install` (frontend), `pip install -r requirements.txt` (backend).
- [ ] **Environment Variables**: `.env` created for backend, `.env.local` for frontend.

## 🔑 API Configuration
- [ ] **Hyperliquid Wallet**: Address configured.
- [ ] **Agent Key**: Generated and saved (Live trading only).
- [ ] **OpenRouter Key**: Valid key starting with `sk-or-v1-`.
- [ ] **Network Selection**: Correct network selected (Mainnet vs Testnet).

## 🛡️ Pre-Trading Safety
- [ ] **Mode Check**: Confirm Trading Mode (Demo/Paper/Live).
- [ ] **Funds**: Sufficient USDC in wallet (for Live/Testnet).
- [ ] **Risk Settings**:
    - [ ] Stop Loss set (Rec: 1-2%).
    - [ ] Take Profit set (Rec: 3-5%).
    - [ ] Leverage set (Rec: <5x).
- [ ] **Liquidation Risk**: Check distance to liquidation is >10%.

## 🚀 Deployment
- [ ] **Docker**: Docker Desktop running.
- [ ] **Ports**: 3000, 8000, 6379 available.
- [ ] **Build**: `docker compose build` completes without error.
- [ ] **Health Check**: All services reporting "healthy".
