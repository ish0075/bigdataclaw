# Pablo Pixel Agents - Local Setup Guide

## Option 1: Use VS Code Extension (Easiest)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "Pixel Agents"
4. Install by Pablo De Lucca
5. Open Command Palette (Ctrl+Shift+P)
6. Run: "Pixel Agents: Show Panel"

## Option 2: Build from Source (Advanced)

```bash
# Clone the repo
git clone https://github.com/pablodelucca/pixel-agents.git
cd pixel-agents

# Install dependencies (may need legacy peer deps)
npm install --legacy-peer-deps

# Install webview dependencies
cd webview-ui
npm install --legacy-peer-deps
cd ..

# Build (may have TypeScript errors with Node 24)
npm run build
```

### Fix TypeScript Errors
If you get type errors, try:

```bash
# Use Node 18 (compatible version)
nvm install 18
nvm use 18

# Delete node_modules and reinstall
rm -rf node_modules webview-ui/node_modules
npm install
cd webview-ui && npm install && cd ..
npm run build
```

### Run in Browser Mode
The webview-ui can run standalone:

```bash
cd webview-ui
npm run dev
# Opens at http://localhost:5173
```

## Option 3: Use BigDataClaw's Integrated Version (Recommended)

Already working at:
- http://localhost:8083/pixel-office-v2.html (with speech bubbles)
- http://localhost:8083/pixel-office-cinematic.html (for videos)

### Features:
- ✅ 10 BigDataClaw agents with your names
- ✅ Speech bubbles showing tasks
- ✅ Stayner deal scenario
- ✅ Hot money alerts
- ✅ No build required
- ✅ Easy to customize

### Customize Agents:
Edit the `AGENT_DATA` array in the HTML file:

```javascript
const AGENT_DATA = [
    { name: 'Transaction Scout', emoji: '🔍', color: '#00d4ff', 
      tasks: ['Scanning LoopNet...', 'New listing found!'] },
    // Add your agents...
];
```

## Summary

| Use Case | Recommended Option |
|----------|-------------------|
| Quick demo | Your integrated version |
| Exact Pablo aesthetic | VS Code extension |
| Modify/customize | Your integrated version |
| Video production | Your cinematic version |
| Contributing to Pablo's project | Build from source |
