// =============================================================================
// ui-shell Library - Qt6/QML Services
// =============================================================================
//
// This library exposes Rust services to the QML UI.
// Uses direct Qt6 C++ FFI for QML loading.
//
// Services:
// - TradingService: Order execution, position management
// - MarketDataService: Price feeds, order book
// - SettingsService: User preferences
//
// The services wrap existing crates:
// - app-core: Orchestration, risk checks
// - paper-trading: Simulated trading
// - ai-providers: AI analysis
//
// Fail-closed behavior:
// - Service errors propagate to QML as error signals
// - Missing data shows loading/empty states
// - Network failures show offline indicators

pub mod error;
pub mod qt6_ffi;

pub use error::UiError;
pub use qt6_ffi::QtApp;

// Data types exposed to QML

/// Position data for display
pub struct Position {
    pub market_id: String,
    pub direction: String,
    pub quantity: f64,
    pub entry_price: f64,
    pub unrealized_pnl: f64,
}

/// Transaction data for display
pub struct Transaction {
    pub timestamp: String,
    pub market_id: String,
    pub side: String,
    pub quantity: f64,
    pub price: f64,
    pub pnl: f64,
}

// Stub services - will be replaced by QML bindings

/// Trading service for order execution
pub struct TradingService {
    pub balance: f64,
}

impl Default for TradingService {
    fn default() -> Self {
        Self { balance: 10000.0 }
    }
}

impl TradingService {
    pub fn get_balance(&self) -> f64 {
        self.balance
    }
}

/// Market data service for price feeds
#[derive(Default)]
pub struct MarketDataService {
    pub connected: bool,
}

impl MarketDataService {
    pub fn is_connected(&self) -> bool {
        self.connected
    }
}

/// Settings service for user preferences
pub struct SettingsService {
    pub dark_mode: bool,
}

impl Default for SettingsService {
    fn default() -> Self {
        Self { dark_mode: true }
    }
}

impl SettingsService {
    pub fn toggle_dark_mode(&mut self) {
        self.dark_mode = !self.dark_mode;
    }
}
