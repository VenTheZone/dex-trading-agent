use serde_json::{json, Value};
use tokio_tungstenite::{connect_async, tungstenite::http::Response, MaybeTlsStream, WebSocketStream};

pub const MAINNET_WS_URL: &str = "wss://api.hyperliquid.xyz/ws";
pub const TESTNET_WS_URL: &str = "wss://api.hyperliquid-testnet.xyz/ws";

pub fn build_clearinghouse_state_subscription(user: &str, dex: &str) -> Value {
    json!({
        "method": "subscribe",
        "subscription": {
            "type": "clearinghouseState",
            "user": user,
            "dex": dex,
        }
    })
}

pub async fn connect_mainnet(
) -> Result<
    (
        WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
        Response<Option<Vec<u8>>>,
    ),
    tokio_tungstenite::tungstenite::Error,
>
{
    connect_async(MAINNET_WS_URL).await
}

pub async fn connect_testnet(
) -> Result<
    (
        WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>,
        Response<Option<Vec<u8>>>,
    ),
    tokio_tungstenite::tungstenite::Error,
>
{
    connect_async(TESTNET_WS_URL).await
}
