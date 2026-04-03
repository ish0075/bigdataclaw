# Bot Boardroom Enhancement Plan
## Agent Pixel Visualization, Chat, Tasks & Evaluator

---

## Overview

This document outlines the architecture and implementation plan to enhance the Bot Boardroom with:

1. **Agent Pixel Visualization** - Real-time visual representation of what each agent is doing
2. **Agent Chat Interface** - Direct messaging with individual agents and group chats
3. **Task Management** - View active tasks, completed tasks, and task history
4. **Agent Evaluator** - Performance metrics and success evaluation system

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BOT BOARDROOM ENHANCED                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  AGENT GRID     │  │  AGENT PIXEL    │  │   TASK BOARD    │             │
│  │  (Existing)     │  │  (New View)     │  │   (New Tab)     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     AGENT DETAIL MODAL                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │    CHAT      │  │    TASKS     │  │   EVALUATE   │              │   │
│  │  │    TAB       │  │    TAB       │  │    TAB       │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ /agents/{id}    │  │ /agents/{id}    │  │ /agents/{id}    │             │
│  │   /status       │  │   /chat         │  │   /tasks        │             │
│  │                 │  │                 │  │                 │             │
│  │ Real-time status│  │ Send/Receive    │  │ CRUD operations │             │
│  │ updates (WS)    │  │ messages        │  │ on agent tasks  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ /agents/{id}    │  │ /agents/{id}    │  │ /meetings/{id}  │             │
│  │   /evaluate     │  │   /metrics      │  │   /visualize    │             │
│  │                 │  │                 │  │                 │             │
│  │ Submit eval     │  │ Performance     │  │ Meeting state   │             │
│  │ ratings         │  │ stats & KPIs    │  │ for pixel view  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  agent_tasks          agent_messages        agent_evaluations               │
│  ─────────────        ──────────────        ─────────────────               │
│  id                   id                    id                              │
│  agent_id             agent_id              agent_id                        │
│  task_id              sender_type           evaluator_id                    │
│  title                content               meeting_id                      │
│  description          message_type          rating                          │
│  status               requires_response     category                        │
│  priority             created_at            feedback                        │
│  deadline             read_at               metrics (JSON)                  │
│  completed_at         ──────────────        created_at                      │
│  created_at                                                                 │
│  ─────────────                                                              │
│                                                                              │
│  agent_activities (for Pixel visualization)                                 │
│  ─────────────────────────────────────────                                  │
│  id, agent_id, activity_type, description, metadata, started_at, ended_at   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Specifications

### 1. Agent Pixel Visualization

**Purpose:** Show real-time animated visualizations of what each agent is currently doing

**Components:**
- **Pixel Grid View** - Full-screen grid showing all agents with their live animations
- **Activity Stream** - Scrollable feed of agent activities
- **Meeting Visualization** - Visual representation of ongoing meetings

**Visual Themes (existing + new):**
```javascript
const PIXEL_THEMES = {
  // Existing themes
  typing: 'Writing code/content',
  bars: 'Processing data',
  radar: 'Scanning/searching',
  nodes: 'Analyzing connections',
  pulse: 'Monitoring',
  
  // New themes for Bot Boardroom
  discuss: 'In discussion',
  decide: 'Making decision',
  research: 'Deep research',
  calculate: 'Crunching numbers',
  alert: 'Alert/Warning',
  sync: 'Synchronizing',
  idle: 'Standing by'
}
```

**Data Flow:**
1. Backend tracks agent activities in `agent_activities` table
2. WebSocket pushes real-time updates
3. Frontend maps activity types to visual themes
4. Animation state changes based on activity status

---

### 2. Agent Chat Interface

**Purpose:** Direct communication with agents and participation in group meetings

**Features:**
- **Direct Messages** - 1-on-1 chat with any agent
- **Meeting Chat** - Participate in ongoing meetings
- **Command Interface** - Send commands to agents (e.g., "pause", "priority boost")
- **Message History** - Searchable chat history

**Message Types:**
```javascript
const MESSAGE_TYPES = {
  TEXT: 'text',           // Regular message
  COMMAND: 'command',     // User command to agent
  RESPONSE: 'response',   // Agent response
  SYSTEM: 'system',       // System notification
  THOUGHT: 'thought',     // Agent's internal reasoning (optional)
  ACTION: 'action'        // Agent performed action
}
```

