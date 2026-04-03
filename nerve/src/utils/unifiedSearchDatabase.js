/**
 * Unified Search Database
 * Global search across all Mission Control modules
 * 
 * MODULES:
 * - builders (home builders & developers)
 * - agents (residential real estate agents)
 * - lenders (mortgage lenders)
 * - properties (property listings/research)
 * - buyers (buyer profiles for matching)
 * 
 * FEATURES:
 * - Full-text search across all fields
 * - Faceted filtering by module, location, type
 * - Cross-module navigation
 * - Search suggestions
 * - Recent searches
 */

import { openDB } from 'idb'

const DB_NAME = 'bigdataclaw-unified-search'
const DB_VERSION = 1

// Store names for each module
const STORES = {
  builders: 'builders',
  agents: 'agents',
  lenders: 'lenders',
  properties: 'properties',
  buyers: 'buyers',
  searchIndex: 'search-index',
  recentSearches: 'recent-searches'
}

// Initialize database with all stores
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Builders store
      if (!db.objectStoreNames.contains(STORES.builders)) {
        const store = db.createObjectStore(STORES.builders, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('region', 'region', { unique: false })
        store.createIndex('city', 'city', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('searchText', 'searchText', { unique: false })
      }

      // Agents store
      if (!db.objectStoreNames.contains(STORES.agents)) {
        const store = db.createObjectStore(STORES.agents, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('brokerage', 'brokerage', { unique: false })
        store.createIndex('region', 'region', { unique: false })
        store.createIndex('city', 'city', { unique: false })
        store.createIndex('brokerOfRecord', 'brokerOfRecord', { unique: false })
        store.createIndex('searchText', 'searchText', { unique: false })
      }

      // Lenders store
      if (!db.objectStoreNames.contains(STORES.lenders)) {
        const store = db.createObjectStore(STORES.lenders, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('assetClasses', 'assetClasses', { unique: false, multiEntry: true })
        store.createIndex('searchText', 'searchText', { unique: false })
      }

      // Properties store
      if (!db.objectStoreNames.contains(STORES.properties)) {
        const store = db.createObjectStore(STORES.properties, { keyPath: 'id' })
        store.createIndex('address', 'address', { unique: false })
        store.createIndex('city', 'city', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('searchText', 'searchText', { unique: false })
      }

      // Buyers store
      if (!db.objectStoreNames.contains(STORES.buyers)) {
        const store = db.createObjectStore(STORES.buyers, { keyPath: 'id' })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('searchText', 'searchText', { unique: false })
      }

      // Search index for fast lookups
      if (!db.objectStoreNames.contains(STORES.searchIndex)) {
        const store = db.createObjectStore(STORES.searchIndex, { keyPath: 'token' })
        store.createIndex('module', 'module', { unique: false })
      }

      // Recent searches
      if (!db.objectStoreNames.contains(STORES.recentSearches)) {
        db.createObjectStore(STORES.recentSearches, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Build search text from object
const buildSearchText = (obj, fields) => {
  return fields
    .map(f => {
      const val = obj[f]
      if (Array.isArray(val)) return val.join(' ')
      return val || ''
    })
    .join(' ')
    .toLowerCase()
}

// Module configurations
const MODULE_CONFIG = {
  builders: {
    fields: ['name', 'type', 'region', 'city', 'address', 'specialties'],
    displayFields: ['name', 'type', 'city', 'region'],
    icon: '🏗️',
    route: '/builders',
    filterParam: 'search'
  },
  agents: {
    fields: ['name', 'brokerage', 'brokerOfRecord', 'salesRep', 'city', 'region', 'specialties'],
    displayFields: ['name', 'brokerage', 'city'],
    icon: '👤',
    route: '/residential-recruiter',
    filterParam: 'search'
  },
  lenders: {
    fields: ['name', 'type', 'assetClasses', 'contactName'],
    displayFields: ['name', 'type'],
    icon: '🏦',
    route: '/lenders',
    filterParam: 'search'
  },
  properties: {
    fields: ['address', 'city', 'type', 'description'],
    displayFields: ['address', 'city', 'type'],
    icon: '🏠',
    route: '/property-research',
    filterParam: 'address'
  },
  buyers: {
    fields: ['name', 'type', 'criteria', 'regions'],
    displayFields: ['name', 'type'],
    icon: '💼',
    route: '/buyer-matcher',
    filterParam: 'search'
  }
}

// Add items to a module
export const addToModule = async (module, items) => {
  const db = await initDB()
  const config = MODULE_CONFIG[module]
  
  const tx = db.transaction(STORES[module], 'readwrite')
  const store = tx.objectStore(STORES[module])
  
  for (const item of items) {
    const enriched = {
      ...item,
      searchText: buildSearchText(item, config.fields),
      module,
      updatedAt: new Date().toISOString()
    }
    await store.put(enriched)
  }
  
  await tx.done
  return items.length
}

// Global search across all modules
export const globalSearch = async (query, options = {}) => {
  const { modules = Object.keys(STORES).filter(k => k !== 'searchIndex' && k !== 'recentSearches'), limit = 20 } = options
  
  if (!query || query.trim().length < 2) return []
  
  const db = await initDB()
  const searchLower = query.toLowerCase()
  const results = []
  
  for (const module of modules) {
    if (!STORES[module]) continue
    
    const store = db.transaction(STORES[module]).objectStore(STORES[module])
    const all = await store.getAll()
    
    const matches = all
      .filter(item => item.searchText.includes(searchLower))
      .map(item => ({
        ...item,
        module,
        matchScore: calculateMatchScore(item, searchLower, MODULE_CONFIG[module].fields),
        display: formatResult(item, module)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
    
    results.push(...matches)
  }
  
  // Sort by match score
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit * modules.length)
}

// Calculate relevance score
const calculateMatchScore = (item, query, fields) => {
  let score = 0
  
  fields.forEach((field, index) => {
    const value = item[field]
    if (!value) return
    
    const valueStr = Array.isArray(value) ? value.join(' ') : String(value)
    const valueLower = valueStr.toLowerCase()
    
    // Exact match in field
    if (valueLower === query) score += 100 - (index * 10)
    // Starts with query
    else if (valueLower.startsWith(query)) score += 50 - (index * 5)
    // Contains query
    else if (valueLower.includes(query)) score += 20 - (index * 2)
  })
  
  return score
}

// Format result for display
const formatResult = (item, module) => {
  const config = MODULE_CONFIG[module]
  const values = config.displayFields.map(f => item[f]).filter(Boolean)
  
  return {
    title: values[0] || 'Unknown',
    subtitle: values.slice(1).join(' • ') || '',
    icon: config.icon,
    module,
    route: config.route,
    id: item.id
  }
}

// Get filter options for a module
export const getFilterOptions = async (module) => {
  const db = await initDB()
  const store = db.transaction(STORES[module]).objectStore(STORES[module])
  const all = await store.getAll()
  
  const options = {}
  
  if (module === 'builders') {
    options.regions = [...new Set(all.map(b => b.region))].sort()
    options.cities = [...new Set(all.map(b => b.city))].sort()
    options.types = [...new Set(all.map(b => b.type))].sort()
  } else if (module === 'agents') {
    options.regions = [...new Set(all.map(a => a.region))].sort()
    options.cities = [...new Set(all.map(a => a.city))].sort()
    options.brokerages = [...new Set(all.map(a => a.brokerage))].sort()
    options.brokersOfRecord = [...new Set(all.map(a => a.brokerOfRecord))].sort()
  } else if (module === 'lenders') {
    options.types = [...new Set(all.map(l => l.type))].sort()
    options.assetClasses = [...new Set(all.flatMap(l => l.assetClasses || []))].sort()
  }
  
  return options
}

// Filter items in a module
export const filterModule = async (module, filters = {}) => {
  const db = await initDB()
  const store = db.transaction(STORES[module]).objectStore(STORES[module])
  let items = await store.getAll()
  
  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    items = items.filter(i => i.searchText.includes(searchLower))
  }
  
  if (filters.region && items[0]?.region !== undefined) {
    items = items.filter(i => i.region === filters.region)
  }
  
  if (filters.city && items[0]?.city !== undefined) {
    items = items.filter(i => i.city === filters.city)
  }
  
  if (filters.type && items[0]?.type !== undefined) {
    items = items.filter(i => i.type === filters.type)
  }
  
  if (filters.brokerage && items[0]?.brokerage !== undefined) {
    items = items.filter(i => i.brokerage === filters.brokerage)
  }
  
  if (filters.brokerOfRecord && items[0]?.brokerOfRecord !== undefined) {
    items = items.filter(i => i.brokerOfRecord === filters.brokerOfRecord)
  }
  
  return items
}

// Save recent search
export const saveRecentSearch = async (query, module = null, resultsCount = 0) => {
  const db = await initDB()
  
  const search = {
    query,
    module,
    resultsCount,
    timestamp: new Date().toISOString()
  }
  
  await db.add(STORES.recentSearches, search)
  
  // Keep only last 50 searches
  const all = await db.getAll(STORES.recentSearches)
  if (all.length > 50) {
    const toDelete = all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(0, all.length - 50)
    for (const s of toDelete) {
      await db.delete(STORES.recentSearches, s.id)
    }
  }
}

// Get recent searches
export const getRecentSearches = async (limit = 10) => {
  const db = await initDB()
  const all = await db.getAll(STORES.recentSearches)
  return all
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

// Get counts for all modules
export const getModuleCounts = async () => {
  // First try to get from API
  try {
    const response = await fetch('/api/data-manager/stats')
    if (response.ok) {
      const data = await response.json()
      // Convert API format to local format
      const counts = {}
      data.modules.forEach(module => {
        counts[module.id] = module.count
      })
      return counts
    }
  } catch (err) {
    console.log('API not available, falling back to local DB')
  }
  
  // Fallback to local IndexedDB
  const db = await initDB()
  const counts = {}
  
  for (const [key, storeName] of Object.entries(STORES)) {
    if (key === 'searchIndex' || key === 'recentSearches') continue
    counts[key] = await db.count(storeName)
  }
  
  return counts
}

// Clear module data
export const clearModule = async (module) => {
  const db = await initDB()
  await db.clear(STORES[module])
}

// Get module stats
export const getModuleStats = async () => {
  // Check if API is available
  try {
    const response = await fetch('/api/data-manager/stats')
    if (response.ok) {
      const data = await response.json()
      // Return simple stats from API (without region/city breakdown)
      const stats = {}
      data.modules.forEach(module => {
        stats[module.id] = {
          count: module.count,
          byRegion: {}, // Would need additional API endpoint for this
          byCity: {}
        }
      })
      return stats
    }
  } catch (err) {
    console.log('API not available, falling back to local DB')
  }
  
  // Fallback to local IndexedDB
  const db = await initDB()
  const stats = {}
  
  for (const module of Object.keys(MODULE_CONFIG)) {
    const store = db.transaction(STORES[module]).objectStore(STORES[module])
    const all = await store.getAll()
    
    stats[module] = {
      count: all.length,
      byRegion: all.reduce((acc, item) => {
        if (item.region) acc[item.region] = (acc[item.region] || 0) + 1
        return acc
      }, {}),
      byCity: all.reduce((acc, item) => {
        if (item.city) acc[item.city] = (acc[item.city] || 0) + 1
        return acc
      }, {})
    }
  }
  
  return stats
}

// Export module data
export const exportModule = async (module) => {
  const db = await initDB()
  const store = db.transaction(STORES[module]).objectStore(STORES[module])
  return await store.getAll()
}

// Check if module has data
export const moduleHasData = async (module) => {
  const db = await initDB()
  const count = await db.count(STORES[module])
  return count > 0
}

export { MODULE_CONFIG }
