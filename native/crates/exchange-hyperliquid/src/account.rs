use domain::{MarketId, Position, PositionDirection, PositionId, StrategyId};
use serde::Deserialize;

use crate::HyperliquidError;

#[derive(Debug, Deserialize)]
struct AccountState {
    #[serde(rename = "assetPositions")]
    asset_positions: Vec<AssetPosition>,
}

#[derive(Debug, Deserialize)]
struct AssetPosition {
    position: RawPosition,
}

#[derive(Debug, Deserialize)]
struct RawPosition {
    coin: String,
    #[serde(rename = "entryPx")]
    entry_px: String,
    szi: String,
}

pub fn parse_account_positions(payload: &str) -> Result<Vec<Position>, HyperliquidError> {
    let state: AccountState = serde_json::from_str(payload)?;
    let mut positions = Vec::with_capacity(state.asset_positions.len());

    for (index, asset_position) in state.asset_positions.into_iter().enumerate() {
        let signed_size: f64 = asset_position.position.szi.parse()?;

        if signed_size == 0.0 {
            continue;
        }

        let direction = if signed_size.is_sign_negative() {
            PositionDirection::Short
        } else {
            PositionDirection::Long
        };

        positions.push(Position {
            id: PositionId(format!(
                "hyperliquid:{}:{}",
                asset_position.position.coin, index
            )),
            strategy_id: StrategyId("hyperliquid-manual".to_string()),
            market_id: MarketId(asset_position.position.coin),
            direction,
            quantity: signed_size.abs(),
            entry_price: asset_position.position.entry_px.parse()?,
        });
    }

    if positions.is_empty() {
        return Err(HyperliquidError::unavailable(
            "account has no open Hyperliquid positions",
        ));
    }

    Ok(positions)
}
