# 🪟 WINDOWS INSTALLER BUILD GUIDE

## How to Build Windows EXE File

### **IMPORTANT: You NEED a Windows computer to build Windows installer**

Windows installers must be built on a Windows machine. However, you have options:

---

## OPTION 1: BUILD ON YOUR WINDOWS MACHINE (EASIEST)

### **Prerequisites:**
- Windows 10 or 11 computer
- Node.js installed (https://nodejs.org - version 18+)
- Your project folder

### **Step 1: Copy Project to Windows**
1. Copy entire `/sales-team` folder to Windows computer
2. Put it somewhere easy to find (like `C:\Users\YourName\Documents\sales-team`)

### **Step 2: Install Dependencies**
1. Open Command Prompt or PowerShell
2. Navigate to project:
```bash
cd C:\Users\YourName\Documents\sales-team
```

3. Install everything:
```bash
npm install
```

Wait for completion (2-5 minutes)

### **Step 3: Build Windows Installers**
```bash
npm run electron-build
```

Wait for build to complete (3-5 minutes)

### **Step 4: Find Your Files**
Look in the `dist/` folder:
- `Sales Team Setup 0.1.0.exe` ← **Main installer (share this)**
- `Sales Team 0.1.0.exe` ← Portable version (optional)
- Other files (don't share these)

### **Step 5: Upload to Google Drive**
Same as macOS - upload the `.exe` file to share with users

---

## OPTION 2: USE GITHUB ACTIONS (AUTOMATED - NO WINDOWS NEEDED)

This builds automatically every time you update code.

### **Step 1: Create GitHub Account**
1. Go to https://github.com
2. Click "Sign up"
3. Complete registration

### **Step 2: Create Repository**
1. Click "+" → "New repository"
2. Name: `sales-team-app`
3. Click "Create repository"
4. Follow GitHub instructions to upload your code

### **Step 3: Create Build Workflow**
1. Click "Actions" tab
2. Click "New workflow"
3. Create file `.github/workflows/build.yml`:

```yaml
name: Build Electron App

on: [push]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm install
      - run: npm run electron-build
      - uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: dist/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### **Step 4: Push Code to GitHub**
Every time you push code, GitHub automatically builds for Windows!

### **Step 5: Get the Built Files**
1. Go to Actions tab
2. Find your latest build
3. Download the artifacts
4. Extract and upload to Google Drive

---

## OPTION 3: USE BUILD FARM SERVICE (SIMPLEST)

Services like Codemagic or Netlify can build for Windows without needing Windows machine.

### **Steps:**
1. Connect your GitHub repo
2. Configure build settings
3. Trigger build
4. Download Windows files
5. Upload to Google Drive

---

## QUICK BUILD CHECKLIST

### **Windows Machine Method:**
- [ ] Copy project to Windows
- [ ] Install Node.js
- [ ] Run `npm install`
- [ ] Run `npm run electron-build`
- [ ] Find `Sales Team Setup 0.1.0.exe` in `dist/`
- [ ] Upload to Google Drive

### **GitHub Actions Method:**
- [ ] Create GitHub account
- [ ] Upload project to GitHub
- [ ] Create workflow file
- [ ] GitHub builds automatically
- [ ] Download built files
- [ ] Upload to Google Drive

---

## AFTER YOU BUILD

1. Upload `Sales Team Setup 0.1.0.exe` to your Google Drive
2. Share the link with Windows users
3. Windows users run the installer
4. Done!

---

## TROUBLESHOOTING

**Q: I don't have a Windows computer?**
A: Use Option 2 (GitHub Actions) - GitHub builds for you automatically

**Q: The build failed?**
A: Make sure:
- Node.js is version 18+
- npm install completed successfully
- No errors in `npm run electron-build` output

**Q: How big is the Windows EXE?**
A: About 150-160 MB (same as macOS DMG)

**Q: Can I just share the portable EXE instead?**
A: YES! `Sales Team 0.1.0.exe` works too, but the installer version is better for users

---

## FILE NAMES EXPLAINED

| File | Use | Share? |
|------|-----|--------|
| `Sales Team Setup 0.1.0.exe` | Main installer | ✅ YES |
| `Sales Team 0.1.0.exe` | Portable (no install) | ✅ YES (optional) |
| Other files | Technical | ❌ NO |

---

**Need help? Let me know your preference (Windows machine or GitHub Actions)!** ✅
