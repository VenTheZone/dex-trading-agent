use market_data::{HistoricalCandle, HistoricalDataClient, HistoricalDataService, MarketDataError};
use std::future::Future;
use std::pin::Pin;

struct EmptyClient;

impl HistoricalDataClient for EmptyClient {
    fn fetch_range<'a>(
        &'a self,
        _symbol: &'a str,
        _days: u32,
    ) -> Pin<Box<dyn Future<Output = Result<Vec<HistoricalCandle>, MarketDataError>> + Send + 'a>>
    {
        Box::pin(async { Ok(Vec::new()) })
    }
}

fn failing_client() -> EmptyClient {
    EmptyClient
}

#[tokio::test]
async fn historical_service_rejects_missing_upstream_data() {
    let svc = HistoricalDataService::with_client(failing_client());
    let err = svc.fetch_range("BTCUSD", 30).await.unwrap_err();

    assert!(err.to_string().contains("unavailable"));
}
