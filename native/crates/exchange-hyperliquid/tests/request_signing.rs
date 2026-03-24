use exchange_hyperliquid::{
    build_order_request, build_signed_order_request, sign_order_action, HyperliquidNetwork, HyperliquidOrder,
    HyperliquidRequestSignature, HyperliquidTimeInForce,
};

#[test]
fn order_request_wraps_action_nonce_and_signature() {
    let order = HyperliquidOrder {
        asset: 7,
        is_buy: true,
        price: "3010.5".to_string(),
        size: "0.42".to_string(),
        reduce_only: false,
        time_in_force: HyperliquidTimeInForce::Gtc,
    };
    let signature = HyperliquidRequestSignature {
        r: "0xabc".to_string(),
        s: "0xdef".to_string(),
        v: 27,
    };

    let request = build_order_request(order, 1_717_777_000_123, signature);

    assert_eq!(request["action"]["type"], "order");
    assert_eq!(request["action"]["orders"][0]["a"], 7);
    assert_eq!(request["action"]["orders"][0]["b"], true);
    assert_eq!(request["action"]["orders"][0]["p"], "3010.5");
    assert_eq!(request["action"]["orders"][0]["s"], "0.42");
    assert_eq!(request["action"]["orders"][0]["r"], false);
    assert_eq!(request["action"]["orders"][0]["t"]["limit"]["tif"], "Gtc");
    assert_eq!(request["action"]["grouping"], "na");
    assert_eq!(request["nonce"], 1_717_777_000_123_u64);
    assert_eq!(request["signature"]["r"], "0xabc");
    assert_eq!(request["signature"]["s"], "0xdef");
    assert_eq!(request["signature"]["v"], 27);
    assert!(request["vaultAddress"].is_null());
}

#[tokio::test]
async fn sign_order_action_matches_sdk_vector() {
    let order = HyperliquidOrder {
        asset: 1,
        is_buy: true,
        price: "100".to_string(),
        size: "100".to_string(),
        reduce_only: false,
        time_in_force: HyperliquidTimeInForce::Gtc,
    };

    let signature = sign_order_action(
        "0x0123456789012345678901234567890123456789012345678901234567890123",
        &order,
        0,
        HyperliquidNetwork::Mainnet,
    )
    .await
    .unwrap();

    assert_eq!(
        signature.r,
        "0xd65369825a9df5d80099e513cce430311d7d26ddf477f5b3a33d2806b100d78e"
    );
    assert_eq!(
        signature.s,
        "0x2b54116ff64054968aa237c20ca9ff68000f977c93289157748a3162b6ea940e"
    );
    assert_eq!(signature.v, 28);
}

#[tokio::test]
async fn build_signed_order_request_uses_real_signature() {
    let order = HyperliquidOrder {
        asset: 1,
        is_buy: true,
        price: "100".to_string(),
        size: "100".to_string(),
        reduce_only: false,
        time_in_force: HyperliquidTimeInForce::Gtc,
    };

    let request = build_signed_order_request(
        "0x0123456789012345678901234567890123456789012345678901234567890123",
        order,
        0,
        HyperliquidNetwork::Mainnet,
    )
    .await
    .unwrap();

    assert_eq!(request["action"]["type"], "order");
    assert_eq!(request["action"]["orders"][0]["a"], 1);
    assert_eq!(request["action"]["orders"][0]["b"], true);
    assert_eq!(request["action"]["orders"][0]["p"], "100");
    assert_eq!(request["action"]["orders"][0]["s"], "100");
    assert_eq!(request["action"]["orders"][0]["r"], false);
    assert_eq!(request["action"]["orders"][0]["t"]["limit"]["tif"], "Gtc");
    assert_eq!(request["action"]["grouping"], "na");
    assert_eq!(request["nonce"], 0);
    assert_eq!(
        request["signature"]["r"],
        "0xd65369825a9df5d80099e513cce430311d7d26ddf477f5b3a33d2806b100d78e"
    );
    assert_eq!(
        request["signature"]["s"],
        "0x2b54116ff64054968aa237c20ca9ff68000f977c93289157748a3162b6ea940e"
    );
    assert_eq!(request["signature"]["v"], 28);
    assert!(request["vaultAddress"].is_null());
}
