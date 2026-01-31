use tauri::Manager;

pub fn init<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("api-keys")
        .invoke_handler(tauri::generate_handler![get_api_keys, set_api_keys, clear_api_keys])
        .setup(|app| {
            // Initialize secure storage
            let store = app.store_builder("secure-api-keys.bin")
                .build();
            Ok(())
        })
        .build()
}

#[tauri::command]
async fn get_api_keys(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let store = app.store_builder("secure-api-keys.bin").build();
    match store.get("api_keys") {
        Some(keys) => Ok(keys),
        None => Ok(serde_json::json!({})),
    }
}

#[tauri::command]
async fn set_api_keys(
    app: tauri::AppHandle,
    keys: serde_json::Value
) -> Result<(), String> {
    let store = app.store_builder("secure-api-keys.bin").build();
    store.set("api_keys", keys);
    store.save().map_err(|e| format!("Failed to save API keys: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn clear_api_keys(app: tauri::AppHandle) -> Result<(), String> {
    let store = app.store_builder("secure-api-keys.bin").build();
    store.delete("api_keys");
    store.save().map_err(|e| format!("Failed to clear API keys: {}", e))?;
    Ok(())
}
