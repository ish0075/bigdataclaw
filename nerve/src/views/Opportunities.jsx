import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search, ExternalLink, Building2, Home, Store, Factory, 
  TreePine, Stethoscope, MapPin, DollarSign, 
  Calendar, AlertCircle, TrendingUp, Filter,
  RefreshCw, Flame, Scale, Gavel, Hammer, Anchor,
  Briefcase, ChevronRight, Target, Clock, Sparkles,
  Landmark, HardHat, ShoppingBag, Loader2
} from 'lucide-react'

const API_BASE_CANDIDATES = Array.from(new Set([
  import.meta.env.VITE_API_URL,
  '/api',
  'http://127.0.0.1:3090/api',
  'http://localhost:3090/api',
  'http://127.0.0.1:8000/api',
  'http://localhost:8000/api',
].filter(Boolean).map((value) => value.replace(/\/$/, ''))))

let resolvedApiBase = null

const shouldRetryWithNextApiBase = (message) => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('file not found') ||
    normalized.includes('cannot get') ||
    normalized.includes('http 404') ||
    normalized.includes('http 502') ||
    normalized.includes('http 503')
  )
}

const createHttpError = async (response) => {
  let detail = ''
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await response.json()
      detail = body?.detail || body?.error || ''
    } else {
      detail = (await response.text()).trim()
    }
  } catch { detail = '' }
  return new Error(detail ? `HTTP ${response.status}: ${detail}` : `HTTP ${response.status}: ${response.statusText}`)
}

const fetchApi = async (path, init) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const candidates = resolvedApiBase ? [resolvedApiBase] : API_BASE_CANDIDATES
  let lastError = null
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${normalizedPath}`, init)
      if (!response.ok) throw await createHttpError(response)
      resolvedApiBase = base
      return response
    } catch (err) {
      lastError = err
      if (!shouldRetryWithNextApiBase(err instanceof Error ? err.message : String(err))) throw err
    }
  }
  throw lastError || new Error('API unavailable')
}

const formatCash = (amount) => {
  if (!amount) return '$0'
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
  return `$${amount}`
}

const ASSET_CLASSES = [
  { value: 'all', label: 'All', icon: Building2, color: 'slate' },
  { value: 'Agricultural', label: 'Agricultural', icon: TreePine, color: 'green' },
  { value: 'Hotel', label: 'Hotel', icon: Briefcase, color: 'rose' },
  { value: 'Industrial', label: 'Industrial', icon: Factory, color: 'blue' },
  { value: 'Land', label: 'Land', icon: MapPin, color: 'orange' },
  { value: 'Multifamily', label: 'Multifamily', icon: Home, color: 'amber' },
  { value: 'Office', label: 'Office', icon: Building2, color: 'purple' },
  { value: 'Retail', label: 'Retail', icon: Store, color: 'emerald' },
  { value: 'Senior Living', label: 'Senior Living', icon: Stethoscope, color: 'cyan' },
  { value: 'Healthcare', label: 'Healthcare', icon: Stethoscope, color: 'teal' },
]

const URGENCY_FILTERS = [
  { value: 'all', label: 'All Flagged', color: 'slate' },
  { value: 'critical', label: 'Critical (≥70%)', color: 'red' },
  { value: 'high', label: 'High (≥50%)', color: 'orange' },
  { value: 'medium', label: 'Medium (≥30%)', color: 'yellow' },
  { value: 'watch', label: 'Watch (≥10%)', color: 'blue' },
]

const PRICE_RANGES = [
  { value: 'all', label: 'All Prices' },
  { value: '<$1M', label: '<$1M' },
  { value: '$1M - $5M', label: '$1M - $5M' },
  { value: '$5M - $10M', label: '$5M - $10M' },
  { value: '$10M - $50M', label: '$10M - $50M' },
  { value: '$50M+', label: '$50M+' },
]

const SIGNAL_ICONS = {
  extreme_rate: Flame,
  high_rate: Flame,
  peak_market: TrendingUp,
  distressed_entity: Gavel,
  underwater: Anchor,
  matured: Clock,
  due_soon: Clock,
  pre_covid: Calendar,
  high_value: DollarSign,
  vacancy: AlertCircle,
  redevelopment: Hammer,
}

const UrgencyBadge = ({ label }) => {
  const colors = {
    CRITICAL: 'bg-red-600 text-white border-red-500',
    HIGH: 'bg-orange-600 text-white border-orange-500',
    MEDIUM: 'bg-yellow-500 text-black border-yellow-400',
    WATCH: 'bg-blue-600 text-white border-blue-500',
  }
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${colors[label] || colors.WATCH}`}>
      {label}
    </span>
  )
}

