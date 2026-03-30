// =============================================================================
// AI Provider Tests
// =============================================================================
//
// Tests for the provider registry and provider implementations.
// Follows TDD: tests first, then implementation.

use std::sync::Arc;
use domain::ids::ProviderId;
use ai_providers::{ProviderRegistry, MarketData, AnalysisAction, ProviderConfig};
use ai_providers::openrouter::OpenRouterProvider;
use ai_providers::kilo::KiloProvider;
use ai_providers::cline::ClineProvider;

/// Helper: create test market data
fn make_market_data() -> MarketData {
    MarketData {
        symbol: "ETH".to_string(),
        price: 3500.0,
        volume_24h: 1_000_000.0,
        price_change_24h: 2.5,
        high_24h: 3600.0,
        low_24h: 3400.0,
    }
}

/// Helper: create test provider config
fn make_provider_config(id: &str) -> ProviderConfig {
    ProviderConfig {
        provider_id: ProviderId(id.to_string()),
        api_key: "sk-test123".to_string(),
        api_url: "https://api.example.com/v1".to_string(),
        model: None,
        timeout_secs: 30,
    }
}

// Test 1: Registry can be created
#[test]
fn registry_can_be_created() {
    let registry = ProviderRegistry::new();
    assert_eq!(registry.provider_ids().len(), 0);
}

// Test 2: Provider can be registered
#[test]
fn provider_can_be_registered() {
    let mut registry = ProviderRegistry::new();
    let config = make_provider_config("openrouter");
    let provider = Arc::new(OpenRouterProvider::new(config));

    registry.register(provider);

    assert_eq!(registry.provider_ids().len(), 1);
    assert!(registry.get(&ProviderId("openrouter".to_string())).is_some());
}

// Test 3: Multiple providers can be registered
#[test]
fn multiple_providers_can_be_registered() {
    let mut registry = ProviderRegistry::new();

    let openrouter = Arc::new(OpenRouterProvider::new(make_provider_config("openrouter")));
    let kilo = Arc::new(KiloProvider::new(make_provider_config("kilo")));
    let cline = Arc::new(ClineProvider::new(make_provider_config("cline")));

    registry.register(openrouter);
    registry.register(kilo);
    registry.register(cline);

    assert_eq!(registry.provider_ids().len(), 3);
}

// Test 4: Market data can be created
#[test]
fn market_data_can_be_created() {
    let data = make_market_data();
    assert_eq!(data.symbol, "ETH");
    assert_eq!(data.price, 3500.0);
}

// Test 5: Provider config can be created
#[test]
fn provider_config_can_be_created() {
    let config = make_provider_config("test");
    assert_eq!(config.provider_id.0, "test");
    assert!(!config.api_key.is_empty());
}
