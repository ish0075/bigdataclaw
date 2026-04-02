import React from 'react'

/**
 * AgentVisualTask - Renders an animated visual representation of what an agent is doing.
 * Maps agent roles/IDs to themed visual animations.
 */

const AGENT_VISUALS = {
  // AgentMissionControl agents
  'agent-1': { theme: 'typing',   label: 'Writing code' },
  'agent-2': { theme: 'bars',     label: 'Mining data' },
  'agent-3': { theme: 'radar',    label: 'Scouting web' },
  'agent-4': { theme: 'typing',   label: 'Creating content' },
  'agent-5': { theme: 'checklist', label: 'Running tests' },

  // Fallback by task type (used when taskType prop is passed)
  'task-code':      { theme: 'typing',   label: 'Coding' },
  'task-research':  { theme: 'search',   label: 'Researching' },
  'task-data':      { theme: 'bars',     label: 'Processing data' },
  'task-web':       { theme: 'radar',    label: 'Scraping web' },
  'task-analysis':  { theme: 'nodes',    label: 'Analyzing' },
  'task-write':     { theme: 'typing',   label: 'Writing' },
  'task-verify':    { theme: 'verify',   label: 'Fact checking' },
  'task-ideate':    { theme: 'sparkles', label: 'Ideating' },

  // Mission Control agents
  'transaction-scout':   { theme: 'radar',    label: 'Scanning transactions' },
  'hot-money-tracker':   { theme: 'pulse',    label: 'Tracking capital flows' },
  'portfolio-analyzer':  { theme: 'bars',     label: 'Analyzing portfolios' },
  'agent-finder':        { theme: 'search',   label: 'Finding agents' },
  'lender-matcher':      { theme: 'nodes',    label: 'Matching lenders' },
  'obsidian-sync':       { theme: 'sync',     label: 'Syncing vault' },

  // Bot Boardroom - Core Analysis
  'recruiting_specialist': { theme: 'search',   label: 'Sourcing candidates' },
  'deal_analyst':          { theme: 'bars',     label: 'Crunching numbers' },
  'market_researcher':     { theme: 'radar',    label: 'Scanning markets' },
  'coordinator':           { theme: 'checklist', label: 'Organizing ops' },

  // Bot Boardroom - Property Analysis
  'seller_profile_bot':    { theme: 'search',   label: 'Profiling sellers' },
  'legal_bot':             { theme: 'shield',   label: 'Reviewing compliance' },
  'watchdog_bot':          { theme: 'pulse',    label: 'Monitoring deals' },
  'property_research_bot': { theme: 'radar',    label: 'Researching properties' },
  'photo_inspector_bot':   { theme: 'scan',     label: 'Inspecting photos' },

  // Bot Boardroom - Sales & Marketing
  'sales_director_bot':    { theme: 'target',   label: 'Closing deals' },
  'social_media_bot':      { theme: 'waves',    label: 'Engaging audience' },
  'inquiries_bot':         { theme: 'chat',     label: 'Responding to leads' },

  // Bot Boardroom - Operations
  'deal_secretary_bot':    { theme: 'typing',   label: 'Filing paperwork' },

  // Bot Boardroom - Transaction Team
  'buyer_bot':             { theme: 'target',   label: 'Matching buyers' },
  'listing_bot':           { theme: 'grid',     label: 'Staging listings' },
  'content_bot':           { theme: 'typing',   label: 'Writing content' },

  // Bot Boardroom - Specialized Bots
  'buyer_matcher_bot':     { theme: 'nodes',    label: 'Matching buyers' },
  'seller_outreach_bot':   { theme: 'waves',    label: 'Outreach campaign' },
  'property_valuation_bot':{ theme: 'dial',     label: 'Calculating value' },
  'marketing_campaign_bot':{ theme: 'bars',     label: 'Optimizing ads' },
  
  // New bots
  'fact_checker_bot':      { theme: 'verify',   label: 'Verifying facts' },
  'fact-checker':          { theme: 'verify',   label: 'Verifying facts' },
  'ideas_bot':             { theme: 'sparkles', label: 'Generating ideas' },
  'ideas-bot':             { theme: 'sparkles', label: 'Generating ideas' },
}

