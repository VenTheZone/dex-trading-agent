use exchange_hyperliquid::build_clearinghouse_state_request;

#[test]
fn clearinghouse_state_request_matches_info_endpoint_docs() {
    let request = build_clearinghouse_state_request(
        "0x0000000000000000000000000000000000000001",
        "",
    );

    assert_eq!(request["type"], "clearinghouseState");
    assert_eq!(request["user"], "0x0000000000000000000000000000000000000001");
    assert_eq!(request["dex"], "");
}
