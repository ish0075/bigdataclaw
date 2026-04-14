import React, { useEffect, useState } from 'react'
import { Play, Square, Pause, ScrollText, Settings, ExternalLink } from 'lucide-react'
import { useAgentStore } from '../../stores/agentStore'
import AgentVisualTask from './AgentVisualTask'

const AgentFleet = ({ agents: propAgents }) => {
  const { agents: storeAgents, loadStarOfficeAgents } = useAgentStore()
  const [starOfficeUrl, setStarOfficeUrl] = useState('http://localhost:19000')
  
  // Use live agents if available, otherwise fall back to props
  const agents = storeAgents.length > 0 ? storeAgents : (propAgents || [])
  
  useEffect(() => {
    loadStarOfficeAgents()
    const interval = setInterval(() => loadStarOfficeAgents(), 5000)
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    if (storeAgents[0]?.starOfficeUrl) {
      setStarOfficeUrl(storeAgents[0].starOfficeUrl)
    }
  }, [storeAgents])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🤖</span>
            Agent Fleet Status
          </h3>
          {storeAgents.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            {agents.filter(a => a.status === 'active').length} Active
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-yellow" />
            {agents.filter(a => a.status === 'queued').length} Queued
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-text-muted" />
            {agents.filter(a => a.status === 'idle').length} Idle
          </span>
          <a
            href={starOfficeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-bg-card hover:bg-bg-input text-text-secondary hover:text-text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Star Office
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}

const AgentCard = ({ agent }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="status-active">ACTIVE</span>
      case 'queued':
        return <span className="status-queued">QUEUED</span>
      case 'error':
        return <span className="status-error">ERROR</span>
      default:
        return <span className="status-idle">IDLE</span>
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'border-accent-green/30 bg-accent-green/5'
      case 'queued':
        return 'border-accent-yellow/30 bg-accent-yellow/5'
      case 'error':
        return 'border-accent-red/30 bg-accent-red/5'
      default:
        return 'border-border-subtle bg-bg-input'
    }
  }
  
  return (
    <div className={`p-4 rounded-xl border ${getStatusColor(agent.status)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-card flex items-center justify-center text-xl">
            {agent.icon}
          </div>
          <div>
            <h4 className="font-medium text-text-primary">{agent.name}</h4>
            {getStatusBadge(agent.status)}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {agent.status === 'idle' ? (
            <button className="p-1.5 rounded-lg hover:bg-accent-green/20 text-text-secondary hover:text-accent-green transition-colors" title="Start">
              <Play className="w-4 h-4" />
            </button>
          ) : agent.status === 'active' ? (
            <>
              <button className="p-1.5 rounded-lg hover:bg-accent-yellow/20 text-text-secondary hover:text-accent-yellow transition-colors" title="Pause">
                <Pause className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-accent-red/20 text-text-secondary hover:text-accent-red transition-colors" title="Stop">
                <Square className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button className="p-1.5 rounded-lg hover:bg-accent-red/20 text-text-secondary hover:text-accent-red transition-colors" title="Stop">
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-sm text-text-secondary mt-3">
        {agent.description}
      </p>
      
      {/* Visual Task */}
      <AgentVisualTask agentId={agent.id} status={agent.status} />
      
      {/* Stats */}
      <div className="mt-4 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between text-xs text-text-muted">
          {agent.area ? (
            <>
              <span className="capitalize">Area: {agent.area.replace('_', ' ')}</span>
              <span>{agent.status === 'active' ? 'Working' : 'Standby'}</span>
            </>
          ) : agent.status === 'active' ? (
            <>
              <span>Running: {agent.activeMissions} missions</span>
              <span>Completed: {agent.completedMissions}</span>
            </>
          ) : agent.status === 'idle' ? (
            <>
              <span>Ready to run</span>
              <span>Last: 2h ago</span>
            </>
          ) : (
            <>
              <span>Standby</span>
              <span>—</span>
            </>
          )}
        </div>
      </div>
      
      {/* Last Log */}
      {agent.lastLog && (
        <div className="mt-3 p-2 rounded-lg bg-bg-card text-xs text-text-secondary">
          <span className="text-text-muted">{agent.lastLog.timestamp?.toLocaleTimeString?.() || 'Now'}:</span>{' '}
          {agent.lastLog.message}
        </div>
      )}
      
      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button className="flex-1 py-1.5 px-3 rounded-lg bg-bg-card text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1.5">
          <ScrollText className="w-3 h-3" />
          Logs
        </button>
        <button className="flex-1 py-1.5 px-3 rounded-lg bg-bg-card text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1.5">
          <Settings className="w-3 h-3" />
          Config
        </button>
      </div>
    </div>
  )
}

export default AgentFleet
