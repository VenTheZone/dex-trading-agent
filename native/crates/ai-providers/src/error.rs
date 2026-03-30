// =============================================================================
// Provider Error Types
// =============================================================================
//
// Errors from AI provider operations.
// All errors fail closed - no synthetic fallbacks.

use domain::ids::ProviderId;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ProviderError {
    /// Provider is unavailable
    #[error("Provider {provider_id} unavailable: {reason}")]
    ProviderUnavailable {
        provider_id: ProviderId,
        reason: String,
    },

    /// API request failed
    #[error("API request failed: {message}")]
    ApiRequestFailed { message: String },

    /// Invalid API key
    #[error("Invalid API key for provider {provider_id}")]
    InvalidApiKey { provider_id: ProviderId },

    /// Rate limited
    #[error("Rate limited by provider {provider_id}")]
    RateLimited { provider_id: ProviderId },

    /// Response parse error
    #[error("Failed to parse response: {message}")]
    ResponseParseError { message: String },

    /// Timeout
    #[error("Request timed out after {timeout_secs} seconds")]
    Timeout { timeout_secs: u64 },

    /// No providers available
    #[error("No AI providers available")]
    NoProvidersAvailable,

    /// Generic error
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl ProviderError {
    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Self::RateLimited { .. } | Self::Timeout { .. } | Self::ApiRequestFailed { .. }
        )
    }
}
