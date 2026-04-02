import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Search, X, Loader2, Building2, Users, Landmark, Home, 
  Briefcase, ChevronRight, Clock, TrendingUp, MapPin,
  Filter, ArrowRight
} from 'lucide-react'
import { 
  globalSearch, getRecentSearches, saveRecentSearch, 
  MODULE_CONFIG, getModuleCounts 
} from '../utils/unifiedSearchDatabase'

/**
 * Global Search Component
 * Unified search across all Mission Control modules
 * 
 * USAGE:
 * <GlobalSearch 
 *   onResultClick={(result) => navigate(result.route)}
 *   placeholder="Search builders, agents, lenders, properties..."
 * />
 */

const GlobalSearch = ({ onResultClick, placeholder = "Search everything...", className = '' }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [moduleCounts, setModuleCounts] = useState({})
  const [selectedModule, setSelectedModule] = useState('all')
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Load recent searches and counts on mount
  useEffect(() => {
    loadRecentSearches()
    loadModuleCounts()
  }, [])

  const loadRecentSearches = async () => {
    const recent = await getRecentSearches(5)
    setRecentSearches(recent)
  }

  const loadModuleCounts = async () => {
    const counts = await getModuleCounts()
    setModuleCounts(counts)
  }

  // Search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedModule])

  const performSearch = async () => {
    setLoading(true)
    
    const modules = selectedModule === 'all' 
      ? Object.keys(MODULE_CONFIG)
      : [selectedModule]
    
    const searchResults = await globalSearch(query, { modules, limit: 10 })
    setResults(searchResults)
    setLoading(false)
    
    // Save to recent if we have results
    if (searchResults.length > 0) {
      await saveRecentSearch(query, selectedModule === 'all' ? null : selectedModule, searchResults.length)
      loadRecentSearches()
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleResultClick = (result) => {
    setShowDropdown(false)
    setQuery('')
    if (onResultClick) onResultClick(result)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  // Group results by module
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.module]) acc[result.module] = []
    acc[result.module].push(result)
    return acc
  }, {})

  const moduleIcons = {
    builders: Building2,
    agents: Users,
    lenders: Landmark,
    properties: Home,
    buyers: Briefcase
  }

  const moduleLabels = {
    builders: 'Builders',
    agents: 'Agents',
    lenders: 'Lenders',
    properties: 'Properties',
    buyers: 'Buyers'
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 bg-bg-input border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
        />
        
        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-hover rounded"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        )}
        
        {/* Module filter */}
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-primary border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-secondary"
        >
          <option value="all">All</option>
          {Object.entries(moduleLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-primary border border-border-subtle rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
          
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Search Results
                </span>
                <span className="text-xs text-text-muted">
                  {results.length} found
                </span>
              </div>
              
              {Object.entries(groupedResults).map(([module, items]) => {
                const Icon = moduleIcons[module]
                return (
                  <div key={module} className="mb-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-bg-input/50 rounded-lg mx-1">
                      <Icon className="w-4 h-4 text-accent-blue" />
                      <span className="text-sm font-medium text-text-secondary">
                        {moduleLabels[module]}
                      </span>
                      <span className="text-xs text-text-muted ml-auto">
                        {items.length}
                      </span>
                    </div>
                    
                    {items.map((result, idx) => (
                      <button
                        key={`${result.id}-${idx}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-input rounded-lg transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-lg">
                          {result.display.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate group-hover:text-accent-blue transition-colors">
                            {result.display.title}
                          </p>
                          <p className="text-sm text-text-muted truncate">
                            {result.display.subtitle}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
              <span className="ml-2 text-text-secondary">Searching...</span>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No results found</p>
              <p className="text-sm text-text-muted mt-1">
                Try different keywords or filters
              </p>
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2 border-t border-border-subtle">
              <div className="flex items-center gap-2 px-3 py-2">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Recent Searches
                </span>
              </div>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(search.query)
                    if (search.module) setSelectedModule(search.module)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-input rounded-lg transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-text-secondary">{search.query}</span>
                  {search.module && (
                    <span className="text-xs px-2 py-0.5 rounded bg-bg-input text-text-muted">
                      {moduleLabels[search.module]}
                    </span>
                  )}
                  <span className="text-xs text-text-muted ml-auto">
                    {new Date(search.timestamp).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {!query && (
            <div className="p-4 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-text-muted" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Database Overview
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(moduleLabels).map(([key, label]) => {
                  const Icon = moduleIcons[key]
                  const count = moduleCounts[key] || 0
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedModule(key)}
                      className={`p-3 rounded-lg border transition-all text-center ${
                        selectedModule === key 
                          ? 'border-accent-blue bg-accent-blue/10' 
                          : 'border-border-subtle hover:border-accent-blue/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1 text-text-muted" />
                      <p className="text-lg font-bold text-text-primary">{count}</p>
                      <p className="text-xs text-text-muted">{label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
