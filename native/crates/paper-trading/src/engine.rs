// =============================================================================
// Paper Trading Engine Implementation
// =============================================================================
//
// Core engine for simulated trading.
// Manages positions, orders, and PnL tracking.
//
// Fail-closed behavior:
// - Balance checks before buy orders
// - Position existence checks before sell orders
// - No synthetic data generation

use std::collections::HashMap;
use chrono::Utc;

use crate::{OrderSide, OrderStatus, OrderType, PaperOrder, PaperPosition, PaperTradingError, TradeRecord};

/// Paper trading engine for simulated trading
pub struct PaperTradingEngine {
    balance: f64,
    initial_balance: f64,
    realized_pnl: f64,  // Track realized PnL separately
    positions: HashMap<String, PaperPosition>,
    orders: Vec<PaperOrder>,
    trade_history: Vec<TradeRecord>,
    next_order_id: u64,
}

impl PaperTradingEngine {
    /// Create new paper trading engine
    pub fn new(initial_balance: f64) -> Self {
        Self {
            balance: initial_balance,
            initial_balance,
            realized_pnl: 0.0,
            positions: HashMap::new(),
            orders: Vec::new(),
            trade_history: Vec::new(),
            next_order_id: 1,
        }
    }

    /// Get current balance
    pub fn balance(&self) -> f64 {
        self.balance
    }

    /// Get initial balance
    pub fn initial_balance(&self) -> f64 {
        self.initial_balance
    }

    /// Get position for symbol
    pub fn position(&self, symbol: &str) -> Option<&PaperPosition> {
        self.positions.get(symbol)
    }

    /// Get all positions
    pub fn positions(&self) -> Vec<&PaperPosition> {
        self.positions.values().collect()
    }

    /// Get order history
    pub fn orders(&self) -> &[PaperOrder] {
        &self.orders
    }

    /// Get trade history
    pub fn trade_history(&self) -> &[TradeRecord] {
        &self.trade_history
    }

    /// Place a paper trading order
    ///
    /// # Fail-closed
    /// Returns error if:
    /// - Insufficient balance for buy
    /// - No position to close for sell
    /// - Invalid parameters
    pub fn place_order(
        &mut self,
        symbol: &str,
        side: OrderSide,
        size: f64,
        price: f64,
        order_type: OrderType,
    ) -> Result<PaperOrder, PaperTradingError> {
        if size <= 0.0 {
            return Err(PaperTradingError::InvalidOrder {
                reason: "Size must be positive".to_string(),
            });
        }

        if price <= 0.0 {
            return Err(PaperTradingError::InvalidOrder {
                reason: "Price must be positive".to_string(),
            });
        }

        let order_value = size * price;

        match side {
            OrderSide::Buy => {
                // Check balance
                if order_value > self.balance {
                    return Err(PaperTradingError::InsufficientBalance {
                        required: order_value,
                        available: self.balance,
                    });
                }

                // Deduct from balance
                self.balance -= order_value;

                // Create or update position
                if let Some(existing) = self.positions.get_mut(symbol) {
                    // Average entry price
                    let total_size = existing.size + size;
                    let avg_price = ((existing.entry_price * existing.size) + (price * size)) / total_size;

                    existing.size = total_size;
                    existing.entry_price = avg_price;
                    existing.current_price = price;
                    existing.unrealized_pnl = 0.0;
                } else {
                    // New position
                    self.positions.insert(symbol.to_string(), PaperPosition {
                        symbol: symbol.to_string(),
                        side: OrderSide::Buy,
                        size,
                        entry_price: price,
                        current_price: price,
                        unrealized_pnl: 0.0,
                        stop_loss: None,
                        take_profit: None,
                    });
                }

                let order = PaperOrder {
                    id: self.next_order_id,
                    symbol: symbol.to_string(),
                    side,
                    size,
                    price,
                    order_type,
                    status: OrderStatus::Filled,
                    pnl: None,
                    timestamp: Utc::now().to_rfc3339(),
                };

                self.next_order_id += 1;
                self.orders.push(order.clone());

                Ok(order)
            }

            OrderSide::Sell => {
                // Check position exists
                let position = self.positions.get(symbol)
                    .ok_or_else(|| PaperTradingError::NoPosition {
                        symbol: symbol.to_string(),
                    })?;

                let pnl = (price - position.entry_price) * position.size;

                // Add PnL to balance
                self.balance += (position.entry_price * position.size) + pnl;

                // Track realized PnL
                self.realized_pnl += pnl;

                // Record trade
                let position = self.positions.remove(symbol).unwrap();
                self.trade_history.push(TradeRecord {
                    symbol: symbol.to_string(),
                    side: position.side,
                    entry_price: position.entry_price,
                    exit_price: price,
                    size: position.size,
                    pnl,
                    timestamp: Utc::now().to_rfc3339(),
                });

                let order = PaperOrder {
                    id: self.next_order_id,
                    symbol: symbol.to_string(),
                    side,
                    size: position.size,
                    price,
                    order_type,
                    status: OrderStatus::Filled,
                    pnl: Some(pnl),
                    timestamp: Utc::now().to_rfc3339(),
                };

                self.next_order_id += 1;
                self.orders.push(order.clone());

                Ok(order)
            }
        }
    }

