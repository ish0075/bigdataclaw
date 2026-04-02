/**
 * Builder Database Service
 * Uses IndexedDB for client-side storage of 5000+ builders
 * Provides fast filtering by Province → Region → City hierarchy
 */

import { openDB } from 'idb'

const DB_NAME = 'bigdataclaw-builders'
const DB_VERSION = 1
const STORE_NAME = 'builders'

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // Create indexes for fast filtering
        store.createIndex('region', 'region', { unique: false })
        store.createIndex('city', 'city', { unique: false })
        store.createIndex('region-city', ['region', 'city'], { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('name', 'name', { unique: false })
        store.createIndex('viewed', 'viewed', { unique: false })
      }
    }
  })
}

// Import builders from CSV/JSON
export const importBuilders = async (buildersData) => {
  const db = await initDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  
  // Clear existing data
  await store.clear()
  
  // Add all builders
  for (const builder of buildersData) {
    await store.add({
      ...builder,
      viewed: false,
      clicked: false,
      importedAt: new Date().toISOString()
    })
  }
  
  await tx.done
  return buildersData.length
}

// Get all builders (with optional limit)
export const getAllBuilders = async (limit = null) => {
  const db = await initDB()
  let builders = await db.getAll(STORE_NAME)
  if (limit) builders = builders.slice(0, limit)
  return builders
}

// Get unique regions (provinces)
export const getRegions = async () => {
  const db = await initDB()
  const builders = await db.getAll(STORE_NAME)
  return [...new Set(builders.map(b => b.region))].sort()
}

// Get cities (optionally filtered by region)
export const getCities = async (region = null) => {
  const db = await initDB()
  let builders
  
  if (region) {
    builders = await db.getAllFromIndex(STORE_NAME, 'region', region)
  } else {
    builders = await db.getAll(STORE_NAME)
  }
  
  return [...new Set(builders.map(b => b.city))].sort()
}

// Get builder types
export const getBuilderTypes = async () => {
  const db = await initDB()
  const builders = await db.getAll(STORE_NAME)
  return [...new Set(builders.map(b => b.type))].sort()
}

// Filter builders with multiple criteria
export const filterBuilders = async (filters = {}) => {
  const db = await initDB()
  const { region, city, type, search, viewFilter } = filters
  
  let builders = []
  
  // Use index for region filter
  if (region && region !== 'all') {
    builders = await db.getAllFromIndex(STORE_NAME, 'region', region)
  } else {
    builders = await db.getAll(STORE_NAME)
  }
  
  // Apply remaining filters in memory (fast for 5000 records)
  if (city && city !== 'all') {
    builders = builders.filter(b => b.city === city)
  }
  
  if (type && type !== 'all') {
    builders = builders.filter(b => b.type === type)
  }
  
  if (search) {
    const searchLower = search.toLowerCase()
    builders = builders.filter(b => 
      b.name.toLowerCase().includes(searchLower) ||
      b.city.toLowerCase().includes(searchLower) ||
      b.region.toLowerCase().includes(searchLower) ||
      b.type.toLowerCase().includes(searchLower) ||
      (b.specialties && b.specialties.some(s => s.toLowerCase().includes(searchLower)))
    )
  }
  
  if (viewFilter === 'viewed') {
    builders = builders.filter(b => b.viewed)
  } else if (viewFilter === 'unviewed') {
    builders = builders.filter(b => !b.viewed)
  }
  
  return builders
}

// Group builders for display
export const groupBuilders = (builders, groupBy = 'region-city') => {
  if (groupBy === 'region-city') {
    return builders.reduce((acc, builder) => {
      if (!acc[builder.region]) acc[builder.region] = {}
      if (!acc[builder.region][builder.city]) acc[builder.region][builder.city] = []
      acc[builder.region][builder.city].push(builder)
      return acc
    }, {})
  } else if (groupBy === 'region') {
    return builders.reduce((acc, builder) => {
      if (!acc[builder.region]) acc[builder.region] = []
      acc[builder.region].push(builder)
      return acc
    }, {})
  } else if (groupBy === 'city') {
    return builders.reduce((acc, builder) => {
      if (!acc[builder.city]) acc[builder.city] = []
      acc[builder.city].push(builder)
      return acc
    }, {})
  } else {
    return builders.reduce((acc, builder) => {
      if (!acc[builder.type]) acc[builder.type] = []
      acc[builder.type].push(builder)
      return acc
    }, {})
  }
}

// Update builder (for tracking)
export const updateBuilder = async (id, updates) => {
  const db = await initDB()
  const builder = await db.get(STORE_NAME, id)
  if (builder) {
    await db.put(STORE_NAME, { ...builder, ...updates })
  }
  return { ...builder, ...updates }
}

// Get stats
export const getStats = async () => {
  const builders = await getAllBuilders()
  return {
    total: builders.length,
    viewed: builders.filter(b => b.viewed).length,
    clicked: builders.filter(b => b.clicked).length,
    unviewed: builders.filter(b => !b.viewed).length,
    totalProjects: builders.reduce((sum, b) => sum + (b.projects || 0), 0),
    totalUnits: builders.reduce((sum, b) => sum + (b.unitsPerYear || 0), 0),
    regions: [...new Set(builders.map(b => b.region))].length,
    cities: [...new Set(builders.map(b => b.city))].length
  }
}

// Export to CSV
export const exportToCSV = (builders) => {
  const headers = ['name', 'type', 'region', 'city', 'address', 'phone', 'email', 'website', 'facebook', 'instagram', 'linkedin', 'projects', 'unitsPerYear', 'priceRange', 'yearEstablished', 'employees', 'specialties', 'viewed', 'clicked']
  const rows = builders.map(b => [
    b.name, b.type, b.region, b.city, b.address, b.phone, b.email, b.website,
    b.facebook || '', b.instagram || '', b.linkedin || '',
    b.projects, b.unitsPerYear, b.priceRange, b.yearEstablished, b.employees,
    (b.specialties || []).join(';'),
    b.viewed ? 'Yes' : 'No', b.clicked ? 'Yes' : 'No'
  ])
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}

// Check if database has data
export const hasData = async () => {
  const db = await initDB()
  const count = await db.count(STORE_NAME)
  return count > 0
}

// Get count
export const getCount = async () => {
  const db = await initDB()
  return db.count(STORE_NAME)
}

// Clear all data
export const clearAll = async () => {
  const db = await initDB()
  await db.clear(STORE_NAME)
}
