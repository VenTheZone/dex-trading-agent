# Build Instructions

## 🛠️ Development Setup

This guide explains how to build the DeX Trading Agent desktop app from source.

---

## 📋 Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | 1.70+ | [rustup.rs](https://rustup.rs) |
| Python | 3.10+ | [python.org](https://python.org) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Platform-Specific Requirements

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- Windows SDK

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- build-essential: `sudo apt-get install build-essential`
- libwebkit2gtk-4.0-dev: `sudo apt-get install libwebkit2gtk-4.0-dev`

---

## 🔧 Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Tauri CLI

```bash
cargo install tauri-cli
```

### 4. Setup Python Backend

```bash
cd migration_python

# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

cd ..
```

---

## 🚀 Development Mode

### Start Python Backend

```bash
# Terminal 1
cd migration_python
source venv/bin/activate
python main.py

# Backend will start on http://localhost:8000
```

### Start Desktop App

```bash
# Terminal 2 (in project root)
npm run tauri dev

# This will:
# 1. Build the frontend
# 2. Compile Rust code
# 3. Launch the desktop app
# 4. Open dev tools automatically
```

**Hot Reload:** Frontend changes auto-reload. Rust changes require restart.

---

## 📦 Production Build

### Build for Current Platform

```bash
npm run tauri build
```

**Output Location:**
- `src-tauri/target/release/bundle/`

### Build for Specific Platforms

**Windows (x64):**
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**macOS (Intel):**
```bash
npm run tauri build -- --target x86_64-apple-darwin
```

**macOS (Apple Silicon):**
```bash
npm run tauri build -- --target aarch64-apple-darwin
```

**Linux (x64):**
```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

---

## 📁 Build Outputs

### Windows
- `src-tauri/target/release/bundle/msi/*.msi` - Installer
- `src-tauri/target/release/bundle/nsis/*.exe` - Setup executable

### macOS
- `src-tauri/target/release/bundle/dmg/*.dmg` - Disk image
- `src-tauri/target/release/bundle/macos/*.app` - App bundle

### Linux
- `src-tauri/target/release/bundle/appimage/*.AppImage` - Portable app
- `src-tauri/target/release/bundle/deb/*.deb` - Debian package

---

## 🔍 Troubleshooting

### Rust Compilation Errors

**Error:** `linker not found`
```bash
# Windows: Install Visual Studio Build Tools
# macOS: Install Xcode CLI tools
xcode-select --install

# Linux: Install build tools
sudo apt-get install build-essential
```

**Error:** `tauri-cli not found`
```bash
cargo install tauri-cli
# Or use npx
npx tauri --version
```

### Frontend Build Errors

**Error:** `Cannot find module`
```bash
# Clear node_modules
rm -rf node_modules
npm install
```

**Error:** TypeScript errors
```bash
# Check for type errors
npx tsc --noEmit

# Fix linting issues
npm run lint
```

### Python Backend Errors

**Error:** `Module not found`
```bash
cd migration_python
source venv/bin/activate
pip install -r requirements.txt
```

**Error:** `Port 8000 already in use`
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
PORT=8001 python main.py
```

---

## 🧪 Testing

### Run Frontend Tests

```bash
# Unit tests
npm test

# Integration tests (manual)
# Open app and run in DevTools console:
import('./src/lib/integration-tests').then(m => m.runAllIntegrationTests())
```

### Run Backend Tests

```bash
cd migration_python
source venv/bin/activate

# Run pytest
pytest tests/ -v

# Or test manually
curl http://localhost:8000/health
```

### Run Tauri Tests

```bash
cd src-tauri
cargo test
```

---

## 🔄 Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Rust
        uses: dtolnay/rust-action@stable
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          npm install
          pip install -r migration_python/requirements.txt
      
      - name: Build Tauri
        run: npm run tauri build
```

---

## 📊 Build Optimization

### Reduce Binary Size

**In `src-tauri/Cargo.toml`:**
```toml
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

### Speed Up Build

**Use sccache:**
```bash
cargo install sccache
export RUSTC_WRAPPER=sccache
```

**Incremental builds:**
```bash
# Development (faster)
cargo build

# Production (optimized)
cargo build --release
```

---

## 🚀 Distribution

### Code Signing (Recommended)

**Windows:**
```bash
# Set environment variable
export TAURI_SIGNING_PRIVATE_KEY=/path/to/private.key
npm run tauri build
```

**macOS:**
```bash
# Sign with Apple Developer ID
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name"
npm run tauri build
```

### Auto-Updater

Configure in `tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://your-update-server.com/updates"],
      "dialog": true
    }
  }
}
```

---

## 📞 Support

- **Documentation:** [README_TAURI.md](./README_TAURI.md)
- **Issues:** [GitHub Issues](https://github.com/VenTheZone/dex-trading-agent/issues)
- **Tauri Docs:** [tauri.app](https://tauri.app)

---

**Happy Building! 🚀**
