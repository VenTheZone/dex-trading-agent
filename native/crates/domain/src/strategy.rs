use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradingAction {
    OpenLong,
    OpenShort,
    Close,
    Hold,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TradingDecision {
    pub action: TradingAction,
    pub reason: String,
}

impl TradingDecision {
    pub fn hold(reason: impl Into<String>) -> Self {
        Self {
            action: TradingAction::Hold,
            reason: reason.into(),
        }
    }
}
