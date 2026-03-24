use serde::{Deserialize, Serialize};

use crate::ids::{MarketId, ProviderId};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MarketStatus {
    Open,
    Closed,
    Halted,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Market {
    pub id: MarketId,
    pub provider_id: ProviderId,
    pub symbol: String,
    pub status: MarketStatus,
}
