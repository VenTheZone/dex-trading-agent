# Automated Release Guide

## 🚀 GitHub Actions Automated Release Workflow

This repository includes a fully automated release workflow that builds the DeX Trading Agent desktop app for all platforms and creates GitHub releases automatically.

---

## 📋 Prerequisites

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add these secrets:

| Secret | Purpose | Required? |
|--------|---------|-----------|
| `TAURI_PRIVATE_KEY` | Code signing private key | No (but recommended) |
| `TAURI_KEY_PASSWORD` | Password for private key | No (if key is encrypted) |
| `APPLE_SIGNING_IDENTITY` | Apple Developer ID | No (macOS only) |
| `APPLE_ID` | Apple ID for notarization | No (macOS only) |
| `APPLE_PASSWORD` | App-specific password | No (macOS only) |
| `APPLE_TEAM_ID` | Apple Developer Team ID | No (macOS only) |
| `DISCORD_WEBHOOK` | Discord webhook URL | No (optional) |

### Optional: Code Signing Setup

**For Windows (Recommended):**
1. Purchase code signing certificate
2. Export private key:
   ```bash
   # Generate key pair
   openssl genrsa -out private-key.pem 4096
   
   # Extract public key
   openssl rsa -in private-key.pem -pubout -out public-key.pem
   ```
3. Add `TAURI_PRIVATE_KEY` (contents of private-key.pem) to GitHub secrets

**For macOS (Required for distribution):**
1. Join Apple Developer Program ($99/year)
2. Create Developer ID Application certificate
3. Add signing secrets to GitHub

---

## 🎯 How to Create a Release

### Method 1: Push a Tag (Recommended)

```bash
# Create and push a tag
git tag -a v2.0.0 -m "Release version 2.0.0 - Tauri Desktop Edition"
git push origin v2.0.0
```

The workflow will automatically:
1. Build for Windows (x64)
2. Build for macOS Intel (x64)
3. Build for macOS Apple Silicon (ARM64)
4. Build for Linux (AppImage + DEB)
5. Create a GitHub release
6. Upload all binaries
7. Generate changelog

### Method 2: Manual Trigger

1. Go to **Actions → Release**
2. Click **Run workflow**
3. Enter version (e.g., `v2.0.0`)
4. Click **Run workflow**

---

## 📦 Release Outputs

### Windows
- **Format:** `.msi` installer
- **Location:** `src-tauri/target/release/bundle/msi/`
- **Size:** ~5-10MB

### macOS Intel
- **Format:** `.dmg` disk image
- **Location:** `src-tauri/target/release/bundle/dmg/`
- **Size:** ~8-15MB

### macOS Apple Silicon
- **Format:** `.dmg` disk image  
- **Location:** `src-tauri/target/release/bundle/dmg/`
- **Size:** ~8-15MB

### Linux
- **Formats:** `.AppImage` + `.deb`
- **Locations:** 
  - `src-tauri/target/release/bundle/appimage/`
  - `src-tauri/target/release/bundle/deb/`
- **Size:** ~10-20MB

---

## ⏱️ Build Times

| Platform | Typical Build Time |
|----------|-------------------|
| Windows | 15-20 minutes |
| macOS Intel | 15-20 minutes |
| macOS ARM | 15-20 minutes |
| Linux | 15-20 minutes |
| **Total** | **30-40 minutes** (parallel builds) |

---

## 🔍 Monitoring Builds

### GitHub Actions Tab
1. Go to **Actions** tab
2. Click on the running workflow
3. Monitor build progress in real-time

### Build Logs
Each job provides detailed logs:
- Rust compilation output
- Frontend build logs
- Packaging output
- Error messages (if any)

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Resource not accessible by integration"**
- **Solution:** Go to Settings → Actions → General → Workflow permissions
- Enable "Read and write permissions"

**Error: "Could not find tauri.conf.json"**
- **Solution:** Ensure `src-tauri/tauri.conf.json` exists and is committed

**Error: "No space left on device"**
- **Solution:** Free up space or use GitHub Actions larger runners

**Error: Apple signing fails**
- **Solution:** Verify all Apple secrets are correct and certificate is valid

---

## 📊 Release Checklist

Before creating a release:

- [ ] All tests passing locally
- [ ] Version bumped in `package.json`
- [ ] Version bumped in `src-tauri/tauri.conf.json`
- [ ] `CHANGELOG.md` updated
- [ ] README updated with new features
- [ ] GitHub secrets configured (for signing)
- [ ] Tag created and pushed

After release:

- [ ] Download and test each binary
- [ ] Verify installers work
- [ ] Check app launches correctly
- [ ] Update release notes if needed
- [ ] Announce on Discord/social media

---

## 🔄 Automatic Updates (Optional)

To enable auto-updates in the app:

1. Add to `tauri.conf.json`:
   ```json
   {
     "plugins": {
       "updater": {
         "active": true,
         "endpoints": [
           "https://github.com/VenTheZone/dex-trading-agent/releases/latest/download/latest.json"
         ],
         "dialog": true
       }
     }
   }
   ```

2. Create `latest.json` during release:
   ```bash
   # Workflow will generate this automatically
   ```

---

## 🎉 Example Release Process

```bash
# 1. Prepare release
git checkout main
git pull origin main

# 2. Update version
npm version 2.0.0

# 3. Commit version bump
git add .
git commit -m "chore: Bump version to 2.0.0"

# 4. Create and push tag
git tag -a v2.0.0 -m "Release v2.0.0 - Tauri Desktop Edition"
git push origin main
git push origin v2.0.0

# 5. Wait for GitHub Actions (~30-40 minutes)
# 6. Check Actions tab for build status
# 7. Verify release at https://github.com/VenTheZone/dex-trading-agent/releases
```

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/VenTheZone/dex-trading-agent/issues)
- **Workflow File:** `.github/workflows/release.yml`
- **Tauri Docs:** [tauri.app](https://tauri.app)

---

**Happy Releasing! 🚀**
