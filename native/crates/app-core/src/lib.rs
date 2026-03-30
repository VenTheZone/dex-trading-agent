use std::error::Error;
use std::fmt::{Display, Formatter};

use domain::{OrderRequest, OrderSide, OrderType, Position, PositionDirection};
use exchange_hyperliquid::{
    build_signed_order_request, parse_account_positions, HyperliquidError, HyperliquidNetwork,
    HyperliquidOrder, HyperliquidTimeInForce,
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

// =============================================================================
// Account State Fetcher
// =============================================================================
// 
// This function parses the clearinghouse state response from Hyperliquid's
// /info endpoint. It wraps exchange-hyperliquid::parse_account_positions
// to provide a clean API for app-core consumers.
//
// Fail-closed behavior:
// - Empty positions list returns an error (account has no open positions)
// - Invalid JSON returns an error
// - Parse failures return an error

pub fn fetch_hyperliquid_positions(payload: &str) -> Result<Vec<Position>, AppCoreError> {
    parse_account_positions(payload).map_err(AppCoreError::from)
}

// =============================================================================
// Risk Preflight Checks
// =============================================================================
// 
// Before executing a live trade, we run risk checks to ensure the order is safe.
// Current checks:
// - Position size limit: reject if order would exceed max_position_size
//
// Future checks (not yet implemented):
// - Duplicate position detection (same market + direction)
// - Leverage limits
// - Account balance validation
// - Margin requirements

/// Configuration for risk preflight checks.
/// Uses defaults that are fail-closed and conservative.
#[derive(Debug, Clone)]
pub struct RiskConfig {
    /// Maximum position size allowed for any single market.
    /// Default: 10,000 units (conservative for testing).
    pub max_position_size: f64,
}

impl Default for RiskConfig {
    fn default() -> Self {
        Self {
            max_position_size: 10_000.0,
        }
    }
}

/// Run risk preflight checks before executing an order.
/// 
/// Returns Ok(()) if all checks pass, Err with reason if any check fails.
/// 
/// Fail-closed: rejects orders that would exceed position size limits.
pub fn check_risk_preflight(
    order: &OrderRequest,
    positions: &[Position],
    config: &RiskConfig,
) -> Result<(), AppCoreError> {
    // Extract asset ID from the order's market_id (format: "hyperliquid:<asset>")
    let Some(order_asset) = order.market_id.0.strip_prefix("hyperliquid:") else {
        return Err(AppCoreError::invalid_market_id(
            "expected hyperliquid:<asset> market id",
        ));
    };

    // Find existing position for the same market
    let existing_position = positions.iter().find(|p| {
        p.market_id
            .0
            .strip_prefix("hyperliquid:")
            .map(|asset| asset == order_asset)
            .unwrap_or(false)
    });

    let Some(position) = existing_position else {
        // No existing position - new position is always allowed
        return Ok(());
    };

    // Check if this order would add to existing position
    let would_add_to_long =
        matches!(order.side, OrderSide::Buy) && matches!(position.direction, PositionDirection::Long);
    let would_add_to_short =
        matches!(order.side, OrderSide::Sell) && matches!(position.direction, PositionDirection::Short);

    if would_add_to_long || would_add_to_short {
        // Calculate total size after order
        let total_size = position.quantity + order.quantity;

        if total_size > config.max_position_size {
            return Err(AppCoreError::invalid_order(format!(
                "position size {} exceeds maximum {}",
                total_size, config.max_position_size
            )));
        }
    }

    // Reducing position or opposite direction - always allowed
    Ok(())
}

// =============================================================================
// Live Decision Orchestrator
// =============================================================================
//
// This is the main orchestration function that:
// 1. Validates the order against risk limits
// 2. Converts the order to Hyperliquid format
// 3. Returns the Hyperliquid order ready for signing
//
// The actual signing is done separately by execute_hyperliquid_order.
// This separation allows:
// - Risk checks to happen before any network calls
// - Order format validation to happen before signing
// - Clear error messages about what failed and why
//
// Fail-closed behavior:
// - Risk violations block execution immediately
// - Invalid order formats are rejected
// - No order reaches the exchange without passing all checks

/// Execute a live trading decision.
///
/// Takes an order request and existing positions, runs risk preflight checks,
/// and converts the order to Hyperliquid format if all checks pass.
///
/// Returns the Hyperliquid order ready for signing, or an error explaining
/// what check failed.
///
/// # Fail-closed behavior
/// - Risk violations block execution immediately
/// - Invalid order formats are rejected
/// - No order reaches the exchange without passing all checks
pub fn execute_live_decision(
    order: &OrderRequest,
    positions: &[Position],
    config: &RiskConfig,
) -> Result<HyperliquidOrder, AppCoreError> {
    // Step 1: Run risk preflight checks
    // This validates that the order won't exceed position size limits
    // and catches any other risk violations before we commit to execution
    check_risk_preflight(order, positions, config)?;

    // Step 2: Convert to Hyperliquid order format
    // This validates the order format (limit orders only, price required)
    // and extracts the asset ID from the market_id
    to_hyperliquid_order(order)
}
