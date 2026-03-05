# Auto-Update Guide for Electron Desktop App

## Overview

Your Sales Team app can be set up to automatically check for and install updates without requiring reinstallation. This guide shows you how to implement it.

## Two Options for Auto-Updates

### Option 1: GitHub Releases (Easiest - FREE)
Updates are hosted on GitHub, users get automatic notifications when new versions are available.

### Option 2: Custom Server (Most Control)
You host updates on your own server with complete control over rollouts and distribution.

---

## Option 1: GitHub Releases Auto-Update (RECOMMENDED - Easiest)

### Step 1: Install electron-updater

```bash
npm install electron-updater
```

### Step 2: Update your App.js

Add this to detect and notify about updates:

```javascript
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check for updates on startup (only in production)
    if (window.electron && !process.env.REACT_APP_DEV) {
      window.electron.app.checkForUpdates?.();
      
      // Listen for update events
      window.electron.app.onUpdateAvailable?.((version) => {
        alert(`New version ${version} available! Click Update to restart and install.`);
      });

      window.electron.app.onUpdateDownloaded?.(() => {
        alert('Update downloaded! Click Update to restart and apply.');
      });
    }
  }, []);

  // ... rest of your component
}
```

### Step 3: Update main.js

Replace your `public/electron/main.js` with this enhanced version:

```javascript
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Initialize electron store for persistent settings
const store = new Store();

let mainWindow;
let updateCheckInterval;

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();

// Create the browser window
function createWindow() {
  const windowConfig = {
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    },
    show: false
  };

  // Add icon if it exists (optional for development)
  const iconPath = path.join(__dirname, '../../src/assets/logo.png');
  if (require('fs').existsSync(iconPath)) {
    windowConfig.icon = iconPath;
  }

  mainWindow = new BrowserWindow(windowConfig);

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
  
  // Check for updates every hour
  if (!isDev) {
    updateCheckInterval = setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000); // 1 hour
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Auto-updater event handlers
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
  // Auto-quit and install on next start (Windows)
  // For macOS, user needs to manually restart
  setImmediate(() => autoUpdater.quitAndInstall());
});

autoUpdater.on('error', (error) => {
  console.error('Update error:', error);
});

// Handle app ready
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
});

// IPC handlers (existing ones remain)
ipcMain.handle('app:minimize', () => mainWindow?.minimize());
ipcMain.handle('app:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('app:close', () => mainWindow?.close());
ipcMain.handle('app:isMaximized', () => mainWindow?.isMaximized() ?? false);

// Store handlers
ipcMain.handle('store:get', (event, key) => store.get(key));
ipcMain.handle('store:set', (event, key, value) => store.set(key, value));
ipcMain.handle('store:delete', (event, key) => store.delete(key));
ipcMain.handle('store:clear', () => store.clear());
```

### Step 4: Update preload.js

Add update methods to `public/electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  app: {
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    close: () => ipcRenderer.invoke('app:close'),
    isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
    
    // Update methods
    checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    quitAndInstall: () => ipcRenderer.invoke('app:quitAndInstall')
  },
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear')
  },
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron
});
```

### Step 5: Create GitHub Release with Installers

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v0.2.0` (matches package.json version)
4. Upload your installers:
   - `Sales Team-0.1.0.dmg` (macOS)
   - `Sales Team Setup 0.1.0.exe` (Windows)
   - `.blockmap` files
   - `.yml` files

**That's it!** Your app now auto-updates from GitHub.

### How Users Experience It:

1. **Check on Startup**: App automatically checks for updates when launched
2. **Background Check**: App checks every hour while running
3. **User Notification**: When update available, user sees "New version available"
4. **Auto-Download**: Update downloads in background
5. **Installation**: 
   - **Windows**: Quit and install automatically on next restart
   - **macOS**: User chooses when to restart

---

## Option 2: Custom Server (Advanced)

### Step 1: Update package.json

```json
{
  "build": {
    "appId": "com.salesteam.app",
    "publish": {
      "provider": "generic",
      "url": "https://your-server.com/downloads/"
    }
  }
}
```

### Step 2: Host Update Files

On your server at `https://your-server.com/downloads/`:

**For macOS:**
- `latest-mac.yml` - Version info file
- `Sales Team-0.2.0.dmg` - The installer

