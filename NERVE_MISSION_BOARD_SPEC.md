# BigDataClaw Nerve Mission Board - Specification

## Overview
A real-time web cockpit for BigDataClaw multi-agent CRE research system. Customized version of OpenClaw Nerve for property matching, hot money tracking, and deal orchestration.

---

## 🎯 Core Missions (Use Cases)

### 1. Property Research Mission
**Trigger:** User submits a property address  
**Flow:** 
```
Property Submission → Transaction Scout → Hot Money ID → Portfolio Match → Agent Finder → Lender Match → Obsidian Export
```

### 2. Hot Money Surveillance
**Trigger:** Continuous monitoring of transaction DB  
**Flow:**
```
New Transaction Detected → Identify Seller → Calculate Cash Position → Alert if Hot → Add to Radar
```

### 3. Deal Pipeline Management
**Trigger:** Active deal progression  
**Flow:**
```
Lead Qualified → Contact Made → Offer Submitted → Negotiation → Closing
```

### 4. Portfolio Analysis Mission
**Trigger:** Entity profile lookup  
**Flow:**
```
Entity Search → Transaction History → Portfolio Map → Holding Pattern Analysis → Contact Intelligence
```

---

## 🏗️ Architecture Components

### Frontend (React 19 + Tailwind + shadcn/ui)
```
src/nerve/
├── layouts/
│   ├── MissionControlLayout.jsx      # Main dashboard shell
│   ├── KanbanLayout.jsx              # Deal board view
│   └── WorkspaceLayout.jsx           # Agent workspace
├── components/
│   ├── MissionBoard/
│   │   ├── MissionCard.jsx           # Individual mission display
│   │   ├── MissionKanban.jsx         # Kanban board for missions
│   │   ├── SubAgentTree.jsx          # Hierarchical agent view
│   │   └── MissionTimeline.jsx       # Mission progress timeline
│   ├── Property/
│   │   ├── PropertyCard.jsx          # Property match card
│   │   ├── HotMoneyRadar.jsx         # Real-time hot money display
│   │   ├── MatchScoreRing.jsx        # Circular match score
│   │   └── PortfolioMap.jsx          # Geographic portfolio view
│   ├── Agent/
│   │   ├── AgentFleet.jsx            # All active agents
│   │   ├── AgentStatusBadge.jsx      # Agent state indicator
│   │   ├── AgentConsole.jsx          # Agent output console
│   │   └── AgentConfigPanel.jsx      # Agent settings
│   ├── Deal/
│   │   ├── DealPipeline.jsx          # Deal stage visualization
│   │   ├── DealCard.jsx              # Deal summary
│   │   ├── ContactQuickActions.jsx   # Click-to-call/email/LinkedIn
│   │   └── OfferWriterPanel.jsx      # AI offer generation
│   ├── Obsidian/
│   │   ├── VaultBrowser.jsx          # Obsidian file browser
│   │   ├── NotePreview.jsx           # Markdown preview
│   │   ├── GraphVisualization.jsx    # Obsidian graph view
│   │   └── SyncStatus.jsx            # Sync indicator
│   └── System/
│       ├── UsageMeter.jsx            # API cost tracking
│       ├── ContextPressure.jsx       # Context window indicator
│       ├── VoiceControl.jsx          # Push-to-talk UI
│       └── ThemeSwitcher.jsx         # Light/dark/themes
├── views/
│   ├── MissionControl.jsx            # Main dashboard
│   ├── PropertyResearch.jsx          # Property matching view
│   ├── HotMoneyRadar.jsx             # Hot money tracking
│   ├── DealPipeline.jsx              # Active deals
│   ├── AgentWorkspace.jsx            # Agent fleet management
│   ├── ObsidianVault.jsx             # Vault browser
│   └── Settings.jsx                  # Configuration
├── hooks/
│   ├── useMissions.js                # Mission state management
│   ├── useAgents.js                  # Agent coordination
│   ├── useHotMoney.js                # Hot money real-time
│   ├── useVoice.js                   # Voice interface
│   └── useObsidian.js                # Obsidian integration
└── stores/
    ├── missionStore.js               # Zustand mission state
    ├── agentStore.js                 # Agent fleet state
    └── workspaceStore.js             # Workspace preferences
```

