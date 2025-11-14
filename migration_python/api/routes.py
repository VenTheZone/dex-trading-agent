@router.post("/hyperliquid/execute-trade")
async def execute_hyperliquid_trade(trade: ExecuteTradeRequest):
    """Execute a live trade on Hyperliquid with 8-layer risk management"""
    try:
        # Initialize Hyperliquid service
        hl_service = HyperliquidService(is_testnet=trade.isTestnet)
        
        # RISK LAYER 1: Validate leverage against asset-specific limits
        asset_max_leverage = get_asset_max_leverage(trade.symbol)
        if trade.leverage > asset_max_leverage:
            raise HTTPException(
                status_code=400,
                detail=f"Leverage {trade.leverage}x exceeds maximum {asset_max_leverage}x for {trade.symbol}"
            )
        
        # RISK LAYER 2: Get account info for margin validation
        wallet_address = Account.from_key(trade.apiSecret).address
        account_info = await hl_service.get_account_info(wallet_address)
        
        if not account_info or "marginSummary" not in account_info:
            raise HTTPException(status_code=400, detail="Failed to fetch account margin data")
        
        account_value = float(account_info["marginSummary"].get("accountValue", 0))
        total_margin_used = float(account_info["marginSummary"].get("totalMarginUsed", 0))
        
        # RISK LAYER 3: Check current margin usage
        if account_value > 0:
            current_margin_usage = (total_margin_used / account_value) * 100
            
            if current_margin_usage >= 90:
                raise HTTPException(
                    status_code=400,
                    detail=f"Margin usage too high: {current_margin_usage:.1f}% (max 90%)"
                )
            
            if current_margin_usage >= 80:
                raise HTTPException(
                    status_code=400,
                    detail=f"Margin usage critical: {current_margin_usage:.1f}% - reduce positions before opening new trades"
                )
        
        # RISK LAYER 4: Calculate position notional and validate against account size
        position_notional = trade.size * trade.price
        initial_margin_required = position_notional / trade.leverage
        
        if initial_margin_required > account_value * 0.5:
            raise HTTPException(
                status_code=400,
                detail=f"Position too large: requires ${initial_margin_required:.2f} margin (50% of account max)"
            )
        
        # Place main order
        order_result = await hl_service.place_order(