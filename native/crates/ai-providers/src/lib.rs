// =============================================================================
// AI Provider Registry
// =============================================================================
//
// Manages AI analysis providers for the DeX Trading Agent.
// Supports: OpenRouter, Kilo, Cline
//
// Fail-closed behavior (RULE 1 & 2):
// - Never synthesize AI decisions
// - On provider failure, emit Blocked and stop
// - No fallback to synthetic analysis
//
// Provider Interface:
// - health_check(): Verify provider is reachable
// - analyze_market(): Send market data, receive trading decision
// - get_provider_id(): Return provider identifier
//
// The registry:
// - Tracks provider health
// - Routes requests to active provider
// - Fails closed if no providers available

pub mod error;
pub mod openrouter;
pub mod kilo;
pub mod cline;
pub mod registry;

pub use error::ProviderError;
pub use registry::ProviderRegistry;

use async_trait::async_trait;
use domain::ProviderHealth;
use domain::ids::ProviderId;
use serde::{Deserialize, Serialize};

// =============================================================================
// Provider Trait
// =============================================================================
//
// All AI providers implement this trait.
// The trait enforces:
// - Health checking before any analysis
// - Explicit provider identification
// - Typed analysis requests/responses

/// Market data for AI analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketData {
    pub symbol: String,
    pub price: f64,
    pub volume_24h: f64,
    pub price_change_24h: f64,
    pub high_24h: f64,
    pub low_24h: f64,
}

/// AI analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub provider_id: ProviderId,
    pub action: AnalysisAction,
    pub confidence: f64,
    pub reasoning: String,
}

/// Trading action from AI analysis
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum AnalysisAction {
    Buy,
    Sell,
    Hold,
}

/// Configuration for AI providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub provider_id: ProviderId,
    pub api_key: String,
    pub api_url: String,
    pub model: Option<String>,
    pub timeout_secs: u64,
}

/// AI provider interface
#[async_trait]
pub trait AiProvider: Send + Sync {
    /// Get provider identifier
    fn provider_id(&self) -> &ProviderId;

    /// Check if provider is available
    async fn health_check(&self) -> ProviderHealth;

    /// Analyze market data and return trading decision
    ///
    /// # Fail-closed
    /// Returns error if:
    /// - Provider is unhealthy
    /// - API call fails
    /// - Response cannot be parsed
    async fn analyze_market(&self, data: &MarketData) -> Result<AnalysisResult, ProviderError>;
}
