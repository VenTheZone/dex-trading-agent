use serde::{Deserialize, Serialize};

use crate::ids::{MarketId, PositionId, StrategyId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PositionDirection {
    Long,
    Short,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Position {
    pub id: PositionId,
    pub strategy_id: StrategyId,
    pub market_id: MarketId,
    pub direction: PositionDirection,
    pub quantity: f64,
    pub entry_price: f64,
}
