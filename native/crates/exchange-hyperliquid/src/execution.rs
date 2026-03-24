use ethers_core::types::transaction::eip712::TypedData;
use ethers_signers::{LocalWallet, Signer};
use rmp_serde::to_vec_named;
use serde::Serialize;
use serde_json::{json, Value};

use crate::HyperliquidError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HyperliquidNetwork {
    Mainnet,
    Testnet,
}

impl HyperliquidNetwork {
    fn source(self) -> &'static str {
        match self {
            Self::Mainnet => "a",
            Self::Testnet => "b",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HyperliquidTimeInForce {
    Alo,
    Ioc,
    Gtc,
}

impl HyperliquidTimeInForce {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Alo => "Alo",
            Self::Ioc => "Ioc",
            Self::Gtc => "Gtc",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HyperliquidOrder {
    pub asset: u32,
    pub is_buy: bool,
    pub price: String,
    pub size: String,
    pub reduce_only: bool,
    pub time_in_force: HyperliquidTimeInForce,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct HyperliquidRequestSignature {
    pub r: String,
    pub s: String,
    pub v: u64,
}

#[derive(Debug, Serialize)]
struct OrderAction<'a> {
    #[serde(rename = "type")]
    action_type: &'static str,
    orders: Vec<OrderWire<'a>>,
    grouping: &'static str,
}

#[derive(Debug, Serialize)]
struct OrderWire<'a> {
    #[serde(rename = "a")]
    asset: u32,
    #[serde(rename = "b")]
    is_buy: bool,
    #[serde(rename = "p")]
    price: &'a str,
    #[serde(rename = "s")]
    size: &'a str,
    #[serde(rename = "r")]
    reduce_only: bool,
    #[serde(rename = "t")]
    order_type: LimitOrderType<'a>,
}

#[derive(Debug, Serialize)]
struct LimitOrderType<'a> {
    limit: LimitTimeInForce<'a>,
}

#[derive(Debug, Serialize)]
struct LimitTimeInForce<'a> {
    tif: &'a str,
}

fn order_wire(order: &HyperliquidOrder) -> OrderWire<'_> {
    OrderWire {
        asset: order.asset,
        is_buy: order.is_buy,
        price: &order.price,
        size: &order.size,
        reduce_only: order.reduce_only,
        order_type: LimitOrderType {
            limit: LimitTimeInForce {
                tif: order.time_in_force.as_str(),
            },
        },
    }
}

fn order_action(order: &HyperliquidOrder) -> OrderAction<'_> {
    OrderAction {
        action_type: "order",
        orders: vec![order_wire(order)],
        grouping: "na",
    }
}

fn action_hash(action: &OrderAction<'_>, nonce: u64) -> Result<[u8; 32], HyperliquidError> {
    let mut data = to_vec_named(action).map_err(|error| HyperliquidError::sign(error.to_string()))?;
    data.extend_from_slice(&nonce.to_be_bytes());
    data.push(0);

    Ok(ethers_core::utils::keccak256(data))
}

fn typed_data(connection_id: [u8; 32], network: HyperliquidNetwork) -> Result<TypedData, HyperliquidError> {
    serde_json::from_value(json!({
        "types": {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"}
            ],
            "Agent": [
                {"name": "source", "type": "string"},
                {"name": "connectionId", "type": "bytes32"}
            ]
        },
        "primaryType": "Agent",
        "domain": {
            "name": "Exchange",
            "version": "1",
            "chainId": 1337,
            "verifyingContract": "0x0000000000000000000000000000000000000000"
        },
        "message": {
            "source": network.source(),
            "connectionId": format!("0x{}", encode_hex(&connection_id))
        }
    }))
    .map_err(|error| HyperliquidError::sign(error.to_string()))
}

fn encode_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(HEX[(byte >> 4) as usize] as char);
        output.push(HEX[(byte & 0x0f) as usize] as char);
    }
    output
}

pub async fn sign_order_action(
    private_key: &str,
    order: &HyperliquidOrder,
    nonce: u64,
    network: HyperliquidNetwork,
) -> Result<HyperliquidRequestSignature, HyperliquidError> {
    let action = order_action(order);
    let connection_id = action_hash(&action, nonce)?;
    let typed_data = typed_data(connection_id, network)?;
    let wallet = match private_key.parse::<LocalWallet>() {
        Ok(wallet) => wallet,
        Err(error) => return Err(HyperliquidError::sign(error.to_string())),
    };
    let signature = match wallet.sign_typed_data(&typed_data).await {
        Ok(signature) => signature,
        Err(error) => return Err(HyperliquidError::sign(error.to_string())),
    };

    Ok(HyperliquidRequestSignature {
        r: format!("{:#x}", signature.r),
        s: format!("{:#x}", signature.s),
        v: signature.v,
    })
}

pub async fn build_signed_order_request(
    private_key: &str,
    order: HyperliquidOrder,
    nonce: u64,
    network: HyperliquidNetwork,
) -> Result<Value, HyperliquidError> {
    let signature = sign_order_action(private_key, &order, nonce, network).await?;
    Ok(build_order_request(order, nonce, signature))
}

pub fn build_order_request(
    order: HyperliquidOrder,
    nonce: u64,
    signature: HyperliquidRequestSignature,
) -> Value {
    let order = order_wire(&order);

    json!({
        "action": {
            "type": "order",
            "orders": [{
                "a": order.asset,
                "b": order.is_buy,
                "p": order.price,
                "s": order.size,
                "r": order.reduce_only,
                "t": {
                    "limit": {
                        "tif": order.order_type.limit.tif,
                    }
                }
            }],
            "grouping": "na"
        },
        "nonce": nonce,
        "signature": signature,
        "vaultAddress": Value::Null
    })
}
