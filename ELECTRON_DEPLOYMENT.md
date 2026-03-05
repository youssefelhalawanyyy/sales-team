# Electron Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Quality
- [ ] All source files compile without errors
- [ ] No console warnings in dev mode
- [ ] All features tested in both web and desktop modes
- [ ] Linting passed (minor warnings acceptable)
- [ ] Git committed all changes

### Build Testing
- [ ] `npm run build` completes successfully
- [ ] Build folder created with all assets
- [ ] `npm run electron-build` completes successfully
- [ ] Installers created in `dist/` folder

### Functionality Testing
- [ ] All routes accessible in desktop mode
- [ ] Sidebar navigation works correctly
- [ ] Window controls (minimize, maximize, close) work
- [ ] Firebase/APIs sync data correctly
- [ ] Authentication flow intact
- [ ] Persistent storage works (test settings save)
- [ ] Hot reload works in dev mode
- [ ] No errors in DevTools console

### Platform Testing
- [ ] Windows: .exe installer creates and installs
- [ ] Windows: App launches after installation
- [ ] macOS: .dmg mounts and app extracts correctly
- [ ] macOS: App launches after copying to Applications

## 📋 Deployment Steps

### Step 1: Prepare Release

```bash
# Update version in package.json
# Update CHANGELOG if applicable
# Commit all changes
git add -A
git commit -m "Release v0.1.0"
git tag v0.1.0
```

### Step 2: Build for Production

```bash
# Clean previous builds
rm -rf build/ dist/

# Create optimized React build
npm run build

# Build installers
npm run electron-build
```

### Step 3: Verify Outputs

```bash
# Check dist folder contents
ls -lh dist/

# Expected:
# - Sales\ Team-0.1.0.dmg           (macOS DMG)
# - Sales\ Team\ Setup\ 0.1.0.exe   (Windows NSIS)
# - Sales\ Team\ 0.1.0.exe          (Windows Portable)
# - *.blockmap, *.yml               (Metadata)
```

### Step 4: Test Installers

**Windows:**
```bash
# Test NSIS installer
dist/Sales\ Team\ Setup\ 0.1.0.exe

# Test portable version
dist/Sales\ Team\ 0.1.0.exe
```

**macOS:**
```bash
# Mount DMG
open dist/Sales\ Team-0.1.0.dmg

# Drag app to Applications folder
# Test running the app
```

### Step 5: Create Hashes (Optional)

```bash
# Generate checksums for security verification
cd dist
sha256sum * > CHECKSUMS.txt
cd ..
```

### Step 6: Upload to Distribution

#### Option A: GitHub Releases

```bash
# Create release on GitHub
# Upload files:
# - Sales Team Setup 0.1.0.exe
# - Sales Team 0.1.0.exe
# - Sales Team-0.1.0.dmg
# - CHECKSUMS.txt (optional)
```

#### Option B: Your Server

```bash
# Upload to your server
scp dist/Sales\ Team*.exe user@server:/path/
scp dist/Sales\ Team*.dmg user@server:/path/
```

#### Option C: Distribution Service

- AWS S3
- Google Drive
- Dropbox
- Custom CDN

### Step 7: Create Release Notes

Document:
- Version number
- New features
- Bug fixes
- Known issues
- Minimum system requirements

Example:
```
## Sales Team v0.1.0

### New Features
- Desktop application for Windows and macOS
- Custom sidebar navigation
- Persistent window state

### System Requirements
- Windows 7+ or macOS 10.13+
- 200MB free disk space
- 2GB RAM recommended

### Known Issues
- None

### Download
- [Windows Installer (.exe)](...)
- [macOS Installer (.dmg)](...)
```

## 🔐 Security Checklist

- [ ] No hardcoded passwords or secrets in code
- [ ] Firebase credentials only in environment variables
- [ ] API keys properly configured
- [ ] No sensitive data in build artifacts
- [ ] App code signed (optional but recommended)
- [ ] Update checking configured (optional)

## 📊 Version Management

### Semantic Versioning: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes (increment if data format changes)
- **MINOR**: New features (sidebar, window controls)
- **PATCH**: Bug fixes

### Update in Multiple Locations

```json
// package.json
{
  "version": "0.1.0",
  "build": {
    "appId": "com.salesteam.app",
    // ...
  }
}
```

### Version History

```
0.1.0 - Initial release
- Desktop app framework
- Sidebar navigation
- Window management
```

## 🎯 Deployment Destinations

### For Internal Team
- Email .exe and .dmg files
- Host on company intranet
- Use Microsoft Intune or similar for Windows

### For Public Distribution
- GitHub Releases (free)
- Official website download page
- App stores (future - Epic Games Store, etc.)

### For Enterprise
- Software deployment system (SCCM, Jamf)
- Windows Installer (.msi) format
- Code signing certificates

## 📈 Post-Deployment

### Monitoring
- [ ] Track download statistics
- [ ] Monitor crash reports (if enabled)
- [ ] Collect user feedback
- [ ] Log issues reported by users

### Support
- [ ] Provide system requirements documentation
- [ ] Create troubleshooting guide
- [ ] Set up support email/form
- [ ] Document known issues

### Updates
- [ ] Plan for version 0.2.0 features
- [ ] Gather user feedback
- [ ] Plan bug fixes
- [ ] Consider auto-update system

## 🔄 Rollback Plan

If issues discovered after release:

```bash
# Tag the broken release
git tag v0.1.0-broken

# Revert to previous working version
git revert v0.1.0

# Fix the issue
# Test thoroughly
# Create new release v0.1.1

npm run build
npm run electron-build

# Deploy v0.1.1
```

## 💼 Business Checklist

- [ ] Product documentation complete
- [ ] User guide/tutorial created
- [ ] Support process established
- [ ] License terms agreed upon
- [ ] Privacy policy updated
- [ ] Terms of service (if applicable)
- [ ] Data handling policy clear
- [ ] Users notified of update availability

## 📝 Final Checklist

**Pre-Release (48 hours before)**
- [ ] Code review completed
- [ ] All tests passing
- [ ] Documentation final
- [ ] Release notes written

**Release Day**
- [ ] Final build created
- [ ] Installers tested on target systems
- [ ] Files uploaded to distribution channels
- [ ] Release notes published
- [ ] Users notified

**Post-Release (24 hours)**
- [ ] Monitor for issues
- [ ] Respond to support requests
- [ ] Track download stats
- [ ] Log any bugs reported

## 🚀 Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh - Automated deployment

set -e

echo "🔨 Building application..."
rm -rf build/ dist/
npm run build
npm run electron-build

echo "📦 Generating checksums..."
cd dist
sha256sum * > CHECKSUMS.txt
cd ..

echo "✅ Build complete!"
echo "📁 Outputs in: dist/"
ls -lh dist/

echo ""
echo "Next steps:"
echo "1. Test installers"
echo "2. Upload to distribution channel"
echo "3. Create GitHub release"
echo "4. Notify users"
```

Use:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📞 Support Resources

- Electron Docs: https://www.electronjs.org/docs
- electron-builder: https://www.electron.build/
- Release Management: https://docs.github.com/en/repositories/releasing-projects-on-github

---

**Status**: Ready for Deployment ✅
**Last Updated**: 2024
