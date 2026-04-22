import React, { useState, useEffect, useMemo } from 'react'
import {
  Facebook, Search, Filter, Flame, Snowflake, Thermometer, 
  User, Building2, MapPin, Tag, MessageCircle, Send, 
  CheckCircle, Archive, Link2, Copy, Check, X, Loader2,
  TrendingUp, Users, Home, ArrowRight, Target, Zap,
  RefreshCw, ChevronDown, ChevronUp, Clock, BarChart3,
  Inbox, ExternalLink, Trash2, Eye, Route, AlertCircle,
  Phone, Mail
} from 'lucide-react'

const API_BASE = (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
  ? 'https://bigdataclaw.srv1368913.hstgr.cloud'
  : (import.meta.env.VITE_API_URL || 'http://localhost:18002')

const TIER_STYLES = {
  HOT: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: Flame },
  WARM: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Thermometer },
  COLD: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', icon: Snowflake },
}

const INTENT_STYLES = {
  buyer: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Buyer' },
  seller: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Seller' },
  broker: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Broker' },
  noise: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Noise' },
}

const STATUS_STYLES = {
  new: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  contacted: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  dm_sent: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  dm_replied: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  connected: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  qualified: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  routed: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  archived: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
}

const SOURCE_STYLES = {
  facebook: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Facebook },
  marketplace: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: Tag },
  linkedin: { bg: 'bg-sky-500/10', text: 'text-sky-400', icon: ExternalLink },
  inbound: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: Inbox },
  referral: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Users },
}

function generateDMTemplate(lead) {
  if (!lead) return ''
  const name = lead.name?.split(' ')[0] || 'there'
  if (lead.intent === 'buyer' || lead.intent === 'broker') {
    return `Hey ${name} — saw your post about ${lead.asset_type || 'CRE'} requirements in ${lead.location || 'the area'}.

We come across off-market product in that range pretty regularly. Are you strictly looking for fully built-out space, or would light retrofit opportunities work as well?

Happy to compare notes if you're active on that side.`
  }
  if (lead.intent === 'seller') {
    return `Hey ${name} — saw your post about the ${lead.asset_type || 'property'} in ${lead.location || 'the area'}.

I may have a buyer match for that. Can you share the rent roll and any recent CapEx?`
  }
  return `Hey ${name} — saw your post about ${lead.asset_type || 'CRE'} in ${lead.location || 'the area'}.

Worth a quick chat?`
}

