use app_core::{execute_hyperliquid_order, AppCoreError, ExecuteHyperliquidOrder};
use domain::{MarketId, OrderId, OrderRequest, OrderSide, OrderType, StrategyId};
use exchange_hyperliquid::HyperliquidNetwork;

#[tokio::test]
async fn execute_hyperliquid_order_builds_a_signed_limit_order_request() {
    let request = OrderRequest {
        id: OrderId("order-1".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("hyperliquid:1".to_string()),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        quantity: 100.0,
        limit_price: Some(100.0),
    };

    let signed_request = execute_hyperliquid_order(ExecuteHyperliquidOrder {
        private_key: "0x0123456789012345678901234567890123456789012345678901234567890123",
        order: &request,
        nonce: 0,
        network: HyperliquidNetwork::Mainnet,
    })
    .await
    .unwrap();

    assert_eq!(signed_request["action"]["type"], "order");
    assert_eq!(signed_request["action"]["orders"][0]["a"], 1);
    assert_eq!(signed_request["action"]["orders"][0]["b"], true);
    assert_eq!(signed_request["action"]["orders"][0]["p"], "100");
    assert_eq!(signed_request["action"]["orders"][0]["s"], "100");
    assert_eq!(signed_request["action"]["orders"][0]["r"], false);
    assert_eq!(signed_request["action"]["orders"][0]["t"]["limit"]["tif"], "Gtc");
    assert_eq!(signed_request["nonce"], 0);
    assert_eq!(
        signed_request["signature"]["r"],
        "0xd65369825a9df5d80099e513cce430311d7d26ddf477f5b3a33d2806b100d78e"
    );
    assert_eq!(
        signed_request["signature"]["s"],
        "0x2b54116ff64054968aa237c20ca9ff68000f977c93289157748a3162b6ea940e"
    );
    assert_eq!(signed_request["signature"]["v"], 28);
    assert!(signed_request["vaultAddress"].is_null());
}

#[tokio::test]
async fn execute_hyperliquid_order_rejects_market_orders() {
    let request = OrderRequest {
        id: OrderId("order-2".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("hyperliquid:1".to_string()),
        side: OrderSide::Sell,
        order_type: OrderType::Market,
        quantity: 1.0,
        limit_price: None,
    };

    let error = execute_hyperliquid_order(ExecuteHyperliquidOrder {
        private_key: "0x0123456789012345678901234567890123456789012345678901234567890123",
        order: &request,
        nonce: 0,
        network: HyperliquidNetwork::Mainnet,
    })
    .await
    .unwrap_err();

    assert_eq!(
        error,
        AppCoreError::unsupported_order("hyperliquid live execution requires limit orders")
    );
}

#[tokio::test]
async fn execute_hyperliquid_order_rejects_limit_orders_without_a_price() {
    let request = OrderRequest {
        id: OrderId("order-3".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("hyperliquid:1".to_string()),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        quantity: 1.0,
        limit_price: None,
    };

    let error = execute_hyperliquid_order(ExecuteHyperliquidOrder {
        private_key: "0x0123456789012345678901234567890123456789012345678901234567890123",
        order: &request,
        nonce: 0,
        network: HyperliquidNetwork::Mainnet,
    })
    .await
    .unwrap_err();

    assert_eq!(
        error,
        AppCoreError::invalid_order("hyperliquid limit orders require limit_price")
    );
}

#[tokio::test]
async fn execute_hyperliquid_order_rejects_unparseable_market_ids() {
    let request = OrderRequest {
        id: OrderId("order-4".to_string()),
        strategy_id: StrategyId("strategy-1".to_string()),
        market_id: MarketId("BTC-USD".to_string()),
        side: OrderSide::Buy,
        order_type: OrderType::Limit,
        quantity: 1.0,
        limit_price: Some(100.0),
    };

    let error = execute_hyperliquid_order(ExecuteHyperliquidOrder {
        private_key: "0x0123456789012345678901234567890123456789012345678901234567890123",
        order: &request,
        nonce: 0,
        network: HyperliquidNetwork::Mainnet,
    })
    .await
    .unwrap_err();

    assert_eq!(
        error,
        AppCoreError::invalid_market_id("expected hyperliquid:<asset> market id")
    );
}
