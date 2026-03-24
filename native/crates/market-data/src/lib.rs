pub mod historical_data_service;
pub mod http_client;
pub mod market_snapshot_service;
pub mod ws_client;

pub use historical_data_service::{
    HistoricalCandle, HistoricalDataClient, HistoricalDataService, HttpHistoricalDataClient,
};
pub use http_client::HttpClient;
pub use market_snapshot_service::{MarketSnapshot, MarketSnapshotService};
pub use ws_client::WsClient;

use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MarketDataError {
    InvalidInput(String),
    Network(String),
    Parse(String),
    Unavailable(String),
}

impl MarketDataError {
    pub fn unavailable(message: impl Into<String>) -> Self {
        Self::Unavailable(message.into())
    }

    pub fn network(message: impl Into<String>) -> Self {
        Self::Network(message.into())
    }

    pub fn parse(message: impl Into<String>) -> Self {
        Self::Parse(message.into())
    }
}

impl Display for MarketDataError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidInput(message) => write!(f, "invalid input: {message}"),
            Self::Network(message) => write!(f, "network error: {message}"),
            Self::Parse(message) => write!(f, "parse error: {message}"),
            Self::Unavailable(message) => write!(f, "historical data unavailable: {message}"),
        }
    }
}

impl Error for MarketDataError {}

impl From<reqwest::Error> for MarketDataError {
    fn from(value: reqwest::Error) -> Self {
        Self::network(value.to_string())
    }
}

impl From<serde_json::Error> for MarketDataError {
    fn from(value: serde_json::Error) -> Self {
        Self::parse(value.to_string())
    }
}

impl From<tokio_tungstenite::tungstenite::Error> for MarketDataError {
    fn from(value: tokio_tungstenite::tungstenite::Error) -> Self {
        Self::network(value.to_string())
    }
}
