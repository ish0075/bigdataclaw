import React from 'react'
import { Scan, ExternalLink, Github, Monitor, Sparkles } from 'lucide-react'

const PixelAgentsOriginal = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scan className="w-8 h-8 text-accent-purple" />
            Pixel Agents
          </h1>
          <p className="text-text-muted mt-1">
            Original pixel agent visualization by Pablo De Lucca
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/pablodelucca/pixel-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-purple transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repo</span>
          </a>
          <a
            href="https://pablodelucca.github.io/pixel-agents/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Live Demo</span>
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center mb-4">
            <Monitor className="w-6 h-6 text-accent-purple" />
          </div>
          <h3 className="font-semibold mb-2">Original Implementation</h3>
          <p className="text-sm text-text-muted">
            The exact pixel agent visualization system created by Pablo De Lucca. 
            Features canvas-based animated pixel characters with real-time status updates.
          </p>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-accent-green" />
          </div>
          <h3 className="font-semibold mb-2">Agent States</h3>
          <p className="text-sm text-text-muted">
            Visual representations for idle, running, thinking, typing, delegating, 
            and error states. Each agent has unique pixel art and animations.
          </p>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-4">
            <Scan className="w-6 h-6 text-accent-blue" />
          </div>
          <h3 className="font-semibold mb-2">Integration Ready</h3>
          <p className="text-sm text-text-muted">
            Designed to connect with Paperclip's agent system. Can display BigDataClaw's 
            20+ agents with real-time status from NERVE API.
          </p>
        </div>
      </div>

      {/* Live Demo Link */}
      <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <Scan className="w-5 h-5 text-accent-purple" />
            Live Demo
          </h3>
          <a
            href="https://pablodelucca.github.io/pixel-agents/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent-purple hover:underline flex items-center gap-1"
          >
            Open in full screen
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="relative aspect-video bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center">
          <div className="text-center">
            <Scan className="w-16 h-16 text-accent-purple mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Pixel Agents by Pablo De Lucca</p>
            <p className="text-sm text-text-muted mb-4">Canvas-based animated agent visualization</p>
            <a
              href="https://pablodelucca.github.io/pixel-agents/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Launch Live Demo
            </a>
          </div>
        </div>
      </div>

      {/* BigDataClaw Integration */}
      <div className="bg-gradient-to-r from-accent-purple/5 to-accent-blue/5 border border-accent-purple/20 rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Scan className="w-5 h-5 text-accent-purple" />
          BigDataClaw Integration Plan
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Phase 1:</strong> Connect Pixel Agents to NERVE API WebSocket for real-time agent status
          </p>
          <p>
            <strong>Phase 2:</strong> Map Paperclip agent states (idle, running, error, paused) to pixel animations
          </p>
          <p>
            <strong>Phase 3:</strong> Display all 20+ BigDataClaw agents with their org chart hierarchy
          </p>
          <p>
            <strong>Phase 4:</strong> Add click-to-inspect for agent details, logs, and budget status
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <a
            href="http://localhost:8081/mission-control"
            className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
          >
            View Local Integration
          </a>
          <span className="text-xs text-text-muted">
            Local Mission Control pixel agent visualization
          </span>
        </div>
      </div>

      {/* Agent State Reference */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <h3 className="font-semibold mb-4">Agent State Mapping</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { state: 'Idle', icon: '💤', color: 'bg-green-500', desc: 'Waiting for task' },
            { state: 'Running', icon: '⚡', color: 'bg-green-400', desc: 'Active processing' },
            { state: 'Thinking', icon: '🤔', color: 'bg-blue-500', desc: 'Analyzing data' },
            { state: 'Typing', icon: '⌨️', color: 'bg-cyan-500', desc: 'Writing output' },
            { state: 'Delegating', icon: '🔗', color: 'bg-purple-500', desc: 'Assigning tasks' },
            { state: 'Error', icon: '❌', color: 'bg-red-500', desc: 'Failed/Blocked' },
            { state: 'Paused', icon: '⏸️', color: 'bg-gray-500', desc: 'Manually paused' },
            { state: 'Completed', icon: '✅', color: 'bg-green-600', desc: 'Task finished' },
          ].map((item) => (
            <div key={item.state} className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <div>
                <div className="font-medium text-sm">{item.icon} {item.state}</div>
                <div className="text-xs text-text-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-text-muted py-4">
        <p>
          Pixel Agents by{' '}
          <a 
            href="https://github.com/pablodelucca" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent-purple hover:underline"
          >
            Pablo De Lucca
          </a>
          {' '}• Integrated with BigDataClaw Mission Control
        </p>
      </div>
    </div>
  )
}

export default PixelAgentsOriginal