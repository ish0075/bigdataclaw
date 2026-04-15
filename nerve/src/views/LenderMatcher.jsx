import React, { useState, useEffect, useMemo } from 'react'
import { 
  Building2, Search, Phone, Mail, Percent, DollarSign, CheckCircle2, 
  MapPin, Briefcase, TrendingUp, ChevronRight, ExternalLink, Globe,
  Linkedin, ArrowUpRight, Filter, Download, X, Star,
  Facebook, Instagram, MoreHorizontal, Share2, MessageSquare, ChevronUp,
  Loader2
} from 'lucide-react'

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud') + '/api'

// Asset Classes for lenders
const ASSET_CLASSES = [
  { id: 'all', label: 'All Asset Classes', color: 'bg-gray-500' },
  { id: 'Commercial', label: 'Commercial', color: 'bg-blue-500' },
  { id: 'Land', label: 'Land', color: 'bg-amber-500' },
  { id: 'Construction', label: 'Construction', color: 'bg-indigo-500' },
  { id: 'Residential', label: 'Residential', color: 'bg-green-500' },
  { id: 'Industrial', label: 'Industrial', color: 'bg-cyan-500' },
  { id: 'Retail', label: 'Retail', color: 'bg-purple-500' },
]

// Generate Quick Links for a lender
const generateQuickLinks = (lender) => {
  const ql = lender.quick_links || {}
  const name = encodeURIComponent(lender.name)
  
  return {
    website: ql.website || (lender.domain ? `https://${lender.domain}` : null),
    google: ql.google || `https://www.google.com/search?q=${name}+lender`,
    linkedin: ql.linkedin || `https://www.linkedin.com/search/results/companies/?keywords=${name}`,
    linkedin_president: ql.linkedin_president || `https://www.google.com/search?q=${name}+President+OR+CEO+linkedin`,
    facebook: ql.facebook || `https://www.google.com/search?q=${name}+facebook`,
    instagram: ql.instagram || `https://www.google.com/search?q=${name}+instagram`,
    twitter: ql.twitter || `https://www.google.com/search?q=${name}+twitter`,
    contact: ql.contact || `https://www.google.com/search?q=${name}+contact`,
  }
}

// Quick Link Button Component
const QuickLinkButton = ({ href, icon, label, color, fullWidth = false }) => {
  if (!href) return null
  
  const isExternal = href.startsWith('http')
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`
        flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-white text-[10px] font-medium
        ${color} hover:opacity-90 transition-opacity whitespace-nowrap
        ${fullWidth ? 'w-full' : 'min-w-0'}
      `}
      title={label}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  )
}

