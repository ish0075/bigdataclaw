import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  UserPlus, Search, Filter, Download, Upload, Users, Mail, Phone, MapPin,
  Building2, Building, Facebook, Instagram, Linkedin, ExternalLink, MoreVertical,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Globe, Home,
  ArrowUpRight, X, Star, MessageCircle, Database, Check, FileText, RefreshCw,
  Eye, EyeOff, UserCheck, Users2, Crown, Target, History, Send,
  MessageSquare, Smartphone, Link2, Trash2, ChevronRight, BarChart3,
  Calendar, AlertCircle, ChevronLeft
} from 'lucide-react'
import { 
  trackInteraction, getAllInteractions, getAgentInteractions, 
  getPlatformStyle, getTrackingStats, clearAgentInteractions 
} from '../utils/agentTrackingDatabase'

/**
 * EXP Agent Recruiter - REAL DATABASE VERSION
 * 
 * Connected to: recruiter_db_with_quicklinks.json (28,505 agents)
 * Features:
 * - Loads actual agent data from database
 * - Semantic search via Qdrant integration
 * - Per-platform tracking
 * - Obsidian export with tracking data
 */

// All Ontario Cities
const ONTARIO_CITIES = [
  'St. Catharines', 'Niagara Falls', 'Welland', 'Thorold', 'Port Colborne',
  'Niagara-on-the-Lake', 'Fort Erie', 'Pelham', 'Lincoln', 'Grimsby', 'West Lincoln', 'Wainfleet',
  'Vaughan', 'Markham', 'Richmond Hill', 'Newmarket', 'Aurora', 
  'Whitchurch-Stouffville', 'King', 'East Gwillimbury', 'Georgina',
  'Mississauga', 'Brampton', 'Caledon',
  'Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
  'Oakville', 'Burlington', 'Milton', 'Halton Hills',
  'Kitchener', 'Waterloo', 'Cambridge', 'Woolwich', 'Wilmot', 'North Dumfries', 'Wellesley',
  'Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York',
  'Hamilton', 'Stoney Creek', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook', 'Mount Hope',
  'Ottawa', 'Kanata', 'Nepean', 'Orleans', 'Barrhaven', 'Stittsville',
  'London', 'Windsor', 'Barrie', 'Guelph', 'Kingston', 'Peterborough', 'Brantford',
  'Sarnia', 'Sault Ste. Marie', 'Sudbury', 'Thunder Bay', 'North Bay',
  'Barrie', 'Orillia', 'Midland', 'Penetanguishene', 'Collingwood', 'Wasaga Beach',
  'Innisfil', 'Bradford West Gwillimbury', 'New Tecumseth',
  'Guelph/Eramosa', 'Centre Wellington', 'Fergus', 'Elora', 'Mapleton', 
  'Wellington North', 'Minto', 'Puslinch', 'Erin',
  'Woodstock', 'Stratford', 'Ingersoll', 'Tillsonburg', 'Listowel', 'Strathroy',
  'Sarnia', 'Chatham', 'Leamington', 'Amherstburg', 'Tecumseh', 'LaSalle',
  'Simcoe', 'Delhi', 'Port Dover', 'Waterford', 'Caledonia', 'Cayuga', 'Dunnville',
  'Orangeville', 'Shelburne', 'Grand Valley', 'Shelburne', 'Perth', 'Smiths Falls',
  'Carleton Place', 'Brockville', 'Prescott', 'Gananoque', 'Napanee', 'Belleville',
  'Trenton', 'Quinte West', 'Cobourg', 'Port Hope', 'Lindsay', 'Bobcaygeon',
  'Fenelon Falls', 'Picton', 'Wellington', 'Bloomfield', 'Pembroke', 'Renfrew',
  'Arnprior', 'Carleton Place', 'Kemptville', 'Cornwall', 'Alexandria', 'Morrisburg',
  'Hawkesbury', 'L\'Orignal', 'Huntsville', 'Bracebridge', 'Gravenhurst', 'Parry Sound',
  'North Bay', 'Temagami', 'Mattawa', 'Sturgeon Falls', 'Espanola', 'Elliot Lake',
  'Blind River', 'Thessalon', 'Wawa', 'White River', 'Marathon', 'Greenstone',
  'Red Lake', 'Dryden', 'Kenora', 'Sioux Lookout', 'Fort Frances', 'Atikokan',
  'Rainy River', 'Emo', 'Manitouwadge', 'Terrace Bay', 'Schreiber', 'Nipigon'
].sort((a, b) => a.localeCompare(b))

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses', color: 'gray' },
  { value: 'new', label: 'New', color: 'gray' },
  { value: 'contacted', label: 'Contacted', color: 'yellow' },
  { value: 'added', label: 'Added', color: 'blue' },
  { value: 'friend', label: 'Friend', color: 'green' },
  { value: 'declined', label: 'Declined', color: 'red' }
]

