# Electron Desktop Application Setup

## Overview

The Sales Team application has been successfully converted to work as both a web application and a desktop application (Windows/macOS) using Electron, while maintaining a single codebase.

## Project Structure

```
sales-team/
├── public/
│   ├── electron/
│   │   ├── main.js          # Electron main process
│   │   └── preload.js       # Secure preload script
│   └── index.html
├── src/
│   ├── components/
│   │   ├── DesktopLayout.js     # Desktop-specific layout
│   │   ├── DesktopTitleBar.js   # Custom draggable title bar
│   │   ├── DesktopSidebar.js    # Desktop navigation sidebar
│   │   └── AppWrapper.js         # Conditional layout router
│   ├── contexts/
│   │   └── ElectronContext.js    # React context for Electron API
│   ├── utils/
│   │   └── electron.js          # Utility functions
│   └── App.js                    # Modified to support both modes
├── package.json                  # Updated with Electron scripts
└── build/                        # Production build output
```

## Installation & Setup

### 1. Install Dependencies

All dependencies are already in `package.json`. If you cloned the project fresh:

```bash
npm install --legacy-peer-deps
```

Key Electron packages added:
- `electron` - Electron framework
- `electron-builder` - Build and package Electron apps
- `electron-is-dev` - Environment detection
- `electron-store` - Persistent settings storage
- `concurrently` - Run multiple processes concurrently
- `wait-on` - Wait for dev server to be ready

### 2. Building

#### Development Mode (with Hot Reload)

```bash
npm run electron-dev
```

This command:
- Starts React dev server on http://localhost:3000
- Waits for server to be ready
- Launches Electron pointing to localhost:3000
- Opens DevTools automatically
- Hot reloads on code changes

#### Production Build

```bash
npm run build
npm run electron-build
```

This:
- Creates optimized React build in `build/` folder
- Creates `.exe` (Windows) and `.dmg` (macOS) installers
- Output in `dist/` folder

#### Production Run

```bash
npm run electron
```

This launches the app from the production build.

## How It Works

### Architecture

The application uses a wrapper pattern to support both web and desktop modes:

1. **Environment Detection**: `ElectronContext` automatically detects if running in Electron
2. **Layout Selection**: `AppWrapper` conditionally renders either `DesktopLayout` or web layout
3. **Shared Code**: All business logic, components, and pages work identically in both modes
4. **API Bridge**: `preload.js` securely exposes Electron API to React

### Key Files

#### `public/electron/main.js` (Main Process)
- Creates and manages the browser window
- Handles app lifecycle events
- Manages menus and system integration
- Provides IPC endpoints for window control and storage
- Switches between dev/prod URLs automatically

