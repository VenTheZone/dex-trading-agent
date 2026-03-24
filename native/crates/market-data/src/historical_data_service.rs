use crate::{HttpClient, MarketDataError};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HistoricalCandle {
    pub timestamp: String,
    pub price: f64,
    pub volume: f64,
}

pub trait HistoricalDataClient: Send + Sync {
    fn fetch_range<'a>(
        &'a self,
        symbol: &'a str,
        days: u32,
    ) -> Pin<Box<dyn Future<Output = Result<Vec<HistoricalCandle>, MarketDataError>> + Send + 'a>>;
}

#[derive(Clone, Debug)]
pub struct HttpHistoricalDataClient {
    client: HttpClient,
}

impl HttpHistoricalDataClient {
    pub fn new(client: HttpClient) -> Self {
        Self { client }
    }
}

impl HistoricalDataClient for HttpHistoricalDataClient {
    fn fetch_range<'a>(
        &'a self,
        symbol: &'a str,
        days: u32,
    ) -> Pin<Box<dyn Future<Output = Result<Vec<HistoricalCandle>, MarketDataError>> + Send + 'a>>
    {
        Box::pin(async move {
            let body = self
                .client
                .get_text(&format!("/historical-data?symbol={symbol}&days={days}"))
                .await?;

            if body.trim().is_empty() {
                return Ok(Vec::new());
            }

            let response: HistoricalDataResponse = serde_json::from_str(&body)?;
            Ok(response.data)
        })
    }
}

#[derive(Debug, Deserialize)]
struct HistoricalDataResponse {
    data: Vec<HistoricalCandle>,
}

pub struct HistoricalDataService<C = HttpHistoricalDataClient> {
    client: C,
}

impl<C> HistoricalDataService<C> {
    pub fn with_client(client: C) -> Self {
        Self { client }
    }
}

impl<C> HistoricalDataService<C>
where
    C: HistoricalDataClient,
{
    pub async fn fetch_range(
        &self,
        symbol: &str,
        days: u32,
    ) -> Result<Vec<HistoricalCandle>, MarketDataError> {
        if symbol.trim().is_empty() {
            return Err(MarketDataError::InvalidInput(
                "symbol cannot be empty".to_string(),
            ));
        }

        if days == 0 {
            return Err(MarketDataError::InvalidInput(
                "days must be greater than zero".to_string(),
            ));
        }

        let upstream_rows = self.client.fetch_range(symbol, days).await?;
        if upstream_rows.is_empty() {
            return Err(MarketDataError::unavailable(format!(
                "no historical candles returned for {symbol}"
            )));
        }

        Ok(upstream_rows)
    }
}
