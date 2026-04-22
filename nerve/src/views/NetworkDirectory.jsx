import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Building2, Briefcase, User, Users,
  ExternalLink, Phone, Mail, Globe, Linkedin, Facebook,
  Star, Filter, X, Loader2, ChevronRight
} from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud') + '/api'

const CONFIG = {
  recruiters: {
    label: 'Recruit Agents',
    endpoint: '/recruiters',
    statsEndpoint: '/recruiters/stats',
    icon: Users,
    filterKey: 'city',
    cardFields: ['name', 'company', 'city', 'job_title', 'brokerage'],
    searchFields: ['name', 'company', 'city', 'brokerage'],
    showCount: 96265
  },
  commercial: {
    label: 'Commercial Agents',
    endpoint: '/brokerages',
    statsEndpoint: '/brokerages/stats',
    icon: Building2,
    filterKey: 'city',
    cardFields: ['name', 'city', 'region', 'broker_of_record'],
    searchFields: ['name', 'city', 'region'],
    showCount: 3884
  },
  lenders: {
    label: 'Lenders',
    endpoint: '/lenders',
    statsEndpoint: '/lenders/stats',
    icon: Briefcase,
    filterKey: 'city',
    cardFields: ['name', 'city', 'lender_type', 'asset_specializations'],
    searchFields: ['name', 'city', 'lender_type'],
    showCount: 5113
  },
  builders: {
    label: 'Builders',
    endpoint: '/data-manager/builders',
    icon: Building2,
    filterKey: 'city',
    cardFields: ['name', 'city', 'province', 'phone'],
    searchFields: ['name', 'city', 'province'],
    showCount: 3884,
    dataKey: 'data'
  }
}

function generateQuickLinks(item) {
  const name = encodeURIComponent(item.name || '')
  const city = encodeURIComponent(item.city || '')
  return {
    google: `https://www.google.com/search?q=${name}`,
    linkedin: `https://www.google.com/search?q=${name}+linkedin`,
    contact: `https://www.google.com/search?q=${name}+contact`,
    website: item.website || item.domain || null
  }
}

export default function NetworkDirectory() {
  const { type } = useParams()
  const navigate = useNavigate()
  const config = CONFIG[type]

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [filters, setFilters] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)

  const pageSize = 25

  useEffect(() => {
    if (!config) return
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    params.set('page', page)
    params.set('limit', pageSize)
    if (search) params.set('search', search)

    fetch(`${API_BASE}${config.endpoint}?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => {
        const list = config.dataKey ? data[config.dataKey] : (data.recruiters || data.brokerages || data.lenders || data.data || [])
        setItems(list)
        setTotal(data.total || list.length)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load')
        setLoading(false)
      })
  }, [type, page, search, config])

  // Build filter chips from loaded items
  useEffect(() => {
    if (!items.length) return
    const key = config.filterKey
    const vals = [...new Set(items.map(i => i[key]).filter(Boolean))].slice(0, 12)
    setFilters(vals)
  }, [items, config])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter(i => i[config.filterKey] === filter)
  }, [items, filter, config])

  if (!config) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p>Unknown network type: {type}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-accent-blue hover:underline">Go back</button>
      </div>
    )
  }

  const Icon = config.icon

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-7 h-7 text-accent-blue" />
          <h1 className="text-2xl font-bold">{config.label}</h1>
        </div>
        <p className="text-text-muted">
          {config.showCount?.toLocaleString()}+ professionals in the network
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder={`Search ${config.label.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-blue"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-muted hover:text-text-primary'
              }`}
            >
              All
            </button>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f === filter ? 'all' : f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  f === filter ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-muted hover:text-text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
          <span className="ml-2 text-text-muted">Loading...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">No results found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, idx) => {
              const ql = generateQuickLinks(item)
              return (
                <div key={item.id || idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-accent-blue/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.company && <p className="text-xs text-text-muted">{item.company}</p>}
                    </div>
                    {item.score_tier && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        item.score_tier === 'HOT' ? 'bg-red-500/20 text-red-400' :
                        item.score_tier === 'WARM' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.score_tier}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {item.city && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <MapPin className="w-3 h-3" />
                        <span>{item.city}{item.region || item.province ? `, ${item.region || item.province}` : ''}</span>
                      </div>
                    )}
                    {item.job_title && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <User className="w-3 h-3" />
                        <span>{item.job_title}</span>
                      </div>
                    )}
                    {item.brokerage && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Building2 className="w-3 h-3" />
                        <span>{item.brokerage}</span>
                      </div>
                    )}
                    {item.lender_type && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Briefcase className="w-3 h-3" />
                        <span>{item.lender_type}</span>
                      </div>
                    )}
                    {item.asset_specializations && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Star className="w-3 h-3" />
                        <span className="truncate">{item.asset_specializations}</span>
                      </div>
                    )}
                    {item.broker_of_record && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <User className="w-3 h-3" />
                        <span>{item.broker_of_record}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border-subtle/50">
                    <a
                      href={ql.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-bg-input rounded text-[10px] text-text-muted hover:text-text-primary transition-colors"
                      title="View Profile"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Profile
                    </a>
                    {ql.website && (
                      <a
                        href={ql.website.startsWith('http') ? ql.website : `https://${ql.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-bg-input rounded text-[10px] text-text-muted hover:text-text-primary transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        Site
                      </a>
                    )}
                    <a
                      href={ql.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-bg-input rounded text-[10px] text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </a>
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="flex items-center gap-1 px-2 py-1 bg-bg-input rounded text-[10px] text-text-muted hover:text-text-primary transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-bg-input rounded-lg text-sm disabled:opacity-40 hover:bg-bg-card border border-border-subtle"
              >
                Prev
              </button>
              <span className="text-sm text-text-muted">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1.5 bg-bg-input rounded-lg text-sm disabled:opacity-40 hover:bg-bg-card border border-border-subtle"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