### Backend (Python FastAPI + WebSocket)
```
nerve_server/
├── main.py                           # FastAPI entry point
├── websocket/
│   ├── mission_hub.py               # Mission state WebSocket
│   ├── agent_stream.py              # Agent output streaming
│   └── voice_gateway.py             # Voice processing
├── agents/
│   ├── mission_controller.py        # Mission lifecycle
│   ├── agent_supervisor.py          # Agent coordination
│   └── result_aggregator.py         # Result compilation
├── services/
│   ├── hot_money_tracker.py         # Hot money detection
│   ├── match_scorer.py              # Match scoring engine
│   ├── obsidian_sync.py             # Vault synchronization
│   └── usage_tracker.py             # Cost tracking
└── models/
    ├── mission.py                   # Mission data models
    ├── agent_state.py               # Agent state models
    └── workspace.py                 # Workspace config
```

---

## 📊 Dashboard Views

### 1. Mission Control (Main Dashboard)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BIGDATACLAW NERVE                    [Voice] [Theme] [Settings] [Profile]  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Active      │  │ Hot Money   │  │ Match Score │  │ API Usage   │        │
│  │ Missions: 5 │  │ Alerts: 12  │  │ Avg: 87%    │  │ $12.40/day  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ ACTIVE MISSIONS (Kanban)    │  │ AGENT FLEET STATUS                  │  │
│  │                             │  │                                     │  │
│  │ [Research] [Analyze] [Done] │  │ 🟢 Transaction Scout - Active       │  │
│  │                             │  │ 🟡 Portfolio Analyzer - Queued      │  │
│  │ • Welland Industrial   →    │  │ 🟢 Hot Money Tracker - Watching     │  │
│  │ • St Catharines Retail →    │  │ ⚪ Agent Finder - Idle              │  │
│  │ • Niagara Farm         →    │  │                                     │  │
│  │                             │  │                                     │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ HOT MONEY RADAR (Real-time)                                         │    │
│  │ 💰 2650687 Ontario Ltd - $15M cash - May 2025    [View] [Contact]   │    │
│  │ 💰 Turnberry Holdings - $9.8M cash - Jan 2025    [View] [Contact]   │    │
│  │ 💰 1863570 Ontario Inc - $7M cash - Jan 2025     [View] [Contact]   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Property Research Workspace
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROPERTY RESEARCH: 1500 Michael Dr, Welland                    [Run Agent] │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  ┌───────────────────────────┐ │
│  │ PROPERTY INPUT                          │  │ RESEARCH PROGRESS         │ │
│  │                                         │  │                           │ │
│  │ Address: [____________________] [Map]   │  │ Phase 1: Transaction Scout│ │
│  │ Asset Class: [Industrial ▼]             │  │ [████████░░░░░░░░] 45%    │ │
│  │ Price: $[5,000,000]                     │  │                           │ │
│  │ Size: [80,000] SF                       │  │ Finding recent sales...   │ │
│  │ Region: [Niagara ▼]                     │  │ • 3 transactions found    │ │
│  │                                         │  │ • 2 hot money leads       │ │
│  │ [Start Research Mission]                │  │                           │ │
│  └─────────────────────────────────────────┘  └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TOP MATCHES                                                           │  │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │  │
│  │ │ Score: 95   │ │ Score: 88   │ │ Score: 82   │ │ Score: 75   │      │  │
│  │ │ Dream Ind   │ │ Pure Ind    │ │ Carttera    │ │ RioCan      │      │  │
│  │ │ $10-100M    │ │ $5-50M      │ │ $20-200M    │ │ $15-500M    │      │  │
│  │ │ [Contact]   │ │ [Contact]   │ │ [Contact]   │ │ [Contact]   │      │  │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Deal Pipeline (Kanban)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEAL PIPELINE                                            [+ New Deal]      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ NEW         │  │ CONTACTED   │  │ OFFER OUT   │  │ CLOSING     │        │
│  │ (12)        │  │ (8)         │  │ (4)         │  │ (2)         │        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ • Dream Ind │  │ • Tregunno  │  │ • Pure Ind  │  │ • Carttera  │        │
│  │   $5M Ind   │  │   $8M Fruit │  │   $3.5M     │  │   $12M      │        │
│  │   [Drag →]  │  │   [Drag →]  │  │   [Drag →]  │  │   [Done]    │        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ • Stone Egl │  │ • Walker Ind│  │             │  │             │        │
│  │   $7M Vine  │  │   $4M Land  │  │             │  │             │        │
│  │   [Drag →]  │  │   [Drag →]  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Agent Workspace
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AGENT WORKSPACE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ AGENT FLEET                                                           │  │
│  │ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐             │  │
│  │ │ Transaction    │ │ Portfolio      │ │ Agent Finder   │             │  │
│  │ │ Scout          │ │ Analyzer       │ │                │             │  │
│  │ │ ─────────────  │ │ ─────────────  │ │ ─────────────  │             │  │
│  │ │ Status: 🟢     │ │ Status: 🟡     │ │ Status: ⚪     │             │  │
│  │ │ Active Missions│ │ Queued         │ │ Idle           │             │  │
│  │ │                │ │                │ │                │             │  │
│  │ │ Last Output:   │ │ Last Output:   │ │ Last Output:   │             │  │
│  │ │ "Found 3 sales│ │ "Analyzing..." │ │ "Standby"      │             │  │
│  │ │ in Welland"   │ │                │ │                │             │  │
│  │ │                │ │                │ │                │             │  │
│  │ │ [View Logs]    │ │ [View Logs]    │ │ [View Logs]    │             │  │
│  │ │ [Configure]    │ │ [Configure]    │ │ [Configure]    │             │  │
│  │ └────────────────┘ └────────────────┘ └────────────────┘             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Key Features

