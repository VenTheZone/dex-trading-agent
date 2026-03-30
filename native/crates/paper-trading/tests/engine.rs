// =============================================================================
// Paper Trading Engine Tests
// =============================================================================
//
// Tests for the paper trading engine.
// Follows TDD: tests verify behavior matches Python implementation.

use paper_trading::{PaperTradingEngine, OrderSide, OrderType, PaperTradingError};

// Helper: create engine with 10000 balance
fn make_engine() -> PaperTradingEngine {
    PaperTradingEngine::new(10000.0)
}

// Test 1: Initial balance
#[test]
fn initial_balance_is_set() {
    let engine = make_engine();
    assert_eq!(engine.balance(), 10000.0);
    assert_eq!(engine.initial_balance(), 10000.0);
}

// Test 2: Buy order deducts from balance
#[test]
fn buy_order_deducts_balance() {
    let mut engine = make_engine();

    let order = engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();

    assert_eq!(order.status, paper_trading::OrderStatus::Filled);
    assert_eq!(engine.balance(), 6500.0); // 10000 - 3500
}

// Test 3: Buy order creates position
#[test]
fn buy_order_creates_position() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();

    let position = engine.position("ETH").unwrap();
    assert_eq!(position.size, 1.0);
    assert_eq!(position.entry_price, 3500.0);
}

// Test 4: Multiple buy orders average entry price
#[test]
fn multiple_buy_orders_average_entry() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3000.0, OrderType::Market).unwrap();
    engine.place_order("ETH", OrderSide::Buy, 1.0, 4000.0, OrderType::Market).unwrap();

    let position = engine.position("ETH").unwrap();
    assert_eq!(position.size, 2.0);
    assert_eq!(position.entry_price, 3500.0); // (3000 + 4000) / 2
}

// Test 5: Sell order closes position
#[test]
fn sell_order_closes_position() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    let order = engine.place_order("ETH", OrderSide::Sell, 1.0, 3600.0, OrderType::Market).unwrap();

    assert_eq!(order.status, paper_trading::OrderStatus::Filled);
    assert_eq!(order.pnl, Some(100.0)); // (3600 - 3500) * 1
    assert!(engine.position("ETH").is_none());
}

// Test 6: Sell order adds PnL to balance
#[test]
fn sell_order_adds_pnl_to_balance() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.place_order("ETH", OrderSide::Sell, 1.0, 3600.0, OrderType::Market).unwrap();

    assert_eq!(engine.balance(), 10100.0); // 10000 - 3500 + 3600
}

// Test 7: Insufficient balance rejects order
#[test]
fn insufficient_balance_rejects_order() {
    let mut engine = make_engine();

    let result = engine.place_order("ETH", OrderSide::Buy, 10.0, 3500.0, OrderType::Market);

    assert!(result.is_err());
    match result.unwrap_err() {
        PaperTradingError::InsufficientBalance { required, available } => {
            assert_eq!(required, 35000.0);
            assert_eq!(available, 10000.0);
        }
        _ => panic!("Expected InsufficientBalance error"),
    }
}

// Test 8: Sell without position rejects
#[test]
fn sell_without_position_rejects() {
    let mut engine = make_engine();

    let result = engine.place_order("ETH", OrderSide::Sell, 1.0, 3500.0, OrderType::Market);

    assert!(result.is_err());
    match result.unwrap_err() {
        PaperTradingError::NoPosition { symbol } => {
            assert_eq!(symbol, "ETH");
        }
        _ => panic!("Expected NoPosition error"),
    }
}

// Test 9: Update price calculates unrealized PnL
#[test]
fn update_price_calculates_unrealized_pnl() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.update_price("ETH", 3600.0);

    let position = engine.position("ETH").unwrap();
    assert_eq!(position.unrealized_pnl, 100.0);
    assert_eq!(position.current_price, 3600.0);
}

// Test 10: Total PnL includes unrealized
#[test]
fn total_pnl_includes_unrealized() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.update_price("ETH", 3600.0);

    assert_eq!(engine.total_pnl(), 100.0);
}

// Test 11: Stop loss triggers on price drop
#[test]
fn stop_loss_triggers() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.set_stop_loss("ETH", 3400.0);
    engine.update_price("ETH", 3390.0);

    // Position should be closed
    assert!(engine.position("ETH").is_none());
    // Balance should reflect the loss
    assert_eq!(engine.balance(), 10000.0 - 110.0); // Loss of 110
}

// Test 12: Take profit triggers on price rise
#[test]
fn take_profit_triggers() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.set_take_profit("ETH", 3600.0);
    engine.update_price("ETH", 3610.0);  // Price exceeds take profit

    // Position should be closed
    assert!(engine.position("ETH").is_none());
    // Balance should reflect the profit (closed at 3610, not 3600)
    assert_eq!(engine.balance(), 10110.0); // PnL = (3610 - 3500) * 1 = 110
}

// Test 13: Reset clears state
#[test]
fn reset_clears_state() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.reset(5000.0);

    assert_eq!(engine.balance(), 5000.0);
    assert_eq!(engine.initial_balance(), 5000.0);
    assert!(engine.position("ETH").is_none());
    assert!(engine.orders().is_empty());
    assert!(engine.trade_history().is_empty());
}

// Test 14: Order history is recorded
#[test]
fn order_history_is_recorded() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.place_order("ETH", OrderSide::Sell, 1.0, 3600.0, OrderType::Market).unwrap();

    assert_eq!(engine.orders().len(), 2);
}

// Test 15: Trade history is recorded on close
#[test]
fn trade_history_is_recorded() {
    let mut engine = make_engine();

    engine.place_order("ETH", OrderSide::Buy, 1.0, 3500.0, OrderType::Market).unwrap();
    engine.place_order("ETH", OrderSide::Sell, 1.0, 3600.0, OrderType::Market).unwrap();

    assert_eq!(engine.trade_history().len(), 1);
    let trade = &engine.trade_history()[0];
    assert_eq!(trade.symbol, "ETH");
    assert_eq!(trade.entry_price, 3500.0);
    assert_eq!(trade.exit_price, 3600.0);
    assert_eq!(trade.pnl, 100.0);
}

// Test 16: Negative size is rejected
#[test]
fn negative_size_rejected() {
    let mut engine = make_engine();

    let result = engine.place_order("ETH", OrderSide::Buy, -1.0, 3500.0, OrderType::Market);

    assert!(result.is_err());
}

// Test 17: Zero price is rejected
#[test]
fn zero_price_rejected() {
    let mut engine = make_engine();

    let result = engine.place_order("ETH", OrderSide::Buy, 1.0, 0.0, OrderType::Market);

    assert!(result.is_err());
}
