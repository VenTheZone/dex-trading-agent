use serde::{Deserialize, Serialize};

use crate::ids::ProviderId;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderStatus {
    Available,
    Unavailable,
    Degraded,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProviderHealth {
    pub provider_id: ProviderId,
    pub status: ProviderStatus,
    pub message: String,
}
