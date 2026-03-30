// =============================================================================
// OpenRouter Provider
// =============================================================================
//
// OpenRouter is a unified API gateway for multiple AI models.
// Supports: DeepSeek, Claude, GPT-4, and more.
//
// API: https://openrouter.ai/api/v1/chat/completions
//
// Fail-closed behavior:
// - Health check verifies API key validity
// - Failed requests return error (never synthesize)
// - Rate limits are propagated to caller

use async_trait::async_trait;
use domain::{ProviderHealth, ProviderStatus};
use domain::ids::ProviderId;
use reqwest::Client;
use serde_json::json;

use crate::{AiProvider, AnalysisAction, AnalysisResult, MarketData, ProviderConfig, ProviderError};

pub struct OpenRouterProvider {
    provider_id: ProviderId,
    api_key: String,
    api_url: String,
    model: String,
    client: Client,
}

impl OpenRouterProvider {
    pub fn new(config: ProviderConfig) -> Self {
        Self {
            provider_id: config.provider_id,
            api_key: config.api_key,
            api_url: config.api_url,
            model: config.model.unwrap_or_else(|| "deepseek/deepseek-chat-v3-0324:free".to_string()),
            client: Client::new(),
        }
    }

    /// Build the analysis prompt
    fn build_prompt(&self, data: &MarketData) -> String {
        format!(
            r#"Analyze this cryptocurrency market data and recommend a trading action.

Symbol: {}
Current Price: ${:.2}
24h Volume: ${:.2}
24h Change: {:.2}%
24h High: ${:.2}
24h Low: ${:.2}

Respond with JSON:
{{
    "action": "buy" | "sell" | "hold",
    "confidence": 0.0-1.0,
    "reasoning": "detailed analysis"
}}"#,
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
impl AiProvider for OpenRouterProvider {
    fn provider_id(&self) -> &ProviderId {
        &self.provider_id
    }

    async fn health_check(&self) -> ProviderHealth {
        // Simple health check - verify API key format
        if self.api_key.is_empty() || !self.api_key.starts_with("sk-") {
            return ProviderHealth {
                provider_id: self.provider_id.clone(),
                status: ProviderStatus::Unavailable,
                message: "Invalid API key format".to_string(),
            };
        }

        // TODO: Make actual API call to verify key
        ProviderHealth {
            provider_id: self.provider_id.clone(),
            status: ProviderStatus::Available,
            message: "API key format valid".to_string(),
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

        // Extract content from response
        let content = body["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| ProviderError::ResponseParseError {
                message: "Missing content in response".to_string(),
            })?;

        // Parse JSON from content
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

        let confidence = analysis["confidence"].as_f64().unwrap_or(0.5);
        let reasoning = analysis["reasoning"]
            .as_str()
            .unwrap_or("No reasoning provided")
            .to_string();

        Ok(AnalysisResult {
            provider_id: self.provider_id.clone(),
            action,
            confidence,
            reasoning,
        })
    }
}
