// =============================================================================
// Error types for UI Shell
// =============================================================================
//
// These errors are shown to the user via QML dialogs.
// Each error has a user-friendly message and optional technical details.

use thiserror::Error;

#[derive(Error, Debug)]
pub enum UiError {
    /// Order execution failed
    #[error("Order failed: {message}")]
    OrderFailed { message: String },

    /// Network/connection error
    #[error("Connection error: {message}")]
    ConnectionError { message: String },

    /// Invalid input from user
    #[error("Invalid input: {field} - {message}")]
    InvalidInput { field: String, message: String },

    /// Risk check failed
    #[error("Risk check failed: {reason}")]
    RiskCheckFailed { reason: String },

    /// Wallet/keyring error
    #[error("Wallet error: {message}")]
    WalletError { message: String },

    /// Configuration error
    #[error("Configuration error: {message}")]
    ConfigError { message: String },

    /// Generic error
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl UiError {
    /// Get user-friendly error message
    pub fn user_message(&self) -> String {
        match self {
            Self::OrderFailed { message } => {
                format!("Failed to execute order: {}", message)
            }
            Self::ConnectionError { message } => {
                format!("Connection error: {}. Please check your network.", message)
            }
            Self::InvalidInput { field, message } => {
                format!("Invalid {}: {}", field, message)
            }
            Self::RiskCheckFailed { reason } => {
                format!("Order rejected: {}", reason)
            }
            Self::WalletError { message } => {
                format!("Wallet error: {}", message)
            }
            Self::ConfigError { message } => {
                format!("Configuration error: {}", message)
            }
            Self::Other(err) => {
                format!("An error occurred: {}", err)
            }
        }
    }

    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Self::ConnectionError { .. } | Self::OrderFailed { .. }
        )
    }

    /// Get error category for logging
    pub fn category(&self) -> &'static str {
        match self {
            Self::OrderFailed { .. } => "order",
            Self::ConnectionError { .. } => "network",
            Self::InvalidInput { .. } => "input",
            Self::RiskCheckFailed { .. } => "risk",
            Self::WalletError { .. } => "wallet",
            Self::ConfigError { .. } => "config",
            Self::Other(_) => "unknown",
        }
    }
}