**UI Components:**
- Chat sidebar in Agent Detail Modal
- Message bubbles with agent avatars
- Typing indicators
- File attachment support
- Quick command buttons

---

### 3. Task Management

**Purpose:** Track what agents are working on, what they've completed, and what's pending

**Task States:**
```javascript
const TASK_STATES = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled'
}
```

**Task Views:**
- **Kanban Board** - Drag-and-drop task management
- **List View** - Sortable/filterable task list
- **Timeline** - Gantt-style view of task schedules
- **My Tasks** - Agent's assigned tasks

**Task Features:**
- Create tasks and assign to agents
- Set priorities (low, medium, high, urgent)
- Add dependencies between tasks
- Track time spent
- Add completion notes
- Attach files/links

---

### 4. Agent Evaluator

**Purpose:** Evaluate agent performance, track success metrics, and provide feedback

**Evaluation Categories:**
```javascript
const EVAL_CATEGORIES = {
  ACCURACY: 'accuracy',       // Quality of work
  SPEED: 'speed',             // Timeliness
  COLLABORATION: 'collab',    // Teamwork in meetings
  INITIATIVE: 'initiative',   // Proactivity
  COMMUNICATION: 'comm'       // Clarity of communication
}
```

**Metrics Tracked:**
- Tasks completed vs assigned
- Average task completion time
- Meeting participation rate
- Messages sent/received
- Success rate by task type
- User satisfaction ratings

**Evaluation UI:**
- Star ratings (1-5) per category
- Free-form feedback text
- Performance dashboard with charts
- Historical trend analysis
- Comparative agent rankings

---

## Implementation Phases

### Phase 1: Backend API (Day 1)
- [ ] Extend agent workspace API with chat endpoints
- [ ] Create task management endpoints
- [ ] Add evaluation/rating endpoints
- [ ] Implement activity tracking for Pixel viz
- [ ] WebSocket setup for real-time updates

### Phase 2: Database Schema (Day 1)
- [ ] Create `agent_messages` table
- [ ] Create `agent_tasks` table (enhance existing)
- [ ] Create `agent_evaluations` table
- [ ] Create `agent_activities` table
- [ ] Add indexes for performance

### Phase 3: Frontend - Agent Pixel (Day 2)
- [ ] Create AgentPixelView component
- [ ] Add new visual themes (discuss, decide, etc.)
- [ ] Implement activity stream component
- [ ] Add Pixel view toggle in Bot Boardroom

### Phase 4: Frontend - Agent Detail Modal (Day 2-3)
- [ ] Create tabbed modal (Chat, Tasks, Evaluate)
- [ ] Implement ChatTab component
- [ ] Implement TasksTab component
- [ ] Implement EvaluateTab component

### Phase 5: Frontend - Task Board (Day 3)
- [ ] Create TaskBoard view
- [ ] Implement Kanban board
- [ ] Add task creation/editing UI
- [ ] Connect to backend API

### Phase 6: Integration & Polish (Day 4)
- [ ] Wire up all API endpoints
- [ ] Add loading states and error handling
- [ ] Implement real-time updates
- [ ] Testing and bug fixes

---

## API Endpoints

### Agent Chat
```
GET    /api/agents/{agent_id}/messages        # Get message history
POST   /api/agents/{agent_id}/messages        # Send message to agent
PUT    /api/agents/messages/{msg_id}/read     # Mark as read
DELETE /api/agents/messages/{msg_id}          # Delete message
```

### Agent Tasks
```
GET    /api/agents/{agent_id}/tasks           # Get agent's tasks
POST   /api/agents/{agent_id}/tasks           # Create new task
PUT    /api/agents/tasks/{task_id}            # Update task
DELETE /api/agents/tasks/{task_id}            # Delete task
PUT    /api/agents/tasks/{task_id}/status     # Update task status
```

### Agent Evaluation
```
GET    /api/agents/{agent_id}/metrics         # Get performance metrics
POST   /api/agents/{agent_id}/evaluate        # Submit evaluation
GET    /api/agents/{agent_id}/evaluations     # Get evaluation history
GET    /api/agents/evaluations/leaderboard    # Agent rankings
```

### Agent Activity (for Pixel)
```
GET    /api/agents/{agent_id}/activity        # Get current activity
GET    /api/agents/activities                 # Get all agents' activities (for grid)
WS     /ws/agents/activity                    # WebSocket for real-time updates
```

---

## New Components

