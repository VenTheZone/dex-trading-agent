use domain::PositionDirection;
use exchange_hyperliquid::parse_account_positions;

#[test]
fn account_response_maps_into_domain_position() {
    let fixture = include_str!("fixtures/account_info.json");

    let parsed = parse_account_positions(fixture).unwrap();

    assert_eq!(parsed.len(), 2);
    assert_eq!(parsed[0].market_id.0, "ETH");
    assert_eq!(parsed[0].direction, PositionDirection::Long);
    assert_eq!(parsed[0].quantity, 0.0335);
    assert_eq!(parsed[0].entry_price, 2986.3);
    assert_eq!(parsed[1].market_id.0, "BTC");
    assert_eq!(parsed[1].direction, PositionDirection::Short);
    assert_eq!(parsed[1].quantity, 0.125);
    assert_eq!(parsed[1].entry_price, 64001.5);
}
