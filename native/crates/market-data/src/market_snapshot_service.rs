use crate::{HttpClient, MarketDataError};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MarketSnapshot {
    pub symbol: String,
    pub price: f64,
    pub timestamp: String,
}

#[derive(Clone, Debug)]
pub struct MarketSnapshotService {
    client: HttpClient,
}

impl MarketSnapshotService {
    pub fn new(client: HttpClient) -> Self {
        Self { client }
    }

    pub async fn fetch_snapshot(&self, symbol: &str) -> Result<MarketSnapshot, MarketDataError> {
        if symbol.trim().is_empty() {
            return Err(MarketDataError::InvalidInput(
                "symbol cannot be empty".to_string(),
            ));
        }

        let body = self
            .client
            .get_text(&format!("/market-snapshot?symbol={symbol}"))
            .await?;

        if body.trim().is_empty() {
            return Err(MarketDataError::unavailable(format!(
                "no market snapshot returned for {symbol}"
            )));
        }

        serde_json::from_str(&body).map_err(MarketDataError::from)
    }
}
