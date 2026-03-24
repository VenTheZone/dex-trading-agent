# DeX Trading Agent: Qt6 Desktop Edition

## 🚀 Overview
The DeX Trading Agent has been migrated from a Tauri-based shell to a native Qt6/PySide6 desktop application for improved performance and compatibility on Linux.

## 🛠️ Prerequisites
- **Python** 3.10+
- **PySide6** (`pip install PySide6`)
- **Cryptography & Keyring** (`pip install cryptography keyring`)
- **Node.js** 18+ and **pnpm**

## 💻 Running the Application

### Development Mode

1. **Start the Frontend (Vite)**:
```bash
pnpm install
pnpm dev
```

2. **Start the Backend (FastAPI)**:
(The Qt application handles starting the backend automatically, but for manual startup:)
```bash
cd migration_python
python main.py
```

3. **Launch the Qt Application**:
```bash
python src-qt/main.py
```

## 🏗️ Architecture
- **Frontend**: React + TypeScript (Vite)
- **Desktop Shell**: PySide6 (Qt6) with `QWebEngineView`
- **Backend**: FastAPI (Python)
- **Bridge**: `QWebChannel` for IPC between Frontend and Qt Shell

## 🔐 Security & Storage
API keys are encrypted using **Fernet (AES-128)** and the encryption key is safely stored in the **system keyring** (GNOME Keyring/KWallet) via the `keyring` library. General application settings are managed via `QSettings`.

## 🛠️ Pre-commit Checks (Maintenance)
For project maintenance and contributions, please always run the following checks before submitting:
- **Rust**: `cargo check`, `cargo fmt`, `cargo clippy` (if applicable)
- **Testing**: Run the test suite (`pnpm test`)
- **Debug**: Use `rust-lldb` for debugging Rust-related issues