const THEMES = {
  radar: RadarVisual,
  pulse: PulseVisual,
  bars: BarsVisual,
  search: SearchVisual,
  nodes: NodesVisual,
  sync: SyncVisual,
  checklist: ChecklistVisual,
  shield: ShieldVisual,
  scan: ScanVisual,
  target: TargetVisual,
  waves: WavesVisual,
  chat: ChatVisual,
  typing: TypingVisual,
  grid: GridVisual,
  dial: DialVisual,
  verify: VerifyVisual,
  sparkles: SparklesVisual,
}

export default function AgentVisualTask({ agentId, status = 'idle', compact = false, taskType = null }) {
  const taskKey = taskType ? `task-${taskType}` : null
  const config = (taskKey && AGENT_VISUALS[taskKey]) || AGENT_VISUALS[agentId] || { theme: 'pulse', label: 'Standing by' }
  const Visual = THEMES[config.theme] || PulseVisual
  const isActive = status === 'active' || status === 'in_progress' || status === 'working'
  const label = isActive ? config.label : 'Standby'

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className={`w-5 h-5 rounded-md bg-bg-input overflow-hidden flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-40'}`}>
          <Visual size={16} active={isActive} />
        </div>
        <span className={`text-[10px] uppercase tracking-wide ${isActive ? 'text-accent-blue animate-pulse' : 'text-text-muted'}`}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-lg bg-bg-input/60 border border-border-subtle/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-border-subtle/50 flex items-center justify-between">
        <span className={`text-[10px] uppercase tracking-wide font-medium ${isActive ? 'text-accent-blue' : 'text-text-muted'}`}>
          {label}
        </span>
        {isActive && (
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-green"></span>
          </span>
        )}
      </div>
      <div className={`h-16 flex items-center justify-center ${isActive ? '' : 'grayscale opacity-50'}`}>
        <Visual size={48} active={isActive} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual Animations
// ─────────────────────────────────────────────────────────────────────────────

function RadarVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-2 border-accent-blue/20" />
      <div className="absolute inset-[15%] rounded-full border border-accent-blue/30" />
      <div className={`absolute inset-[30%] rounded-full bg-accent-blue/20 ${active ? 'animate-pulse' : ''}`} />
      {active && (
        <div 
          className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-gradient-to-r from-transparent to-accent-blue/40 origin-top-left rounded-tr-full"
          style={{ animation: 'radar-sweep 2s linear infinite' }}
        />
      )}
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function PulseVisual({ size = 48, active = true }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className={`absolute rounded-full bg-accent-red/20 ${active ? 'animate-ping' : ''}`} style={{ width: size * 0.8, height: size * 0.8 }} />
      <div className={`absolute rounded-full bg-accent-red/40 ${active ? 'animate-pulse' : ''}`} style={{ width: size * 0.5, height: size * 0.5 }} />
      <div className="absolute rounded-full bg-accent-red" style={{ width: size * 0.2, height: size * 0.2 }} />
      {active && (
        <svg className="absolute inset-0" viewBox="0 0 100 100">
          <polyline 
            fill="none" 
            stroke="#f87171" 
            strokeWidth="3" 
            points="0,50 20,50 25,30 35,70 45,40 55,60 65,35 75,65 80,50 100,50"
            className="opacity-60"
            style={{ animation: 'pulse-line 1.5s ease-in-out infinite' }}
          />
        </svg>
      )}
      <style>{`
        @keyframes pulse-line {
          0%, 100% { transform: translateY(0); opacity: .6; }
          50% { transform: translateY(-5%); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function BarsVisual({ size = 48, active = true }) {
  const bars = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5]
  const barWidth = size / (bars.length * 1.8)
  return (
    <div className="flex items-end gap-0.5 h-full" style={{ height: size * 0.6 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={`rounded-sm bg-accent-green ${active ? '' : 'opacity-40'}`}
          style={{
            width: barWidth,
            height: `${h * 100}%`,
            animation: active ? `bar-bounce 0.8s ease-in-out infinite alternate ${i * 0.1}s` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes bar-bounce {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}

function SearchVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-blue">
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {active && (
        <>
          <div 
            className="absolute rounded-full border border-accent-blue/40"
            style={{
              width: size * 0.3, height: size * 0.3,
              top: '25%', left: '20%',
              animation: 'search-ring 1.5s ease-out infinite',
            }}
          />
          <div 
            className="absolute rounded-full border border-accent-blue/20"
            style={{
              width: size * 0.5, height: size * 0.5,
              top: '15%', left: '10%',
              animation: 'search-ring 1.5s ease-out infinite 0.5s',
            }}
          />
        </>
      )}
      <style>{`
        @keyframes search-ring {
          from { transform: scale(0.5); opacity: 1; }
          to { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function NodesVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Nodes */}
      <div className="absolute w-2 h-2 rounded-full bg-accent-purple" style={{ top: '20%', left: '20%' }} />
      <div className="absolute w-2 h-2 rounded-full bg-accent-purple" style={{ top: '20%', right: '20%' }} />
      <div className="absolute w-2.5 h-2.5 rounded-full bg-accent-purple" style={{ bottom: '25%', left: '50%', transform: 'translateX(-50%)' }} />
      {/* Connecting lines with animated dashes */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: active ? 1 : 0.3 }}>
        <line x1="25%" y1="25%" x2="75%" y2="25%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" className={active ? '' : ''} style={{ animation: active ? 'dash-flow 1s linear infinite' : 'none' }} />
        <line x1="25%" y1="25%" x2="50%" y2="75%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: active ? 'dash-flow 1s linear infinite 0.3s' : 'none' }} />
        <line x1="75%" y1="25%" x2="50%" y2="75%" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: active ? 'dash-flow 1s linear infinite 0.6s' : 'none' }} />
      </svg>
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -16; }
        }
      `}</style>
    </div>
  )
}

function SyncVisual({ size = 48, active = true }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-teal">
        <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {active && (
        <div 
          className="absolute rounded-full border-2 border-accent-teal/30"
          style={{ width: size, height: size, animation: 'spin 3s linear infinite' }}
        />
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function ChecklistVisual({ size = 48, active = true }) {
  return (
    <div className="flex flex-col justify-center gap-1" style={{ width: size, height: size * 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-sm border ${i < 2 ? 'bg-accent-orange border-accent-orange' : 'border-text-muted'}`}
            style={{ animation: active && i === 2 ? 'check-pop 0.8s ease-in-out infinite alternate' : 'none' }}
          >
            {i < 2 && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div className={`h-1.5 rounded-full ${active && i === 2 ? 'bg-accent-orange/60' : 'bg-text-muted/30'}`} style={{ width: size * (0.5 - i * 0.1) }} />
        </div>
      ))}
      <style>{`
        @keyframes check-pop {
          from { transform: scale(0.8); opacity: 0.5; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ShieldVisual({ size = 48, active = true }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-red">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {active && (
        <div 
          className="absolute rounded-full bg-accent-red/20"
          style={{ width: size, height: size, animation: 'shield-pulse 1.5s ease-in-out infinite' }}
        />
      )}
      <style>{`
        @keyframes shield-pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

function ScanVisual({ size = 48, active = true }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-accent-cyan/30 bg-accent-cyan/5" style={{ width: size * 0.9, height: size * 0.7 }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-cyan">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {active && (
        <div 
          className="absolute left-0 right-0 h-0.5 bg-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          style={{ animation: 'scan-line 1.5s ease-in-out infinite alternate' }}
        />
      )}
      <style>{`
        @keyframes scan-line {
          from { top: 5%; }
          to { top: 95%; }
        }
      `}</style>
    </div>
  )
}

function TargetVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-2 border-accent-pink/20" />
      <div className="absolute inset-[25%] rounded-full border border-accent-pink/40" />
      <div className="absolute inset-[45%] rounded-full bg-accent-pink" />
      {active && (
        <>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-accent-pink/30" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent-pink/30" />
          <div 
            className="absolute inset-[15%] rounded-full border border-accent-pink/60"
            style={{ animation: 'target-lock 1s ease-in-out infinite alternate' }}
          />
        </>
      )}
      <style>{`
        @keyframes target-lock {
          from { transform: scale(0.9); opacity: 0.5; }
          to { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function WavesVisual({ size = 48, active = true }) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: size * 0.6 }}>
      {[0.3, 0.6, 0.9, 0.6, 0.3].map((s, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-accent-rose"
          style={{
            height: size * s * 0.5,
            animation: active ? `wave 0.6s ease-in-out infinite alternate ${i * 0.1}s` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); opacity: 0.4; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ChatVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-violet">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {active && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-violet"
          style={{ animation: 'chat-bounce 0.8s ease-in-out infinite alternate' }}
        />
      )}
      <style>{`
        @keyframes chat-bounce {
          from { transform: scale(0.5); opacity: 0.3; }
          to { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function TypingVisual({ size = 48, active = true }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-bg-card border border-border-subtle" style={{ height: size * 0.4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-secondary"
          style={{ animation: active ? `typing-bounce 0.6s ease-in-out infinite ${i * 0.15}s` : 'none' }}
        />
      ))}
      <style>{`
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function GridVisual({ size = 48, active = true }) {
  return (
    <div className="grid grid-cols-2 gap-1" style={{ width: size * 0.6, height: size * 0.6 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-sm bg-accent-fuchsia"
          style={{
            opacity: active ? undefined : 0.4,
            animation: active ? `grid-pop 0.8s ease-in-out infinite alternate ${i * 0.15}s` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes grid-pop {
          from { transform: scale(0.7); opacity: 0.4; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function DialVisual({ size = 48, active = true }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border-4 border-accent-amber/20" />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="8"
          strokeDasharray="264"
          strokeDashoffset={active ? '66' : '198'}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', animation: active ? 'dial-spin 2s linear infinite' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-accent-amber">{active ? '++' : '--'}</span>
      </div>
      <style>{`
        @keyframes dial-spin {
          from { stroke-dashoffset: 264; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

function VerifyVisual({ size = 48, active = true }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-lime">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {active && (
        <>
          <div 
            className="absolute rounded-full border-2 border-accent-lime/40"
            style={{ width: size, height: size, animation: 'verify-pulse 1.5s ease-in-out infinite' }}
          />
          <div 
            className="absolute"
            style={{ 
              width: size * 0.4, 
              height: size * 0.4,
              animation: 'verify-scan 1.2s ease-in-out infinite alternate'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-lime w-full h-full">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </>
      )}
      <style>{`
        @keyframes verify-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        @keyframes verify-scan {
          from { transform: translateY(-10%) scale(0.8); opacity: 0.5; }
          to { transform: translateY(10%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function SparklesVisual({ size = 48, active = true }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor" className="text-accent-sky">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
      {active && (
        <>
          <div 
            className="absolute bg-accent-sky rounded-full"
            style={{ 
              width: 3, height: 3, 
              top: '15%', left: '25%',
              animation: 'sparkle-blink 0.8s ease-in-out infinite alternate'
            }}
          />
          <div 
            className="absolute bg-accent-sky rounded-full"
            style={{ 
              width: 4, height: 4, 
              top: '20%', right: '20%',
              animation: 'sparkle-blink 1s ease-in-out infinite alternate 0.2s'
            }}
          />
          <div 
            className="absolute bg-accent-sky rounded-full"
            style={{ 
              width: 3, height: 3, 
              bottom: '20%', left: '20%',
              animation: 'sparkle-blink 0.9s ease-in-out infinite alternate 0.4s'
            }}
          />
          <div 
            className="absolute bg-accent-sky rounded-full"
            style={{ 
              width: 2, height: 2, 
              bottom: '15%', right: '25%',
              animation: 'sparkle-blink 0.7s ease-in-out infinite alternate 0.1s'
            }}
          />
          <div 
            className="absolute bg-accent-sky/60"
            style={{ 
              width: 12, height: 2, 
              top: '30%', left: '10%',
              animation: 'sparkle-streak 1.2s linear infinite'
            }}
          />
        </>
      )}
      <style>{`
        @keyframes sparkle-blink {
          from { transform: scale(0.3); opacity: 0.2; }
          to { transform: scale(1.2); opacity: 1; }
        }
        @keyframes sparkle-streak {
          0% { transform: translateX(-10px) rotate(45deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(20px) rotate(45deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
