// =============================================================================
// Qt6 C++ Implementation with Error Handling
// =============================================================================
//
// Implements the FFI functions declared in qt6_ffi.rs.
// This file is compiled separately and linked to the Rust crate.
//
// Best practices applied:
// - Null pointer checks on all inputs
// - Exception handling with try-catch
// - Debug logging via stderr
// - RAII for resource management
// - Const correctness

#include <QApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QString>
#include <QUrl>
#include <QDebug>
#include <iostream>
#include <exception>

// Debug macro for logging
#ifdef QT_DEBUG
#define QT_FFI_DEBUG(msg) std::cerr << "[Qt6 FFI] " << msg << std::endl
#else
#define QT_FFI_DEBUG(msg)
#endif

extern "C" {

// QApplication
QApplication* qt_app_new(int argc, char** argv) {
    QT_FFI_DEBUG("Creating QApplication with " << argc << " arguments");
    
    try {
        // Validate inputs
        if (argc < 0) {
            std::cerr << "[Qt6 FFI ERROR] Invalid argc: " << argc << std::endl;
            return nullptr;
        }
        
        if (argc > 0 && argv == nullptr) {
            std::cerr << "[Qt6 FFI ERROR] argv is null but argc > 0" << std::endl;
            return nullptr;
        }
        
        // Create QApplication
        QApplication* app = new QApplication(argc, argv);
        
        if (app == nullptr) {
            std::cerr << "[Qt6 FFI ERROR] Failed to allocate QApplication" << std::endl;
            return nullptr;
        }
        
        QT_FFI_DEBUG("QApplication created successfully");
        return app;
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_app_new: " << e.what() << std::endl;
        return nullptr;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_app_new" << std::endl;
        return nullptr;
    }
}

int qt_app_exec(QApplication* app) {
    QT_FFI_DEBUG("Starting QApplication event loop");
    
    if (app == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_app_exec called with null app" << std::endl;
        return -1;
    }
    
    try {
        int result = app->exec();
        QT_FFI_DEBUG("QApplication event loop exited with code: " << result);
        return result;
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_app_exec: " << e.what() << std::endl;
        return -1;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_app_exec" << std::endl;
        return -1;
    }
}

void qt_app_delete(QApplication* app) {
    QT_FFI_DEBUG("Deleting QApplication");
    
    if (app == nullptr) {
        std::cerr << "[Qt6 FFI WARNING] qt_app_delete called with null app" << std::endl;
        return;
    }
    
    try {
        delete app;
        QT_FFI_DEBUG("QApplication deleted successfully");
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_app_delete: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_app_delete" << std::endl;
    }
}

// QQmlApplicationEngine
QQmlApplicationEngine* qt_engine_new() {
    QT_FFI_DEBUG("Creating QQmlApplicationEngine");
    
    try {
        QQmlApplicationEngine* engine = new QQmlApplicationEngine();
        
        if (engine == nullptr) {
            std::cerr << "[Qt6 FFI ERROR] Failed to allocate QQmlApplicationEngine" << std::endl;
            return nullptr;
        }
        
        QT_FFI_DEBUG("QQmlApplicationEngine created successfully");
        return engine;
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_new: " << e.what() << std::endl;
        return nullptr;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_new" << std::endl;
        return nullptr;
    }
}

void qt_engine_load(QQmlApplicationEngine* engine, const char* path) {
    QT_FFI_DEBUG("Loading QML file: " << (path ? path : "null"));
    
    if (engine == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_load called with null engine" << std::endl;
        return;
    }
    
    if (path == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_load called with null path" << std::endl;
        return;
    }
    
    try {
        QString qmlPath = QString::fromUtf8(path);
        
        if (qmlPath.isEmpty()) {
            std::cerr << "[Qt6 FFI ERROR] QML path is empty" << std::endl;
            return;
        }
        
        // Load QML file
        engine->load(QUrl(qmlPath));
        
        // Check if loading succeeded by looking at root objects
        if (engine->rootObjects().isEmpty()) {
            std::cerr << "[Qt6 FFI ERROR] Failed to load QML file: " << path << std::endl;
            return;
        }
        
        QT_FFI_DEBUG("QML file loaded successfully: " << path);
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_load: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_load" << std::endl;
    }
}

void qt_engine_delete(QQmlApplicationEngine* engine) {
    QT_FFI_DEBUG("Deleting QQmlApplicationEngine");
    
    if (engine == nullptr) {
        std::cerr << "[Qt6 FFI WARNING] qt_engine_delete called with null engine" << std::endl;
        return;
    }
    
    try {
        delete engine;
        QT_FFI_DEBUG("QQmlApplicationEngine deleted successfully");
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_delete: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_delete" << std::endl;
    }
}

// QML Context Properties
void qt_engine_set_context_property(
    QQmlApplicationEngine* engine,
    const char* name,
    const char* value
) {
    QT_FFI_DEBUG("Setting context property: " << (name ? name : "null") << " = " << (value ? value : "null"));
    
    if (engine == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property called with null engine" << std::endl;
        return;
    }
    
    if (name == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property called with null name" << std::endl;
        return;
    }
    
    if (value == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property called with null value" << std::endl;
        return;
    }
    
    try {
        engine->rootContext()->setContextProperty(
            QString::fromUtf8(name),
            QString::fromUtf8(value)
        );
        QT_FFI_DEBUG("Context property set successfully");
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_set_context_property: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_set_context_property" << std::endl;
    }
}

void qt_engine_set_context_property_double(
    QQmlApplicationEngine* engine,
    const char* name,
    double value
) {
    QT_FFI_DEBUG("Setting context property (double): " << (name ? name : "null") << " = " << value);
    
    if (engine == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property_double called with null engine" << std::endl;
        return;
    }
    
    if (name == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property_double called with null name" << std::endl;
        return;
    }
    
    try {
        engine->rootContext()->setContextProperty(
            QString::fromUtf8(name),
            value
        );
        QT_FFI_DEBUG("Context property (double) set successfully");
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_set_context_property_double: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_set_context_property_double" << std::endl;
    }
}

void qt_engine_set_context_property_bool(
    QQmlApplicationEngine* engine,
    const char* name,
    bool value
) {
    QT_FFI_DEBUG("Setting context property (bool): " << (name ? name : "null") << " = " << (value ? "true" : "false"));
    
    if (engine == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property_bool called with null engine" << std::endl;
        return;
    }
    
    if (name == nullptr) {
        std::cerr << "[Qt6 FFI ERROR] qt_engine_set_context_property_bool called with null name" << std::endl;
        return;
    }
    
    try {
        engine->rootContext()->setContextProperty(
            QString::fromUtf8(name),
            value
        );
        QT_FFI_DEBUG("Context property (bool) set successfully");
        
    } catch (const std::exception& e) {
        std::cerr << "[Qt6 FFI ERROR] Exception in qt_engine_set_context_property_bool: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "[Qt6 FFI ERROR] Unknown exception in qt_engine_set_context_property_bool" << std::endl;
    }
}

}  // extern "C"
