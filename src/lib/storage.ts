import { invoke } from "@tauri-apps/api/core";

const STORAGE_PREFIX = "dex_agent_";

// API Keys storage using Tauri secure store
export interface ApiKeys {
  hyperliquidMainnetApiKey: string;
  hyperliquidTestnetApiKey: string;
  openRouterApiKey: string;
  [key: string]: string;
}

// Demo keys for testing
const DEMO_KEYS: ApiKeys = {
  hyperliquidMainnetApiKey: "demo_mainnet_key",
  hyperliquidTestnetApiKey: "demo_testnet_key",
  openRouterApiKey: "demo_openrouter_key",
};

/**
 * Get API keys from secure Tauri store
 */
export async function getApiKeys(): Promise<ApiKeys> {
  try {
    const keys = await invoke<ApiKeys>("get_api_keys");
    return keys || {};
  } catch (error) {
    console.error("Error loading API keys from secure store:", error);
    return {};
  }
}

/**
 * Save API keys to secure Tauri store
 */
export async function saveApiKeys(keys: ApiKeys): Promise<void> {
  try {
    await invoke("set_api_keys", { keys });
  } catch (error) {
    console.error("Error saving API keys to secure store:", error);
    throw error;
  }
}

/**
 * Clear all API keys from secure store
 */
export async function clearApiKeys(): Promise<void> {
  try {
    await invoke("clear_api_keys");
  } catch (error) {
    console.error("Error clearing API keys:", error);
    throw error;
  }
}

/**
 * Enable demo mode with demo keys
 */
export async function enableDemoMode(): Promise<void> {
  await saveApiKeys(DEMO_KEYS);
}

/**
 * Check if demo mode is enabled
 */
export async function isDemoMode(): Promise<boolean> {
  const keys = await getApiKeys();
  return keys.hyperliquidMainnetApiKey === "demo_mainnet_key";
}

/**
 * Get a specific API key
 */
export async function getApiKey(key: keyof ApiKeys): Promise<string | null> {
  const keys = await getApiKeys();
  return keys[key] || null;
}

/**
 * Validate that required API keys are present
 */
export async function validateApiKeys(): Promise<boolean> {
  const keys = await getApiKeys();
  const hasMainnetKey = !!keys.hyperliquidMainnetApiKey;
  const hasTestnetKey = !!keys.hyperliquidTestnetApiKey;
  const hasOpenRouterKey = !!keys.openRouterApiKey;
  
  return hasMainnetKey && hasTestnetKey && hasOpenRouterKey;
}

// ============================================
// LEGACY localStorage functions (deprecated)
// These are kept for backward compatibility during migration
// ============================================

/**
 * @deprecated Use getApiKeys() instead
 * Load API keys from localStorage (legacy)
 */
export function loadApiKeysLegacy(): ApiKeys | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}api_keys`);
    if (!stored) return null;
    return JSON.parse(stored) as ApiKeys;
  } catch (error) {
    console.error("Error loading API keys from localStorage:", error);
    return null;
  }
}

/**
 * @deprecated Use saveApiKeys() instead
 * Save API keys to localStorage (legacy)
 */
export function saveApiKeysLegacy(keys: ApiKeys): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(keys));
  } catch (error) {
    console.error("Error saving API keys to localStorage:", error);
  }
}

/**
 * @deprecated Use enableDemoMode() instead
 * Enable demo mode with demo keys (legacy)
 */
export function enableDemoModeLegacy(): ApiKeys {
  localStorage.setItem(`${STORAGE_PREFIX}demo_mode`, "true");
  saveApiKeysLegacy(DEMO_KEYS);
  return DEMO_KEYS;
}

/**
 * @deprecated Use isDemoMode() instead
 * Check if demo mode is enabled (legacy)
 */
export function isDemoModeLegacy(): boolean {
  return localStorage.getItem(`${STORAGE_PREFIX}demo_mode`) === "true";
}

/**
 * @deprecated Use clearApiKeys() instead
 * Clear all API keys from localStorage (legacy)
 */
export function clearApiKeysLegacy(): void {
  localStorage.removeItem(`${STORAGE_PREFIX}demo_mode`);
  localStorage.removeItem(`${STORAGE_PREFIX}api_keys`);
}