const LenderMatcher = () => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssetClass, setFilterAssetClass] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [loanAmount, setLoanAmount] = useState('')
  const [expandedQuickLinks, setExpandedQuickLinks] = useState({})
  
  // Data State
  const [lenders, setLenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [lenderTypes, setLenderTypes] = useState([])
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(100)
  const [total, setTotal] = useState(0)
  
  // Load lenders from API
  useEffect(() => {
    const loadLenders = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Build query params
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        
        if (searchQuery) params.append('search', searchQuery)
        if (filterType !== 'all') params.append('lender_type', filterType)
        if (filterAssetClass !== 'all') params.append('asset_class', filterAssetClass)
        
        const res = await fetch(`${API_BASE}/lenders?${params}`)
        if (!res.ok) throw new Error('Failed to load lenders')
        
        const data = await res.json()
        setLenders(data.lenders || [])
        setTotal(data.total || 0)
      } catch (err) {
        console.error('Error loading lenders:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadLenders()
  }, [page, limit, searchQuery, filterType, filterAssetClass])
  
  // Load stats and filter options
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load stats
        const statsRes = await fetch(`${API_BASE}/lenders/stats`)
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        
        // Load filter options
        const optionsRes = await fetch(`${API_BASE}/lenders/filter-options`)
        if (optionsRes.ok) {
          const optionsData = await optionsRes.json()
          setLenderTypes(optionsData.lender_types || [])
        }
      } catch (err) {
        console.error('Error loading stats:', err)
      }
    }
    
    loadStats()
  }, [])
  
  // Toggle quick links
  const toggleQuickLinks = (lenderId) => {
    setExpandedQuickLinks(prev => ({
      ...prev,
      [lenderId]: !prev[lenderId]
    }))
  }
  
  // Filter by loan amount (client-side)
  const filteredLenders = useMemo(() => {
    if (!loanAmount) return lenders
    
    const amount = parseInt(loanAmount.replace(/[^0-9]/g, ''))
    if (!amount) return lenders
    
    // For demo purposes, show all (we don't have min/max in DB yet)
    return lenders
  }, [lenders, loanAmount])
  
  // Group by asset class for display
  const groupedByAssetClass = useMemo(() => {
    const groups = {}
    filteredLenders.forEach(lender => {
      const specs = lender.asset_specializations?.split('|') || ['Commercial']
      const primary = specs[0] || 'Commercial'
      
      if (!groups[primary]) groups[primary] = []
      groups[primary].push(lender)
    })
    return groups
  }, [filteredLenders])
  
  const totalPages = Math.ceil(total / limit)
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-500" />
              Lender Matcher
            </h1>
            <p className="text-slate-400 mt-1">Connect properties and buyers with specialized commercial lenders across Ontario.</p>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>Filter 5,000+ lenders by asset-class specialization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>View lender notes, contact info, and territory coverage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              <span>Match financing sources to distressed or high-value deals</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Stats Panel */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-text-muted text-xs">Total Lenders</p>
            <p className="text-2xl font-bold text-text-primary">{stats.total.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-text-muted text-xs">Banks</p>
            <p className="text-2xl font-bold text-accent-blue">{(stats.by_type?.Bank || 0).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-text-muted text-xs">Insurance</p>
            <p className="text-2xl font-bold text-accent-purple">{(stats.by_type?.Insurance || 0).toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-text-muted text-xs">Private Lenders</p>
            <p className="text-2xl font-bold text-accent-orange">{(stats.by_type?.['Private Lender'] || 0).toLocaleString()}</p>
          </div>
        </div>
      )}
      
      {/* Asset Class Filter */}
      <div className="card p-4">
        <p className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Filter by Asset Class
        </p>
        <div className="flex flex-wrap gap-2">
          {ASSET_CLASSES.map(asset => (
            <button
              key={asset.id}
              onClick={() => {
                setFilterAssetClass(asset.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterAssetClass === asset.id 
                  ? `${asset.color} text-white shadow-lg` 
                  : 'bg-bg-input text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {asset.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Search & Filters */}
      <div className="card p-5">
        <h3 className="font-semibold text-text-primary mb-4">Search Lenders</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Search by Name</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search lenders... (Press Enter)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    setExpandedQuickLinks({})
                  }
                }}
                className="w-full pl-10 pr-20 py-2 bg-bg-input border border-border-subtle rounded-lg"
              />
              <button
                onClick={() => {
                  setPage(1)
                  setExpandedQuickLinks({})
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-accent-green hover:bg-accent-green/80 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                Search
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Lender Type</label>
            <select 
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setPage(1)
              }}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            >
              <option value="all">All Types</option>
              {lenderTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Loan Amount Needed</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="e.g. 5000000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Count & Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-text-secondary">
          Showing {filteredLenders.length.toLocaleString()} of {total.toLocaleString()} lenders
          {searchQuery && <span className="text-accent-blue ml-2">"{searchQuery}"</span>}
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 bg-bg-input rounded-lg disabled:opacity-50 text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Previous
            </button>
            <span className="text-text-secondary px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 bg-bg-input rounded-lg disabled:opacity-50 text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 className="w-12 h-12 text-accent-green mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Loading lenders...</h3>
          <p className="text-text-secondary">Fetching from database</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="card p-12 text-center border-accent-red/30">
          <X className="w-16 h-16 text-accent-red mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Failed to load lenders</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-green text-white rounded-lg hover:bg-accent-green/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Results */}
      {!loading && !error && (
        <div className="space-y-6">
          {Object.entries(groupedByAssetClass).map(([assetClass, classLenders]) => (
            <div key={assetClass} className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${ASSET_CLASSES.find(a => a.id === assetClass)?.color || 'bg-gray-500'}`} />
                {assetClass}
                <span className="text-sm text-text-muted font-normal">({classLenders.length})</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classLenders.map((lender) => {
                  const links = generateQuickLinks(lender)
                  const isExpanded = expandedQuickLinks[lender.id]
                  
                  return (
                    <div key={lender.id} className="card p-5 hover:shadow-lg transition-all">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-text-primary">{lender.name}</h4>
                          <p className="text-sm text-accent-green">{lender.lender_type}</p>
                        </div>
                        <span className="flex items-center gap-1 text-sm text-accent-yellow">
                          <Star className="w-4 h-4 fill-current" />
                          4.5
                        </span>
                      </div>
                      
                      {/* Domain */}
                      {lender.domain && (
                        <p className="text-xs text-text-muted mb-3 truncate">{lender.domain}</p>
                      )}
                      
                      {/* Specializations */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {lender.asset_specializations?.split('|').map((spec, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-bg-input text-text-secondary">
                            {spec}
                          </span>
                        ))}
                      </div>
                      
                      {/* Primary Quick Links */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <a
                          href={links.website || links.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors group"
                        >
                          <Globe className="w-5 h-5 text-purple-500" />
                          <span className="text-[10px] text-text-secondary group-hover:text-purple-400">Web</span>
                        </a>
                        <a
                          href={links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors group"
                        >
                          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                          <span className="text-[10px] text-text-secondary group-hover:text-[#0A66C2]">LI</span>
                        </a>
                        <a
                          href={links.google}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 transition-colors group"
                        >
                          <Search className="w-5 h-5 text-slate-500" />
                          <span className="text-[10px] text-text-secondary group-hover:text-slate-400">Google</span>
                        </a>
                        <a
                          href={links.contact}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group"
                        >
                          <Mail className="w-5 h-5 text-emerald-500" />
                          <span className="text-[10px] text-text-secondary group-hover:text-emerald-400">Contact</span>
                        </a>
                      </div>
                      
                      {/* Expand Quick Links Button */}
                      <button
                        onClick={() => toggleQuickLinks(lender.id)}
                        className="w-full py-2 bg-bg-input/50 hover:bg-bg-input border-t border-border-subtle flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Quick Links
                          </>
                        ) : (
                          <>
                            <MoreHorizontal className="w-4 h-4" />
                            Quick Links
                          </>
                        )}
                      </button>
                      
                      {/* Expanded Quick Links */}
                      {isExpanded && (
                        <div className="border-t border-border-subtle bg-bg-input/30 p-4 space-y-3 mt-0">
                          {/* Social & Professional */}
                          <div>
                            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Share2 className="w-3 h-3" />
                              Social & Professional
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <QuickLinkButton 
                                href={links.linkedin} 
                                icon={<Linkedin className="w-3.5 h-3.5" />} 
                                label="LinkedIn"
                                color="bg-[#0A66C2]"
                              />
                              <QuickLinkButton 
                                href={links.facebook} 
                                icon={<Facebook className="w-3.5 h-3.5" />} 
                                label="Facebook"
                                color="bg-[#1877F2]"
                              />
                              <QuickLinkButton 
                                href={links.instagram} 
                                icon={<Instagram className="w-3.5 h-3.5" />} 
                                label="Instagram"
                                color="bg-gradient-to-br from-purple-500 to-pink-500"
                              />
                            </div>
                          </div>
                          
                          {/* Contact */}
                          <div>
                            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" />
                              Contact
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <QuickLinkButton 
                                href={links.contact} 
                                icon={<Mail className="w-3.5 h-3.5" />} 
                                label="Contact Page"
                                color="bg-emerald-500"
                              />
                              <QuickLinkButton 
                                href={links.linkedin_president} 
                                icon={<Linkedin className="w-3.5 h-3.5" />} 
                                label="CEO LinkedIn"
                                color="bg-blue-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && filteredLenders.length === 0 && (
        <div className="card p-12 text-center">
          <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No lenders found</h3>
          <p className="text-text-secondary">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}

export default LenderMatcher
