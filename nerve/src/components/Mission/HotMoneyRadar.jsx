import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, ExternalLink, Flame, DollarSign } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const HotMoneyRadar = ({ leads }) => {
  const [apiLeads, setApiLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/hotmoney?limit=5&days=90`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        const leadsArray = Array.isArray(data) ? data : (data.leads || [])
        if (leadsArray.length > 0) {
          setApiLeads(leadsArray.map(lead => ({
            id: String(lead.id),
            entity: lead.entity,
            cashAmount: lead.cash_amount,
            saleDate: lead.sale_date,
            location: lead.location,
            property: lead.property,
            daysAgo: lead.days_ago
          })))
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('API hot money fetch failed, falling back to sample data:', err)
      }
      
      // Fallback to static sample data when API is unavailable or empty
      try {
        const fallback = await fetch('/data/hot_money_sample.json')
        if (fallback.ok) {
          const data = await fallback.json()
          setApiLeads(data.slice(0, 5).map(lead => ({
            id: String(lead.id),
            entity: lead.entity,
            cashAmount: lead.cash_amount,
            saleDate: lead.sale_date,
            location: lead.location,
            property: lead.property,
            daysAgo: lead.days_ago
          })))
        } else {
          setApiLeads([])
        }
      } catch (fallbackErr) {
        console.error('Fallback hot money fetch also failed:', fallbackErr)
        setApiLeads([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  const displayLeads = leads.length > 0 ? leads.slice(0, 3) : apiLeads.slice(0, 3)

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
        {loading ? (
          <div className="p-4 text-center text-text-muted text-sm">
            Loading hot money leads...
          </div>
        ) : displayLeads.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-sm">
            No hot money leads in the last 90 days.
          </div>
        ) : (
          displayLeads.map((lead) => (
            <HotMoneyCard key={lead.id} lead={lead} formatCash={formatCash} />
          ))
        )}
      </div>

      <Link to="/hotmoney" className="block w-full mt-4 py-2.5 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors font-medium text-center">
        View All Hot Money Leads →
      </Link>
    </div>
  )
}

const HotMoneyCard = ({ lead, formatCash }) => {
  const navigate = useNavigate()
  return (
    <div 
      onClick={() => navigate('/hotmoney')}
      className="p-4 rounded-xl bg-bg-input border border-border-subtle hover:border-accent-red/30 transition-colors group cursor-pointer"
    >
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
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/hotmoney') }}
            className="p-2 rounded-lg bg-accent-red text-white hover:bg-accent-red/90 transition-colors" 
            title="Contact"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); navigate('/hotmoney') }}
            className="p-2 rounded-lg bg-bg-card text-text-secondary hover:text-text-primary transition-colors" 
            title="View Profile"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HotMoneyRadar