### 1. AgentPixelView
```jsx
// Full-screen pixel visualization of all agents
<AgentPixelView 
  agents={agents}
  activities={activities}
  onAgentClick={openAgentDetail}
/>
```

### 2. AgentDetailModal
```jsx
// Tabbed modal for agent interaction
<AgentDetailModal
  agent={agent}
  activeTab="chat" | "tasks" | "evaluate"
  onClose={handleClose}
>
  <ChatTab />
  <TasksTab />
  <EvaluateTab />
</AgentDetailModal>
```

### 3. TaskBoard
```jsx
// Kanban board for task management
<TaskBoard
  tasks={tasks}
  agents={agents}
  onTaskMove={handleTaskMove}
  onTaskCreate={handleTaskCreate}
/>
```

### 4. AgentChat
```jsx
// Chat interface for agent communication
<AgentChat
  agentId={agentId}
  messages={messages}
  onSendMessage={handleSend}
  onSendCommand={handleCommand}
/>
```

### 5. AgentEvaluator
```jsx
// Performance evaluation component
<AgentEvaluator
  agent={agent}
  metrics={metrics}
  onSubmitEvaluation={handleSubmit}
/>
```

---

## UI Mockup Description

### Bot Boardroom Main View
```
┌─────────────────────────────────────────────────────────────┐
│  Bot Boardroom                    [Grid View] [Pixel View]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   🤖 Alex   │ │   💼 Sam    │ │   📊 Jordan │           │
│  │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │           │
│  │  │ PIXEL │  │ │  │ PIXEL │  │ │  │ PIXEL │  │           │
│  │  │ ANIM  │  │ │  │ ANIM  │  │ │  │ ANIM  │  │           │
│  │  └───────┘  │ │  └───────┘  │ │  └───────┘  │           │
│  │  Chat Tasks │ │  Chat Tasks │ │  Chat Tasks │           │
│  │  Eval       │ │  Eval       │ │  Eval       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Detail Modal - Chat Tab
```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Alex - Recruiting Specialist              [X]           │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  [Chat]  │  ┌─────────────────────────┐                    │
│  [Tasks] │  │ 🤖 Alex                 │                    │
│  [Eval]  │  │ Hello! How can I help?  │                    │
│          │  └─────────────────────────┘                    │
│          │           ┌─────────────────────────┐           │
│          │           │ 👤 You                  │           │
│          │           │ Review the Seaway deal  │           │
│          │           └─────────────────────────┘           │
│          │                                                  │
│          │  ┌─────────────────────────┐                    │
│          │  │ 🤖 Alex                 │                    │
│          │  │ On it! Analyzing...     │                    │
│          │  │ [SHOW: bars animation]  │                    │
│          │  └─────────────────────────┘                    │
│          │                                                  │
│          ├──────────────────────────────────────────────────┤
│          │ [Quick: Review | Pause | Status]                 │
│          │ [Type message...                 ] [Send]        │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files:
1. `nerve/src/views/AgentPixelView.jsx` - Full-screen pixel visualization
2. `nerve/src/components/Agent/AgentDetailModal.jsx` - Agent interaction modal
3. `nerve/src/components/Agent/AgentChat.jsx` - Chat interface
4. `nerve/src/components/Agent/AgentTasks.jsx` - Task management tab
5. `nerve/src/components/Agent/AgentEvaluate.jsx` - Evaluation tab
6. `nerve/src/components/Agent/TaskBoard.jsx` - Kanban task board
7. `agent_chat_api.py` - Backend API for chat
8. `agent_tasks_api.py` - Backend API for tasks
9. `agent_eval_api.py` - Backend API for evaluations

### Modified Files:
1. `nerve/src/views/BotBoardroom.jsx` - Add view toggle, integrate modals
2. `agent_workspace_api.py` - Add new endpoints
3. `setup_agent_workspace_db.py` - Add new tables
4. `nerve/src/components/Agent/AgentVisualTask.jsx` - Add new themes

---

## Success Criteria

- [ ] User can view all agents in Pixel view with live animations
- [ ] User can click any agent to open detail modal
- [ ] User can chat with agents and see message history
- [ ] User can view agent's active and completed tasks
- [ ] User can create and assign new tasks to agents
- [ ] User can evaluate agent performance with ratings
- [ ] Real-time updates show when agents change activities
- [ ] All features work smoothly with existing Bot Boardroom

---

*Document Version: 1.0*
*Created: 2026-04-02*
*Status: Ready for Implementation*