#### `public/electron/preload.js` (Security Bridge)
- Securely exposes Electron APIs via `window.electron`
- Context isolation enabled (renderer can't access Node.js directly)
- Sandboxing enabled for security
- Exposes: `app` (window controls), `store` (persistent storage), system info

#### `src/contexts/ElectronContext.js` (React Context)
- Provides React hooks for Electron API access
- Detects Electron environment on mount
- Tracks window state (maximized/minimized)
- Exports: `ElectronProvider`, `useElectron()` hook

#### `src/components/AppWrapper.js` (Conditional Renderer)
- Checks if running in Electron
- Wraps content with `DesktopLayout` if Electron
- Leaves content unchanged for web mode
- Zero impact on existing routes

#### `src/components/DesktopLayout.js` (Desktop UI)
- Main wrapper for desktop mode
- Contains title bar and sidebar
- Manages layout spacing and styling

#### `src/components/DesktopTitleBar.js` (Window Controls)
- Draggable custom title bar (styled)
- Window minimize, maximize, close buttons
- Calls Electron main process via IPC

#### `src/components/DesktopSidebar.js` (Desktop Navigation)
- Persistent sidebar with 5 menu categories
- 18+ menu items with icons
- Expandable/collapsible sections
- Active route highlighting

### Electron IPC Communication

**Available endpoints in main process:**

```javascript
// Window controls
ipcMain.handle('app:minimize', () => { /* minimize window */ });
ipcMain.handle('app:maximize', () => { /* toggle maximize */ });
ipcMain.handle('app:close', () => { /* close window */ });
ipcMain.handle('app:isMaximized', () => { /* return boolean */ });

// Persistent storage
ipcMain.handle('store:get', (key) => { /* get value */ });
ipcMain.handle('store:set', (key, value) => { /* set value */ });
ipcMain.handle('store:delete', (key) => { /* delete value */ });
ipcMain.handle('store:clear', () => { /* clear all */ });
```

**Usage in React:**

```javascript
import { useElectron } from '../contexts/ElectronContext';

function MyComponent() {
  const { electronAPI, isElectron } = useElectron();

  if (isElectron) {
    // Can use electronAPI.app.* and electronAPI.store.*
    electronAPI.app.minimize();
    electronAPI.store.set('key', value);
  }
}
```

## Build Configuration

### electron-builder Settings

Configured in `package.json` under `"build"` key:

**Windows:**
- Creates `.exe` installer (NSIS)
- Creates portable `.exe`
- 64-bit architecture
- Allows custom installation directory
- Creates desktop and start menu shortcuts

**macOS:**
- Creates `.dmg` installer
- Creates `.zip` for distribution
- App category: Business
- Code signing support (configure as needed)

**Common Settings:**
- App ID: `com.salesteam.app`
- App Name: `Sales Team`
- Includes: build/, public/electron/, node_modules/

## Deployment

### Windows

Distribute the `.exe` installers from `dist/`:
- `Sales Team Setup 0.1.0.exe` - NSIS installer (recommended)
- `Sales Team 0.1.0.exe` - Portable executable

### macOS

Distribute the `.dmg` from `dist/`:
- `Sales Team-0.1.0.dmg` - DMG installer

Users can drag the app to Applications folder.

### Signed Releases

To sign builds (optional):

**Windows Signing:**
Add to `package.json` build.win:
```json
"certificateFile": "/path/to/cert.pfx",
"certificatePassword": "password",
"signingHashAlgorithms": ["sha256"]
```

**macOS Signing:**
Add to `package.json` build.mac:
```json
"identity": "Developer ID Application: Company Name (XXXXXXX)",
"harddenedRuntime": true
```

## Troubleshooting

### Dev server not starting

```bash
# Kill any lingering processes
lsof -ti:3000 | xargs kill -9

# Try again
npm run electron-dev
```

### Window doesn't appear in dev mode

1. Ensure dev server is running (port 3000)
2. Check DevTools for console errors
3. Verify `public/electron/main.js` exists
4. Restart electron: press Ctrl+C, run command again

### App crashes on startup

1. Check if `build/` folder exists
2. Run `npm run build` first for production
3. Check main process logs in DevTools

### Preload script not working

1. Verify `public/electron/preload.js` exists
2. Check preload path in main.js matches
3. Enable DevTools and check console for errors

### IPC endpoints not responding

1. Ensure main.js has `ipcMain.handle()` registered
2. Check preload.js exports the function
3. Verify no typos in function names

## Features

### Electron-Specific

- ✅ Custom draggable title bar
- ✅ Sidebar navigation (desktop UI)
- ✅ Window management (minimize, maximize, close)
- ✅ Persistent settings storage (Electron Store)
- ✅ Desktop menu system
- ✅ Auto-close dev tools in production
- ✅ Platform-specific handling (macOS/Windows)

### Shared Features

- ✅ All existing functionality preserved
- ✅ Firebase real-time sync works in both modes
- ✅ Authentication unchanged
- ✅ All pages and components work identically
- ✅ Responsive design in both modes

## Development Tips

### Hot Reload

Changes to React components auto-reload in dev mode. Changes to main.js require restart.

### Debug Electron Process

DevTools open automatically in dev mode. Use to debug:
- React component rendering
- IPC communication
- Network requests
- Console errors

### Test Both Modes

- **Web mode**: Run `npm start` (React dev server only)
- **Desktop mode**: Run `npm run electron-dev` (with Electron window)

### File Structure Best Practices

- Electron files: `public/electron/`
- React components: `src/components/`
- Business logic: `src/pages/`, `src/utils/`
- Assets: `public/` (automatically included in build)

## Security Considerations

### Context Isolation

- ✅ Enabled: `contextIsolation: true`
- ✅ Preload script uses `contextBridge`
- ✅ Limited API surface exposure
- ✅ Sandbox mode enabled

### What's Exposed

The app intentionally limits what's available to renderer:
- Window control methods only
- Storage API (no file system access)
- Platform info (read-only)

### What's NOT Exposed

- Direct Node.js `require()`
- File system access
- Process spawning
- System commands

## Future Enhancements

Potential additions:

1. **Code Signing**: Sign builds for distribution
2. **Auto-Update**: Add electron-updater for auto-updates
3. **Crash Reporting**: Implement crash reporting
4. **Offline Support**: Add offline sync with local database
5. **Tray Icon**: Minimize to system tray
6. **System Notifications**: Desktop notifications
7. **File Associations**: Open app with specific file types
8. **Custom Protocols**: Handle custom URL schemes

## Support

For issues or questions:

1. Check DevTools console for errors
2. Verify all dependencies installed
3. Ensure port 3000 is available
4. Check logs in `~/.config/Sales Team/` (Linux) or equivalent

## Command Reference

| Command | Purpose |
|---------|---------|
| `npm start` | Start web dev server only |
| `npm run build` | Build production React bundle |
| `npm run electron-dev` | Start dev server + Electron window |
| `npm run electron` | Launch app from production build |
| `npm run electron-build` | Build installers (after npm run build) |
| `npm test` | Run tests |
| `npm run eject` | Eject from react-scripts (not reversible) |

## Version Info

- React: 19.2.4
- Electron: 30.0.0
- Electron Builder: 25.0.5
- Node: 18.x recommended (tested with 24.12.0)
- Platform: macOS, Windows (Linux untested)

---

**Last Updated**: 2024
**Status**: Production Ready