const UrgencyBar = ({ score }) => {
  let color = 'bg-blue-500'
  if (score >= 70) color = 'bg-red-500'
  else if (score >= 50) color = 'bg-orange-500'
  else if (score >= 30) color = 'bg-yellow-500'
  
  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
      <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}

const Opportunities = () => {
  const [activeTab, setActiveTab] = useState('goldmine')
  const [opportunities, setOpportunities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [distressedLoading, setDistressedLoading] = useState(false)
  const [distressedError, setDistressedError] = useState(null)
  const [flaggedReports, setFlaggedReports] = useState([])
  
  const [assetClassFilter, setAssetClassFilter] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('urgency')

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (assetClassFilter && assetClassFilter !== 'all') params.append('asset_class', assetClassFilter)
      params.append('limit', '500')
      const response = await fetchApi(`/opportunities/gold?${params.toString()}`)
      const data = await response.json()
      setOpportunities(data.opportunities || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error('Error fetching opportunities:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlaggedReports = async () => {
    try {
      setDistressedLoading(true)
      setDistressedError(null)
      // Try the flagged-opportunities endpoint if it exists; otherwise fall back gracefully
      const response = await fetchApi('/opportunities/flagged')
      const data = await response.json()
      setFlaggedReports(data.reports || [])
    } catch (err) {
      console.error('Error fetching flagged reports:', err)
      setDistressedError(err.message)
    } finally {
      setDistressedLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [assetClassFilter])

  useEffect(() => {
    if (activeTab === 'distressed') {
      fetchFlaggedReports()
    }
  }, [activeTab])

  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities]
    
    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(o => o.urgency_label.toLowerCase() === urgencyFilter)
    }
    
    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(o => o.price_range === priceFilter)
    }
    
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        (o.entity || '').toLowerCase().includes(q) ||
        (o.location || '').toLowerCase().includes(q) ||
        (o.asset_class || '').toLowerCase().includes(q) ||
        (o.address || '').toLowerCase().includes(q)
      )
    }
    
    // Sort
    if (sortBy === 'urgency') {
      filtered.sort((a, b) => b.urgency_score - a.urgency_score || b.cash_amount - a.cash_amount)
    } else if (sortBy === 'cash') {
      filtered.sort((a, b) => b.cash_amount - a.cash_amount)
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => (b.sale_date || '').localeCompare(a.sale_date || ''))
    }
    
    return filtered
  }, [opportunities, urgencyFilter, priceFilter, searchQuery, sortBy])

  const totalFlaggedCapital = useMemo(() => {
    return filteredOpportunities.reduce((sum, o) => sum + (o.cash_amount || 0), 0)
  }, [filteredOpportunities])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-accent-yellow" />
            Opportunity Goldmine
          </h1>
          <p className="text-slate-400 mt-1">
            {stats ? `${stats.total_flagged.toLocaleString()} distressed and high-urgency deals flagged by AI` : 'Loading opportunities...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOpportunities}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('goldmine')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'goldmine'
              ? 'border-accent-yellow text-accent-yellow'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Goldmine
        </button>
        <button
          onClick={() => setActiveTab('distressed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'distressed'
              ? 'border-accent-yellow text-accent-yellow'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Distressed
        </button>
      </div>

      {activeTab === 'goldmine' && (
        <>
          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-xl p-4 border border-red-500/20">
                <p className="text-3xl font-bold text-white">{stats.critical}</p>
                <p className="text-sm text-slate-400">Critical</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-yellow-600/20 rounded-xl p-4 border border-orange-500/20">
                <p className="text-3xl font-bold text-white">{stats.high}</p>
                <p className="text-sm text-slate-400">High</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-amber-600/20 rounded-xl p-4 border border-yellow-500/20">
                <p className="text-3xl font-bold text-white">{stats.medium}</p>
                <p className="text-sm text-slate-400">Medium</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl p-4 border border-blue-500/20">
                <p className="text-3xl font-bold text-white">{stats.watch}</p>
                <p className="text-sm text-slate-400">Watch</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-2xl font-bold text-emerald-400">{formatCash(totalFlaggedCapital)}</p>
                <p className="text-sm text-slate-400">Filtered Capital</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-4">
            {/* Row 1: Search & Sort */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search entity, location, address..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="urgency">Sort: Urgency</option>
                <option value="cash">Sort: Cash ↓</option>
                <option value="date">Sort: Sale Date</option>
              </select>
            </div>

            {/* Row 2: Urgency Filters */}
            <div className="flex flex-wrap gap-2">
              {URGENCY_FILTERS.map((f) => {
                const isActive = urgencyFilter === f.value
                const activeClasses = {
                  slate: 'bg-slate-600 text-white border-slate-500',
                  red: 'bg-red-600 text-white border-red-500',
                  orange: 'bg-orange-600 text-white border-orange-500',
                  yellow: 'bg-yellow-500 text-black border-yellow-400',
                  blue: 'bg-blue-600 text-white border-blue-500',
                }
                return (
                  <button
                    key={f.value}
                    onClick={() => setUrgencyFilter(f.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      isActive ? activeClasses[f.color] : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Row 3: Asset Class Chips */}
            <div className="flex flex-wrap gap-2">
              {ASSET_CLASSES.map((btn) => {
                const isActive = assetClassFilter === btn.value || (assetClassFilter === '' && btn.value === 'all')
                const count = btn.value === 'all' ? (stats?.total_flagged || 0) : (stats?.by_asset_class?.[btn.value] || 0)
                const activeClasses = {
                  slate: 'bg-slate-600 text-white border-slate-500',
                  green: 'bg-green-600 text-white border-green-500',
                  rose: 'bg-rose-600 text-white border-rose-500',
                  blue: 'bg-blue-600 text-white border-blue-500',
                  orange: 'bg-orange-600 text-white border-orange-500',
                  amber: 'bg-amber-600 text-white border-amber-500',
                  purple: 'bg-purple-600 text-white border-purple-500',
                  emerald: 'bg-emerald-600 text-white border-emerald-500',
                  cyan: 'bg-cyan-600 text-white border-cyan-500',
                  teal: 'bg-teal-600 text-white border-teal-500',
                }
                return (
                  <button
                    key={btn.value}
                    onClick={() => setAssetClassFilter(btn.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-all ${
                      isActive ? `${activeClasses[btn.color]} shadow-lg` : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <btn.icon className="w-4 h-4" />
                    <span>{btn.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
                      {count.toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Row 4: Price Range */}
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((pr) => {
                const isActive = priceFilter === pr.value
                return (
                  <button
                    key={pr.value}
                    onClick={() => setPriceFilter(pr.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white border-indigo-500' 
                        : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {pr.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Showing <span className="text-white font-semibold">{filteredOpportunities.length}</span> opportunities
            </p>
          </div>

          {/* Opportunity Cards */}
          <div className="space-y-4">
            {loading && opportunities.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-10 h-10 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Scanning database for distressed deals...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-400">
                <p>{error}</p>
                <button onClick={fetchOpportunities} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm">Try Again</button>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No opportunities match your filters.</p>
                <button 
                  onClick={() => { setUrgencyFilter('all'); setPriceFilter('all'); setSearchQuery(''); }}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredOpportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'distressed' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Distressed & Flagged Deals
            </h2>
            <p className="text-slate-400 mt-1 max-w-3xl">
              High-stress properties identified through Ontario land-registry intelligence — mortgage renewals, high leverage, on-demand loans, and negative equity signals.
            </p>
          </div>

          <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-8 text-center">
            {distressedLoading ? (
              <>
                <Loader2 className="w-10 h-10 text-accent-yellow animate-spin mx-auto mb-4" />
                <p className="text-slate-300 font-medium">Loading flagged opportunity reports...</p>
                <p className="text-slate-500 text-sm mt-1">Contacting the BigDataClaw scanner</p>
              </>
            ) : distressedError ? (
              <>
                <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <p className="text-slate-300 font-medium">Scanner connection not yet live</p>
                <p className="text-slate-500 text-sm mt-1">{distressedError}</p>
                <button
                  onClick={fetchFlaggedReports}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-sm"
                >
                  Retry
                </button>
              </>
            ) : flaggedReports.length === 0 ? (
              <>
                <Loader2 className="w-10 h-10 text-accent-yellow animate-spin mx-auto mb-4" />
                <p className="text-slate-300 font-medium">Loading flagged opportunity reports...</p>
                <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
                  These reports are generated from the BigDataClaw flagged-opportunity scanner. Check back shortly for live data.
                </p>
              </>
            ) : (
              <div className="text-left space-y-3">
                {flaggedReports.map((report, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-white font-medium">{report.title || report.filename || 'Flagged Report'}</p>
                    {report.summary && <p className="text-slate-400 text-sm mt-1">{report.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const OpportunityCard = ({ opportunity }) => {
  const asset = ASSET_CLASSES.find(a => a.value === opportunity.asset_class) || ASSET_CLASSES[0]
  const AssetIcon = asset.icon
  
  return (
    <div className={`bg-slate-800/40 rounded-xl border-l-4 p-5 transition-all hover:bg-slate-800/60 ${
      opportunity.urgency_label === 'CRITICAL' ? 'border-red-500' :
      opportunity.urgency_label === 'HIGH' ? 'border-orange-500' :
      opportunity.urgency_label === 'MEDIUM' ? 'border-yellow-500' :
      'border-blue-500'
    }`}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Icon + Urgency */}
        <div className="flex flex-row lg:flex-col items-center lg:items-center gap-3 lg:gap-2 lg:w-24 flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            opportunity.urgency_label === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
            opportunity.urgency_label === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
            opportunity.urgency_label === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <AssetIcon className="w-6 h-6" />
          </div>
          <UrgencyBadge label={opportunity.urgency_label} />
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{opportunity.entity}</h3>
              <p className="text-slate-400 text-sm flex items-center gap-2 flex-wrap">
                <span className="text-slate-300">{opportunity.asset_class}</span>
                <span className="text-slate-600">•</span>
                <span>{opportunity.location}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">{opportunity.price_range}</span>
              </p>
              {opportunity.address && opportunity.address !== opportunity.property && (
                <p className="text-slate-500 text-xs mt-0.5">{opportunity.address}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-emerald-400">{formatCash(opportunity.cash_amount)}</p>
              <p className="text-xs text-slate-500">Transaction Value</p>
            </div>
          </div>
          
          {/* Urgency Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Urgency Score</span>
              <span className="text-white font-bold">{opportunity.urgency_score}%</span>
            </div>
            <UrgencyBar score={opportunity.urgency_score} />
          </div>
          
          {/* Signals */}
          <div className="mt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Why it's flagged</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {opportunity.signals.map((sig, idx) => {
                const Icon = SIGNAL_ICONS[sig.type] || AlertCircle
                return (
                  <div key={idx} className="flex items-start gap-2 bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
                    <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{sig.label} <span className="text-slate-500">(+{sig.weight}%)</span></p>
                      <p className="text-xs text-slate-500">{sig.reason}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Property Details */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {opportunity.sale_date && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Sale: {opportunity.sale_date}</span>
              </div>
            )}
            {opportunity.interest_rate > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <DollarSign className="w-4 h-4" />
                <span>Rate: {opportunity.interest_rate}%</span>
              </div>
            )}
            {opportunity.loan_principal > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Landmark className="w-4 h-4" />
                <span>Loan: {formatCash(opportunity.loan_principal)}</span>
              </div>
            )}
            {opportunity.due_date && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Due: {opportunity.due_date}</span>
              </div>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-2">
            <a 
              href={opportunity.quick_links.google}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Google
            </a>
            <a 
              href={opportunity.quick_links.google_maps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              Maps
            </a>
            <a 
              href={opportunity.quick_links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              LinkedIn
            </a>
            <a 
              href={opportunity.quick_links.exec_search}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Exec Search
            </a>
            <a 
              href={`/hotmoney`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              View in Hot Money
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Opportunities
