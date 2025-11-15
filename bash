# Terminal 1: Start the Python backend
cd migration_python
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2: Run the backtest
pnpm test src/lib/__tests__/agent-backtest.test.ts