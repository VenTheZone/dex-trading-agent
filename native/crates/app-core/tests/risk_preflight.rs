use app_core::{check_risk_preflight, AppCoreError, RiskConfig};
use domain::{MarketId, OrderId, OrderRequest, OrderSide, OrderType, Position, PositionDirection, StrategyId};

fn make_order(market_id: &str, side: OrderSide, quantity: f64) -> OrderRequest {
    OrderRequest {
        id: OrderId("order-1".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId(market_id.to_string()),
        side,
        order_type: OrderType::Limit,
        quantity,
        limit_price: Some(100.0),
    }
}

fn make_position(market_id: &str, direction: PositionDirection, quantity: f64) -> Position {
    Position {
        id: domain::PositionId(format!("{}:0", market_id)),
        strategy_id: StrategyId("hyperliquid-manual".to_string()),
        market_id: MarketId(format!("hyperliquid:{}", market_id)),
        direction,
        quantity,
        entry_price: 100.0,
    }
}

// 1. New position is allowed (no existing positions)
#[test]
fn risk_preflight_allows_new_position_when_none_exist() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 100.0);
    let positions: Vec<Position> = vec![];
    let config = RiskConfig::default();

    check_risk_preflight(&order, &positions, &config).unwrap();
}

// 2. Adding to existing position in same direction is allowed (within size limit)
#[test]
fn risk_preflight_allows_adding_to_existing_position() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 50.0);
    // make_position adds "hyperliquid:" prefix, so pass just the asset ID
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig {
        max_position_size: 200.0,
    };

    check_risk_preflight(&order, &positions, &config).unwrap();
}

// 3. Opening opposite direction is allowed (hedge mode)
#[test]
fn risk_preflight_allows_opposite_direction_position() {
    let order = make_order("hyperliquid:1", OrderSide::Sell, 100.0);
    // make_position adds "hyperliquid:" prefix, so pass just the asset ID
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig::default();

    check_risk_preflight(&order, &positions, &config).unwrap();
}

 // 4. Reject position that exceeds max size
#[test]
fn risk_preflight_rejects_position_exceeding_max_size() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 150.0);
    // make_position adds "hyperliquid:" prefix, so pass just the asset ID
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig {
        max_position_size: 200.0, // existing 100 + new 150 = 250 > 200
    };

    let error = check_risk_preflight(&order, &positions, &config).unwrap_err();

    // Use contains() to check that error is about exceeding max size
    assert!(error.to_string().contains("exceeds maximum"));
}

// 5. New position for different market is allowed
#[test]
fn risk_preflight_allows_position_for_different_market() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 100.0);
    // Existing position in BTC (asset 0), order is for ETH (asset 1)
    // make_position adds "hyperliquid:" prefix, so pass just the asset ID
    let positions = vec![make_position("0", PositionDirection::Long, 100.0)];
    let config = RiskConfig::default();

    check_risk_preflight(&order, &positions, &config).unwrap();
}
