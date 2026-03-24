use exchange_hyperliquid::build_clearinghouse_state_subscription;

#[test]
fn clearinghouse_state_subscription_matches_docs() {
    let request = build_clearinghouse_state_subscription(
        "0x0000000000000000000000000000000000000001",
        "",
    );

    assert_eq!(request["method"], "subscribe");
    assert_eq!(request["subscription"]["type"], "clearinghouseState");
    assert_eq!(
        request["subscription"]["user"],
        "0x0000000000000000000000000000000000000001"
    );
    assert_eq!(request["subscription"]["dex"], "");
}
