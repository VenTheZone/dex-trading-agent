# ... keep existing code (imports)

from services.backtesting_service import get_backtest_service, BacktestResult

# ... keep existing code

@router.post("/api/backtest/run")
async def run_backtest(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Run a backtest simulation with detailed logging
    """
    try:
        symbol = request.get("symbol", "BTCUSD")
        start_date = datetime.fromisoformat(request["startDate"].replace("Z", "+00:00"))
        end_date = datetime.fromisoformat(request["endDate"].replace("Z", "+00:00"))
        interval_minutes = request.get("intervalMinutes", 60)
        initial_balance = request.get("initialBalance", 10000.0)
        settings = request.get("settings", {})
        price_data = request.get("priceData", [])
        
        if not price_data:
            return {
                "success": False,
                "error": "Historical price data is required for backtesting"
            }
        
        # Get backtest service
        backtest_service = get_backtest_service(initial_balance)
        
        # Run backtest
        result = await backtest_service.run_backtest(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            interval_minutes=interval_minutes,
            settings=settings,
            ai_service=None,
            price_data=price_data
        )
        
        # Get trade logs
        trade_logs = backtest_service.get_trade_logs()
        
        return {
            "success": True,
            "result": {
                "startDate": result.start_date.isoformat(),
                "endDate": result.end_date.isoformat(),
                "initialBalance": result.initial_balance,
                "finalBalance": result.final_balance,
                "totalTrades": result.total_trades,
                "winningTrades": result.winning_trades,
                "losingTrades": result.losing_trades,
                "totalPnl": result.total_pnl,
                "totalPnlPercent": result.total_pnl_percent,
                "maxDrawdown": result.max_drawdown,
                "maxDrawdownPercent": result.max_drawdown_percent,
                "sharpeRatio": result.sharpe_ratio,
                "winRate": result.win_rate,
                "avgWin": result.avg_win,
                "avgLoss": result.avg_loss,
                "trades": result.trades,
                "equityCurve": result.equity_curve,
                "logs": trade_logs
            }
        }
    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        return {"success": False, "error": str(e)}

@router.get("/api/backtest/logs")
async def get_backtest_logs():
    """Get detailed backtest logs"""
    try:
        backtest_service = get_backtest_service()
        logs = backtest_service.get_trade_logs()
        return {"success": True, "logs": logs}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ... keep existing code (sample data endpoint)
