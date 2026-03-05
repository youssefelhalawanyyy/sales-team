# Quick Start: Electron Desktop App

## 🚀 Quick Commands

### Development

```bash
# Start in development mode (web + Electron)
npm run electron-dev

# Or just the web version
npm start
```

### Production

```bash
# Build & create installers
npm run build
npm run electron-build

# Run production app
npm run electron
```

## 📁 What Was Added

### New Files
- `public/electron/main.js` - Electron main process
- `public/electron/preload.js` - Security bridge
- `src/contexts/ElectronContext.js` - React context
- `src/components/DesktopLayout.js` - Desktop UI wrapper
- `src/components/DesktopTitleBar.js` - Custom title bar
- `src/components/DesktopSidebar.js` - Desktop navigation
- `src/components/AppWrapper.js` - Layout router
- `src/utils/electron.js` - Utilities
- `ELECTRON_SETUP.md` - Full documentation

### Modified Files
- `package.json` - Added Electron scripts & dependencies
- `src/App.js` - Added ElectronProvider & AppWrapper

### New Scripts in package.json
```json
"electron": "electron .",
"electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && npm run electron\"",
"electron-build": "npm run build && electron-builder"
```

## 💻 How It Works

1. **Single Codebase**: React app serves both web and desktop
2. **Auto-Detection**: App detects Electron environment automatically
3. **Desktop UI**: Shows sidebar + custom title bar on desktop
4. **Web Mode**: Shows normal responsive web layout
5. **Shared Features**: All functionality works identically

## 🎯 Desktop Features

✅ Custom draggable title bar
✅ Persistent sidebar navigation
✅ Window controls (minimize, maximize, close)
✅ Persistent settings storage
✅ Platform-specific builds (.exe, .dmg)

## 🔧 Configuration

### Build Settings

Edit `package.json` → `"build"` section:
- App ID: `com.salesteam.app`
- App name: `Sales Team`
- Windows: Creates .exe + portable
- macOS: Creates .dmg

### Window Size

In `public/electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1400,    // Default width
  height: 900,    // Default height
  minWidth: 1000,  // Minimum width
  minHeight: 600,  // Minimum height
});
```

## 🎨 Customization

### Change Desktop Colors

Edit `src/components/DesktopTitleBar.js` and `src/components/DesktopSidebar.js`:
- Title bar: Gradient colors starting at line 23
- Sidebar: Theme colors in className

### Modify Sidebar Menu

Edit `src/components/DesktopSidebar.js` line ~45+:
```javascript
const menuCategories = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    items: [
      // Add/remove menu items here
    ]
  },
  // More categories...
];
```

### Add App Icon

Place PNG file at: `src/assets/logo.png`
Will auto-include in builds.

## 🐛 Troubleshooting

**Dev server won't start?**
```bash
# Kill any lingering processes
lsof -ti:3000 | xargs kill -9
npm run electron-dev
```

**Electron window blank?**
1. Ensure dev server running on http://localhost:3000
2. Check DevTools (F12) for console errors
3. Restart with Ctrl+C then npm run electron-dev

**Build fails?**
```bash
# Clean build
rm -rf build/
npm run build
npm run electron-build
```

## 📦 Distribution

### Windows Users
Give them `dist/Sales Team Setup 0.1.0.exe` to run

### macOS Users
Give them `dist/Sales Team-0.1.0.dmg` to mount and drag to Applications

## 📚 Full Docs

See `ELECTRON_SETUP.md` for:
- Detailed architecture
- IPC communication
- Deployment guide
- Security info
- Future enhancements

## ⚡ Common Commands Reference

| What | Command |
|------|---------|
| Dev server only | `npm start` |
| Desktop dev mode | `npm run electron-dev` |
| Production build | `npm run build` |
| Create installers | `npm run electron-build` |
| Run production app | `npm run electron` |
| Run tests | `npm test` |

## 🎓 Key Takeaways

- ✅ One codebase = web + desktop
- ✅ All existing features work unchanged
- ✅ Automatic environment detection
- ✅ Secure API bridge with preload.js
- ✅ Ready for production use
- ✅ Supports Windows & macOS

---

**Status**: ✅ Production Ready
**Ready to**: Develop, test, build, or distribute