    /// Close a position
    pub fn close_position(&mut self, symbol: &str, price: f64) -> Result<f64, PaperTradingError> {
        let order = self.place_order(symbol, OrderSide::Sell, 0.0, price, OrderType::Market)?;

        // Note: size is taken from position, not from the argument
        order.pnl.ok_or_else(|| PaperTradingError::ExecutionFailed {
            reason: "No PnL in sell order".to_string(),
        })
    }

    /// Update position with current market price
    ///
    /// Also checks stop loss and take profit triggers.
    pub fn update_price(&mut self, symbol: &str, current_price: f64) {
        // Extract position data first to avoid borrow checker issues
        let (should_close, size, _stop_loss, _take_profit) = {
            if let Some(position) = self.positions.get_mut(symbol) {
                position.current_price = current_price;
                position.unrealized_pnl = (current_price - position.entry_price) * position.size;

                // Check if we need to close the position
                let mut should_close = false;

                if let Some(stop_loss) = position.stop_loss {
                    if current_price <= stop_loss {
                        should_close = true;
                    }
                }

                if let Some(take_profit) = position.take_profit {
                    if current_price >= take_profit {
                        should_close = true;
                    }
                }

                (should_close, position.size, position.stop_loss, position.take_profit)
            } else {
                (false, 0.0, None, None)
            }
        };

        // Close position if triggered (after releasing the borrow)
        if should_close {
            let _ = self.place_order(
                symbol,
                OrderSide::Sell,
                size,
                current_price,
                OrderType::Market,
            );
        }
    }

    /// Set stop loss for a position
    pub fn set_stop_loss(&mut self, symbol: &str, stop_loss: f64) {
        if let Some(position) = self.positions.get_mut(symbol) {
            position.stop_loss = Some(stop_loss);
        }
    }

    /// Set take profit for a position
    pub fn set_take_profit(&mut self, symbol: &str, take_profit: f64) {
        if let Some(position) = self.positions.get_mut(symbol) {
            position.take_profit = Some(take_profit);
        }
    }

    /// Get total PnL (realized + unrealized)
    pub fn total_pnl(&self) -> f64 {
        let unrealized: f64 = self.positions.values()
            .map(|p| p.unrealized_pnl)
            .sum();

        self.realized_pnl + unrealized
    }

    /// Reset the engine
    pub fn reset(&mut self, initial_balance: f64) {
        self.balance = initial_balance;
        self.initial_balance = initial_balance;
        self.realized_pnl = 0.0;
        self.positions.clear();
        self.orders.clear();
        self.trade_history.clear();
        self.next_order_id = 1;
    }
}

impl Default for PaperTradingEngine {
    fn default() -> Self {
        Self::new(10000.0)
    }
}
