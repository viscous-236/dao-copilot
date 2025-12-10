# 🚀 Installing the DAO Governance Co-Pilot Extension

## ✅ Build Complete!

Your extension has been built successfully and is ready to load into Chrome.

## 📦 Installation Steps

### 1. Open Chrome Extensions Page
- Open Google Chrome
- Navigate to `chrome://extensions/`
- Or click the puzzle icon → "Manage Extensions"

### 2. Enable Developer Mode
- Toggle the **"Developer mode"** switch in the top right corner

### 3. Load Unpacked Extension
- Click **"Load unpacked"** button
- Navigate to and select the `dist` folder:
  ```
  /Users/vaibhavgoyal/Desktop/web3/dao-copilot/extension/dist
  ```

### 4. Verify Installation
You should see the extension card with:
- ✅ Name: **DAO Governance Co-Pilot**
- ✅ Version: 0.1.0
- ✅ Status: Enabled

## 🧪 Testing the Extension

### Step 1: Make Sure the AI Agent is Running
```bash
cd /Users/vaibhavgoyal/Desktop/web3/dao-copilot/agent
node ./dist/index.js &
```

The agent should be running on `http://localhost:4000`

### Step 2: Visit a Uniswap Proposal
1. Open a new tab in Chrome
2. Go to: https://vote.uniswapfoundation.org/
3. Click on any proposal (e.g., https://vote.uniswapfoundation.org/proposals/xxx)

### Step 3: Look for the AI Panel
You should see a **purple floating panel** in the top-right corner that says:
```
🤖 DAO Governance Co-Pilot
```

### Step 4: Test the Analysis
1. Click the panel to expand it
2. Click **"🔍 Ask AI About This Proposal"**
3. Wait for the AI analysis (should take ~1 second)
4. See the results:
   - ✅ Benefits
   - ⚠️ Risks
   - 💡 AI Reasoning
   - Recommendation (YES/NO/ABSTAIN)
   - Confidence score

## 🐛 Troubleshooting

### Panel Not Showing Up?
1. **Check Console** - Open DevTools (F12) → Console tab
   - Look for messages starting with `[DAO Co-Pilot]`
   - You should see: `"[DAO Co-Pilot] Content script loaded!"`

2. **Reload the Page** - Press Ctrl+R or Cmd+R

3. **Check the URL** - Make sure you're on:
   - `vote.uniswapfoundation.org/proposals/*` (Uniswap)
   - `snapshot.org/#/*/proposal/*` (Snapshot)

4. **Verify Extension is Enabled**
   - Go to `chrome://extensions/`
   - Make sure the toggle is ON for "DAO Governance Co-Pilot"

### "Failed to analyze proposal" Error?
1. **Check AI Agent** - Make sure it's running:
   ```bash
   curl http://localhost:4000/api/health
   # Should return: {"status":"ok","service":"DAO Governance Co-Pilot AI Agent"...}
   ```

2. **Check CORS** - The extension needs permission to access `localhost:4000`
   - This is already configured in `manifest.json` under `host_permissions`

3. **Check Network Tab** - Open DevTools → Network tab
   - Look for the POST request to `localhost:4000/api/analyze-proposal`
   - Check if it's being blocked or returning errors

## 🔄 Making Changes

After making changes to the extension code:

1. **Rebuild**:
   ```bash
   cd extension
   npm run build
   cp src/manifest.json dist/
   cp src/index.html dist/
   ```

2. **Reload Extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the refresh icon ↻ on the extension card

3. **Reload the Page** where you're testing

## 📁 Extension Structure

```
extension/dist/          ← Load this folder in Chrome
├── manifest.json        ← Extension configuration
├── index.html           ← Popup HTML
├── background/
│   └── listener.js      ← Background service worker
├── content-script/
│   └── injectPanel.js   ← Injected into DAO pages
└── popup/
    └── Popup.js         ← Extension popup UI
```

## 🎯 What to Test

- ✅ Panel appears on Uniswap proposal pages
- ✅ Panel is collapsible (click header to collapse/expand)
- ✅ "Ask AI" button triggers analysis
- ✅ Loading spinner shows during analysis
- ✅ Results display correctly with colors
- ✅ Recommendation badge shows correct color (Green=YES, Red=NO, Orange=ABSTAIN)
- ✅ Panel persists when navigating between proposals

## 🌐 Supported Sites

Currently works on:
- ✅ **Uniswap DAO**: `vote.uniswapfoundation.org`
- ✅ **Snapshot**: `snapshot.org` (any DAO space)

## 🔜 Next Steps

1. **Test with real proposals** - Visit actual Uniswap proposals
2. **Try different proposal types** - Treasury, governance, technical upgrades
3. **Test on Snapshot** - Try with different DAOs on Snapshot
4. **Integrate X402 micropayments** - Add payment before analysis
5. **Improve text extraction** - Better parsing of proposal content

---

**Status**: ✅ Extension built and ready to install!
**Path**: `/Users/vaibhavgoyal/Desktop/web3/dao-copilot/extension/dist`
