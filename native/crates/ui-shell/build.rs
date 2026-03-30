// =============================================================================
// Build script for Qt6/QML UI Shell
// =============================================================================
//
// Compiles Qt6 C++ FFI implementation and links to Rust crate.
// Also compiles Qt resource file to embed QML in binary.
//
// Debugging:
// - Adds -DQT_DEBUG for debug builds
// - Enables warnings and errors
// - Uses pkg-config for correct paths

fn main() {
    println!("cargo:rerun-if-changed=src/");
    println!("cargo:rerun-if-changed=cpp/");
    println!("cargo:rerun-if-changed=qml/");
    println!("cargo:rerun-if-changed=resources.qrc");

    // Get Qt6 include paths using pkg-config command
    let output = std::process::Command::new("pkg-config")
        .args(["--cflags", "Qt6Core", "Qt6Gui", "Qt6Qml", "Qt6Quick", "Qt6Widgets"])
        .output()
        .expect("Failed to run pkg-config");

    let cflags = String::from_utf8_lossy(&output.stdout);

    // Build C++ file with debugging flags
    let mut build = cc::Build::new();
    build.cpp(true);
    build.file("cpp/qt6_ffi.cpp");

    // Add debugging flags for debug builds
    if std::env::var("PROFILE").unwrap_or_default() == "debug" {
        build.define("QT_DEBUG", None);
        build.flag("-g");  // Debug symbols
        build.flag("-O0"); // No optimization
        build.flag("-Wall"); // All warnings
        build.flag("-Wextra"); // Extra warnings
        build.flag("-Werror"); // Warnings as errors (optional)
    }

    // Parse and add include paths from pkg-config output
    for flag in cflags.split_whitespace() {
        if let Some(path) = flag.strip_prefix("-I") {
            build.include(path);
        }
        if let Some(define) = flag.strip_prefix("-D") {
            build.define(define, None);
        }
    }

    // Add C++ standard
    build.flag_if_supported("-std=c++17");

    // Compile
    build.compile("qt6_ffi");

    // Compile Qt resource file with rcc
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let rcc_output = format!("{}/qrc_resources.cpp", out_dir);

    // Try rcc from PATH first, then try known locations
    let rcc_path = std::process::Command::new("rcc")
        .arg("--version")
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|_| "rcc".to_string())
        .or_else(|| {
            // Try known locations
            let paths = [
                "/usr/lib/qt6/libexec/rcc",
                "/usr/lib/x86_64-linux-gnu/qt6/libexec/rcc",
                "/usr/local/qt6/bin/rcc",
            ];
            for path in &paths {
                if std::path::Path::new(path).exists() {
                    return Some(path.to_string());
                }
            }
            None
        });

    match rcc_path {
        Some(rcc) => {
            let rcc_status = std::process::Command::new(&rcc)
                .args(["resources.qrc", "-o", &rcc_output])
                .status();

            match rcc_status {
                Ok(status) if status.success() => {
                    // Compile the generated resource file
                    let mut rcc_build = cc::Build::new();
                    rcc_build.cpp(true);
                    rcc_build.file(&rcc_output);

                    // Add debugging flags for debug builds
                    if std::env::var("PROFILE").unwrap_or_default() == "debug" {
                        rcc_build.define("QT_DEBUG", None);
                        rcc_build.flag("-g");
                        rcc_build.flag("-O0");
                    }

                    // Add include paths
                    for flag in cflags.split_whitespace() {
                        if let Some(path) = flag.strip_prefix("-I") {
                            rcc_build.include(path);
                        }
                        if let Some(define) = flag.strip_prefix("-D") {
                            rcc_build.define(define, None);
                        }
                    }

                    rcc_build.flag_if_supported("-std=c++17");
                    rcc_build.compile("qt_resources");
                    println!("cargo:warning=Qt resources embedded successfully");
                }
                Err(e) => {
                    println!("cargo:warning=rcc failed with error: {}", e);
                }
                _ => {
                    println!("cargo:warning=rcc failed - QML files will not be embedded");
                }
            }
        }
        None => {
            println!("cargo:warning=rcc not found - QML files will not be embedded");
        }
    }

    // Link Qt6 libraries
    println!("cargo:rustc-link-lib=Qt6Core");
    println!("cargo:rustc-link-lib=Qt6Gui");
    println!("cargo:rustc-link-lib=Qt6Qml");
    println!("cargo:rustc-link-lib=Qt6Quick");
    println!("cargo:rustc-link-lib=Qt6Widgets");
    println!("cargo:rustc-link-lib=Qt6Network");
}
