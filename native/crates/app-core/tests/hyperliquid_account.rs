use app_core::{fetch_hyperliquid_positions, AppCoreError};
use domain::PositionDirection;

// 1. Parse positions from a JSON fixture (verifies account.rs wiring through app-core)
#[test]
fn fetch_hyperliquid_positions_parses_clearinghouse_state() {
    let fixture = r#"{
        "assetPositions": [
            {
                "position": {
                    "coin": "ETH",
                    "entryPx": "2986.3",
                    "szi": "0.0335"
                },
                "type": "oneWay"
            },
            {
                "position": {
                    "coin": "BTC",
                    "entryPx": "64001.5",
                    "szi": "-0.125"
                },
                "type": "oneWay"
            }
        ],
        "marginSummary": {
            "accountValue": "13109.482328",
            "totalMarginUsed": "4.967826",
            "totalNtlPos": "100.02765",
            "totalRawUsd": "13009.454678"
        },
        "withdrawable": "13104.514502"
    }"#;

    let positions = fetch_hyperliquid_positions(fixture).unwrap();

    assert_eq!(positions.len(), 2);
    assert_eq!(positions[0].market_id.0, "ETH");
    assert_eq!(positions[0].direction, PositionDirection::Long);
    assert_eq!(positions[0].quantity, 0.0335);
    assert_eq!(positions[0].entry_price, 2986.3);
    assert_eq!(positions[1].market_id.0, "BTC");
    assert_eq!(positions[1].direction, PositionDirection::Short);
    assert_eq!(positions[1].quantity, 0.125);
    assert_eq!(positions[1].entry_price, 64001.5);
}

// 2. Fail closed: empty positions returns error
#[test]
fn fetch_hyperliquid_positions_rejects_empty_account() {
    let fixture = r#"{
        "assetPositions": [],
        "marginSummary": {
            "accountValue": "0",
            "totalMarginUsed": "0",
            "totalNtlPos": "0",
            "totalRawUsd": "0"
        },
        "withdrawable": "0"
    }"#;

    let error = fetch_hyperliquid_positions(fixture).unwrap_err();

    assert_eq!(
        error,
        AppCoreError::exchange("hyperliquid unavailable: account has no open Hyperliquid positions")
    );
}

// 3. Fail closed: invalid JSON returns error
#[test]
fn fetch_hyperliquid_positions_rejects_invalid_json() {
    let fixture = "not json";

    let error = fetch_hyperliquid_positions(fixture).unwrap_err();

    assert!(matches!(error, AppCoreError::Exchange(_)));
}