**For Windows:**
- `latest.yml` - Version info file
- `Sales Team Setup 0.2.0.exe` - The installer

### Step 3: Create Version File (latest.yml)

**For Windows (latest.yml):**
```yaml
version: 0.2.0
files:
  - url: Sales Team Setup 0.2.0.exe
    sha512: [hash-here]
    size: 154000000
path: Sales Team Setup 0.2.0.exe
sha512: [hash-here]
releaseDate: '2024-03-05T10:00:00.000Z'
```

**For macOS (latest-mac.yml):**
```yaml
version: 0.2.0
files:
  - url: Sales Team-0.2.0.dmg
    sha512: [hash-here]
    size: 154000000
path: Sales Team-0.2.0.dmg
sha512: [hash-here]
releaseDate: '2024-03-05T10:00:00.000Z'
```

To generate SHA512 hash:
```bash
shasum -a 512 Sales\ Team\ Setup\ 0.2.0.exe
```

---

## Creating Update UI Component (Optional)

If you want a custom update notification:

```javascript
// src/components/UpdateNotification.js
import { useState, useEffect } from 'react';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
  const [updateState, setUpdateState] = useState(null);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateState('available');
    };

    const handleUpdateDownloaded = () => {
      setUpdateState('downloaded');
    };

    if (window.electron?.app) {
      window.electron.app.onUpdateAvailable(handleUpdateAvailable);
      window.electron.app.onUpdateDownloaded(handleUpdateDownloaded);
    }
  }, []);

  if (!updateState) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-md">
      <div className="flex items-center gap-3">
        {updateState === 'available' ? (
          <>
            <Download className="w-5 h-5" />
            <span>Update downloading...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-5 h-5" />
            <span>Update ready! Restart to apply.</span>
            <button
              onClick={() => window.electron.app.quitAndInstall()}
              className="ml-2 bg-white text-blue-500 px-3 py-1 rounded hover:bg-gray-100"
            >
              Restart Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

Add to your App.js:
```javascript
import UpdateNotification from './components/UpdateNotification';

function App() {
  return (
    <Router>
      <UpdateNotification /> {/* Add this line */}
      {/* ... rest of app */}
    </Router>
  );
}
```

---

## Update Workflow

### Release a New Version:

1. **Update version in package.json:**
   ```json
   "version": "0.2.0"
   ```

2. **Build installers:**
   ```bash
   npm run build
   npm run electron-build
   ```

3. **Upload to GitHub (or your server):**
   - GitHub: Create new release with installers
   - Custom: Upload files to your server with version file

4. **Users automatically get notified and update!**

---

## Checking Update Status

Users can manually check for updates via:
- Menu: Help → Check for Updates
- They'll see notifications when updates are available

---

## Troubleshooting Updates

**Updates not working?**
1. Verify version in package.json is newer
2. Check GitHub release is properly configured
3. Ensure installers are uploaded
4. Check app logs: `~/.config/Sales Team/logs/`

**Manual Update Server Issues?**
1. Verify `.yml` files are in correct format
2. Check SHA512 hashes match files
3. Ensure server allows file downloads
4. Test with `curl https://your-server.com/downloads/latest.yml`

---

## Security Best Practices

- ✅ Sign your installers (optional but recommended)
- ✅ Use HTTPS for download servers
- ✅ Verify SHA512 hashes automatically
- ✅ Test updates before releasing to all users
- ✅ Keep update servers secure

---

## Summary

**GitHub Releases (Easiest):**
- ✅ Free hosting
- ✅ Easy to set up (5 steps)
- ✅ Perfect for most teams
- ✅ No server maintenance

**Custom Server (Most Control):**
- ✅ Complete control
- ✅ Can do phased rollouts
- ✅ Direct user communication
- ❌ Requires server setup
- ❌ More complex

**I recommend GitHub Releases for getting started!**

---

## Quick Install for Auto-Update

```bash
# 1. Install
npm install electron-updater

# 2. Update main.js with code above
# 3. Update preload.js with code above
# 4. Rebuild
npm run build
npm run electron-build

# 5. Create GitHub release with installers
# 6. Done! Updates work automatically
```

---

**Status**: Ready to implement ✅
**Time to implement**: 15-30 minutes
**Difficulty**: Easy to Medium