### 1. Real-Time Mission Tracking
- Mission lifecycle: Queued → Running → Review → Complete
- Sub-agent tree visualization
- Live log streaming
- Progress indicators per phase

### 2. Hot Money Radar
- Real-time transaction monitoring
- Cash position calculations
- Alert thresholds (configurable)
- Geographic heat map

### 3. Match Score Visualization
- Circular progress ring (0-100)
- Breakdown: Recency, Capital, Asset Match, Geography
- Comparative view (multiple buyers)
- Historical trend

### 4. Voice Interface
- Push-to-talk property queries
- Natural language: "Find me hot money buyers for a $5M industrial in Welland"
- Voice-to-form auto-fill
- TTS for match results

### 5. Obsidian Integration
- Vault browser (file tree)
- Live note preview
- One-click export to vault
- Graph visualization of connections

### 6. Deal Pipeline
- Kanban board (New → Contacted → Offer → Closing)
- Drag-and-drop deal progression
- Contact quick actions (call/email/LinkedIn)
- Due date tracking

### 7. Agent Fleet Management
- Start/stop agents
- Configure agent parameters
- View agent logs
- Agent-to-agent delegation

### 8. Usage & Cost Tracking
- Per-mission API cost
- Daily/weekly/monthly usage
- Context window pressure
- Token consumption by agent

---

## 🔧 Technical Implementation

