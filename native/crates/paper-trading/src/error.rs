// =============================================================================
// Paper Trading Error Types
// =============================================================================
//
// Errors from paper trading operations.
// All errors are recoverable - no panics.

use thiserror::Error;

#[derive(Error, Debug)]
pub enum PaperTradingError {
    /// Insufficient balance for order
    #[error("Insufficient balance: required {required:.2}, available {available:.2}")]
    InsufficientBalance { required: f64, available: f64 },

    /// No position to close
    #[error("No position found for {symbol}")]
    NoPosition { symbol: String },

    /// Invalid order parameters
    #[error("Invalid order: {reason}")]
    InvalidOrder { reason: String },

    /// Order execution failed
    #[error("Order execution failed: {reason}")]
    ExecutionFailed { reason: String },
}

impl PaperTradingError {
    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        matches!(self, Self::InsufficientBalance { .. } | Self::InvalidOrder { .. })
    }
}
