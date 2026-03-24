#[test]
fn workspace_bootstraps() {
    let bootstrap_bin = env!("CARGO_BIN_EXE_app-bootstrap");
    let output = std::process::Command::new(bootstrap_bin)
        .output()
        .expect("app-bootstrap binary should execute");

    assert!(output.status.success());
    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        "bootstrapping native app\n"
    );

    let app_name = app_core::application_name();
    assert_eq!(app_name, "DeX Trading Agent");
}