### WebSocket Events
```javascript
// Mission lifecycle
'mission:created'      // New mission started
'mission:phase:change' // Phase transition
'mission:agent:spawn'  // Sub-agent created
'mission:complete'     // Mission finished
'mission:hotmoney:found' // Hot money detected

// Agent streaming
'agent:log'            // Log line from agent
'agent:result'         // Structured result
'agent:error'          // Error occurred
'agent:status'         // Status change

// Hot money alerts
'hotmoney:new'         // New hot money lead
'hotmoney:update'      // Lead updated
'hotmoney:expire'      // Lead expired

// User interactions
'voice:transcript'     // Voice input
'voice:command'        // Parsed command
'click:contact'        // Contact action
'drag:deal'            // Deal moved
```

### REST Endpoints
```
POST   /api/missions                    # Create new mission
GET    /api/missions/:id                # Get mission details
POST   /api/missions/:id/abort          # Abort mission
GET    /api/missions/:id/logs           # Get mission logs
GET    /api/agents                      # List all agents
POST   /api/agents/:id/run              # Run agent
GET    /api/hotmoney                    # Get hot money leads
GET    /api/matches/:propertyId         # Get match results
POST   /api/deals                       # Create deal
PATCH  /api/deals/:id/stage             # Update deal stage
GET    /api/obsidian/vault              # Browse vault
POST   /api/obsidian/export             # Export to vault
GET    /api/usage                       # Get usage stats
```

### Agent Markers (Rich Output)
Similar to Nerve's markers, BigDataClaw agents output:

```python
# Kanban marker
"""@kanban:hotmoney
- name: "2650687 Ontario Ltd"
- cash: "$15,000,000"
- date: "May 2025"
- location: "West Lincoln"
- action: "[Contact] [View Profile]"
"""

# Chart marker
"""@chart:portfolio
- type: "pie"
- data: {"Industrial": 45, "Retail": 30, "Office": 25}
- title: "Asset Class Distribution"
"""

# Score marker
"""@score:match
- buyer: "Dream Industrial REIT"
- score: 95
- breakdown: {"recency": 90, "capital": 95, "asset": 98, "geo": 92}
"""

# Deal marker
"""@deal:pipeline
- entity: "Tregunno Fruit Farms"
- stage: "contacted"
- value: "$8,000,000"
- next_action: "Schedule call"
"""
```

---

## 📱 Responsive Design

### Desktop (1200px+)
- Full 4-column kanban
- Side-by-side panels
- Agent fleet grid

### Tablet (768px-1199px)
- 2-column kanban
- Stacked panels
- Collapsible sidebar

### Mobile (<768px)
- Single column
- Bottom nav
- Card-based layout
- Swipeable tabs

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Setup React 19 + Vite + Tailwind + shadcn/ui
- [ ] FastAPI WebSocket server
- [ ] Mission state management (Zustand)
- [ ] Basic dashboard layout

### Phase 2: Mission Control
- [ ] Mission kanban board
- [ ] Agent fleet status
- [ ] Hot money radar widget
- [ ] Property input form

### Phase 3: Research Flow
- [ ] Property submission → agent trigger
- [ ] Live log streaming
- [ ] Match results display
- [ ] Score visualization

### Phase 4: Deal Management
- [ ] Deal pipeline kanban
- [ ] Contact quick actions
- [ ] Drag-and-drop stages
- [ ] Deal detail view

### Phase 5: Advanced Features
- [ ] Voice interface (Whisper + TTS)
- [ ] Obsidian vault browser
- [ ] Usage tracking
- [ ] Mobile optimization

---

## 🔌 Integration Points

### Existing BigDataClaw Components
- `matching_engine.py` - Match scoring
- `orchestrator.py` - Agent coordination
- `buyer_database.py` - Buyer data
- `obsidian_agent.py` - Vault integration
- `api_server.py` - REST endpoints

### New Nerve Components
- `nerve_server/main.py` - WebSocket hub
- `mission_controller.py` - Mission lifecycle
- `hot_money_tracker.py` - Real-time tracking
- `usage_tracker.py` - Cost monitoring

---

*Specification for BigDataClaw Nerve Mission Board v1.0*
