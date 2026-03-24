pub mod account;
pub mod execution;
pub mod rest;
pub mod ws;

pub use account::parse_account_positions;
pub use execution::{
    build_order_request, build_signed_order_request, sign_order_action, HyperliquidNetwork,
    HyperliquidOrder, HyperliquidRequestSignature, HyperliquidTimeInForce,
};
pub use rest::build_clearinghouse_state_request;
pub use ws::build_clearinghouse_state_subscription;

use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HyperliquidError {
    Parse(String),
    Sign(String),
    Unavailable(String),
}

impl HyperliquidError {
    pub fn parse(message: impl Into<String>) -> Self {
        Self::Parse(message.into())
    }

    pub fn sign(message: impl Into<String>) -> Self {
        Self::Sign(message.into())
    }

    pub fn unavailable(message: impl Into<String>) -> Self {
        Self::Unavailable(message.into())
    }
}

impl Display for HyperliquidError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Parse(message) => write!(f, "parse error: {message}"),
            Self::Sign(message) => write!(f, "signing error: {message}"),
            Self::Unavailable(message) => write!(f, "hyperliquid unavailable: {message}"),
        }
    }
}

impl Error for HyperliquidError {}

impl From<serde_json::Error> for HyperliquidError {
    fn from(value: serde_json::Error) -> Self {
        Self::parse(value.to_string())
    }
}

impl From<std::num::ParseFloatError> for HyperliquidError {
    fn from(value: std::num::ParseFloatError) -> Self {
        Self::parse(value.to_string())
    }
}
