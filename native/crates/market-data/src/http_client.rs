use crate::MarketDataError;
use reqwest::Client;
use std::time::Duration;

#[derive(Clone, Debug)]
pub struct HttpClient {
    client: Client,
    base_url: String,
}

impl HttpClient {
    pub fn new(base_url: impl Into<String>) -> Result<Self, MarketDataError> {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .map_err(MarketDataError::from)?;

        Ok(Self {
            client,
            base_url: base_url.into(),
        })
    }

    pub async fn get_text(&self, path: &str) -> Result<String, MarketDataError> {
        let url = if path.starts_with("http://") || path.starts_with("https://") {
            path.to_owned()
        } else {
            format!("{}{}", self.base_url.trim_end_matches('/'), path)
        };

        let response = self
            .client
            .get(url)
            .send()
            .await
            .map_err(MarketDataError::from)?
            .error_for_status()
            .map_err(MarketDataError::from)?;

        response.text().await.map_err(MarketDataError::from)
    }
}
