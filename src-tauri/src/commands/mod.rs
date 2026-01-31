use tauri::AppHandle;
use serde_json::Value;
use std::collections::HashMap;

// ============================================
// API KEYS MANAGEMENT
// ============================================

#[tauri::command]
pub async fn get_api_keys(app: AppHandle) -> Result<Value, String> {
    let store = app.store_builder("api_keys.dat").build();
    match store.get("keys") {
        Some(keys) => Ok(keys),
        None => Ok(serde_json::json!({})),
    }
}

#[tauri::command]
pub async fn set_api_keys(app: AppHandle, keys: Value) -> Result<(), String> {
    let store = app.store_builder("api_keys.dat").build();
    store.set("keys", keys);
    store.save().map_err(|e| format!("Failed to save API keys: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn clear_api_keys(app: AppHandle) -> Result<(), String> {
    let store = app.store_builder("api_keys.dat").build();
    store.delete("keys");
    store.save().map_err(|e| format!("Failed to clear API keys: {}", e))?;
    Ok(())
}

// ============================================
// WALLET MANAGEMENT
// ============================================

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct WalletInfo {
    address: String,
    network: String,
    connected_at: String,
}

#[tauri::command]
pub async fn save_wallet_connection(
    app: AppHandle,
    address: String,
    network: String,
) -> Result<(), String> {
    let store = app.store_builder("wallet.dat").build();
    let wallet_info = serde_json::json!({
        "address": address,
        "network": network,
        "connected_at": chrono::Utc::now().to_rfc3339(),
    });
    store.set("current_wallet", wallet_info);
    store.save().map_err(|e| format!("Failed to save wallet: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_connected_wallet(app: AppHandle) -> Result<Option<Value>, String> {
    let store = app.store_builder("wallet.dat").build();
    Ok(store.get("current_wallet"))
}

#[tauri::command]
pub async fn clear_wallet_connection(app: AppHandle) -> Result<(), String> {
    let store = app.store_builder("wallet.dat").build();
    store.delete("current_wallet");
    store.save().map_err(|e| format!("Failed to clear wallet: {}", e))?;
    Ok(())
}

// ============================================
// TRADING MODE MANAGEMENT
// ============================================

#[tauri::command]
pub async fn get_trading_mode(app: AppHandle) -> Result<String, String> {
    let store = app.store_builder("settings.dat").build();
    match store.get("trading_mode") {
        Some(mode) => mode.as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Invalid trading mode".to_string()),
        None => Ok("paper".to_string()),
    }
}

#[tauri::command]
pub async fn set_trading_mode(app: AppHandle, mode: String) -> Result<(), String> {
    let store = app.store_builder("settings.dat").build();
    store.set("trading_mode", serde_json::json!(mode));
    store.save().map_err(|e| format!("Failed to save trading mode: {}", e))?;
    Ok(())
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<Value, String> {
    let store = app.store_builder("settings.dat").build();
    match store.get("app_settings") {
        Some(settings) => Ok(settings),
        None => Ok(serde_json::json!({})),
    }
}

#[tauri::command]
pub async fn set_settings(app: AppHandle, settings: Value) -> Result<(), String> {
    let store = app.store_builder("settings.dat").build();
    store.set("app_settings", settings);
    store.save().map_err(|e| format!("Failed to save settings: {}", e))?;
    Ok(())
}
