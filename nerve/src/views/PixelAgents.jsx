import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Scan,
  RefreshCw,
  Grid3X3,
  List,
  Activity,
  Bot,
  Zap,
  X,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
  MessageSquare,
  PanelRight,
  Play,
  User,
} from 'lucide-react'
import { DEFAULT_PIXEL_AGENTS } from '../types/pixelAgents'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Live agent status polling hook
function useLiveAgents() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/agents/live`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data.agents) {
          setAgents(data.agents)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  return { agents, loading }
}

// Orchestrator hook
function useOrchestrator() {
  const [running, setRunning] = useState(false)
  const [runId, setRunId] = useState(null)

  const run = useCallback(async (payload) => {
    setRunning(true)
    try {
      const res = await fetch(`${API_BASE}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRunId(data.run_id)
      return data
    } catch (err) {
      throw err
    } finally {
      setRunning(false)
    }
  }, [])

  return { run, running, runId }
}

export default function PixelAgents() {
  const { agents: liveAgents, loading: liveLoading } = useLiveAgents()
  const { run: runOrchestrator, running: orchestratorRunning, runId } = useOrchestrator()

  const [selectedAgent, setSelectedAgent] = useState(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [orchestratorForm, setOrchestratorForm] = useState({
    command: 'Build outreach pack',
    property_type: 'Office',
    city: 'Mississauga',
    province: 'ON',
    size_sqft: 100000,
    price: 25000000,
    net_income: 1400000,
    cap_rate: 5.6,
    occupancy: 'stabilized',
    notes: 'Value-add potential near airport corridor',
  })

  // Merge live agents with default pixel agents for visual representation
  const displayAgents = React.useMemo(() => {
    const base = [...DEFAULT_PIXEL_AGENTS]
    const liveMap = new Map(liveAgents.map((a) => [a.agent_id, a]))

    // Add live orchestrator agents
    liveAgents.forEach((live) => {
      if (!base.find((b) => b.id === live.agent_id)) {
        base.push({
          id: live.agent_id,
          name: live.agent_name || live.agent_id,
          role: live.role || 'Agent',
          description: live.task || 'Working on deal workflow',
          status: live.status === 'busy' ? 'busy' : live.status === 'error' ? 'error' : 'online',
          mode: 'analyst',
          capabilities: ['chat', 'orchestration'],
          sprite: `/pablo-assets/characters/frames/char_${(live.agent_id.length % 6)}_avatar.png`,
          color: live.role === 'coordinator' ? '#f97316' : live.role === 'buyer_intel' ? '#8b5cf6' : live.role === 'lender' ? '#10b981' : live.role === 'feature_sheet' ? '#0ea5e9' : live.role === 'teaser' ? '#ec4899' : '#64748b',
          task: live.task,
          tool: live.tool,
          artifact_url: live.artifact_url,
          parent_id: live.parent_id,
          timestamp: live.timestamp,
        })
      } else {
        // Update existing
        const existing = base.find((b) => b.id === live.agent_id)
        if (existing) {
          existing.status = live.status === 'busy' ? 'busy' : live.status === 'error' ? 'error' : 'online'
          existing.task = live.task
          existing.tool = live.tool
          existing.artifact_url = live.artifact_url
        }
      }
    })
    return base
  }, [liveAgents])

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent)
    setInspectorOpen(true)
  }

  const handleSendChat = () => {
    if (!chatMessage.trim() || !selectedAgent) return
    setChatHistory((prev) => [
      ...prev,
      { role: 'user', agent_id: selectedAgent.id, content: chatMessage, time: new Date().toLocaleTimeString() },
    ])
    setChatMessage('')
    // Simulate agent response
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'agent', agent_id: selectedAgent.id, content: `I'm on it: ${selectedAgent.task || 'working'}`, time: new Date().toLocaleTimeString() },
      ])
    }, 800)
  }

  const handleRunOrchestrator = async () => {
    try {
      await runOrchestrator(orchestratorForm)
    } catch (err) {
      alert(`Orchestrator error: ${err.message}`)
    }
  }

  const onlineCount = displayAgents.filter((a) => a.status === 'online').length
  const busyCount = displayAgents.filter((a) => a.status === 'busy').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scan className="w-8 h-8 text-accent-purple" />
            Pixel Agents
          </h1>
          <p className="text-text-muted mt-1">
            Live operations floor — watch agents work, inspect tasks, chat directly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-text-secondary">{onlineCount} online</span>
            </div>
            {busyCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm text-text-secondary">{busyCount} busy</span>
              </div>
            )}
          </div>
          <div className="flex items-center bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-secondary'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-secondary'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Orchestrator Panel */}
      <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent-purple" />
              Agent Orchestrator
            </h3>
            <p className="text-sm text-text-muted mt-1">
              Spawn the full agent fleet with one command.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <input value={orchestratorForm.property_type} onChange={(e) => setOrchestratorForm({ ...orchestratorForm, property_type: e.target.value })} className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm" placeholder="Asset Type" />
              <input value={orchestratorForm.city} onChange={(e) => setOrchestratorForm({ ...orchestratorForm, city: e.target.value })} className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm" placeholder="City" />
              <input value={orchestratorForm.price} onChange={(e) => setOrchestratorForm({ ...orchestratorForm, price: Number(e.target.value) })} type="number" className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm" placeholder="Price" />
              <input value={orchestratorForm.cap_rate} onChange={(e) => setOrchestratorForm({ ...orchestratorForm, cap_rate: Number(e.target.value) })} type="number" step="0.1" className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm" placeholder="Cap Rate" />
            </div>
          </div>
          <button
            onClick={handleRunOrchestrator}
            disabled={orchestratorRunning}
            className="px-6 py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {orchestratorRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {orchestratorRunning ? 'Spawning Agents...' : 'Run Orchestrator'}
          </button>
        </div>
        {runId && (
          <div className="mt-3 text-xs text-text-muted">
            Last run: <span className="font-mono text-accent-primary">{runId}</span>
          </div>
        )}
      </div>

      {/* Agent Grid */}
      {liveLoading && displayAgents.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-text-muted" />
          <span className="text-text-muted">Loading agent fleet...</span>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {displayAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleSelectAgent(agent)}
            className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.01] ${
              selectedAgent?.id === agent.id
                ? 'bg-accent-primary/5 border-accent-primary/30'
                : 'bg-bg-card border-border-subtle hover:border-accent-primary/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={agent.sprite}
                  alt={agent.name}
                  className="w-12 h-12 object-contain flex-shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-bg-card ${
                    agent.status === 'online' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-yellow-500 animate-pulse' : agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-text-primary">{agent.name}</h4>
                  {agent.task && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary rounded">
                      {agent.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">{agent.role}</p>
                {agent.task && (
                  <p className="text-xs text-accent-primary mt-1 truncate">{agent.task}</p>
                )}
                {agent.tool && (
                  <p className="text-[10px] text-text-muted mt-0.5">tool: {agent.tool}</p>
                )}
              </div>
            </div>
            {agent.artifact_url && (
              <div className="mt-3 pt-3 border-t border-border-subtle/50">
                <a
                  href={agent.artifact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-accent-primary hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  View artifact
                </a>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Inspector Drawer */}
      {inspectorOpen && selectedAgent && (
        <div className="fixed inset-y-0 right-0 w-96 bg-bg-card border-l border-border-subtle shadow-2xl z-50 flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <img src={selectedAgent.sprite} alt="" className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
              <div>
                <h3 className="font-semibold text-text-primary text-sm">{selectedAgent.name}</h3>
                <p className="text-xs text-text-muted">{selectedAgent.role}</p>
              </div>
            </div>
            <button onClick={() => setInspectorOpen(false)} className="p-1 hover:bg-bg-input rounded">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {/* Task & Status */}
          <div className="px-4 py-3 border-b border-border-subtle space-y-2">
            <div className="flex items-center gap-2">
              {selectedAgent.status === 'online' ? <CheckCircle className="w-4 h-4 text-green-500" /> : selectedAgent.status === 'busy' ? <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" /> : selectedAgent.status === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-text-muted" />}
              <span className="text-sm text-text-primary capitalize">{selectedAgent.status}</span>
            </div>
            {selectedAgent.task && (
              <div className="text-sm text-text-primary">
                <span className="text-text-muted">Task:</span> {selectedAgent.task}
              </div>
            )}
            {selectedAgent.tool && (
              <div className="text-sm text-text-primary">
                <span className="text-text-muted">Tool:</span> {selectedAgent.tool}
              </div>
            )}
            {selectedAgent.artifact_url && (
              <a href={selectedAgent.artifact_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Open artifact
              </a>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-border-subtle flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-medium text-text-muted">Chat with {selectedAgent.name}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.filter((m) => m.agent_id === selectedAgent.id).length === 0 && (
                <p className="text-xs text-text-muted text-center py-8">
                  Click an agent and send a message to redirect or ask questions.
                </p>
              )}
              {chatHistory
                .filter((m) => m.agent_id === selectedAgent.id)
                .map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                      msg.role === 'user'
                        ? 'bg-accent-primary text-white'
                        : 'bg-bg-input text-text-primary border border-border-subtle'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-white/70' : 'text-text-muted'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-3 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={`Message ${selectedAgent.name}...`}
                  className="flex-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatMessage.trim()}
                  className="p-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay when drawer is open */}
      {inspectorOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setInspectorOpen(false)}
        />
      )}
    </div>
  )
}
