use serde_json::{json, Value};

pub const MAINNET_API_URL: &str = "https://api.hyperliquid.xyz";
pub const TESTNET_API_URL: &str = "https://api.hyperliquid-testnet.xyz";

pub fn build_clearinghouse_state_request(user: &str, dex: &str) -> Value {
    json!({
        "type": "clearinghouseState",
        "user": user,
        "dex": dex,
    })
}

pub async fn fetch_clearinghouse_state(
    client: &reqwest::Client,
    base_url: &str,
    user: &str,
    dex: &str,
) -> Result<Value, reqwest::Error> {
    client
        .post(format!("{base_url}/info"))
        .json(&build_clearinghouse_state_request(user, dex))
        .send()
        .await?
        .json()
        .await
}
