# Migration Guide: Web → Desktop (Tauri)

## 🔄 Overview

This guide helps you migrate from the web-based DeX Trading Agent to the new **Tauri Desktop Application**.

**Migration Time:** ~5 minutes  
**Data Preservation:** ✅ All settings and API keys  
**Breaking Changes:** Minimal

---

## 📋 Pre-Migration Checklist

Before migrating, ensure you have:

- [ ] Exported your API keys from the web app
- [ ] Backed up your trading history (optional)
- [ ] Installed the desktop app prerequisites

---

## 🔐 Step 1: Export API Keys (From Web App)

### Method 1: Browser Console
1. Open the web app in your browser
2. Press `F12` to open Developer Tools
3. Go to Console tab
4. Run this command:

```javascript
const keys = localStorage.getItem('dex_agent_api_keys');
console.log('Your API Keys:', keys);
// Copy the output and save it securely
```

### Method 2: Manual Export
1. Go to Settings → API Keys in the web app
2. Copy each key individually:
   - Hyperliquid Mainnet API Key
   - Hyperliquid Testnet API Key
   - OpenRouter API Key

**⚠️ Security Note:** Store these keys securely. Never share them.

---

## 💻 Step 2: Install Desktop App

### Download
Download the latest release for your platform:
- **Windows:** `DeX-Trading-Agent_2.0.0_x64.msi`
- **macOS:** `DeX-Trading-Agent_2.0.0_x64.dmg`
- **Linux:** `DeX-Trading-Agent_2.0.0_amd64.AppImage`

### Install

**Windows:**
```bash
# Run the installer
DeX-Trading-Agent_2.0.0_x64.msi

# Or install via command line
msiexec /i DeX-Trading-Agent_2.0.0_x64.msi /qn
```

**macOS:**
```bash
# Mount DMG
open DeX-Trading-Agent_2.0.0_x64.dmg

# Drag to Applications folder
cp -R "/Volumes/DeX Trading Agent/DeX Trading Agent.app" /Applications/
```

**Linux:**
```bash
# Make AppImage executable
chmod +x DeX-Trading-Agent_2.0.0_amd64.AppImage

# Run
./DeX-Trading-Agent_2.0.0_amd64.AppImage
```

---

## 📥 Step 3: Import API Keys

### First Launch
1. Open the desktop app
2. Click "Get Started" or "Settings"
3. Select "API Keys" tab

### Enter Your Keys
```
Hyperliquid Mainnet API Key: [paste your key]
Hyperliquid Testnet API Key: [paste your key]
OpenRouter API Key: [paste your key]
```

### Save
Click "Save API Keys" - they will be securely stored in the Tauri encrypted store.

**✅ Success!** Your keys are now stored securely on your local machine.

---

## 🔄 Step 4: Reconnect Wallet

Since wallet connections aren't transferable between web and desktop:

### Browser Extension Mode
If you have MetaMask or similar browser extension:
1. Open the desktop app
2. Go to Wallet tab
3. Select "Browser Extension"
4. The app will auto-detect your extension

### Mobile Wallet Mode
1. Go to Wallet tab
2. Select "Mobile Wallet"
3. Choose your wallet (MetaMask, Trust, etc.)
4. Follow the deep link to connect

---

## 📊 What Gets Migrated

| Data | Web → Desktop | Method |
|------|---------------|--------|
| **API Keys** | ✅ | Manual import |
| **Trading History** | ✅ | Sync from backend |
| **Settings** | ✅ | Auto-sync |
| **Wallet Connection** | ❌ | Reconnect required |
| **Paper Trading Balance** | ✅ | Backend sync |
| **Preferences** | ✅ | Auto-sync |

---

## ⚠️ Breaking Changes

### 1. Storage Mechanism
**Before:** localStorage (browser)  
**After:** Tauri Secure Store (encrypted)

**Impact:** You need to re-enter API keys once.

### 2. Wallet Connection
**Before:** Direct MetaMask browser extension  
**After:** Hybrid (Browser + Mobile deep links)

**Impact:** Reconnect your wallet using the new method.

### 3. File Downloads
**Before:** Browser downloads to default folder  
**After:** Native file picker (you choose location)

**Impact:** Better UX, you control where files go.

---

## 🧪 Verification

After migration, verify everything works:

### Test Checklist
- [ ] API keys saved successfully
- [ ] Can fetch market data (BTC price)
- [ ] AI analysis works
- [ ] Paper trading functional
- [ ] Wallet connects
- [ ] TradingView charts load
- [ ] Can place test trade (paper mode)

### Run Integration Tests
```bash
# In the desktop app, open DevTools (F12)
# Run in console:
import('./src/lib/integration-tests').then(m => m.runAllIntegrationTests())
```

---

## 🆘 Troubleshooting

### Issue: API Keys Not Saving
**Solution:**
1. Check you have permission to write to `~/.config/dex-trading-agent/`
2. Try running app with sudo (Linux/Mac) or Administrator (Windows)
3. Check logs: `~/.config/dex-trading-agent/logs/`

### Issue: TradingView Charts Not Loading
**Solution:**
1. Check internet connection
2. Disable VPN (may block TradingView)
3. Wait 10 seconds (initial load time)
4. Click "Retry" button if shown

### Issue: Backend Not Connecting
**Solution:**
1. Ensure backend is running: `python migration_python/main.py`
2. Check port 8000 is available
3. Verify `VITE_PYTHON_API_URL=http://localhost:8000`

### Issue: Wallet Won't Connect
**Solution:**
1. Try both "Browser Extension" and "Mobile Wallet" modes
2. Clear browser cache (for extension mode)
3. Ensure wallet app is installed (for mobile mode)

---

## 📞 Need Help?

- **Documentation:** See [README_TAURI.md](./README_TAURI.md)
- **Issues:** [GitHub Issues](https://github.com/VenTheZone/dex-trading-agent/issues)
- **Discord:** [Community Support](https://discord.gg/yourserver)

---

## 🎉 Migration Complete!

You now have the **secure, fast, native desktop version** of DeX Trading Agent!

### Benefits You Now Have:
- ✅ **Encrypted API key storage**
- ✅ **Native performance** (no browser overhead)
- ✅ **Better security** (no browser vulnerabilities)
- ✅ **Native file dialogs**
- ✅ **Works offline** (core functionality)
- ✅ **System tray integration**
- ✅ **Auto-updates** (coming soon)

---

**Welcome to DeX Trading Agent v2.0 - Desktop Edition! 🚀**
