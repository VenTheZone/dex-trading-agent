// =============================================================================
// execute_live_decision() Test Suite
// =============================================================================
//
// This function is the orchestration layer that:
// 1. Takes an order request and existing positions
// 2. Runs risk preflight checks
// 3. Converts the order to Hyperliquid format
// 4. Returns the Hyperliquid order ready for signing
//
// Fail-closed behavior:
// - Risk violations block execution
// - Invalid orders are rejected before signing
// - No synthetic data ever reaches the exchange

use app_core::{execute_live_decision, AppCoreError, RiskConfig};
use domain::{MarketId, OrderId, OrderRequest, OrderSide, OrderType, Position, PositionDirection, StrategyId};

// Helper: create a minimal order for testing
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

// Helper: create a position (note: make_position adds "hyperliquid:" prefix)
fn make_position(asset_id: &str, direction: PositionDirection, quantity: f64) -> Position {
    Position {
        id: domain::PositionId(format!("{}:0", asset_id)),
        strategy_id: StrategyId("hyperliquid-manual".to_string()),
        market_id: MarketId(format!("hyperliquid:{}", asset_id)),
        direction,
        quantity,
        entry_price: 100.0,
    }
}

// Test 1: execute_live_decision with no existing positions should succeed
#[test]
fn execute_live_succeeds_with_no_positions() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 100.0);
    let positions: Vec<Position> = vec![];
    let config = RiskConfig::default();

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_ok(), "should succeed with no positions");

    let hl_order = result.unwrap();
    assert_eq!(hl_order.asset, 1);
    assert!(hl_order.is_buy);
    assert_eq!(hl_order.size, "100");
}

// Test 2: execute_live_decision should reject when position exceeds max size
#[test]
fn execute_live_rejects_oversized_position() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 150.0);
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig {
        max_position_size: 200.0, // 100 + 150 = 250 > 200
    };

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_err(), "should reject oversized position");

    let err = result.unwrap_err();
    assert!(err.to_string().contains("exceeds maximum"));
}

// Test 3: execute_live_decision should allow adding to position within limits
#[test]
fn execute_live_allows_adding_within_limits() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 50.0);
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig {
        max_position_size: 200.0, // 100 + 50 = 150 <= 200
    };

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_ok(), "should allow adding within limits");

    let hl_order = result.unwrap();
    assert_eq!(hl_order.asset, 1);
    assert!(hl_order.is_buy);
}

// Test 4: execute_live_decision should allow opposite direction (hedge mode)
#[test]
fn execute_live_allows_opposite_direction() {
    let order = make_order("hyperliquid:1", OrderSide::Sell, 100.0);
    let positions = vec![make_position("1", PositionDirection::Long, 100.0)];
    let config = RiskConfig::default();

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_ok(), "should allow opposite direction");

    let hl_order = result.unwrap();
    assert!(!hl_order.is_buy); // Sell = is_buy=false
}

// Test 5: execute_live_decision should allow different market
#[test]
fn execute_live_allows_different_market() {
    let order = make_order("hyperliquid:1", OrderSide::Buy, 100.0);
    let positions = vec![make_position("0", PositionDirection::Long, 100.0)];
    let config = RiskConfig::default();

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_ok(), "should allow different market");
}

// Test 6: execute_live_decision should reject market orders
#[test]
fn execute_live_rejects_market_orders() {
    let order = OrderRequest {
        id: OrderId("order-1".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("hyperliquid:1".to_string()),
        side: OrderSide::Buy,
        order_type: OrderType::Market, // Market order!
        quantity: 100.0,
        limit_price: None,
    };
    let positions: Vec<Position> = vec![];
    let config = RiskConfig::default();

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_err(), "should reject market orders");

    let err = result.unwrap_err();
    assert!(err.to_string().contains("limit orders"));
}

// Test 7: execute_live_decision should reject orders without limit price
#[test]
fn execute_live_rejects_missing_price() {
    let order = OrderRequest {
        id: OrderId("order-1".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("hyperliquid:1".to_string()),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        quantity: 100.0,
        limit_price: None, // Missing price!
    };
    let positions: Vec<Position> = vec![];
    let config = RiskConfig::default();

    let result = execute_live_decision(&order, &positions, &config);
    assert!(result.is_err(), "should reject orders without price");

    let err = result.unwrap_err();
    assert!(err.to_string().contains("limit_price"));
}
