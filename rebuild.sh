#!/bin/bash

# Build script for Sales Team Electron App
set -e

echo "🚀 Starting build process..."
echo ""

# Step 1: Build React
echo "📦 Step 1/3: Building React app..."
npm run build

echo "✅ React build complete"
echo ""

# Step 2: Build Electron installer
echo "📦 Step 2/3: Building Electron installer..."
electron-builder --publish=never

echo "✅ Electron build complete"
echo ""

# Step 3: List installers
echo "📦 Step 3/3: Checking installers..."
ls -lh dist/ | grep -E "\.dmg|\.zip|\.exe" || echo "No installers found"

echo ""
echo "✅ Build complete!"
echo "📁 Installers are in: dist/"