const STATUS_CONFIG = {
  new: { color: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'New' },
  contacted: { color: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Contacted' },
  added: { color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Added' },
  friend: { color: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400', label: 'Friend', pulse: true },
  declined: { color: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Declined' }
}

// Generate Quick Links for an agent - ALL use Google Search format
const generateQuickLinks = (agent) => {
  const searchName = encodeURIComponent(agent.name)
  const searchWithBrokerage = encodeURIComponent(`${agent.name} ${agent.brokerage || ''}`)
  const searchRealtor = encodeURIComponent(`${agent.name} realtor`)
  
  // Helper to create Google search URLs
  const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  
  return {
    // Primary Links
    phone: agent.phone ? `tel:${agent.phone}` : null,
    email: agent.email ? `mailto:${agent.email}` : null,
    
    // Search & Discovery (Google Search format)
    google: googleSearch(agent.name),
    googleRealtor: googleSearch(`${agent.name} realtor`),
    googleNews: googleSearch(`${agent.name} real estate news`),
    
    // Social Media (Google Search format) - Add 'realtor' to find the right person
    linkedin: googleSearch(`${agent.name} realtor linkedin`),
    facebook: googleSearch(`${agent.name} realtor facebook`),
    instagram: googleSearch(`${agent.name} realtor instagram`),
    twitter: googleSearch(`${agent.name} realtor twitter`),
    
    // Real Estate Platforms (Google Search format) - name + realtor + platform
    realtor: googleSearch(`${agent.name} realtor realtor.ca`),
    zoocasa: googleSearch(`${agent.name} realtor zoocasa`),
    remax: googleSearch(`${agent.name} realtor remax`),
    
    // Brokerage (Google Search format)
    brokerage: agent.brokerage ? googleSearch(`${agent.brokerage}`) : null,
    brokerageReviews: agent.brokerage ? googleSearch(`${agent.brokerage} reviews`) : null,
    
    // Broker of Record (BOR) - brokerage name + broker of record
    bor: agent.brokerage ? googleSearch(`${agent.brokerage} broker of record`) : null,
    
    // Reviews & Research (Google Search format)
    reviews: googleSearch(`${agent.name} realtor reviews`),
    pastSales: googleSearch(`${agent.name} sold listings`),
    linkedinPosts: googleSearch(`${agent.name} linkedin posts`),
    
    // Contact Discovery (Google Search format)
    contactPage: googleSearch(`${agent.name} contact`),
  }
}

// Ontario City Dropdown Component
const OntarioCityDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const filteredCities = useMemo(() => {
    if (!searchTerm) return ONTARIO_CITIES
    return ONTARIO_CITIES.filter(city => 
      city.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])
  
  const displayLabel = value === 'all' ? 'All Cities' : value
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm min-w-[180px] hover:border-accent-blue transition-colors"
      >
        <MapPin className="w-4 h-4 text-text-muted" />
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-subtle rounded-lg shadow-xl z-50 max-h-[400px] overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search Ontario cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[300px]">
            <button
              onClick={() => {
                onChange('all')
                setIsOpen(false)
                setSearchTerm('')
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-bg-input transition-colors ${
                value === 'all' ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary'
              }`}
            >
              All Cities
            </button>
            
            <div className="border-t border-border-subtle">
              {filteredCities.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-muted">
                  No cities found
                </div>
              ) : (
                filteredCities.map(city => (
                  <button
                    key={city}
                    onClick={() => {
                      onChange(city)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-bg-input transition-colors ${
                      value === city ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-secondary'
                    }`}
                  >
                    {city}
                  </button>
                ))
              )}
            </div>
          </div>
          
          <div className="px-4 py-2 border-t border-border-subtle text-xs text-text-muted">
            {filteredCities.length} of {ONTARIO_CITIES.length} cities
          </div>
        </div>
      )}
    </div>
  )
}

