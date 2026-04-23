import React, { useState, useEffect } from 'react'
import {
  Clock, CheckCircle, AlertCircle, Loader2, Zap,
  FileText, Users, Send, BarChart3, RefreshCw,
  ChevronRight, Calendar, Filter
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://13f0-142-189-188-192.ngrok-free.app'

const EVENT_ICONS = {
  orchestrator_started: Zap,
  orchestrator_complete: CheckCircle,
  buyer_intelligence_complete: Users,
  feature_sheet_generated: FileText,
  teaser_generated: Send,
}

const EVENT_COLORS = {
  orchestrator_started: 'text-yellow-400 bg-yellow-500/10',
  orchestrator_complete: 'text-green-400 bg-green-500/10',
  buyer_intelligence_complete: 'text-accent-purple bg-accent-purple/10',
  feature_sheet_generated: 'text-accent-primary bg-accent-primary/10',
  teaser_generated: 'text-accent-blue bg-accent-blue/10',
}

export default function ExecutionHistory() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selectedPack, setSelectedPack] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [timelineLoading, setTimelineLoading] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/execution-history?limit=100`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to load execution history:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeline = async (packId) => {
    if (!packId) return
    setTimelineLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/deal-timeline/${packId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTimeline(data)
    } catch (err) {
      console.error('Failed to load timeline:', err)
    } finally {
      setTimelineLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredEvents = filter
    ? events.filter((e) => e.event_type?.toLowerCase().includes(filter.toLowerCase()))
    : events

  // Group by run_id
  const runs = {}
  filteredEvents.forEach((e) => {
    const rid = e.run_id || 'unknown'
    if (!runs[rid]) runs[rid] = []
    runs[rid].push(e)
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-accent-purple" />
            Execution History
          </h1>
          <p className="text-text-muted mt-1">
            Track every run, artifact, and action across the system.
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="p-2 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-primary/30 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Runs</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{Object.keys(runs).length}</p>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Events Logged</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{events.length}</p>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {events.filter((e) => e.event_type?.includes('complete')).length}
          </p>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Latest</p>
          <p className="text-sm font-medium text-text-primary mt-1">
            {events[0]?.created_at ? new Date(events[0].created_at).toLocaleTimeString() : '—'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by event type..."
          className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-accent-primary"
        />
        {['orchestrator', 'buyer', 'feature', 'teaser'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-accent-purple text-white'
                : 'bg-bg-card hover:bg-border-subtle text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
        {filter && (
          <button onClick={() => setFilter('')} className="text-xs text-text-muted hover:text-text-secondary">
            Clear
          </button>
        )}
      </div>

      {/* Run List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-text-muted" />
          <span className="text-text-muted">Loading history...</span>
        </div>
      ) : Object.keys(runs).length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No execution history yet.</p>
          <p className="text-xs mt-1">Run an orchestrator to see events here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(runs)
            .sort((a, b) => {
              const ta = a[1][0]?.created_at || ''
              const tb = b[1][0]?.created_at || ''
              return tb.localeCompare(ta)
            })
            .map(([runId, runEvents]) => {
              const start = runEvents.find((e) => e.event_type === 'orchestrator_started')
              const complete = runEvents.find((e) => e.event_type === 'orchestrator_complete')
              const meta = start?.metadata ? JSON.parse(start.metadata || '{}') : {}
              const isExpanded = selectedPack === runId
              return (
                <div key={runId} className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
                  {/* Run Header */}
                  <button
                    onClick={() => {
                      setSelectedPack(isExpanded ? null : runId)
                      if (!isExpanded) loadTimeline(runId)
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-input/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-accent-purple" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">
                          Run <span className="font-mono text-accent-primary">{runId.slice(0, 12)}</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          {meta.command || 'Unknown command'} · {runEvents.length} events
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {complete ? (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-medium">
                          Complete
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-[10px] font-medium">
                          Running
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Timeline */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border-subtle">
                      {timelineLoading ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-text-muted">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading timeline...
                        </div>
                      ) : timeline?.events?.length ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                            Deal Timeline
                          </p>
                          {timeline.events.map((evt, idx) => {
                            const Icon = evt.type === 'execution'
                              ? (EVENT_ICONS[evt.event_type] || Zap)
                              : evt.type === 'feedback'
                              ? CheckCircle
                              : Send
                            const color = evt.type === 'execution'
                              ? (EVENT_COLORS[evt.event_type] || 'text-text-muted bg-bg-input')
                              : evt.type === 'feedback'
                              ? 'text-green-400 bg-green-500/10'
                              : 'text-accent-blue bg-accent-blue/10'
                            return (
                              <div key={idx} className="flex items-start gap-3">
                                <div className={`mt-0.5 p-1 rounded ${color}`}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-text-primary">
                                    {evt.type === 'execution' && evt.event_type.replace(/_/g, ' ')}
                                    {evt.type === 'action' && `${evt.action} — ${evt.buyer_name || 'System'}`}
                                    {evt.type === 'feedback' && `${evt.status} — ${evt.buyer_name}`}
                                  </p>
                                  {evt.notes && (
                                    <p className="text-[10px] text-text-muted">{evt.notes}</p>
                                  )}
                                  <p className="text-[10px] text-text-muted">
                                    {new Date(evt.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-3 text-xs text-text-muted">No timeline events.</div>
                      )}

                      {/* Raw Events */}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                          Execution Events
                        </p>
                        {runEvents.map((evt, idx) => {
                          const Icon = EVENT_ICONS[evt.event_type] || Zap
                          const color = EVENT_COLORS[evt.event_type] || 'text-text-muted bg-bg-input'
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <div className={`p-1 rounded ${color}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="text-text-primary">{evt.event_type.replace(/_/g, ' ')}</span>
                              <span className="text-text-muted">
                                {new Date(evt.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
