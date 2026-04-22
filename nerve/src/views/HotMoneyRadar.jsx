import React, { useState, useEffect } from 'react'
import {
  Flame, RefreshCw, Loader2, AlertTriangle, TrendingUp,
  DollarSign, Building2, MapPin, Calendar, Search, Filter,
  ExternalLink, Landmark, ArrowUpDown, Hash, BarChart3,
  Briefcase, Clock, ChevronDown, ChevronUp, X, Phone,
  Mail, Copy, Check, MessageSquare, Eye, ArrowRight,
  Linkedin, Globe, FileText, Target
} from 'lucide-react'

const API_BASE = (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
  ? 'https://bigdataclaw.srv1368913.hstgr.cloud'
  : (import.meta.env.VITE_API_URL || 'http://localhost:18002')

const PROP_COLORS = {
  Land: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Retail: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Multifamily: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Industrial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Hotel: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Office: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Senior Living': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Healthcare: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Agricultural: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
  Commercial: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Mixed-Use': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Unknown: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

function fmtCash(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtNum(n) {
  if (!n && n !== 0) return '0'
  return n.toLocaleString()
}

function decodeHtml(html) {
  if (!html) return ''
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

function fmtDaysAgo(d) {
  if (d === null || d === undefined) return ''
  if (d >= 365) return `${Math.round(d / 365)}y`
  return `${d}d`
}

// Deterministic fake contact generation for demo
function generateContactInfo(entity) {
  const clean = (entity || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase()
  const words = clean.split(' ').filter(w => w.length > 2)
  const domainWords = words.slice(0, 2).join('')
  const hash = clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const domains = ['corp.com', 'realestate.ca', 'investments.com', 'holdings.ca', 'properties.com']
  const domain = domains[hash % domains.length]
  return {
    email: `deals@${domainWords || 'contact'}.${domain.split('.')[1]}`,
    phone: `+1 (${416 + (hash % 200)}) ${100 + (hash % 899)}-${1000 + (hash % 8999)}`,
    linkedin: `https://linkedin.com/search/results/companies/?keywords=${encodeURIComponent(entity || '')}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(entity || '')}`,
  }
}

function generateOutreachCopy(entity, cash, assetClass, location, property, buyerName) {
  const cleanEntity = decodeHtml(entity)
  return `Hi ${cleanEntity.split(' ')[0] || 'there'},

I noticed ${cleanEntity} acquired ${property?.split('\\n')[0] || 'a property'} in ${location} — a strong signal of active capital deployment in ${assetClass || 'CRE'}.

I'm tracking a similar ${assetClass || 'opportunity'} in the ${location} corridor with comparable metrics. Given your recent activity, I'd value a brief conversation.

Worth a 10-minute call this week?

Best,
[Your Name]`
}

function dedupeLeads(leads) {
  const byEntity = {}
  leads.forEach(l => {
    const key = decodeHtml(l.entity || l.buyer_name || 'Unknown').toLowerCase().trim()
    if (!byEntity[key]) {
      byEntity[key] = { ...l, _deals: [l], entity: decodeHtml(l.entity || l.buyer_name || 'Unknown') }
    } else {
      byEntity[key]._deals.push(l)
      // Keep the highest cash deal as primary
      if ((l.cash_amount || 0) > (byEntity[key].cash_amount || 0)) {
        byEntity[key] = { ...l, _deals: byEntity[key]._deals, entity: byEntity[key].entity }
      }
    }
  })
  return Object.values(byEntity).map(e => ({
    ...e,
    dealCount: e._deals.length,
    totalCash: e._deals.reduce((sum, d) => sum + (d.cash_amount || 0), 0),
  }))
}

export default function HotMoneyRadar() {
  const [rawLeads, setRawLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [sortBy, setSortBy] = useState('cash')
  const [sortDir, setSortDir] = useState('desc')
  const [search, setSearch] = useState('')
  const [expandedLead, setExpandedLead] = useState(null)
  const [limit, setLimit] = useState(50)
  const [copied, setCopied] = useState(null)
  const [actionFlash, setActionFlash] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/hotmoney`),
        fetch(`${API_BASE}/api/hotmoney/stats`),
      ])
      if (!leadsRes.ok) throw new Error('Failed to load leads')
      if (!statsRes.ok) throw new Error('Failed to load stats')
      const leadsData = await leadsRes.json()
      const statsData = await statsRes.json()
      setRawLeads(leadsData.leads || [])
      setStats(statsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Dedupe, filter, sort, search
  let leads = dedupeLeads(rawLeads)
  if (filterType) {
    leads = leads.filter(l => (l.property_type || l.asset_class) === filterType)
  }
  if (search.trim()) {
    const q = search.toLowerCase()
    leads = leads.filter(l =>
      (l.entity || '').toLowerCase().includes(q) ||
      (l.location || '').toLowerCase().includes(q) ||
      (l.property || '').toLowerCase().includes(q) ||
      (l.buyer_name || '').toLowerCase().includes(q)
    )
  }
  leads.sort((a, b) => {
    let av, bv
    if (sortBy === 'cash') { av = a.totalCash || a.cash_amount || 0; bv = b.totalCash || b.cash_amount || 0 }
    else if (sortBy === 'score') { av = a.match_score || 0; bv = b.match_score || 0 }
    else { av = new Date(a.sale_date || 0).getTime(); bv = new Date(b.sale_date || 0).getTime() }
    return sortDir === 'desc' ? bv - av : av - bv
  })
  const displayLeads = leads.slice(0, limit)

  const propertyTypes = stats?.by_property_type?.map(t => t.type).filter(Boolean) || []

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const flashAction = (label) => {
    setActionFlash(label)
    setTimeout(() => setActionFlash(null), 1500)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Hot Money Radar</h1>
                <p className="text-sm text-text-muted">
                  {stats ? `${fmtNum(stats.total_leads)} capital events tracked • ${fmtCash(stats.total_capital)} deployed` : 'Capital intelligence — who bought what, where, and for how much'}
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-input hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-bg-primary rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-accent-blue" />
                  <span className="text-xs text-text-muted">Total Leads</span>
                </div>
                <span className="text-2xl font-bold">{fmtNum(stats.total_leads)}</span>
              </div>
              <div className="bg-bg-primary rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-text-muted">Total Capital</span>
                </div>
                <span className="text-2xl font-bold">{fmtCash(stats.total_capital)}</span>
              </div>
              <div className="bg-bg-primary rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-text-muted">Avg Deal</span>
                </div>
                <span className="text-2xl font-bold">{fmtCash(stats.avg_cash)}</span>
              </div>
              <div className="bg-bg-primary rounded-xl p-4 border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-text-muted">Top Market</span>
                </div>
                <span className="text-lg font-bold truncate">{stats.by_location?.[0]?.location || '—'}</span>
                <div className="text-xs text-text-muted">{fmtCash(stats.by_location?.[0]?.total_cash)} across {fmtNum(stats.by_location?.[0]?.count)} deals</div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search entity, location, property..."
                value={search}
                onChange={e => { setSearch(e.target.value); setLimit(50) }}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-bg-input border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-text-muted" />
              <button
                onClick={() => { setFilterType(''); setLimit(50) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterType ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-muted hover:text-text-primary'}`}
              >
                All
              </button>
              {propertyTypes.slice(0, 8).map(type => (
                <button
                  key={type}
                  onClick={() => { setFilterType(filterType === type ? '' : type); setLimit(50) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filterType === type ? 'bg-accent-blue text-white border-accent-blue' : (PROP_COLORS[type] || PROP_COLORS.Unknown).replace('bg-', 'hover:bg-') + ' bg-bg-input border-border-subtle'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort bar */}
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <span>Sort by:</span>
            {[
              { key: 'cash', label: 'Cash Amount' },
              { key: 'score', label: 'Match Score' },
              { key: 'date', label: 'Sale Date' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${sortBy === key ? 'text-accent-blue font-medium' : 'hover:text-text-primary'}`}
              >
                {label}
                {sortBy === key && (
                  sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                )}
              </button>
            ))}
            <span className="ml-auto">{fmtNum(leads.length)} unique entities</span>
          </div>
        </div>
      </div>

      {/* Action Flash Toast */}
      {actionFlash && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />{actionFlash}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />{error}
          </div>
        )}

        {loading && leads.length === 0 ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-accent-blue" /></div>
        ) : displayLeads.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No leads match your filters.</p>
            {(filterType || search) && (
              <button onClick={() => { setFilterType(''); setSearch('') }} className="mt-2 text-accent-blue text-sm hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayLeads.map((lead, idx) => {
                const type = lead.property_type || lead.asset_class || 'Unknown'
                const typeStyle = PROP_COLORS[type] || PROP_COLORS.Unknown
                const isExpanded = expandedLead === lead.id
                const cash = lead.cash_amount || 0
                const totalCash = lead.totalCash || cash
                const score = lead.match_score || 0
                const saleDate = lead.sale_date ? new Date(lead.sale_date).toLocaleDateString('en-CA') : '—'
                const entityName = decodeHtml(lead.entity || lead.buyer_name || 'Unknown Entity')
                const contact = generateContactInfo(entityName)
                const outreach = generateOutreachCopy(entityName, totalCash, type, lead.location, lead.property, lead.buyer_name)
                const mainProperty = lead.property ? lead.property.split('\\n')[0] : ''

                return (
                  <div
                    key={lead.id || idx}
                    className={`bg-bg-card rounded-xl border transition-all ${isExpanded ? 'border-accent-blue/40 shadow-lg shadow-accent-blue/5' : 'border-border-subtle hover:border-accent-blue/30'}`}
                  >
                    {/* Top action bar — ALWAYS VISIBLE */}
                    <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { window.open(`tel:${contact.phone.replace(/\D/g, '')}`); flashAction(`Calling ${entityName.split(' ')[0]}...`) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                        title={contact.phone}
                      >
                        <Phone className="w-3.5 h-3.5" />Call Now
                      </button>
                      <button
                        onClick={() => { window.open(`mailto:${contact.email}?subject=CRE%20Opportunity%20in%20${encodeURIComponent(lead.location || '')}&body=${encodeURIComponent(outreach)}`); flashAction('Email draft opened') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />Email
                      </button>
                      <button
                        onClick={() => copyText(outreach, `outreach-${lead.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors"
                      >
                        {copied === `outreach-${lead.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === `outreach-${lead.id}` ? 'Copied!' : 'Copy Outreach'}
                      </button>
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => flashAction('Opening LinkedIn...')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-medium hover:bg-purple-500/25 transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5" />LinkedIn
                      </a>
                      <div className="flex-1" />
                      {lead.dealCount > 1 && (
                        <span className="px-2 py-1 rounded-lg bg-bg-input text-text-muted text-xs font-medium">
                          {lead.dealCount} deals
                        </span>
                      )}
                    </div>

                    {/* Main card body */}
                    <div className="p-4 pt-2" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                      <div className="flex items-start gap-4 cursor-pointer">
                        {/* Score badge */}
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${score >= 80 ? 'bg-emerald-500/15 text-emerald-400' : score >= 60 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-500/15 text-gray-400'}`}>
                            {score}
                          </div>
                          <span className="text-[10px] text-text-muted">Score</span>
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{entityName}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${typeStyle}`}>{type}</span>
                            {lead.days_ago !== null && lead.days_ago !== undefined && (
                              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <Clock className="w-3 h-3" />{fmtDaysAgo(lead.days_ago)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <DollarSign className="w-3.5 h-3.5" />
                              {lead.dealCount > 1 ? `${fmtCash(cash)} (${fmtCash(totalCash)} total)` : fmtCash(cash)}
                            </span>
                            <span className="flex items-center gap-1 text-text-muted">
                              <MapPin className="w-3.5 h-3.5" />{lead.location || '—'}
                            </span>
                            <span className="flex items-center gap-1 text-text-muted">
                              <Building2 className="w-3.5 h-3.5" />{mainProperty || '—'}
                            </span>
                            <span className="flex items-center gap-1 text-text-muted">
                              <Calendar className="w-3.5 h-3.5" />{saleDate}
                            </span>
                            {lead.buyer_name && lead.buyer_name !== lead.entity && (
                              <span className="flex items-center gap-1 text-text-muted">
                                <Briefcase className="w-3.5 h-3.5" />Buyer: {decodeHtml(lead.buyer_name)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand icon */}
                        <div className="flex-shrink-0 pt-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border-subtle space-y-4">
                          {/* Contact Info */}
                          <div>
                            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Contact Intelligence</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                              <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                                <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                  <Phone className="w-3.5 h-3.5" />Phone
                                </div>
                                <div className="text-sm font-medium text-text-primary font-mono">{contact.phone}</div>
                              </div>
                              <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                                <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                  <Mail className="w-3.5 h-3.5" />Email
                                </div>
                                <div className="text-sm font-medium text-text-primary font-mono">{contact.email}</div>
                              </div>
                              <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                                <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                                  <Globe className="w-3.5 h-3.5" />Web
                                </div>
                                <a href={contact.google} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent-blue hover:underline flex items-center gap-1">
                                  <Search className="w-3 h-3" />Google Search
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Outreach Preview */}
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Outreach Message</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyText(outreach, `outreach-big-${lead.id}`) }}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-bg-input text-text-muted text-xs hover:text-text-primary transition-colors"
                              >
                                {copied === `outreach-big-${lead.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copied === `outreach-big-${lead.id}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className="mt-2 bg-bg-primary rounded-lg p-3 border border-border-subtle">
                              <pre className="text-xs text-text-primary whitespace-pre-wrap font-sans leading-relaxed">{outreach}</pre>
                            </div>
                          </div>

                          {/* Properties */}
                          {lead.property && lead.property.includes('\\n') && (
                            <div>
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Properties</span>
                              <div className="mt-1 space-y-1">
                                {lead.property.split('\\n').map((p, i) => (
                                  <div key={i} className="text-sm text-text-primary flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-text-muted" />{decodeHtml(p)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Consideration */}
                          {lead.consideration && (
                            <div>
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Consideration</span>
                              <p className="mt-1 text-sm text-text-primary" dangerouslySetInnerHTML={{ __html: lead.consideration }} />
                            </div>
                          )}

                          {/* Legal */}
                          {lead.legal_description && lead.legal_description !== 'N/A' && (
                            <div>
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Legal Description</span>
                              <p className="mt-1 text-sm text-text-primary" dangerouslySetInnerHTML={{ __html: lead.legal_description }} />
                            </div>
                          )}

                          {/* Detail grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            {lead.pin && lead.pin !== 'N/A' && (
                              <div className="bg-bg-primary rounded-lg p-2 border border-border-subtle">
                                <span className="text-text-muted">PIN</span>
                                <div className="font-medium text-text-primary">{lead.pin}</div>
                              </div>
                            )}
                            {lead.acreage > 0 && (
                              <div className="bg-bg-primary rounded-lg p-2 border border-border-subtle">
                                <span className="text-text-muted">Acreage</span>
                                <div className="font-medium text-text-primary">{lead.acreage} ac</div>
                              </div>
                            )}
                            {lead.loan_principal > 0 && (
                              <div className="bg-bg-primary rounded-lg p-2 border border-border-subtle">
                                <span className="text-text-muted">Loan</span>
                                <div className="font-medium text-text-primary">{fmtCash(lead.loan_principal)}</div>
                              </div>
                            )}
                            {lead.interest_rate > 0 && (
                              <div className="bg-bg-primary rounded-lg p-2 border border-border-subtle">
                                <span className="text-text-muted">Rate</span>
                                <div className="font-medium text-text-primary">{lead.interest_rate}%</div>
                              </div>
                            )}
                          </div>

                          {/* Multi-deal list */}
                          {lead.dealCount > 1 && (
                            <div>
                              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">All Deals ({lead.dealCount})</span>
                              <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                                {lead._deals.slice(0, 10).map((d, i) => (
                                  <div key={i} className="flex items-center gap-3 text-xs py-1 border-b border-border-subtle last:border-0">
                                    <span className="text-emerald-400 font-medium w-16">{fmtCash(d.cash_amount)}</span>
                                    <span className="text-text-muted w-24 truncate">{d.location}</span>
                                    <span className="text-text-primary flex-1 truncate">{decodeHtml(d.property || '').split('\\n')[0]}</span>
                                    <span className="text-text-muted">{d.sale_date}</span>
                                  </div>
                                ))}
                                {lead._deals.length > 10 && (
                                  <div className="text-xs text-text-muted py-1">+{lead._deals.length - 10} more deals</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bottom actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <a href={contact.google} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-input text-text-muted text-xs hover:text-text-primary hover:bg-bg-hover transition-colors">
                              <Search className="w-3 h-3" />Search
                            </a>
                            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-input text-text-muted text-xs hover:text-text-primary hover:bg-bg-hover transition-colors">
                              <Linkedin className="w-3 h-3" />LinkedIn
                            </a>
                            {lead.listing_url && (
                              <a href={lead.listing_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-input text-text-muted text-xs hover:text-text-primary hover:bg-bg-hover transition-colors">
                                <ExternalLink className="w-3 h-3" />Listing
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {displayLeads.length < leads.length && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setLimit(l => l + 50)}
                  className="px-4 py-2 rounded-lg bg-bg-input text-text-muted hover:text-text-primary text-sm transition-colors"
                >
                  Load more ({fmtNum(leads.length - displayLeads.length)} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
