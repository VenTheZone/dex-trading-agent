pub mod errors;
pub mod ids;
pub mod market;
pub mod orders;
pub mod positions;
pub mod providers;
pub mod strategy;

pub use errors::DomainError;
pub use ids::{MarketId, OrderId, PositionId, ProviderId, StrategyId};
pub use market::{Market, MarketStatus};
pub use orders::{OrderRequest, OrderSide, OrderType};
pub use positions::{Position, PositionDirection};
pub use providers::{ProviderHealth, ProviderStatus};
pub use strategy::{TradingAction, TradingDecision};
