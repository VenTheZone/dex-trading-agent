use std::error::Error;
use std::fmt::{Display, Formatter};

use domain::{OrderRequest, OrderSide, OrderType};
use exchange_hyperliquid::{
    build_signed_order_request, HyperliquidError, HyperliquidNetwork, HyperliquidOrder,
    HyperliquidTimeInForce,
};
use serde_json::Value;

pub struct ExecuteHyperliquidOrder<'a> {
    pub private_key: &'a str,
    pub order: &'a OrderRequest,
    pub nonce: u64,
    pub network: HyperliquidNetwork,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppCoreError {
    InvalidMarketId(String),
    InvalidOrder(String),
    UnsupportedOrder(String),
    Exchange(String),
}

impl AppCoreError {
    pub fn invalid_market_id(message: impl Into<String>) -> Self {
        Self::InvalidMarketId(message.into())
    }

    pub fn invalid_order(message: impl Into<String>) -> Self {
        Self::InvalidOrder(message.into())
    }

    pub fn unsupported_order(message: impl Into<String>) -> Self {
        Self::UnsupportedOrder(message.into())
    }

    pub fn exchange(message: impl Into<String>) -> Self {
        Self::Exchange(message.into())
    }
}

impl Display for AppCoreError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidMarketId(message) => write!(f, "invalid market id: {message}"),
            Self::InvalidOrder(message) => write!(f, "invalid order: {message}"),
            Self::UnsupportedOrder(message) => write!(f, "unsupported order: {message}"),
            Self::Exchange(message) => write!(f, "exchange error: {message}"),
        }
    }
}

impl Error for AppCoreError {}

impl From<HyperliquidError> for AppCoreError {
    fn from(value: HyperliquidError) -> Self {
        Self::exchange(value.to_string())
    }
}

pub fn application_name() -> &'static str {
    "DeX Trading Agent"
}

pub async fn execute_hyperliquid_order(
    request: ExecuteHyperliquidOrder<'_>,
) -> Result<Value, AppCoreError> {
    let order = to_hyperliquid_order(request.order)?;

    build_signed_order_request(request.private_key, order, request.nonce, request.network)
        .await
        .map_err(AppCoreError::from)
}

fn to_hyperliquid_order(order: &OrderRequest) -> Result<HyperliquidOrder, AppCoreError> {
    if order.order_type != OrderType::Limit {
        return Err(AppCoreError::unsupported_order(
            "hyperliquid live execution requires limit orders",
        ));
    }

    let limit_price = match order.limit_price {
        Some(limit_price) => limit_price,
        None => {
            return Err(AppCoreError::invalid_order(
                "hyperliquid limit orders require limit_price",
            ))
        }
    };

    Ok(HyperliquidOrder {
        asset: parse_hyperliquid_asset(&order.market_id.0)?,
        is_buy: matches!(order.side, OrderSide::Buy),
        price: format_decimal(limit_price),
        size: format_decimal(order.quantity),
        reduce_only: false,
        time_in_force: HyperliquidTimeInForce::Gtc,
    })
}

fn parse_hyperliquid_asset(market_id: &str) -> Result<u32, AppCoreError> {
    let Some(asset) = market_id.strip_prefix("hyperliquid:") else {
        return Err(AppCoreError::invalid_market_id(
            "expected hyperliquid:<asset> market id",
        ));
    };

    asset.parse::<u32>().map_err(|_| {
        AppCoreError::invalid_market_id("expected hyperliquid:<asset> market id")
    })
}

fn format_decimal(value: f64) -> String {
    value.to_string()
}
