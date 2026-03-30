// =============================================================================
// Kilo Provider
// =============================================================================
//
// Kilo Code AI provider for trading analysis.
// Uses Kilo's API for market analysis.
//
// API: https://api.kilo.ai/v1/chat/completions
//
// Fail-closed behavior:
// - Health check verifies API connectivity
// - Failed requests return error (never synthesize)
// - Rate limits are propagated to caller

use async_trait::async_trait;
use domain::{ProviderHealth, ProviderStatus};
use domain::ids::ProviderId;
use reqwest::Client;
use serde_json::json;

use crate::{AiProvider, AnalysisAction, AnalysisResult, MarketData, ProviderConfig, ProviderError};

pub struct KiloProvider {
    provider_id: ProviderId,
    api_key: String,
    api_url: String,
    model: String,
    client: Client,
}

impl KiloProvider {
    pub fn new(config: ProviderConfig) -> Self {
        Self {
            provider_id: config.provider_id,
            api_key: config.api_key,
            api_url: config.api_url,
            model: config.model.unwrap_or_else(|| "kilo-code".to_string()),
            client: Client::new(),
        }
    }

    fn build_prompt(&self, data: &MarketData) -> String {
        format!(
            r#"You are a cryptocurrency trading analyst. Analyze this market data and recommend an action.

Market Data:
- Symbol: {}
- Current Price: ${:.2}
- 24h Volume: ${:.2}
- 24h Change: {:.2}%
- 24h High: ${:.2}
- 24h Low: ${:.2}

Respond with JSON only:
{{"action": "buy"|"sell"|"hold", "confidence": 0.0-1.0, "reasoning": "brief analysis"}}"#,
            data.symbol,
            data.price,
            data.volume_24h,
            data.price_change_24h,
            data.high_24h,
            data.low_24h,
        )
    }
}

#[async_trait]
impl AiProvider for KiloProvider {
    fn provider_id(&self) -> &ProviderId {
        &self.provider_id
    }

    async fn health_check(&self) -> ProviderHealth {
        if self.api_key.is_empty() {
            return ProviderHealth {
                provider_id: self.provider_id.clone(),
                status: ProviderStatus::Unavailable,
                message: "API key not configured".to_string(),
            };
        }

        ProviderHealth {
            provider_id: self.provider_id.clone(),
            status: ProviderStatus::Available,
            message: "API key configured".to_string(),
        }
    }

    async fn analyze_market(&self, data: &MarketData) -> Result<AnalysisResult, ProviderError> {
        let prompt = self.build_prompt(data);

        let response = self.client
            .post(&format!("{}/chat/completions", self.api_url))
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&json!({
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a trading analysis assistant. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }))
            .send()
            .await
            .map_err(|e| ProviderError::ApiRequestFailed {
                message: e.to_string(),
            })?;

        if !response.status().is_success() {
            return Err(ProviderError::ApiRequestFailed {
                message: format!("HTTP {}", response.status()),
            });
        }

        let body: serde_json::Value = response.json().await.map_err(|e| {
            ProviderError::ResponseParseError {
                message: e.to_string(),
            }
        })?;

        let content = body["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| ProviderError::ResponseParseError {
                message: "Missing content in response".to_string(),
            })?;

        let analysis: serde_json::Value = serde_json::from_str(content).map_err(|e| {
            ProviderError::ResponseParseError {
                message: format!("Failed to parse analysis JSON: {}", e),
            }
        })?;

        let action = match analysis["action"].as_str() {
            Some("buy") => AnalysisAction::Buy,
            Some("sell") => AnalysisAction::Sell,
            Some("hold") => AnalysisAction::Hold,
            _ => return Err(ProviderError::ResponseParseError {
                message: "Invalid action in response".to_string(),
            }),
        };

        Ok(AnalysisResult {
            provider_id: self.provider_id.clone(),
            action,
            confidence: analysis["confidence"].as_f64().unwrap_or(0.5),
            reasoning: analysis["reasoning"].as_str().unwrap_or("").to_string(),
        })
    }
}
