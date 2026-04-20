# BigDataClaw NERVE Mission Control - User Guide

Complete guide to using the NERVE real-time CRE intelligence platform.

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Mission Control](#mission-control)
4. [Property Research](#property-research)
5. [Hot Money Radar](#hot-money-radar)
6. [Deal Pipeline](#deal-pipeline)
7. [Agent Workspace](#agent-workspace)
8. [Obsidian Vault](#obsidian-vault)
9. [Voice Control](#voice-control)
10. [Settings & Configuration](#settings--configuration)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Screen resolution: 1280x720 minimum (1920x1080 recommended)

### Accessing NERVE
1. Open your browser
2. Navigate to: `http://localhost:5173` (or your deployed URL)
3. The dashboard will load automatically

### First-Time Setup
1. Click **Settings** (gear icon in top right)
2. Configure your API keys (OpenAI, Anthropic)
3. Set your Obsidian vault path
4. Adjust notification preferences

---

## Dashboard Overview

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🚦          Connection: ✅ Connected    [Voice] [🔔] [⚙️] [👤] │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  🦞      │              MAIN CONTENT AREA                   │
│ BIGDATA  │                                                  │
│ CLAW     │    Changes based on selected view:               │
│          │    • Mission Control                             │
│  ─────── │    • Property Research                           │
│  Navigation│    • Hot Money Radar                           │
│  Menu    │    • Deal Pipeline                               │
│          │    • Agent Workspace                             │
│  [Nav    │    • Obsidian Vault                              │
│   Items] │    • Settings                                    │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Top Bar Elements
| Element | Function |
|---------|----------|
| 🚦 Traffic Lights | Window controls (decorative) |
| Connection Status | Shows WebSocket connection state |
| 🎙️ Voice | Activate voice control |
| 💳 Usage | API cost tracking |
| 🔔 Notifications | Alert center |
| ⚙️ Settings | Configuration panel |
| 🦞 Profile | User menu |

### Navigation Sidebar
Click any item to navigate:
- **Mission Control** - Main dashboard
- **Property Research** - Start property analysis missions
- **Hot Money Radar** - View hot money alerts
- **Deal Pipeline** - Manage active deals
- **Agent Workspace** - Control AI agents
- **Obsidian Vault** - Browse research notes

---

## Mission Control

### Overview
The Mission Control dashboard provides a real-time overview of your CRE intelligence operations.

### Stat Cards (Top Row)
Four key metrics displayed:
1. **Active Missions** - Currently running research missions
2. **Hot Money Alerts** - New sellers with fresh capital detected
3. **Tracked Capital** - Total cash position of tracked entities
4. **Matches Today** - Buyer/property matches generated

### Active Missions Panel
Shows running research missions:
- **Progress Bar** - Visual indicator of mission completion
- **Phase Indicator** - Current step (1-5)
- **Status** - Running, Queued, or Paused
- **Actions** - View details, pause, or abort

**How to read mission status:**
```
🟢 Running  → Mission is actively processing
🟡 Queued   → Waiting to start
🔴 Paused   → Temporarily stopped
```

### Hot Money Radar Widget
Quick view of top hot money leads:
- Entity name and cash position
- Sale date and location
- One-click contact actions

### Agent Fleet Panel
Status of all AI agents:
- **🟢 Active** - Agent is running
- **🟡 Queued** - Agent is waiting
- **⚪ Idle** - Agent ready to start

**Agent Types:**
| Agent | Function |
|-------|----------|
| Transaction Scout | Finds recent market transactions |
| Hot Money Tracker | Identifies sellers with fresh capital |
| Portfolio Analyzer | Matches asset class portfolios |
| Agent Finder | Finds active brokers |
| Lender Matcher | Matches financing sources |
| Obsidian Sync | Syncs with your vault |

### Quick Actions
One-click shortcuts to common tasks:
- 🎯 Research Property → Opens Property Research
- 🔥 View Hot Money → Opens Hot Money Radar
- 📊 Deal Pipeline → Shows active deals
- 🤖 Agent Workspace → Manage agents

---

## Property Research

### Starting a New Mission

1. Click **"New Mission"** on Mission Control, or
2. Navigate to **Property Research** in sidebar
3. Fill in property details:

**Required Fields:**
- Street Address
- City
- Asset Class (Industrial, Retail, Office, etc.)
- Price
- Region

**Optional Fields:**
- Postal Code
- Size (Square Feet)

### Research Depth Options
Choose analysis depth:
- **Quick** - Top 5 matches (1-2 minutes)
- **Standard** - Top 10 matches (3-5 minutes) ⭐ Recommended
- **Deep** - Top 25 matches (8-10 minutes)

### Include Options
Toggle which analyses to run:
- ✅ Hot money analysis
- ✅ Portfolio matching
- ✅ Agent recommendations
- ✅ Lender matching
- ⬜ Comp analysis (optional)

### Launching the Mission
1. Click **"Launch Mission"**
2. Mission phases will execute automatically:
   ```
   Phase 1: Transaction Scout    [████████░░] 80%
   Phase 2: Hot Money ID         [░░░░░░░░░░] 0%
   Phase 3: Portfolio Match      [░░░░░░░░░░] 0%
   Phase 4: Agent Finder         [░░░░░░░░░░] 0%
   Phase 5: Lender Match         [░░░░░░░░░░] 0%
   ```

### Mission Phases Explained

**Phase 1: Transaction Scout**
- Searches recent transactions in target market
- Identifies comparable sales
- Finds market trends

**Phase 2: Hot Money ID**
- Cross-references recent sellers
- Calculates cash positions
- Flags qualified buyers

**Phase 3: Portfolio Match**
- Analyzes buyer portfolios
- Scores asset class alignment
- Ranks by investment criteria

**Phase 4: Agent Finder**
- Identifies active local brokers
- Cross-references deal history
- Provides contact intelligence

**Phase 5: Lender Match**
- Matches financing sources
- Calculates loan scenarios
- Provides lender contacts

### Results
Once complete, you'll see:
- **Top Matches** - Ranked buyer list with scores
- **Match Score Ring** - Visual score indicator (0-100)
- **Score Breakdown**:
  - Recency (how recent their activity)
  - Capital (available funds)
  - Asset Match (portfolio alignment)
  - Geography (location preference)

---

## Hot Money Radar

### Overview
Real-time surveillance of recent sellers who now have fresh capital to deploy.

### Understanding Hot Money
**Definition:** Entities who have recently sold properties and have cash ready to reinvest.

**Why it matters:**
- They have proven liquidity
- They're actively looking to deploy capital
- Higher conversion probability
- Faster deal velocity

### Hot Money List View
Each lead shows:
- **Entity Name** - Company or individual
- **Cash Position** - Amount available (e.g., $15M)
- **Sale Date** - When they sold (recency indicator)
- **Location** - Where they sold
- **Property** - What they sold
- **Match Score** - How well they match your criteria
- **Days Ago** - How recent the sale was

### Lead Card Actions
Hover over any lead to reveal:
- 📞 **Contact** - Initiate contact
- 👤 **Profile** - View full entity profile

Click to expand for:
- ☎️ Call - Phone number
- ✉️ Email - Email address
- 🎯 Add to Deal - Add to pipeline
- 🔗 View Full Profile - Detailed analysis

### Sorting & Filtering
- **Cash Amount (High→Low)** - Biggest players first
- **Date (Newest)** - Most recent sales
- **Match Score** - Best fits first

### Statistics Dashboard
Four key metrics:
1. **Total Hot Money** - Sum of all tracked cash
2. **Active Alerts** - Number of tracked entities
3. **Avg Cash Position** - Average liquidity
4. **Avg Match Score** - Overall quality score

---

## Deal Pipeline

### Overview
Kanban-style board for tracking deals from lead to close.

### Pipeline Stages
```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│   🔵    │  │   🟡    │  │   🟠    │  │   🟢    │
│   NEW   │→ │CONTACTED│→ │OFFER OUT│→ │ CLOSING │
│  (12)   │  │   (8)   │  │   (4)   │  │   (2)   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

### Deal Cards
Each card displays:
- **Entity Name** - Buyer/seller name
- **Deal Value** - Dollar amount
- **Property Type** - Asset class
- **Location** - Market area
- **Match Score** - Quality indicator (0-100)

**Score Colors:**
- 🟢 90-100 = Excellent match
- 🟡 70-89 = Good match
- 🔴 <70 = Fair match

### Moving Deals
**Drag and Drop:**
1. Click and hold a deal card
2. Drag to new column
3. Release to drop

**Or click the arrow buttons** on each card

### Quick Actions
Hover over any deal to reveal:
- 📞 Call - Initiate phone call
- ✉️ Email - Send email
- 💼 LinkedIn - View LinkedIn profile
- ⋯ More - Additional options

### Pipeline Summary (Bottom)
Four metrics:
- **Total Pipeline Value** - Sum of all deals
- **Active Deals** - Count in pipeline
- **Avg Match Score** - Average quality
- **Closing This Month** - Expected closings

### Adding New Deals
1. Click **"+ New Deal"** button
2. Fill in deal details
3. Select initial stage
4. Save

---

## Agent Workspace

### Overview
Control center for managing your AI research agents.

### Agent Cards
Each agent shows:
- **Icon** - Visual identifier
- **Name** - Agent name
- **Status** - Current state
- **Description** - What the agent does
- **Stats** - Mission counts, uptime, etc.

### Agent States

**Idle (⚪)**
- Agent is ready to run
- Not currently processing
- Click **▶ Play** to start

**Active (🟢)**
- Agent is running
- May be processing missions
- Click **⏸ Pause** or **⏹ Stop**

**Queued (🟡)**
- Agent is waiting
- Tasks scheduled
- Click **⏹ Stop** to cancel

**Error (🔴)**
- Agent encountered an error
- Check logs for details
- Restart to retry

### Agent Controls

**Start Agent:**
1. Find idle agent
2. Click **▶ Play** button
3. Agent will begin processing

**Stop Agent:**
1. Find active agent
2. Click **⏹ Stop** button
3. Agent will finish current task then stop

**Pause Agent:**
1. Find active agent
2. Click **⏸ Pause** button
3. Agent will pause after current task

### Agent Logs
Real-time log viewer at bottom:
- Select agent to view its logs
- Shows timestamp, level, message
- Color-coded by severity:
  - 🔴 ERROR = Critical issues
  - 🟡 WARN = Warnings
  - 🟢 SUCCESS = Completed actions
  - ⚪ INFO = General information

**Log Levels:**
- Use for debugging
- Track agent progress
- Monitor for errors

---

## Obsidian Vault

### Overview
Browse, search, and sync your research notes from Obsidian.

### Vault Browser (Left Panel)
File tree navigation:
- **Folders** - Expandable/collapsible
- **Files** - Click to preview
- **Search** - Find files quickly

**Folder Structure:**
```
📁 Research/          - Property analyses
📁 Deals/             - Active deal notes
📁 Buyers/            - Buyer profiles
📁 Templates/         - Note templates
📄 Sync Status.md     - Sync log
```

### Note Preview (Center Panel)
Markdown preview of selected note:
- **Headers** - Section titles
- **Lists** - Bullet points
- **Tables** - Data grids
- **Bold/Italic** - Emphasized text

**Actions:**
- ✏️ Edit - Modify note
- 👁️ Preview - View mode
- ⬇️ Download - Save locally
- 🔗 Share - Share note
- 🗑️ Delete - Remove note

### Sync Status (Right Panel)
Real-time sync information:
- **Files Synced** - Total count
- **Last Sync** - Time since last sync
- **Pending Uploads** - Waiting to upload
- **Pending Downloads** - Waiting to download

**Vault Path:**
Shows where your vault is located locally

### Sync Controls
- **Auto Sync** - Toggle automatic syncing
- **Sync Interval** - How often to sync (1-60 minutes)
- **Sync Now** - Manual sync trigger

### Recent Notes
Quick access to recently modified files with tags.

### Quick Actions
- **Open in Obsidian** - Launch desktop app
- **Global Search** - Search all notes
- **Vault Settings** - Configure sync options

---

## Voice Control

### Overview
Control NERVE using natural language voice commands.

### Activating Voice Control
1. Click **🎙️ Voice** button in top bar
2. Or use keyboard shortcut (see below)
3. Speak your command
4. System will transcribe and execute

### Voice Panel
When active, shows:
- 🎙️ Pulsing microphone indicator
- Live transcript display
- Suggested commands

### Supported Commands

**Navigation:**
- "Show me hot money"
- "Open deal pipeline"
- "Go to agent workspace"
- "Take me to settings"

**Research:**
- "Find buyers for a $5M industrial in Welland"
- "Research 1500 Michael Drive"
- "Start new property mission"

**Actions:**
- "Pause all agents"
- "Sync Obsidian vault"
- "Show mission status"

### Tips for Best Results
- Speak clearly and at normal pace
- Use specific locations and dollar amounts
- Wait for the beep before speaking
- Keep commands concise

### Privacy
- Voice data is processed locally
- Transcripts are not stored
- Microphone turns off automatically after 30 seconds of silence

---

## Settings & Configuration

### Account Tab
Manage your profile:
- **Full Name** - Display name
- **Email** - Contact address
- **Company** - Organization
- **Phone** - Contact number
- **Avatar** - Profile picture

### Notifications Tab
Configure alerts:
- **Email Notifications** - Master toggle
- **Hot Money Alerts** - New seller notifications
- **Deal Updates** - Pipeline changes
- **Mission Complete** - Research finished
- **Daily Digest** - Summary email

### API & Integrations Tab
Configure external services:

**API Keys (stored locally):**
- OpenAI API Key - For AI features
- Anthropic API Key - Alternative AI
- ContextKeep URL - Backend endpoint

⚠️ **Security Note:** API keys are stored in browser local storage only and never sent to our servers.

### Obsidian Vault Tab
Vault configuration:
- **Vault Path** - Local folder location
- **Auto Sync** - Enable automatic sync
- **Sync Interval** - Minutes between syncs

### Display Tab
Visual preferences:
- **Theme** - Dark or Light mode
- **Compact Mode** - Smaller UI elements
- **Animations** - Enable/disable transitions

### Billing Tab
Usage and subscription:
- **Current Plan** - Your subscription tier
- **Usage Meter** - Daily API cost
- **Statistics** - Notes, missions, leads counts

---

## Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + M` | Toggle voice control |

### Navigation Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1` | Mission Control |
| `Ctrl/Cmd + 2` | Property Research |
| `Ctrl/Cmd + 3` | Hot Money Radar |
| `Ctrl/Cmd + 4` | Deal Pipeline |
| `Ctrl/Cmd + 5` | Agent Workspace |
| `Ctrl/Cmd + 6` | Obsidian Vault |

### Action Shortcuts
| Shortcut | Action |
|----------|--------|
| `N` | New mission |
| `R` | Refresh data |
| `S` | Sync vault |
| `Esc` | Close modals/panels |

---

## Troubleshooting

### Connection Issues

**"Connection Refused" Error**
```
Problem: Cannot connect to servers
Solution:
1. Check if servers are running:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3090/health
2. Restart servers if needed
3. Check firewall settings
```

**WebSocket Disconnected**
```
Problem: Real-time updates not working
Solution:
1. Check internet connection
2. Refresh the page
3. Check backend server status
4. Wait for auto-reconnect (3 seconds)
```

### Performance Issues

**Slow Loading**
```
Solutions:
1. Clear browser cache
2. Close unused browser tabs
3. Check internet speed
4. Refresh the page
```

**High CPU Usage**
```
Solutions:
1. Disable animations in Settings > Display
2. Reduce number of active missions
3. Close unused views
4. Restart browser
```

### Agent Issues

**Agent Won't Start**
```
1. Check agent status (should be Idle)
2. Check logs for error messages
3. Stop and restart the agent
4. Refresh the page
```

**No Mission Results**
```
1. Check property details are complete
2. Verify region selection
3. Check agent is running
4. Try increasing research depth
```

### Sync Issues

**Obsidian Not Syncing**
```
1. Verify vault path is correct
2. Check Obsidian is not running (file locks)
3. Click "Sync Now" manually
4. Check file permissions
```

### Voice Control Issues

**Voice Not Working**
```
1. Ensure microphone permissions are granted
2. Check browser supports Web Speech API
3. Speak clearly and closer to mic
4. Try Chrome browser (best support)
```

### Data Issues

**Missing Hot Money Leads**
```
1. Check Hot Money Tracker agent is active
2. Verify date range filters
3. Refresh the page
4. Check API connections
```

---

## Best Practices

### Mission Management
1. **Start with Standard depth** - Good balance of speed and thoroughness
2. **Queue multiple missions** - While one runs, prepare the next
3. **Monitor agent logs** - Catch issues early
4. **Export results** - Save to Obsidian for reference

### Deal Pipeline
1. **Update regularly** - Keep stages current
2. **Use match scores** - Prioritize high-scoring deals
3. **Add notes** - Document conversations
4. **Set follow-up dates** - Don't let deals go cold

### Hot Money Tracking
1. **Check daily** - New leads appear regularly
2. **Act fast** - Hot money cools quickly
3. **Verify cash position** - Confirm liquidity
4. **Track outcomes** - Mark contacted/dead leads

### Vault Organization
1. **Use templates** - Consistent note structure
2. **Tag everything** - Easy searching later
3. **Sync regularly** - Keep backups current
4. **Link notes** - Build knowledge graph

---

## Support

### Getting Help
1. Check this user guide first
2. Review troubleshooting section
3. Check browser console for errors
4. Contact BigDataClaw support

### Reporting Bugs
Include:
- Browser version
- Steps to reproduce
- Error messages
- Screenshots if applicable

---

## Updates

### Version History
- **v1.0.0** - Initial release
  - Mission Control dashboard
  - Property Research missions
  - Hot Money Radar
  - Deal Pipeline
  - Agent Workspace
  - Obsidian Vault integration
  - Voice Control

---

*BigDataClaw NERVE - Real-time CRE Intelligence Platform*
*© 2025 BigDataClaw Team*