function timeSince(isoString) {
  if (!isoString) return ''
  const then = new Date(isoString)
  const now = new Date()
  const diffMs = now - then
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function freshnessColor(isoString) {
  if (!isoString) return ''
  const hours = (new Date() - new Date(isoString)) / 3600000
  if (hours < 1) return 'text-red-400 animate-pulse'
  if (hours < 6) return 'text-red-400'
  if (hours < 24) return 'text-amber-400'
  return 'text-slate-400'
}

export default function FacebookIntelligence() {
  const [activeTab, setActiveTab] = useState('inbox')
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters
  const [filterIntent, setFilterIntent] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Classifier
  const [classifierText, setClassifierText] = useState('')
  const [classifierResult, setClassifierResult] = useState(null)
  const [classifierLoading, setClassifierLoading] = useState(false)
  
  // Selected lead
  const [selectedLead, setSelectedLead] = useState(null)
  const [leadDetail, setLeadDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // Templates
  const [templates, setTemplates] = useState(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [copiedTemplate, setCopiedTemplate] = useState(null)
  const [copiedDM, setCopiedDM] = useState(null)
  
  // Ingest form
  const [showIngestForm, setShowIngestForm] = useState(false)
  const [ingestData, setIngestData] = useState({
    name: '', company: '', location: '', asset_type: '',
    intent: 'buyer', urgency: 'medium', source: 'facebook', post_text: '',
    facebook_profile: '', contact_method: 'dm', estimated_value: '', notes: '',
  })
  const [ingestLoading, setIngestLoading] = useState(false)

  // Load leads
  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterIntent) params.append('intent', filterIntent)
      if (filterTier) params.append('tier', filterTier)
      if (filterStatus) params.append('status', filterStatus)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '100')
      
      const res = await fetch(`${API_BASE}/api/facebook/leads?${params}`)
      if (!res.ok) throw new Error('Failed to load leads')
      const data = await res.json()
      setLeads(data.leads || [])
      setStats(data.stats || {})
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Load stats
  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/facebook/stats`)
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error('Stats error:', e)
    }
  }

  useEffect(() => {
    loadLeads()
    loadStats()
  }, [filterIntent, filterTier, filterStatus])

  useEffect(() => {
    const timer = setTimeout(loadLeads, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Classify post
  const classifyPost = async () => {
    if (!classifierText.trim()) return
    setClassifierLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/facebook/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_text: classifierText, source: 'facebook' }),
      })
      const data = await res.json()
      setClassifierResult(data)
      // Pre-fill ingest form
      const c = data.classification
      setIngestData(prev => ({
        ...prev,
        name: c.name || '',
        location: c.location || '',
        asset_type: c.asset_type || '',
        intent: c.intent || 'buyer',
        urgency: c.urgency || 'medium',
        post_text: classifierText,
        estimated_value: c.estimated_value || '',
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setClassifierLoading(false)
    }
  }

  // Ingest lead
  const ingestLead = async () => {
    setIngestLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/facebook/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ingestData,
          signal_tags: classifierResult?.classification?.signal_tags || [],
        }),
      })
      const data = await res.json()
      if (data.lead_id) {
        setClassifierResult(null)
        setClassifierText('')
        setShowIngestForm(false)
        loadLeads()
        loadStats()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setIngestLoading(false)
    }
  }

  // Load lead detail
  const loadLeadDetail = async (leadId) => {
    setDetailLoading(true)
    setSelectedLead(leadId)
    try {
      const res = await fetch(`${API_BASE}/api/facebook/lead/${leadId}`)
      if (!res.ok) throw new Error('Failed to load lead')
      const data = await res.json()
      setLeadDetail(data)
      // Load templates
      loadTemplates(leadId, data.intent)
    } catch (e) {
      setError(e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  // Load templates
  const loadTemplates = async (leadId, intent) => {
    setTemplatesLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/facebook/templates?lead_id=${leadId}&template_type=all`)
      const data = await res.json()
      setTemplates(data.templates)
    } catch (e) {
      console.error('Templates error:', e)
    } finally {
      setTemplatesLoading(false)
    }
  }

  // Update lead status
  const updateStatus = async (leadId, action) => {
    try {
      await fetch(`${API_BASE}/api/facebook/lead/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action, channel: 'facebook' }),
      })
      loadLeads()
      if (selectedLead === leadId) loadLeadDetail(leadId)
      loadStats()
    } catch (e) {
      setError(e.message)
    }
  }

  // Route lead
  const routeLead = async (leadId, routeTo) => {
    try {
      await fetch(`${API_BASE}/api/facebook/lead/${leadId}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, route_to: routeTo }),
      })
      loadLeads()
      if (selectedLead === leadId) loadLeadDetail(leadId)
      loadStats()
    } catch (e) {
      setError(e.message)
    }
  }

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedTemplate(key)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }

  const funnelData = stats?.conversion_funnel || stats || {}

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-subtle bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Facebook Intelligence</h1>
                <p className="text-sm text-text-muted">Social signal → structured lead → pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { loadLeads(); loadStats() }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-input hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
            {[
              { label: 'Total', value: stats?.total || 0, icon: Inbox, color: 'text-text-primary' },
              { label: 'HOT', value: stats?.hot || 0, icon: Flame, color: 'text-red-400' },
              { label: 'WARM', value: stats?.warm || 0, icon: Thermometer, color: 'text-amber-400' },
              { label: 'COLD', value: stats?.cold || 0, icon: Snowflake, color: 'text-slate-400' },
              { label: 'Buyers', value: stats?.buyer || 0, icon: Users, color: 'text-emerald-400' },
              { label: 'Sellers', value: stats?.seller || 0, icon: Home, color: 'text-blue-400' },
              { label: 'DMs Sent', value: funnelData?.dm_sent || 0, icon: Send, color: 'text-purple-400' },
              { label: 'Connected', value: funnelData?.connected || 0, icon: CheckCircle, color: 'text-green-400' },
            ].map((s, i) => (
              <div key={i} className="bg-bg-primary rounded-xl p-3 border border-border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-xs text-text-muted">{s.label}</span>
                </div>
                <span className="text-lg font-bold">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Speed Metrics Bar */}
          {(stats?.speed_metrics?.avg_speed_to_dm_minutes != null || stats?.speed_metrics?.avg_first_response_minutes != null) && (
            <div className="flex flex-wrap gap-4 mt-3">
              {stats?.speed_metrics?.avg_speed_to_dm_minutes != null && (
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-text-muted">Avg Speed to DM:</span>
                  <span className="font-medium text-amber-400">{stats.speed_metrics.avg_speed_to_dm_minutes} min</span>
                </div>
              )}
              {stats?.speed_metrics?.avg_first_response_minutes != null && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-text-muted">Avg First Response:</span>
                  <span className="font-medium text-emerald-400">{stats.speed_metrics.avg_first_response_minutes} min</span>
                </div>
              )}
              {stats?.source_breakdown && Object.entries(stats.source_breakdown).length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-text-muted">Sources:</span>
                  {Object.entries(stats.source_breakdown).map(([src, count]) => (
                    <span key={src} className="px-1.5 py-0.5 rounded bg-bg-input text-text-muted capitalize">{src}: {count}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-border-subtle">
            {[
              { id: 'inbox', label: 'Lead Inbox', icon: Inbox },
              { id: 'classifier', label: 'Post Classifier', icon: Zap },
              { id: 'funnel', label: 'Conversion Funnel', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* INBOX TAB */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <select
                  value={filterTier}
                  onChange={e => setFilterTier(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                >
                  <option value="">All Tiers</option>
                  <option value="HOT">HOT</option>
                  <option value="WARM">WARM</option>
                  <option value="COLD">COLD</option>
                </select>
                <select
                  value={filterIntent}
                  onChange={e => setFilterIntent(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                >
                  <option value="">All Intents</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="broker">Broker</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                >
                  <option value="">All Status</option>
                  <option value="new">New</option>
                  <option value="dm_sent">DM Sent</option>
                  <option value="dm_replied">DM Replied</option>
                  <option value="connected">Connected</option>
                  <option value="qualified">Qualified</option>
                  <option value="routed">Routed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Lead Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-20 text-text-muted">
                  <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No leads yet. Use the Post Classifier to ingest leads.</p>
                </div>
              ) : (
                leads.map(lead => {
                  const tierStyle = TIER_STYLES[lead.score_tier] || TIER_STYLES.COLD
                  const intentStyle = INTENT_STYLES[lead.intent] || INTENT_STYLES.noise
                  const TierIcon = tierStyle.icon
                  return (
                    <div
                      key={lead.id}
                      onClick={() => loadLeadDetail(lead.id)}
                      className={`bg-bg-card rounded-xl border transition-all cursor-pointer hover:border-accent-blue/30 ${
                        selectedLead === lead.id ? 'border-accent-blue' : 'border-border-subtle'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${tierStyle.bg} flex items-center justify-center flex-shrink-0`}>
                              <TierIcon className={`w-5 h-5 ${tierStyle.text}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm">{lead.name || 'Unknown'}</h3>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border} border`}>
                                  {lead.score_tier}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${intentStyle.bg} ${intentStyle.text}`}>
                                  {intentStyle.label}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[lead.status]?.bg || ''} ${STATUS_STYLES[lead.status]?.text || ''}`}>
                                  {lead.status}
                                </span>
                                {lead.source && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${SOURCE_STYLES[lead.source]?.bg || 'bg-bg-input'} ${SOURCE_STYLES[lead.source]?.text || 'text-text-muted'}`}>
                                    {lead.source}
                                  </span>
                                )}
                                {lead.score_tier === 'HOT' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${freshnessColor(lead.created_at)}`}>
                                    <Flame className="w-3 h-3" />
                                    {timeSince(lead.created_at)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-text-muted flex-wrap">
                                {lead.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.location}</span>}
                                {lead.asset_type && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.asset_type}</span>}
                                {lead.estimated_value && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{lead.estimated_value}</span>}
                                {lead.urgency && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{lead.urgency}</span>}
                              </div>
                              <p className="text-xs text-text-muted mt-2 line-clamp-2">{lead.post_text}</p>
                              {lead.signal_tags?.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {lead.signal_tags.slice(0, 5).map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-bg-input text-[10px] text-text-muted">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-text-muted flex-shrink-0 text-right">
                            <div>{new Date(lead.created_at).toLocaleDateString()}</div>
                            <div className={`text-[10px] ${freshnessColor(lead.created_at)}`}>{timeSince(lead.created_at)}</div>
                          </div>
                        </div>

                        {/* Primary Action Bar — View Profile / Copy DM / Contact */}
                        {lead.facebook_profile && (
                          <div className="flex gap-2 mt-3">
                            <a
                              href={lead.facebook_profile}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> View Profile
                            </a>
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                const dm = generateDMTemplate(lead)
                                navigator.clipboard.writeText(dm)
                                setCopiedDM(lead.id)
                                setTimeout(() => setCopiedDM(null), 2000)
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                            >
                              {copiedDM === lead.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedDM === lead.id ? 'Copied!' : 'Copy DM'}
                            </button>
                            {lead.contact_available && (
                              <button
                                onClick={e => { e.stopPropagation(); window.open(lead.facebook_profile, '_blank') }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" /> Message Now
                              </button>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-2 pt-2 border-t border-border-subtle">
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'dm_sent') }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
                          >
                            <Send className="w-3 h-3" /> DM Sent
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'dm_replied') }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" /> Replied
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'connected') }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" /> Connected
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'qualified') }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 text-xs hover:bg-pink-500/20 transition-colors"
                          >
                            <Target className="w-3 h-3" /> Qualified
                          </button>
                          <div className="ml-auto flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); routeLead(lead.id, 'buyer_pipeline') }}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors"
                              title="Route to Buyer Pipeline"
                            >
                              <Route className="w-3 h-3" /> Buyer
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); routeLead(lead.id, 'deal_pipeline') }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
                              title="Route to Deal Pipeline"
                            >
                              <Home className="w-3 h-3" /> Deal
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'archived') }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 text-xs hover:bg-slate-500/20 transition-colors"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Lead Detail Panel */}
            <div className="lg:col-span-1">
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                </div>
              ) : leadDetail ? (
                <div className="bg-bg-card rounded-xl border border-border-subtle p-4 space-y-4 sticky top-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Lead Detail</h3>
                    <button onClick={() => { setSelectedLead(null); setLeadDetail(null) }} className="text-text-muted hover:text-text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-text-muted">Name</label>
                      <p className="text-sm font-medium">{leadDetail.name || 'Unknown'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-muted">Intent</label>
                        <p className="text-sm font-medium capitalize">{leadDetail.intent}</p>
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Tier</label>
                        <p className="text-sm font-medium">{leadDetail.score_tier}</p>
                      </div>
                    </div>
                    {leadDetail.location && (
                      <div>
                        <label className="text-xs text-text-muted">Location</label>
                        <p className="text-sm">{leadDetail.location}</p>
                      </div>
                    )}
                    {leadDetail.asset_type && (
                      <div>
                        <label className="text-xs text-text-muted">Asset Type</label>
                        <p className="text-sm">{leadDetail.asset_type}</p>
                      </div>
                    )}
                    {leadDetail.estimated_value && (
                      <div>
                        <label className="text-xs text-text-muted">Estimated Value</label>
                        <p className="text-sm font-medium">{leadDetail.estimated_value}</p>
                      </div>
                    )}
                    {(leadDetail.speed_to_dm_minutes != null || leadDetail.first_response_minutes != null) && (
                      <div className="bg-bg-primary rounded-lg p-3 border border-border-subtle space-y-2">
                        <label className="text-xs text-text-muted">Speed Metrics</label>
                        {leadDetail.speed_to_dm_minutes != null && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">Ingest → DM Sent</span>
                            <span className={`font-medium ${leadDetail.speed_to_dm_minutes < 60 ? 'text-green-400' : leadDetail.speed_to_dm_minutes < 240 ? 'text-amber-400' : 'text-red-400'}`}>
                              {leadDetail.speed_to_dm_minutes} min
                            </span>
                          </div>
                        )}
                        {leadDetail.first_response_minutes != null && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-muted">DM Sent → Replied</span>
                            <span className={`font-medium ${leadDetail.first_response_minutes < 60 ? 'text-green-400' : leadDetail.first_response_minutes < 240 ? 'text-amber-400' : 'text-red-400'}`}>
                              {leadDetail.first_response_minutes} min
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {leadDetail.facebook_profile && (
                      <div>
                        <label className="text-xs text-text-muted">Profile</label>
                        <a href={leadDetail.facebook_profile} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View Profile
                        </a>
                      </div>
                    )}
                    {leadDetail.post_url && (
                      <div>
                        <label className="text-xs text-text-muted">Post URL</label>
                        <a href={leadDetail.post_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-blue flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> View Post
                        </a>
                      </div>
                    )}
                  </div>

                  {/* DM Templates */}
                  <div className="border-t border-border-subtle pt-4">
                    <h4 className="text-sm font-medium mb-3">DM Templates</h4>
                    {templatesLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
                    ) : templates ? (
                      <div className="space-y-2">
                        {Object.entries(templates).map(([type, text]) => (
                          <div key={type} className="bg-bg-primary rounded-lg p-3 border border-border-subtle">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium capitalize text-text-muted">{type}</span>
                              <button
                                onClick={() => copyToClipboard(text, type)}
                                className="text-text-muted hover:text-text-primary"
                              >
                                {copiedTemplate === type ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <p className="text-xs leading-relaxed">{text}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Action History */}
                  {leadDetail.actions?.length > 0 && (
                    <div className="border-t border-border-subtle pt-4">
                      <h4 className="text-sm font-medium mb-3">Activity</h4>
                      <div className="space-y-2">
                        {leadDetail.actions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Clock className="w-3 h-3 text-text-muted mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium capitalize">{action.action.replace(/_/g, ' ')}</span>
                              <span className="text-text-muted ml-1">{new Date(action.created_at).toLocaleDateString()}</span>
                              {action.notes && <p className="text-text-muted mt-0.5">{action.notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-bg-card rounded-xl border border-border-subtle p-8 text-center text-text-muted">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a lead to view details and DM templates</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLASSIFIER TAB */}
        {activeTab === 'classifier' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-bg-card rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Post Classifier
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Paste a Facebook post, comment, or Marketplace listing. We'll classify intent, score urgency, extract signals, and generate a structured lead.
              </p>
              <textarea
                value={classifierText}
                onChange={e => setClassifierText(e.target.value)}
                placeholder="Paste Facebook post text here..."
                rows={6}
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border-subtle text-sm focus:outline-none focus:border-accent-blue resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-text-muted">{classifierText.length} characters</span>
                <button
                  onClick={classifyPost}
                  disabled={!classifierText.trim() || classifierLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {classifierLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Classify & Extract
                </button>
              </div>
            </div>

            {classifierResult && (
              <div className="bg-bg-card rounded-xl border border-border-subtle p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Classification Result</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${TIER_STYLES[classifierResult.tier]?.bg} ${TIER_STYLES[classifierResult.tier]?.text}`}>
                      {classifierResult.tier}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${INTENT_STYLES[classifierResult.classification?.intent]?.bg} ${INTENT_STYLES[classifierResult.classification?.intent]?.text}`}>
                      {INTENT_STYLES[classifierResult.classification?.intent]?.label || classifierResult.classification?.intent}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-bg-primary rounded-lg p-3">
                    <span className="text-xs text-text-muted">Intent</span>
                    <p className="text-sm font-medium capitalize">{classifierResult.classification?.intent}</p>
                  </div>
                  <div className="bg-bg-primary rounded-lg p-3">
                    <span className="text-xs text-text-muted">Urgency</span>
                    <p className="text-sm font-medium capitalize">{classifierResult.classification?.urgency}</p>
                  </div>
                  <div className="bg-bg-primary rounded-lg p-3">
                    <span className="text-xs text-text-muted">Asset Type</span>
                    <p className="text-sm font-medium capitalize">{classifierResult.classification?.asset_type || '—'}</p>
                  </div>
                  <div className="bg-bg-primary rounded-lg p-3">
                    <span className="text-xs text-text-muted">Location</span>
                    <p className="text-sm font-medium">{classifierResult.classification?.location || '—'}</p>
                  </div>
                </div>

                {classifierResult.classification?.signal_tags?.length > 0 && (
                  <div>
                    <span className="text-xs text-text-muted">Signal Tags</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {classifierResult.classification.signal_tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-bg-input text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {classifierResult.classification?.estimated_value && (
                  <div>
                    <span className="text-xs text-text-muted">Estimated Value</span>
                    <p className="text-sm font-medium">{classifierResult.classification.estimated_value}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowIngestForm(!showIngestForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-green text-white text-sm font-medium hover:bg-accent-green/90 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {showIngestForm ? 'Hide Form' : 'Ingest as Lead'}
                  </button>
                  <button
                    onClick={() => { setClassifierResult(null); setClassifierText(''); setShowIngestForm(false) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-input text-text-muted text-sm hover:text-text-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                </div>

                {/* Ingest Form */}
                {showIngestForm && (
                  <div className="bg-bg-primary rounded-xl border border-border-subtle p-4 space-y-3 mt-4">
                    <h4 className="text-sm font-medium">Lead Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Name"
                        value={ingestData.name}
                        onChange={e => setIngestData({...ingestData, name: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      />
                      <input
                        placeholder="Company"
                        value={ingestData.company}
                        onChange={e => setIngestData({...ingestData, company: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      />
                      <input
                        placeholder="Location"
                        value={ingestData.location}
                        onChange={e => setIngestData({...ingestData, location: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      />
                      <select
                        value={ingestData.asset_type}
                        onChange={e => setIngestData({...ingestData, asset_type: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      >
                        <option value="">Asset Type</option>
                        <option value="multifamily">Multifamily</option>
                        <option value="office">Office</option>
                        <option value="industrial">Industrial</option>
                        <option value="retail">Retail</option>
                        <option value="hotel">Hotel</option>
                        <option value="land">Land</option>
                        <option value="mixed-use">Mixed-Use</option>
                      </select>
                      <select
                        value={ingestData.intent}
                        onChange={e => setIngestData({...ingestData, intent: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="broker">Broker</option>
                      </select>
                      <select
                        value={ingestData.urgency}
                        onChange={e => setIngestData({...ingestData, urgency: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      >
                        <option value="high">High Urgency</option>
                        <option value="medium">Medium Urgency</option>
                        <option value="low">Low Urgency</option>
                      </select>
                      <select
                        value={ingestData.source || 'facebook'}
                        onChange={e => setIngestData({...ingestData, source: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      >
                        <option value="facebook">Facebook</option>
                        <option value="marketplace">Marketplace</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="inbound">Inbound</option>
                        <option value="referral">Referral</option>
                      </select>
                      <input
                        placeholder="Facebook Profile URL"
                        value={ingestData.facebook_profile}
                        onChange={e => setIngestData({...ingestData, facebook_profile: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      />
                      <input
                        placeholder="Estimated Value"
                        value={ingestData.estimated_value}
                        onChange={e => setIngestData({...ingestData, estimated_value: e.target.value})}
                        className="px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue"
                      />
                    </div>
                    <textarea
                      placeholder="Notes"
                      value={ingestData.notes}
                      onChange={e => setIngestData({...ingestData, notes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-sm focus:outline-none focus:border-accent-blue resize-none"
                    />
                    <button
                      onClick={ingestLead}
                      disabled={ingestLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent-green text-white text-sm font-medium hover:bg-accent-green/90 disabled:opacity-50 transition-colors"
                    >
                      {ingestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Ingest Lead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FUNNEL TAB */}
        {activeTab === 'funnel' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-bg-card rounded-xl border border-border-subtle p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-blue" />
                Conversion Funnel
              </h2>
              
              {funnelData && (
                <div className="space-y-4">
                  {[
                    { label: 'Ingested', value: funnelData.ingested || 0, color: 'bg-slate-500', total: funnelData.ingested || 1 },
                    { label: 'DM Sent', value: funnelData.dm_sent || 0, color: 'bg-blue-500', total: funnelData.ingested || 1 },
                    { label: 'DM Replied', value: funnelData.dm_replied || 0, color: 'bg-emerald-500', total: funnelData.ingested || 1 },
                    { label: 'Connected', value: funnelData.connected || 0, color: 'bg-purple-500', total: funnelData.ingested || 1 },
                    { label: 'Qualified', value: funnelData.qualified || 0, color: 'bg-pink-500', total: funnelData.ingested || 1 },
                  ].map((step, i) => {
                    const pct = Math.round((step.value / step.total) * 100)
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 text-sm text-text-muted text-right">{step.label}</div>
                        <div className="flex-1 h-8 bg-bg-primary rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full ${step.color} transition-all duration-500 rounded-lg`}
                            style={{ width: `${pct}%`, minWidth: pct > 0 ? '4px' : '0' }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                            {step.value} ({pct}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Rules Reminder */}
              <div className="mt-8 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <h4 className="text-sm font-medium text-amber-400 mb-2">Platform Rules</h4>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>• No spam blasting — every message must reference their post</li>
                  <li>• No generic copy-paste — personalize with post context</li>
                  <li>• Respect platform limits — don&apos;t send more than 10 DMs/hour</li>
                  <li>• Soft and contextual — not salesy</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
