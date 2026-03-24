use crate::MarketDataError;
use tokio_tungstenite::connect_async;

#[derive(Clone, Debug)]
pub struct WsClient {
    url: String,
}

impl WsClient {
    pub fn new(url: impl Into<String>) -> Self {
        Self { url: url.into() }
    }

    pub async fn connect(&self) -> Result<(), MarketDataError> {
        connect_async(self.url.as_str())
            .await
            .map(|_| ())
            .map_err(MarketDataError::from)
    }
}
