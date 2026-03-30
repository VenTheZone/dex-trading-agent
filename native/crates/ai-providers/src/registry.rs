// =============================================================================
// Provider Registry
// =============================================================================
//
// Manages AI providers for the DeX Trading Agent.
// Tracks provider health and routes requests.
//
// Fail-closed behavior:
// - No providers available → return error
// - All providers unhealthy → return error
// - Never synthesize AI decisions

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use domain::{ProviderHealth, ProviderStatus};
use domain::ids::ProviderId;

use crate::{AiProvider, AnalysisResult, MarketData, ProviderError};

/// Registry for managing AI providers
pub struct ProviderRegistry {
    providers: HashMap<ProviderId, Arc<dyn AiProvider>>,
    health: Arc<RwLock<HashMap<ProviderId, ProviderHealth>>>,
}

impl ProviderRegistry {
    pub fn new() -> Self {
        Self {
            providers: HashMap::new(),
            health: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a provider
    pub fn register(&mut self, provider: Arc<dyn AiProvider>) {
        let id = provider.provider_id().clone();
        self.providers.insert(id.clone(), provider);
        // Initialize with unknown health
        let health = ProviderHealth {
            provider_id: id.clone(),
            status: ProviderStatus::Unavailable,
            message: "Not yet checked".to_string(),
        };
        // We need to use a blocking write here since register is sync
        // In practice, health checks will update this async
        let mut health_map = self.health.blocking_write();
        health_map.insert(id, health);
    }

    /// Get provider by ID
    pub fn get(&self, provider_id: &ProviderId) -> Option<Arc<dyn AiProvider>> {
        self.providers.get(provider_id).cloned()
    }

    /// Get all provider IDs
    pub fn provider_ids(&self) -> Vec<ProviderId> {
        self.providers.keys().cloned().collect()
    }

    /// Check health of all providers
    pub async fn check_all_health(&self) -> Vec<ProviderHealth> {
        let mut results = Vec::new();
        let mut health_map = self.health.write().await;

        for (id, provider) in &self.providers {
            let health = provider.health_check().await;
            health_map.insert(id.clone(), health.clone());
            results.push(health);
        }

        results
    }

    /// Get cached health for a provider
    pub async fn get_health(&self, provider_id: &ProviderId) -> Option<ProviderHealth> {
        let health_map = self.health.read().await;
        health_map.get(provider_id).cloned()
    }

    /// Get first available provider
    pub async fn get_available_provider(&self) -> Result<Arc<dyn AiProvider>, ProviderError> {
        let health_map = self.health.read().await;

        for (id, health) in health_map.iter() {
            if health.status == ProviderStatus::Available {
                if let Some(provider) = self.providers.get(id) {
                    return Ok(provider.clone());
                }
            }
        }

        Err(ProviderError::NoProvidersAvailable)
    }

    /// Analyze market using first available provider
    ///
    /// # Fail-closed
    /// Returns error if:
    /// - No providers registered
    /// - No providers available
    /// - Provider analysis fails
    pub async fn analyze_market(&self, data: &MarketData) -> Result<AnalysisResult, ProviderError> {
        let provider = self.get_available_provider().await?;
        provider.analyze_market(data).await
    }
}

impl Default for ProviderRegistry {
    fn default() -> Self {
        Self::new()
    }
}
