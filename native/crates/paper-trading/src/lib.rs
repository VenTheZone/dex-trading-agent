// =============================================================================
// Paper Trading Engine
// =============================================================================
//
// Simulates trading without real funds.
// Ported from Python `PaperTradingEngine` in migration_python/services/paper_trading_service.py
//
// Features:
// - Balance tracking (initial + current)
// - Position management (long/short with entry price)
// - Order placement (buy/sell with market/limit)
// - Stop loss and take profit
// - Trade history tracking
// - PnL calculation (realized + unrealized)
//
// Fail-closed behavior:
// - Rejects orders with insufficient balance
// - Rejects closing non-existent positions
// - Never synthesizes trades or balances
//
// Paper trading is ephemeral - no persistence needed.

pub mod error;
pub mod engine;

pub use engine::PaperTradingEngine;
pub use error::PaperTradingError;

/// Order side
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum OrderSide {
    Buy,
    Sell,
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum OrderType {
    Market,
    Limit,
}

/// Order status
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum OrderStatus {
    Filled,
    Rejected,
    Pending,
}

/// Paper trading order
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PaperOrder {
    pub id: u64,
    pub symbol: String,
    pub side: OrderSide,
    pub size: f64,
    pub price: f64,
    pub order_type: OrderType,
    pub status: OrderStatus,
    pub pnl: Option<f64>,
    pub timestamp: String,
}

/// Paper trading position
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PaperPosition {
    pub symbol: String,
    pub side: OrderSide,
    pub size: f64,
    pub entry_price: f64,
    pub current_price: f64,
    pub unrealized_pnl: f64,
    pub stop_loss: Option<f64>,
    pub take_profit: Option<f64>,
}

/// Trade record for history
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TradeRecord {
    pub symbol: String,
    pub side: OrderSide,
    pub entry_price: f64,
    pub exit_price: f64,
    pub size: f64,
    pub pnl: f64,
    pub timestamp: String,
}
