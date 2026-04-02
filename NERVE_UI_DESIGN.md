# BigDataClaw Nerve Mission Board - UI Design Specification

## Design System (Based on Existing UI)

### Color Palette
```css
--bg-primary: #0D0D0D;        /* Main background */
--bg-card: #1A1A1A;           /* Card backgrounds */
--bg-input: #242424;          /* Input fields */
--accent-red: #E74C3C;        /* Primary accent (buttons, active states) */
--accent-green: #27AE60;      /* Success/active */
--accent-yellow: #F39C12;     /* Warning/queued */
--accent-blue: #3498DB;       /* Info/links */
--text-primary: #FFFFFF;      /* Headings */
--text-secondary: #9CA3AF;    /* Body text */
--text-muted: #6B7280;        /* Labels */
--border-subtle: #2D2D2D;     /* Card borders */
```

### Typography
```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--heading-1: 28px/1.2 font-weight: 600;
--heading-2: 22px/1.3 font-weight: 600;
--heading-3: 18px/1.4 font-weight: 500;
--body: 14px/1.5 font-weight: 400;
--caption: 12px/1.4 font-weight: 400;
```

### Spacing & Radius
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

---

## 📱 Main Views

### 1. Mission Control Dashboard (Home)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  MISSION CONTROL                                            │
│  │BIGDATA  │  Real-time CRE intelligence & agent orchestration           │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 MISSION OVERVIEW                                                   │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │      12     │  │      48     │  │    $2.4B    │  │    156      │  │  │
│  │  │   Active    │  │   Hot Money │  │   Tracked   │  │   Matches   │  │  │
│  │  │  Missions   │  │    Leads    │  │   Capital   │  │   Today     │  │  │
│  │  │  ↑ 3 new    │  │  ↑ 8 new    │  │  ↑ 12%      │  │  ↑ 24       │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │ 🎯 ACTIVE MISSIONS           │  │ 💰 HOT MONEY RADAR                  │ │
│  │                              │  │                                     │ │
│  │ ┌──────────────────────────┐│  │ ┌─────────────────────────────────┐ │ │
│  │ │ 🟢 Industrial Research   ││  │ │ 🔥 2650687 Ontario Ltd          │ │ │
│  │ │ 1500 Michael Dr...      ││  │ │    $15M cash • May 2025         │ │ │
│  │ │ Phase 2/6 • 45%         ││  │ │    [Contact] [Profile]          │ │ │
│  │ │ [View] [Abort]          ││  │ └─────────────────────────────────┘ │ │
│  │ └──────────────────────────┘│  │ ┌─────────────────────────────────┐ │ │
│  │ ┌──────────────────────────┐│  │ │ 🔥 Turnberry Holdings           │ │ │
│  │ │ 🟡 Farm Analysis         ││  │ │    $9.8M cash • Jan 2025        │ │ │
│  │ │ Ridgeway 40-acre...     ││  │ │    [Contact] [Profile]          │ │ │
│  │ │ Queued • Starting...    ││  │ └─────────────────────────────────┘ │ │
│  │ │ [View]                  ││  │ ┌─────────────────────────────────┐ │ │
│  │ └──────────────────────────┘│  │ │ 🔥 1863570 Ontario Inc          │ │ │
│  │                              │  │ │    $7M cash • Jan 2025          │ │ │
│  │ [+ New Mission]              │  │ │    [Contact] [Profile]          │ │ │
│  │                              │  │ └─────────────────────────────────┘ │ │
│  └──────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 AGENT FLEET STATUS                                                 │  │
│  │                                                                       │  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │  │
│  │  │ 🎯             │ │ 🔍             │ │ 💼             │            │  │
│  │  │ Transaction    │ │ Hot Money      │ │ Portfolio      │            │  │
│  │  │ Scout          │ │ Tracker        │ │ Analyzer       │            │  │
│  │  │ ─────────────  │ │ ─────────────  │ │ ─────────────  │            │  │
│  │  │ 🟢 ACTIVE      │ │ 🟢 ACTIVE      │ │ 🟡 QUEUED      │            │  │
│  │  │ 3 missions     │ │ Watching 156   │ │ 1 pending      │            │  │
│  │  │                │ │ entities       │ │                │            │  │
│  │  │ [Logs] [Stop]  │ │ [Logs] [Pause] │ │ [Logs]         │            │  │
│  │  └────────────────┘ └────────────────┘ └────────────────┘            │  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │  │
│  │  │ 👤             │ │ 🏦             │ │ 📝             │            │  │
│  │  │ Agent Finder   │ │ Lender Match   │ │ Obsidian       │            │  │
│  │  │ ─────────────  │ │ ─────────────  │ │ Sync           │            │  │
│  │  │ ⚪ IDLE        │ │ ⚪ IDLE        │ │ 🟢 ACTIVE      │            │  │
│  │  │ Ready          │ │ Ready          │ │ Synced 2m ago  │            │  │
│  │  │ [Logs] [Run]   │ │ [Logs] [Run]   │ │ [Logs] [Force] │            │  │
│  │  └────────────────┘ └────────────────┘ └────────────────┘            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Property Research Mission View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  NEW RESEARCH MISSION                                        │
│  │BIGDATA  │  Submit property to find qualified buyers                    │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────┐  ┌───────────────────────────┐ │
│  │ 📍 PROPERTY INPUT                       │  │ 📡 MISSION CONFIG         │ │
│  │                                         │  │                           │ │
│  │  Street Address *                       │  │ Research Depth:           │ │
│  │  ┌───────────────────────────────────┐  │  ○ Quick (Top 5)          │ │
│  │  │ 1500 Michael Drive, Welland      │  │  ● Standard (Top 10)      │ │
│  │  │                            [📍]  │  │  ○ Deep (Top 25)          │ │
│  │  └───────────────────────────────────┘  │                           │ │
│  │                                         │  Include:                 │ │
│  │  ┌───────────────┐ ┌───────────────┐   │  ☑ Hot money analysis     │ │
│  │  │ Asset Class * │ │   Price ($) * │   │  ☑ Portfolio matching     │ │
│  │  │  [Industrial ▼] │ │ [5,000,000] │   │  ☑ Agent recommendations  │ │
│  │  └───────────────┘ └───────────────┘   │  ☑ Lender matching        │ │
│  │                                         │  ☐ Comp analysis          │ │
│  │  ┌───────────────┐ ┌───────────────┐   │                           │ │
│  │  │ Size (SF)     │ │   Region *    │   │  [🚀 Launch Mission]      │ │
│  │  │  [80,000]     │ │  [Niagara ▼]  │   │                           │ │
│  │  └───────────────┘ └───────────────┘   │                           │ │
│  │                                         │                           │ │
│  │  [📎 Attach Documents]                  │                           │ │
│  │                                         │                           │ │
│  └─────────────────────────────────────────┘  └───────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔄 MISSION PROGRESS                                                   │  │
│  │                                                                       │  │
│  │  Phase 1        Phase 2        Phase 3        Phase 4       Phase 5  │  │
│  │  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐   │  │
│  │  │  🎯  │──────│  🔍  │──────│  💼  │──────│  👤  │──────│  🏦  │   │  │
│  │  │ DONE │      │ACTIVE│      │ QUEUE│      │ QUEUE│      │ QUEUE│   │  │
│  │  └──────┘      └──────┘      └──────┘      └──────┘      └──────┘   │  │
│  │  Transaction   Hot Money     Portfolio    Agent        Lender        │  │
│  │  Scout         Identifier    Analyzer     Finder       Match         │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ 🟡 Hot Money Identifier is running...                            │ │  │
│  │  │                                                                  │ │  │
│  │  │ Analyzing recent transactions in Welland industrial market...   │ │  │
│  │  │ Found 3 sellers with $15M+ cash positions                       │ │  │
│  │  │                                                                  │ │  │
│  │  │ [View Live Logs]                [📊 Preview Results]            │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Match Results with Score Cards

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  MATCH RESULTS • 1500 Michael Dr, Welland                      │
│  │BIGDATA  │  11 qualified buyers, agents & lenders found                    │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ All (11) │ │Buyers(5) │ │Agents(3) │ │Lenders(3)│                        │
│  │ 🔴       │ │    ⚪    │ │    ⚪    │ │    ⚪    │                        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                        │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ⭐ 95 MATCH                                                           │  │
│  │                                                                       │  │
│  │  ┌─────────┐                                                          │  │
│  │  │         │  Dream Industrial REIT                        [💰 Hot]  │  │
│  │  │   95    │  ─────────────────────────────────────────────────────  │  │
│  │  │  Score  │  💵 $10-100M typical • 🏭 Industrial focus • 📍 GTA      │  │
│  │  │         │                                                          │  │
│  │  └─────────┘  Match Factors:                                         │  │
│  │             • Recency: 95 • Capital: 98 • Asset: 96 • Geography: 92  │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Contact: Michael Cooper, VP Acquisitions                       │ │  │
│  │  │ 📧 m.cooper@dream.ca  📞 416-555-0101  💼 linkedin.com/...    │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  [📞 Call] [✉️ Email] [💼 LinkedIn] [📋 Copy Info] [🎯 Add to Deal] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ⭐ 88 MATCH                                                           │  │
│  │                                                                       │  │
│  │  ┌─────────┐                                                          │  │
│  │  │         │  Pure Industrial REIT                                     │  │
│  │  │   88    │  ─────────────────────────────────────────────────────  │  │
│  │  │  Score  │  💵 $5-50M typical • 🏭 Industrial/Light Mfg • 📍 ON     │  │
│  │  │         │                                                          │  │
│  │  └─────────┘  Recent Deal: Niagara Distribution Facility - $18M        │  │
│  │                                                                       │  │
│  │  Contact: Sarah Chen, Director, Investments                          │  │
│  │  [📞 Call] [✉️ Email] [💼 LinkedIn] [🎯 Add to Deal]                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔥 92 MATCH • HOT MONEY                                               │  │
│  │                                                                       │  │
│  │  ┌─────────┐                                                          │  │
│  │  │         │  2650687 Ontario Ltd                            [🔥 New] │  │
│  │  │   92    │  ─────────────────────────────────────────────────────  │  │
│  │  │  Score  │  💰 $15,000,000 cash from May 2025 sale                  │  │
│  │  │         │  🏭 Just sold Thirty Rd property                        │  │
│  │  └─────────┘                                                          │  │
│  │                                                                       │  │
│  │  ⚡ Hot Money Alert: Recent seller with capital to reinvest!          │  │
│  │                                                                       │  │
│  │  [📞 Call Now] [✉️ Email] [🎯 Create Deal] [📊 Full Profile]          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [📥 Export to Obsidian] [📄 Generate Report] [📧 Email All Matches]         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Deal Pipeline Kanban

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  DEAL PIPELINE                                                │
│  │BIGDATA  │  Track your active deals from lead to close                  │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 🔵 NEW      │  │ 🟡 CONTACT  │  │ 🟠 OFFER    │  │ 🟢 CLOSING  │        │
│  │    (4)      │  │    (3)      │  │    (2)      │  │    (1)      │        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │             │  │             │  │             │  │             │        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │        │
│  │ │Dream Ind│ │  │ │Tregunno │ │  │ │Pure Ind │ │  │ │Carttera │ │        │
│  │ │$5M Ind  │ │  │ │$8M Farm │ │  │ │$3.5M    │ │  │ │$12M     │ │        │
│  │ │Welland  │ │  │ │NOTL     │ │  │ │Welland  │ │  │ │Niagara  │ │        │
│  │ │         │ │  │ │         │ │  │ │         │ │  │ │         │ │        │
│  │ │⭐95     │ │  │ │⭐88     │ │  │ │⭐88     │ │  │ │⭐92     │ │        │
│  │ │[→]      │ │  │ │[→]      │ │  │ │[→]      │ │  │ │[✓]      │ │        │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │        │
│  │             │  │             │  │             │  │             │        │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │             │  │             │        │
│  │ │StoneEgl │ │  │ │Walker  │ │  │             │  │             │        │
│  │ │$7M Vine │ │  │ │$4M Land │ │  │             │  │             │        │
│  │ │NOTL     │ │  │ │Niagara  │ │  │             │  │             │        │
│  │ │         │ │  │ │         │ │  │             │  │             │        │
│  │ │⭐92     │ │  │ │⭐85     │ │  │             │  │             │        │
│  │ │[→]      │ │  │ │[→]      │ │  │             │  │             │        │
│  │ └─────────┘ │  │ └─────────┘ │  │             │  │             │        │
│  │             │  │             │  │             │  │             │        │
│  │ [+ Add]     │  │             │  │             │  │             │        │
│  │             │  │             │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  [+ New Deal]                    [📊 Pipeline Report] [📅 Calendar View]     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Agent Workspace

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  AGENT WORKSPACE                                               │
│  │BIGDATA  │  Manage and monitor your AI research agents                   │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 🎯               │ │ 🔥               │ │ 💼               │            │
│  │ Transaction      │ │ Hot Money        │ │ Portfolio        │            │
│  │ Scout            │ │ Tracker          │ │ Analyzer         │            │
│  │ ───────────────  │ │ ───────────────  │ │ ───────────────  │            │
│  │                  │ │                  │ │                  │            │
│  │    🟢 ACTIVE     │ │    🟢 ACTIVE     │ │    🟡 QUEUED     │            │
│  │                  │ │                  │ │                  │            │
│  │ Running: 3       │ │ Watching: 156    │ │ Pending: 1       │            │
│  │ Completed: 42    │ │ Alerts: 8 new    │ │ Last run: 2h ago │            │
│  │                  │ │                  │ │                  │            │
│  │ Uptime: 99.9%    │ │ Latency: 45ms    │ │ Avg time: 3m     │            │
│  │                  │ │                  │ │                  │            │
│  │ [🛑 Stop]        │ │ [⏸️ Pause]       │ │ [▶️ Run Now]     │            │
│  │ [📜 Logs]        │ │ [📜 Logs]        │ │ [📜 Logs]        │            │
│  │ [⚙️ Config]      │ │ [⚙️ Config]      │ │ [⚙️ Config]      │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ 👤               │ │ 🏦               │ │ 📝               │            │
│  │ Agent Finder     │ │ Lender Match     │ │ Obsidian         │            │
│  │                  │ │                  │ │ Sync             │            │
│  │ ───────────────  │ │ ───────────────  │ │ ───────────────  │            │
│  │                  │ │                  │ │                  │            │
│  │    ⚪ IDLE       │ │    ⚪ IDLE       │ │    🟢 ACTIVE     │            │
│  │                  │ │                  │ │                  │            │
│  │ Ready to run     │ │ Ready to run     │ │ Last sync: 2m    │            │
│  │                  │ │                  │ │                  │            │
│  │ Dependencies: OK │ │ Dependencies: OK │ │ Files: 1,247     │            │
│  │                  │ │                  │ │                  │            │
│  │ [▶️ Run]         │ │ [▶️ Run]         │ │ [🔄 Force Sync]  │            │
│  │ [📜 Logs]        │ │ [📜 Logs]        │ │ [📜 Logs]        │            │
│  │ [⚙️ Config]      │ │ [⚙️ Config]      │ │ [⚙️ Config]      │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 📜 RECENT AGENT LOGS                                                │    │
│  │                                                                     │    │
│  │ 10:42:23 🎯 Transaction Scout    Found 3 recent industrial sales    │    │
│  │ 10:42:25 🔥 Hot Money Tracker    Alert: $15M cash detected          │    │
│  │ 10:42:30 💼 Portfolio Analyzer   Matching asset class portfolios... │    │
│  │ 10:42:35 🎯 Transaction Scout    Completed phase 1                  │    │
│  │ 10:42:40 🔥 Hot Money Tracker    Found 8 hot money leads            │    │
│  │                                                                     │    │
│  │ [View All Logs]                                    [Clear]          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Obsidian Vault Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  BigDataClaw Nerve                                    🔔 👤 ⚙️       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                                  │
│  │ 🦞      │  OBSIDIAN VAULT                                               │
│  │BIGDATA  │  Browse and manage your research notes                        │
│  │ CLAW    │                                                                  │
│  └─────────┘                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────┐  ┌───────────────────────────────────────┐  │
│  │ 📁 VAULT BROWSER          │  │ 📝 NOTE PREVIEW                       │  │
│  │                           │  │                                       │  │
│  │ 📂 Buyers/                │  │ # 2650687 Ontario Ltd                 │  │
│  │   📄 dream-industrial.md  │  │                                       │  │
│  │   📄 pure-industrial.md   │  │ ## Overview                           │  │
│  │   📄 tregunno-farms.md    │  │ - **Cash Position:** $15,000,000      │  │
│  │   📄 ...                  │  │ - **Recent Sale:** May 2025           │  │
│  │ 📂 Hot Money/             │  │ - **Property:** Thirty Rd, West       │  │
│  │   📄 2650687-ontario.md ◄ │  │   Lincoln                             │  │
│  │   📄 turnberry-holdings.md│  │                                       │  │
│  │ 📂 Properties/            │  │ ## Contact                            │  │
│  │   📄 1500-michael-dr.md   │  │ - Phone: [View in vault]              │  │
│  │ 📂 Deals/                 │  │ - Email: [View in vault]              │  │
│  │   📄 active/              │  │                                       │  │
│  │                           │  │ ## Match History                      │  │
│  │ [🔄 Sync Now]             │  │ - Matched to: 1500 Michael Dr (95%)   │  │
│  │ Last sync: 2m ago         │  │ - Date: 2025-03-26                    │  │
│  │                           │  │                                       │  │
│  │                           │  │ ## Quick Actions                      │  │
│  │                           │  │ [📞 Call] [✉️ Email] [🎯 Add to Deal]  │  │
│  │                           │  │                                       │  │
│  └───────────────────────────┘  └───────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔗 GRAPH VIEW                                                         │  │
│  │                                                                       │  │
│  │     [Visual graph showing connections between buyers, properties,     │  │
│  │      deals, and hot money leads - similar to Obsidian's graph view]   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [📤 Export Selection] [📥 Import Notes] [⚙️ Vault Settings]                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Specifications

### Match Score Ring
```
┌─────────┐
│   95    │  ← Circular progress ring
│  Score  │     • 0-100 scale
│         │     • Color gradient:
│         │       90-100: Green #27AE60
│         │       70-89:  Yellow #F39C12  
│         │       0-69:   Red #E74C3C
│         │     • Animated on load
└─────────┘
```

### Hot Money Badge
```
┌──────────────┐
│ 🔥 Hot Money │  ← Red pulse animation
│ $15,000,000  │     • Red background
│ May 2025     │     • Cash amount prominent
└──────────────┘
```

### Agent Status Badge
```
🟢 ACTIVE   ← Green dot + pulse
🟡 QUEUED    ← Yellow dot
⚪ IDLE      ← Gray dot
🔴 ERROR     ← Red dot
```

### Quick Action Buttons
```
[📞 Call]     ← Primary red button
[✉️ Email]    ← Secondary outline
[💼 LinkedIn] ← Icon button
[🎯 Deal]     ← Accent button
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|----------------|
| **Desktop** (1200px+) | Full sidebar, 4-column kanban, side-by-side panels |
| **Tablet** (768-1199px) | Collapsible sidebar, 2-column kanban, stacked panels |
| **Mobile** (<768px) | Bottom nav, single column, cards stack vertically |

---

## 🎬 Animations

| Element | Animation |
|---------|-----------|
| Page load | Fade in + slide up (200ms) |
| Score ring | Circular progress (800ms ease-out) |
| Hot money alert | Red pulse (infinite, 2s) |
| Agent status | Dot pulse when active |
| Card hover | Scale 1.02 + shadow increase |
| Kanban drag | Ghost card + drop indicator |
| Live logs | Auto-scroll + new entry flash |

---

*UI Design Specification for BigDataClaw Nerve Mission Board v1.0*
*Based on existing BigDataClaw design system*
