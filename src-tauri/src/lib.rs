// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Initialize store for secure API key storage
            let _store = app.store_builder("api_keys.dat").build();
            
            // Set up window event listeners
            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(|event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        // Allow close
                    }
                });
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // API Keys
            commands::get_api_keys,
            commands::set_api_keys,
            commands::clear_api_keys,
            // Wallet
            commands::save_wallet_connection,
            commands::get_connected_wallet,
            commands::clear_wallet_connection,
            // Trading Mode
            commands::get_trading_mode,
            commands::set_trading_mode,
            // Settings
            commands::get_settings,
            commands::set_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
