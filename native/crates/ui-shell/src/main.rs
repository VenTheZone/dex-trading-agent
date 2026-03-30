// =============================================================================
// DeX Trading Agent - Qt6/QML Entry Point
// =============================================================================
//
// This is the main entry point for the Qt6 desktop application.
// It initializes the QML engine and loads the main window.
//
// Safety:
// - Panic catching at top level
// - Error propagation with context
// - Graceful shutdown on errors
// - Debug logging for troubleshooting

use anyhow::Result;
use ui_shell::QtApp;

fn main() -> Result<()> {
    // Set up panic handler to catch any panics
    std::panic::set_hook(Box::new(|panic_info| {
        eprintln!("[FATAL] Panic occurred:");
        if let Some(location) = panic_info.location() {
            eprintln!("  File: {}:{}", location.file(), location.line());
        }
        if let Some(message) = panic_info.payload().downcast_ref::<&str>() {
            eprintln!("  Message: {}", message);
        } else if let Some(message) = panic_info.payload().downcast_ref::<String>() {
            eprintln!("  Message: {}", message);
        } else {
            eprintln!("  Message: <unknown>");
        }
        eprintln!("  Backtrace:\n{}", std::backtrace::Backtrace::capture());
    }));

    // Parse command line arguments
    let args: Vec<String> = std::env::args().collect();

    if args.contains(&"--help".to_string()) {
        print_help();
        return Ok(());
    }

    if args.contains(&"--version".to_string()) {
        println!("DeX Trading Agent v2.0.0 (Qt6 Edition)");
        return Ok(());
    }

    // Show banner
    print_banner();

    // Create Qt6 application
    let app = QtApp::new()
        .map_err(|e| anyhow::anyhow!("{}", e))?;

    // Set QML context properties (Rust → QML data binding)
    set_qml_context_properties(&app)?;

    // Load QML file
    // Try embedded resource first, then fall back to file path
    let qml_path = std::env::var("QML_PATH")
        .unwrap_or_else(|_| ":/DeXTradingAgent/qml/Main.qml".to_string());
    
    app.load_qml(&qml_path)
        .map_err(|e| anyhow::anyhow!("Failed to load QML file {}: {}", qml_path, e))?;

    println!("\n[Qt6 UI loaded - running event loop]");

    // Run the Qt event loop
    let exit_code = app.exec();

    println!("[Qt6 UI exited with code: {}]", exit_code);

    std::process::exit(exit_code);
}

/// Set QML context properties for Rust → QML data binding
fn set_qml_context_properties(app: &QtApp) -> Result<()> {
    // Trading service properties
    app.set_context_property_double("tradingBalance", 10000.0)
        .map_err(|e| anyhow::anyhow!("Failed to set tradingBalance: {}", e))?;
    
    app.set_context_property_bool("tradingConnected", false)
        .map_err(|e| anyhow::anyhow!("Failed to set tradingConnected: {}", e))?;

    // Market data properties
    app.set_context_property("marketSymbol", "ETH")
        .map_err(|e| anyhow::anyhow!("Failed to set marketSymbol: {}", e))?;
    
    app.set_context_property_double("marketPrice", 3500.0)
        .map_err(|e| anyhow::anyhow!("Failed to set marketPrice: {}", e))?;

    // Settings properties
    app.set_context_property_bool("darkMode", true)
        .map_err(|e| anyhow::anyhow!("Failed to set darkMode: {}", e))?;

    Ok(())
}

fn print_help() {
    println!(
        r#"
DeX Trading Agent - Qt6 Desktop Edition

USAGE:
    ui-shell [OPTIONS]

OPTIONS:
    --help      Show this help message
    --version   Show version information

ENVIRONMENT:
    QML_PATH=path/to/Main.qml   Path to QML file (default: embedded resource)
    QT_QPA_PLATFORM=wayland      Use Wayland (default on Linux)
    QT_QPA_PLATFORM=xcb          Use X11
    QT_QUICK_BACKEND=software    Use software rendering
    QT_DEBUG_PLUGINS=1            Enable plugin debugging
    QT_LOGGING_RULES="*.debug=true"  Enable Qt debug logging

DEBUGGING:
    Set QT_DEBUG=1 environment variable to enable debug output.
    Check stderr for error messages from the Qt6 FFI layer.

ARCHITECTURE:
    ┌─────────────────────────────────────────────────────────┐
    │  Qt6 + QML Frontend                                     │
    │  ├── Main.qml (window frame, navigation)                │
    │  ├── TradingView.qml (order book, charts)               │
    │  ├── SettingsView.qml (API keys, preferences)           │
    │  └── WalletView.qml (balances, transactions)            │
    ├─────────────────────────────────────────────────────────┤
    │  Qt6 C++ FFI                                            │
    │  ├── QApplication (window management)                   │
    │  ├── QQmlApplicationEngine (QML loading)                │
    │  └── Context properties (Rust → QML data)               │
    ├─────────────────────────────────────────────────────────┤
    │  Rust Backend (existing crates)                         │
    │  ├── app-core (orchestration, risk checks)              │
    │  ├── exchange-hyperliquid (L1 signing)                  │
    │  ├── persistence (SQLite)                               │
    │  └── wallet (system keyring)                            │
    └─────────────────────────────────────────────────────────┘

BUILD:
    cargo build --release -p ui-shell

DEBUG BUILD:
    cargo build -p ui-shell  # Includes debug symbols and logging
"#
    );
}

fn print_banner() {
    println!(
        r#"
╔══════════════════════════════════════════════════════════════╗
║           DeX Trading Agent - Qt6 UI Shell                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Status: Qt6 FFI Integration with Error Handling            ║
║                                                              ║
║  Features:                                                   ║
║  - Panic catching at top level                               ║
║  - Error propagation with context                            ║
║  - Debug logging to stderr                                   ║
║  - Null pointer checks on all FFI calls                      ║
║  - Exception handling in C++ layer                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
"#
    );
}
