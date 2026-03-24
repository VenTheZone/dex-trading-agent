use domain::TradingDecision;

#[test]
fn trading_decision_roundtrips_without_loss() {
    let decision = TradingDecision::hold("provider unavailable");
    let json = serde_json::to_string(&decision).unwrap();
    let parsed: TradingDecision = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed, decision);
}