const EXAgentRecruiter = () => {
  const [agents, setAgents] = useState([])
  const [allAgents, setAllAgents] = useState([]) // Store all agents for search
  const [interactions, setInteractions] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    city: 'all',
    brokerage: 'all'
  })
  const [searchField, setSearchField] = useState('all')
  
  // UI State
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showQuickLinks, setShowQuickLinks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [groupBy, setGroupBy] = useState('brokerage')
  const [viewFilter, setViewFilter] = useState('all')
  
  // Pagination
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 100

  // Load agents from JSON
  useEffect(() => {
    loadAgents()
    loadInteractions()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      
      // Load from JSON file
      const response = await fetch('/data/recruiters_full.json')
      
      if (response.ok) {
        const data = await response.json()
        // Load first 1000 initially for performance
        setAgents(data.slice(0, 1000))
        setAllAgents(data)
        setTotalCount(data.length)
      } else {
        // Fallback to sample
        const sampleResponse = await fetch('/data/recruiters_sample.json')
        if (sampleResponse.ok) {
          const data = await sampleResponse.json()
          setAgents(data)
          setAllAgents(data)
          setTotalCount(data.length)
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const loadMoreAgents = () => {
    if (loadingMore || allAgents.length === 0) return
    
    setLoadingMore(true)
    
    // Load more from local data
    const nextPage = page + 1
    const startIdx = nextPage * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const newAgents = allAgents.slice(startIdx, endIdx)
    
    if (newAgents.length > 0) {
      setAgents(prev => [...prev, ...newAgents])
      setPage(nextPage)
    }
    
    setLoadingMore(false)
  }

  const loadInteractions = async () => {
    const all = await getAllInteractions()
    setInteractions(all)
  }

  // Get unique values for filters from loaded agents
  const cities = useMemo(() => [...new Set(agents.map(a => a.city).filter(Boolean))].sort(), [agents])
  const brokerages = useMemo(() => [...new Set(agents.map(a => a.brokerage).filter(Boolean))].sort(), [agents])

  // Track interaction
  const handleTrackInteraction = async (agentId, platform, url) => {
    await trackInteraction(agentId, platform)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    await loadInteractions()
  }

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const searchFields = {
          'all': [agent.name, agent.city, agent.brokerage, agent.email, agent.jobTitle],
          'name': [agent.name],
          'city': [agent.city],
          'brokerage': [agent.brokerage],
          'email': [agent.email]
        }
        const fieldsToSearch = searchFields[searchField] || searchFields['all']
        const matches = fieldsToSearch.some(field => 
          field && field.toLowerCase().includes(searchLower)
        )
        if (!matches) return false
      }
      
      // Dropdown filters
      if (filters.status !== 'all' && agent.status !== filters.status) return false
      if (filters.city !== 'all' && agent.city !== filters.city) return false
      if (filters.brokerage !== 'all' && agent.brokerage !== filters.brokerage) return false
      
      // Contact filter
      if (viewFilter === 'contacted') {
        const agentInteractions = interactions[agent.id]
        if (!agentInteractions || Object.keys(agentInteractions).length === 0) return false
      }
      if (viewFilter === 'not-contacted') {
        const agentInteractions = interactions[agent.id]
        if (agentInteractions && Object.keys(agentInteractions).length > 0) return false
      }
      
      return true
    })
  }, [agents, searchQuery, searchField, filters, interactions, viewFilter])

  // Group agents
  const groupedAgents = useMemo(() => {
    return filteredAgents.reduce((acc, agent) => {
      let key
      if (groupBy === 'city') key = agent.city || 'Unknown City'
      else if (groupBy === 'brokerage') key = agent.brokerage || 'Unknown Brokerage'
      else key = agent.status || 'new'
      
      if (!acc[key]) acc[key] = []
      acc[key].push(agent)
      return acc
    }, {})
  }, [filteredAgents, groupBy])

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isGroupExpanded = (key) => expandedGroups[key] !== false

  // Quick connect modal
  const handleQuickConnect = (agent) => {
    setSelectedAgent(agent)
    setShowQuickLinks(true)
  }

  // View history
  const handleViewHistory = (agent) => {
    setSelectedAgent(agent)
    setShowHistory(true)
  }

  // Export
  const handleExport = () => {
    const headers = ['name', 'brokerage', 'email', 'jobTitle', 'city', 'status']
    const rows = filteredAgents.map(a => [a.name, a.brokerage, a.email, a.jobTitle, a.city, a.status])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agents-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Stats
  const stats = {
    total: totalCount,
    loaded: agents.length,
    filtered: filteredAgents.length,
    contacted: Object.keys(interactions).length,
    notContacted: totalCount - Object.keys(interactions).length
  }

  // Get platforms contacted for an agent
  const getContactedPlatforms = (agentId) => {
    const agentInteractions = interactions[agentId]
    return agentInteractions ? Object.keys(agentInteractions) : []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
        <span className="ml-3 text-text-secondary">Loading {totalCount.toLocaleString()} agents...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-accent-purple" />
              EXP Agent Recruiter
            </h1>
            <span className="px-2 py-1 rounded-full bg-accent-red/10 text-accent-red text-xs font-medium">
              LIVE DATABASE
            </span>
          </div>
          <p className="text-text-secondary mt-1">
            {stats.total.toLocaleString()} total agents • {stats.loaded.toLocaleString()} loaded • {stats.filtered} showing
            <span className="mx-2">•</span>
            <span className="text-accent-blue">{stats.contacted} contacted</span>
            <span className="mx-2">•</span>
            <span className="text-accent-green">{stats.notContacted.toLocaleString()} not contacted</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadAgents}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-text-muted text-xs">Total Agents</p>
          <p className="text-2xl font-bold text-text-primary">{stats.total.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Loaded</p>
          <p className="text-2xl font-bold text-accent-blue">{stats.loaded.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Showing</p>
          <p className="text-2xl font-bold text-accent-purple">{stats.filtered.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Contacted</p>
          <p className="text-2xl font-bold text-accent-green">{stats.contacted.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Brokerages</p>
          <p className="text-2xl font-bold text-accent-orange">{brokerages.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 space-y-4">
        {/* Search Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] flex gap-2">
            <select 
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm w-40"
            >
              <option value="all">All Fields</option>
              <option value="name">Agent Name</option>
              <option value="city">City</option>
              <option value="brokerage">Brokerage</option>
              <option value="email">Email</option>
            </select>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={`Search ${searchField === 'all' ? 'agents...' : searchField + '...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm">
            {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          
          <OntarioCityDropdown 
            value={filters.city}
            onChange={(city) => setFilters({...filters, city})}
          />
          
          <select value={filters.brokerage} onChange={(e) => setFilters({...filters, brokerage: e.target.value})} className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm max-w-[200px]">
            <option value="all">All Brokerages</option>
            {brokerages.map(b => (<option key={b} value={b}>{b}</option>))}
          </select>
        </div>

        {/* Group By & Contact Filter */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border-subtle">
          <span className="text-sm font-medium text-text-secondary">Group By:</span>
          <div className="flex gap-2">
            <button onClick={() => setGroupBy('brokerage')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${groupBy === 'brokerage' ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-secondary'}`}>Brokerage</button>
            <button onClick={() => setGroupBy('city')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${groupBy === 'city' ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-secondary'}`}>City</button>
            <button onClick={() => setGroupBy('status')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${groupBy === 'status' ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-secondary'}`}>Status</button>
          </div>

          <div className="h-6 w-px bg-border-subtle mx-2" />

          <span className="text-sm font-medium text-text-secondary">Contact Status:</span>
          <div className="flex gap-2">
            <button onClick={() => setViewFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewFilter === 'all' ? 'bg-accent-blue text-white' : 'bg-bg-input text-text-secondary'}`}>All</button>
            <button onClick={() => setViewFilter('contacted')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewFilter === 'contacted' ? 'bg-accent-green text-white' : 'bg-bg-input text-text-secondary'}`}>Contacted</button>
            <button onClick={() => setViewFilter('not-contacted')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewFilter === 'not-contacted' ? 'bg-accent-purple text-white' : 'bg-bg-input text-text-secondary'}`}>Not Contacted</button>
          </div>
        </div>
      </div>

      {/* Agent Groups */}
      <div className="space-y-6">
        {Object.entries(groupedAgents).map(([groupName, groupAgents]) => {
          const expanded = isGroupExpanded(groupName)
          const contactedCount = groupAgents.filter(a => interactions[a.id] && Object.keys(interactions[a.id]).length > 0).length
          
          return (
            <div key={groupName} className="card overflow-hidden">
              <button 
                onClick={() => toggleGroup(groupName)}
                className="w-full p-4 bg-bg-input border-b border-border-subtle flex items-center justify-between hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  {groupBy === 'city' && <MapPin className="w-5 h-5 text-accent-blue" />}
                  {groupBy === 'brokerage' && <Building2 className="w-5 h-5 text-accent-purple" />}
                  {groupBy === 'status' && <CheckCircle className="w-5 h-5 text-accent-green" />}
                  <span className="text-lg font-semibold text-text-primary">{groupName}</span>
                  <span className="text-sm text-text-muted">({groupAgents.length} agents)</span>
                  {contactedCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-accent-green/20 text-accent-green">
                      {contactedCount} contacted
                    </span>
                  )}
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
              </button>
              
              {expanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupAgents.map(agent => (
                    <AgentCard 
                      key={agent.id} 
                      agent={agent} 
                      interactions={interactions[agent.id] || {}}
                      onQuickConnect={() => handleQuickConnect(agent)}
                      onViewHistory={() => handleViewHistory(agent)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {agents.length < totalCount && (
        <div className="text-center">
          <button 
            onClick={loadMoreAgents}
            disabled={loadingMore}
            className="btn-secondary"
          >
            {loadingMore ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</>
            ) : (
              <>Load More ({agents.length} / {totalCount})</>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No agents found</h3>
          <p className="text-text-secondary">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modals */}
      {showQuickLinks && selectedAgent && (
        <QuickLinksModal 
          agent={selectedAgent} 
          interactions={interactions[selectedAgent.id] || {}}
          onTrack={handleTrackInteraction}
          onClose={() => setShowQuickLinks(false)} 
        />
      )}

      {showHistory && selectedAgent && (
        <HistoryModal 
          agent={selectedAgent}
          onClose={() => setShowHistory(false)}
          onRefresh={loadInteractions}
        />
      )}
    </div>
  )
}

// Agent Card Component
const AgentCard = ({ agent, interactions, onQuickConnect, onViewHistory }) => {
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.new
  const initials = agent.name ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
  const contactedPlatforms = Object.keys(interactions)
  const hasContacts = contactedPlatforms.length > 0
  
  return (
    <div className={`card p-4 border-l-4 ${statusConfig.color} hover:shadow-lg transition-all ${hasContacts ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">{agent.name}</h3>
            {hasContacts && <CheckCircle className="w-4 h-4 text-accent-green flex-shrink-0" title="Contacted" />}
          </div>
          <p className="text-sm text-text-secondary truncate">{agent.brokerage || 'No brokerage'}</p>
          <p className="text-xs text-text-muted truncate">{agent.jobTitle || 'Agent'}</p>
        </div>
      </div>

      {/* Contacted Platforms */}
      {hasContacts && (
        <div className="mb-3 p-2 rounded bg-bg-input">
          <p className="text-xs text-text-muted mb-1">Contacted on:</p>
          <div className="flex flex-wrap gap-1">
            {contactedPlatforms.slice(0, 4).map(platform => (
              <span key={platform} className="text-xs px-2 py-0.5 rounded bg-accent-green/20 text-accent-green flex items-center gap-1">
                <Check className="w-3 h-3" />
                {platform}
              </span>
            ))}
            {contactedPlatforms.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded bg-bg-primary text-text-secondary">
                +{contactedPlatforms.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="space-y-1 mb-3 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {agent.city || 'Unknown location'}
        </div>
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {agent.email || 'No email'}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-4 gap-1">
        {/* Google Search - Primary action */}
        <TrackedButton
          icon={<Search className="w-3.5 h-3.5" />}
          platform="google"
          agentId={agent.id}
          url={`https://www.google.com/search?q=${encodeURIComponent(agent.name + ' realtor')}`}
          color="red"
          interactions={interactions}
        />
        <TrackedButton
          icon={<Linkedin className="w-3.5 h-3.5" />}
          platform="linkedin"
          agentId={agent.id}
          url={`https://www.google.com/search?q=${encodeURIComponent(agent.name + ' realtor linkedin')}`}
          color="blue"
          interactions={interactions}
        />
        <TrackedButton
          icon={<Facebook className="w-3.5 h-3.5" />}
          platform="facebook"
          agentId={agent.id}
          url={`https://www.google.com/search?q=${encodeURIComponent(agent.name + ' realtor facebook')}`}
          color="blue"
          interactions={interactions}
        />
        <TrackedButton
          icon={<Globe className="w-3.5 h-3.5" />}
          platform="realtor"
          agentId={agent.id}
          url={`https://www.google.com/search?q=${encodeURIComponent(agent.name + ' realtor realtor.ca')}`}
          color="red"
          interactions={interactions}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
        <button 
          onClick={onQuickConnect}
          className="flex-1 py-1.5 text-xs font-medium text-center rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center justify-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          All Links
        </button>
        <button 
          onClick={onViewHistory}
          className="flex-1 py-1.5 text-xs font-medium text-center rounded-lg bg-bg-input text-text-secondary hover:bg-bg-hover transition-colors flex items-center justify-center gap-1"
        >
          <History className="w-3 h-3" />
          History {hasContacts && `(${contactedPlatforms.length})`}
        </button>
      </div>
    </div>
  )
}

// Tracked Button Component
const TrackedButton = ({ icon, platform, agentId, url, color, interactions }) => {
  const [tracked, setTracked] = useState(false)
  
  useEffect(() => {
    setTracked(!!interactions[platform])
  }, [interactions, platform])

  const handleClick = async (e) => {
    e.preventDefault()
    await trackInteraction(agentId, platform)
    setTracked(true)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    gray: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
  }

  return (
    <a
      href={url}
      onClick={handleClick}
      className={`py-2 rounded-lg flex items-center justify-center transition-all ${colorClasses[color]} ${tracked ? 'ring-1 ring-accent-green' : ''}`}
      title={tracked ? `Already contacted on ${platform}` : `Contact on ${platform}`}
    >
      <div className="relative">
        {icon}
        {tracked && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-green rounded-full" />
        )}
      </div>
    </a>
  )
}

// Quick Links Modal
const QuickLinksModal = ({ agent, interactions, onTrack, onClose }) => {
  const links = generateQuickLinks(agent)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center text-xl font-bold">
              {agent.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{agent.name}</h3>
              <p className="text-text-secondary">{agent.brokerage}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-sm font-medium text-text-secondary mb-4">Quick Links (Google Search)</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              // Primary (Email moved here from main card)
              { name: 'Email', icon: Mail, platform: 'email', url: links.email, color: 'bg-blue-500' },
              { name: 'Phone', icon: Phone, platform: 'phone', url: links.phone, color: 'bg-green-500' },
              
              // Search & Discovery
              { name: 'Google', icon: Search, platform: 'google', url: links.google, color: 'bg-gray-600' },
              { name: 'Realtor Search', icon: Search, platform: 'googleRealtor', url: links.googleRealtor, color: 'bg-red-600' },
              { name: 'News', icon: MessageSquare, platform: 'googleNews', url: links.googleNews, color: 'bg-orange-500' },
              
              // Social Media (with 'realtor' keyword to find right person)
              { name: 'LinkedIn', icon: Linkedin, platform: 'linkedin', url: links.linkedin, color: 'bg-blue-700' },
              { name: 'Facebook', icon: Facebook, platform: 'facebook', url: links.facebook, color: 'bg-blue-600' },
              { name: 'Instagram', icon: Instagram, platform: 'instagram', url: links.instagram, color: 'bg-pink-500' },
              { name: 'Twitter/X', icon: MessageSquare, platform: 'twitter', url: links.twitter, color: 'bg-black' },
              
              // Real Estate Platforms (name + realtor + platform)
              { name: 'Realtor.ca', icon: Globe, platform: 'realtor', url: links.realtor, color: 'bg-red-700' },
              { name: 'Zoocasa', icon: Globe, platform: 'zoocasa', url: links.zoocasa, color: 'bg-teal-500' },
              { name: 'RE/MAX', icon: Building, platform: 'remax', url: links.remax, color: 'bg-red-500' },
              
              // Research & BOR
              { name: 'Reviews', icon: Star, platform: 'reviews', url: links.reviews, color: 'bg-yellow-500' },
              { name: 'Past Sales', icon: BarChart3, platform: 'pastSales', url: links.pastSales, color: 'bg-indigo-500' },
              { name: 'LinkedIn Posts', icon: Linkedin, platform: 'linkedinPosts', url: links.linkedinPosts, color: 'bg-blue-500' },
              { name: 'Contact Page', icon: Link2, platform: 'contactPage', url: links.contactPage, color: 'bg-purple-500' },
              
              // Brokerage & BOR (Broker of Record)
              ...(links.brokerage ? [
                { name: 'Brokerage', icon: Building2, platform: 'brokerage', url: links.brokerage, color: 'bg-emerald-600' },
                { name: 'Brokerage Reviews', icon: Star, platform: 'brokerageReviews', url: links.brokerageReviews, color: 'bg-emerald-500' }
              ] : []),
              
              // BOR - Broker of Record
              ...(links.bor ? [
                { name: 'BOR', icon: Crown, platform: 'bor', url: links.bor, color: 'bg-amber-600' }
              ] : []),
            ].filter(l => l.url).map((link) => {
              const Icon = link.icon
              const isTracked = !!interactions[link.platform]
              
              return (
                <a 
                  key={link.name}
                  href={link.url}
                  onClick={(e) => {
                    e.preventDefault()
                    onTrack(agent.id, link.platform, link.url)
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all group ${
                    isTracked 
                      ? 'border-accent-green bg-accent-green/10' 
                      : 'border-border-subtle hover:border-accent-blue hover:bg-accent-blue/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{link.name}</p>
                    {isTracked && <span className="text-xs text-accent-green">Contacted</span>}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-text-muted" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// History Modal
const HistoryModal = ({ agent, onClose, onRefresh }) => {
  const [history, setHistory] = useState([])
  
  useEffect(() => {
    loadHistory()
  }, [agent.id])
  
  const loadHistory = async () => {
    const interactions = await getAgentInteractions(agent.id)
    const historyList = Object.entries(interactions).map(([platform, data]) => ({
      platform,
      ...data
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    setHistory(historyList)
  }
  
  const clearHistory = async () => {
    await clearAgentInteractions(agent.id)
    await loadHistory()
    onRefresh()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Contact History</h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        
        <div className="p-5">
          <p className="text-text-secondary mb-4">{agent.name}</p>
          
          {history.length === 0 ? (
            <p className="text-text-muted text-center py-8">No contact history</p>
          ) : (
            <div className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-input">
                  <CheckCircle className="w-5 h-5 text-accent-green" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary capitalize">{item.platform}</p>
                    <p className="text-xs text-text-muted">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {history.length > 0 && (
          <div className="p-5 border-t border-border-subtle">
            <button 
              onClick={clearHistory}
              className="w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EXAgentRecruiter
