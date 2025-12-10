#!/bin/bash

# Build script for DAO Governance Co-Pilot Extension

echo "🔨 Building DAO Governance Co-Pilot Extension..."
echo "================================================"
echo ""

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Build with webpack
echo "⚙️  Running webpack build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "📋 Copying static files..."
cp src/manifest.json dist/
cp src/index.html dist/

echo ""
echo "✅ Build complete!"
echo ""
echo "📂 Extension is ready in: $(pwd)/dist"
echo ""
echo "📖 Next steps:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode' (toggle in top right)"
echo "   3. Click 'Load unpacked' and select the 'dist' folder"
echo "   4. Visit https://vote.uniswapfoundation.org/proposals/xxx"
echo "   5. Look for the purple AI panel in the top-right!"
echo ""
