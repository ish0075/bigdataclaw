import React from 'react'
import { 
  Phone, 
  Mail, 
  Linkedin, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Building2,
  DollarSign,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

const DealCard = ({ deal, onDragStart, compact = false }) => {
  const formatCurrency = (value) => {
    if (!value) return '$0'
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-accent-green'
    if (score >= 70) return 'text-accent-yellow'
    return 'text-accent-red'
  }
  
  const getStageColor = (stage) => {
    switch (stage) {
      case 'new': return 'bg-accent-blue/20 text-accent-blue'
      case 'contacted': return 'bg-accent-yellow/20 text-accent-yellow'
      case 'offer': return 'bg-accent-orange/20 text-accent-orange'
      case 'closing': return 'bg-accent-green/20 text-accent-green'
      default: return 'bg-text-muted/20 text-text-muted'
    }
  }
  
  if (compact) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        className="p-3 rounded-xl bg-bg-input border border-border-subtle cursor-move hover:border-accent-red/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-text-primary text-sm truncate">{deal.entity}</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              {formatCurrency(deal.value)} • {deal.type}
            </p>
          </div>
          <div className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}>
            {deal.matchScore}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-4 rounded-xl bg-bg-input border border-border-subtle cursor-move hover:border-accent-red/30 transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-text-primary truncate">{deal.entity}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
              {deal.stage}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {formatCurrency(deal.value)} • {deal.type}
          </p>
        </div>
        
        <div className={`text-2xl font-bold ${getScoreColor(deal.matchScore)}`}>
          {deal.matchScore}
        </div>
      </div>
      
      {/* Property Info */}
      <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>{deal.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          <span>{deal.type}</span>
        </div>
      </div>
      
      {/* Progress Bar (if in progress) */}
      {deal.stage !== 'new' && (
        <div className="mt-3">
          <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                deal.stage === 'contacted' ? 'bg-accent-yellow w-1/3' :
                deal.stage === 'offer' ? 'bg-accent-orange w-2/3' :
                'bg-accent-green w-full'
              }`}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">
            {deal.stage === 'contacted' && 'Initial contact made'}
            {deal.stage === 'offer' && 'Offer submitted'}
            {deal.stage === 'closing' && 'Closing in progress'}
          </p>
        </div>
      )}
      
      {/* Next Action */}
      {deal.nextAction && (
        <div className="mt-3 p-2 rounded-lg bg-accent-yellow/5 border border-accent-yellow/20">
          <p className="text-xs text-accent-yellow flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Next: {deal.nextAction}
          </p>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-green transition-colors"
          title="Call"
        >
          <Phone className="w-3.5 h-3.5" />
        </button>
        <button 
          className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-blue transition-colors"
          title="Email"
        >
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button 
          className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-blue transition-colors"
          title="LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
        </button>
        <button 
          className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-text-primary transition-colors ml-auto"
          title="More"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Last Activity */}
      <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
        <Calendar className="w-3 h-3" />
        <span>Updated {new Date(deal.lastActivity).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export const DealStageBadge = ({ stage }) => {
  const stages = {
    new: { label: 'New', color: 'bg-accent-blue/20 text-accent-blue', icon: '🔵' },
    contacted: { label: 'Contacted', color: 'bg-accent-yellow/20 text-accent-yellow', icon: '🟡' },
    offer: { label: 'Offer Out', color: 'bg-accent-orange/20 text-accent-orange', icon: '🟠' },
    closing: { label: 'Closing', color: 'bg-accent-green/20 text-accent-green', icon: '🟢' },
    closed: { label: 'Closed', color: 'bg-text-muted/20 text-text-muted', icon: '⚪' },
  }
  
  const config = stages[stage] || stages.new
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

export const ContactQuickActions = ({ deal, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-green transition-colors">
          <Phone className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-blue transition-colors">
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded bg-bg-card text-text-secondary hover:text-accent-blue transition-colors">
          <Linkedin className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2">
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-green text-white text-sm hover:bg-accent-green/90 transition-colors">
        <Phone className="w-4 h-4" />
        Call
      </button>
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue text-white text-sm hover:bg-accent-blue/90 transition-colors">
        <Mail className="w-4 h-4" />
        Email
      </button>
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input text-text-primary text-sm hover:bg-bg-card transition-colors border border-border-subtle">
        <Linkedin className="w-4 h-4" />
        LinkedIn
      </button>
    </div>
  )
}

export default DealCard
