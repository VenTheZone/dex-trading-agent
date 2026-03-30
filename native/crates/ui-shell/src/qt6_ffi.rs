// =============================================================================
// Qt6 C++ FFI Bindings with Safety Checks
// =============================================================================
//
// Direct FFI bindings to Qt6 C++ libraries.
// This avoids CXX-Qt complexity and gives us full control.
//
// Safety:
// - All FFI calls wrapped in unsafe blocks
// - Null pointer checks before dereferencing
// - Panic catching for Rust callbacks
// - Result types for error handling

use std::ffi::CString;
use std::os::raw::{c_char, c_int, c_double};
use std::panic;

// Opaque Qt6 types
#[repr(C)]
pub struct QApplication {
    _private: [u8; 0],
}

#[repr(C)]
pub struct QQmlApplicationEngine {
    _private: [u8; 0],
}

// Qt6 C++ FFI functions
extern "C" {
    // QApplication
    fn qt_app_new(argc: c_int, argv: *const *const c_char) -> *mut QApplication;
    fn qt_app_exec(app: *mut QApplication) -> c_int;
    fn qt_app_delete(app: *mut QApplication);

    // QQmlApplicationEngine
    fn qt_engine_new() -> *mut QQmlApplicationEngine;
    fn qt_engine_load(engine: *mut QQmlApplicationEngine, path: *const c_char);
    fn qt_engine_delete(engine: *mut QQmlApplicationEngine);

    // QML Context Properties
    fn qt_engine_set_context_property(
        engine: *mut QQmlApplicationEngine,
        name: *const c_char,
        value: *const c_char,
    );
    fn qt_engine_set_context_property_double(
        engine: *mut QQmlApplicationEngine,
        name: *const c_char,
        value: c_double,
    );
    fn qt_engine_set_context_property_bool(
        engine: *mut QQmlApplicationEngine,
        name: *const c_char,
        value: bool,
    );
}

/// Qt6 application wrapper with safety checks
pub struct QtApp {
    app: *mut QApplication,
    engine: *mut QQmlApplicationEngine,
}

impl QtApp {
    /// Create new Qt6 application
    /// 
    /// # Safety
    /// This function is safe to call from the main thread.
    /// It will catch panics and return an error if something goes wrong.
    pub fn new() -> Result<Self, String> {
        // Catch any panics that might occur
        let result = panic::catch_unwind(|| {
            let args: Vec<CString> = std::env::args()
                .map(|arg| CString::new(arg).unwrap_or_default())
                .collect();

            let c_args: Vec<*const c_char> = args.iter()
                .map(|arg| arg.as_ptr())
                .collect();

            let app = unsafe { qt_app_new(c_args.len() as c_int, c_args.as_ptr()) };
            if app.is_null() {
                return Err("Failed to create QApplication".to_string());
            }

            let engine = unsafe { qt_engine_new() };
            if engine.is_null() {
                unsafe { qt_app_delete(app) };
                return Err("Failed to create QQmlApplicationEngine".to_string());
            }

            Ok(Self { app, engine })
        });

        match result {
            Ok(inner) => inner,
            Err(_) => Err("Panic occurred while creating QtApp".to_string()),
        }
    }

    /// Load QML file
    /// 
    /// # Safety
    /// The QML file must exist and be valid.
    pub fn load_qml(&self, path: &str) -> Result<(), String> {
        if self.engine.is_null() {
            return Err("Engine is null".to_string());
        }

        let c_path = CString::new(path).map_err(|e| format!("Invalid path: {}", e))?;
        
        // Catch panics during QML loading
        let result = panic::catch_unwind(|| {
            unsafe {
                qt_engine_load(self.engine, c_path.as_ptr());
            }
        });

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(format!("Panic occurred while loading QML: {}", path)),
        }
    }

    /// Set QML context property as string
    pub fn set_context_property(&self, name: &str, value: &str) -> Result<(), String> {
        if self.engine.is_null() {
            return Err("Engine is null".to_string());
        }

        let c_name = CString::new(name).map_err(|e| format!("Invalid name: {}", e))?;
        let c_value = CString::new(value).map_err(|e| format!("Invalid value: {}", e))?;

        let result = panic::catch_unwind(|| {
            unsafe {
                qt_engine_set_context_property(self.engine, c_name.as_ptr(), c_value.as_ptr());
            }
        });

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(format!("Panic occurred while setting context property: {}", name)),
        }
    }

    /// Set QML context property as double
    pub fn set_context_property_double(&self, name: &str, value: f64) -> Result<(), String> {
        if self.engine.is_null() {
            return Err("Engine is null".to_string());
        }

        let c_name = CString::new(name).map_err(|e| format!("Invalid name: {}", e))?;

        let result = panic::catch_unwind(|| {
            unsafe {
                qt_engine_set_context_property_double(self.engine, c_name.as_ptr(), value);
            }
        });

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(format!("Panic occurred while setting context property (double): {}", name)),
        }
    }

    /// Set QML context property as bool
    pub fn set_context_property_bool(&self, name: &str, value: bool) -> Result<(), String> {
        if self.engine.is_null() {
            return Err("Engine is null".to_string());
        }

        let c_name = CString::new(name).map_err(|e| format!("Invalid name: {}", e))?;

        let result = panic::catch_unwind(|| {
            unsafe {
                qt_engine_set_context_property_bool(self.engine, c_name.as_ptr(), value);
            }
        });

        match result {
            Ok(_) => Ok(()),
            Err(_) => Err(format!("Panic occurred while setting context property (bool): {}", name)),
        }
    }

    /// Run the application event loop
    pub fn exec(&self) -> i32 {
        if self.app.is_null() {
            eprintln!("[Qt6 FFI ERROR] exec called with null app");
            return -1;
        }

        let result = panic::catch_unwind(|| {
            unsafe { qt_app_exec(self.app) as i32 }
        });

        match result {
            Ok(code) => code,
            Err(_) => {
                eprintln!("[Qt6 FFI ERROR] Panic occurred during event loop");
                -1
            }
        }
    }
}

impl Drop for QtApp {
    fn drop(&mut self) {
        // Clean up engine first
        if !self.engine.is_null() {
            let result = panic::catch_unwind(|| {
                unsafe { qt_engine_delete(self.engine) };
            });
            if result.is_err() {
                eprintln!("[Qt6 FFI WARNING] Panic during engine cleanup");
            }
            self.engine = std::ptr::null_mut();
        }

        // Then clean up app
        if !self.app.is_null() {
            let result = panic::catch_unwind(|| {
                unsafe { qt_app_delete(self.app) };
            });
            if result.is_err() {
                eprintln!("[Qt6 FFI WARNING] Panic during app cleanup");
            }
            self.app = std::ptr::null_mut();
        }
    }
}

// Ensure QtApp is Send + Sync for thread safety
// Note: Qt apps should only be used from the main thread
// but we mark it Send to allow moving between threads
unsafe impl Send for QtApp {}
unsafe impl Sync for QtApp {}
