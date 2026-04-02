import React from 'react'
import { Phone, ExternalLink, Flame, DollarSign } from 'lucide-react'

const HotMoneyRadar = ({ leads }) => {
  const sampleLeads = [
    {
      id: '1',
      entity: '2650687 Ontario Ltd',
      cashAmount: 15000000,
      saleDate: 'May 2025',
      location: 'West Lincoln',
      property: 'Thirty Rd',
    },
    {
      id: '2',
      entity: 'Turnberry Holdings Inc',
      cashAmount: 9840000,
      saleDate: 'Jan 2025',
      location: 'Lincoln',
      property: 'Multiple Properties',
    },
    {
      id: '3',
      entity: '1863570 Ontario Inc',
      cashAmount: 7000000,
      saleDate: 'Jan 2025',
      location: 'Pelham',
      property: '981 Pelham St',
    },
  ]
  
  const displayLeads = leads.length > 0 ? leads.slice(0, 3) : sampleLeads
  
  const formatCash = (amount) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
    return `$${amount}`
  }
  
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>💰</span>
          Hot Money Radar
        </h3>
        <span className="text-sm text-accent-red font-medium">
          {displayLeads.length} new alerts
        </span>
      </div>
      
      <div className="space-y-3">
        {displayLeads.map((lead) => (
          <HotMoneyCard key={lead.id} lead={lead} formatCash={formatCash} />
        ))}
      </div>
      
      <button className="w-full mt-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors font-medium">
        View All Hot Money Leads →
      </button>
    </div>
  )
}

const HotMoneyCard = ({ lead, formatCash }) => (
  <div className="p-4 rounded-xl bg-bg-input border border-border-subtle hover:border-accent-red/30 transition-colors group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="hot-money-badge text-xs">
            <Flame className="w-3 h-3" />
            <span>HOT</span>
          </div>
          <h4 className="font-medium text-text-primary">{lead.entity}</h4>
        </div>
        
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-accent-red font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{formatCash(lead.cashAmount)} cash</span>
          </div>
          <span className="text-text-muted text-sm">•</span>
          <span className="text-text-secondary text-sm">{lead.saleDate}</span>
        </div>
        
        <p className="text-xs text-text-muted mt-1">
          {lead.property} • {lead.location}
        </p>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 rounded-lg bg-accent-red text-white hover:bg-accent-red/90 transition-colors" title="Contact">
          <Phone className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg bg-bg-card text-text-secondary hover:text-text-primary transition-colors" title="View Profile">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)

export default HotMoneyRadar
