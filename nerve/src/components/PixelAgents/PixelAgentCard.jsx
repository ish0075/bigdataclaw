import React from 'react'
import { MessageSquare, Zap, Cpu } from 'lucide-react'
import { getStatusColor, getStatusDotColor } from '../../types/pixelAgents'

const PixelAgentCard = ({ agent, onSelect, isSelected }) => {
  return (
    <div
      onClick={() => onSelect(agent)}
      className={`
        relative group cursor-pointer rounded-2xl border transition-all duration-200
        ${isSelected
          ? 'border-accent-primary bg-accent-primary/5 shadow-lg shadow-accent-primary/10'
          : 'border-border-subtle bg-bg-card hover:border-accent-primary/30 hover:shadow-md'
        }
      `}
    >
      {/* Status dot */}
      <div
        className="absolute top-3 right-3 w-3 h-3 rounded-full ring-2 ring-bg-card"
        style={{ backgroundColor: getStatusDotColor(agent.status) }}
        title={`Status: ${agent.status}`}
      />

      <div className="p-5">
        {/* Sprite + Name row */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${agent.color}15` }}
          >
            <img
              src={agent.sprite}
              alt={agent.name}
              className="w-12 h-12 object-contain image-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary text-lg truncate">{agent.name}</h3>
            <p className="text-xs text-text-muted uppercase tracking-wide">{agent.role}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">{agent.description}</p>

        {/* Capabilities chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.capabilities?.slice(0, 4).map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 text-[10px] bg-bg-input border border-border-subtle rounded-md text-text-muted capitalize"
            >
              {cap.replace(/_/g, ' ')}
            </span>
          ))}
          {(agent.capabilities?.length || 0) > 4 && (
            <span className="px-2 py-0.5 text-[10px] text-text-muted">+{agent.capabilities.length - 4}</span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <span className="text-xs text-text-muted capitalize">{agent.status}</span>
          </div>
          <div className="flex items-center gap-2">
            {agent.mode === 'analyst' && (
              <span className="flex items-center gap-1 text-[10px] text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                <Cpu className="w-3 h-3" />
                Tools
              </span>
            )}
            <button className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PixelAgentCard
