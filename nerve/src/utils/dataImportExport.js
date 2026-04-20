/**
 * Data Import/Export Utilities
 * Import CSV/JSON data into unified database
 * Export data for backup/sharing
 */

import { 
  addToModule, clearModule, exportModule, 
  getModuleCounts, getModuleStats 
} from './unifiedSearchDatabase'

// Parse CSV text to array of objects
export const parseCSV = (csvText, mappings = {}) => {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  
  const headers = parseCSVLine(lines[0])
  const results = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const obj = { id: `imported-${Date.now()}-${i}` }
    
    headers.forEach((header, idx) => {
      const key = mappings[header] || header.toLowerCase().replace(/\s+/g, '_')
      let value = values[idx] || ''
      
      // Try to parse as number
      if (!isNaN(value) && value !== '') {
        value = Number(value)
      }
      
      // Parse arrays (semicolon separated)
      if (value.includes(';')) {
        value = value.split(';').map(v => v.trim()).filter(Boolean)
      }
      
      obj[key] = value
    })
    
    results.push(obj)
  }
  
  return results
}

// Parse a single CSV line handling quoted values
const parseCSVLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// Import builders from CSV
export const importBuildersCSV = async (csvText) => {
  const mappings = {
    'Name': 'name',
    'Company': 'name',
    'Builder Name': 'name',
    'Type': 'type',
    'Builder Type': 'type',
    'Region': 'region',
    'Province': 'region',
    'City': 'city',
    'Address': 'address',
    'Phone': 'phone',
    'Email': 'email',
    'Website': 'website',
    'Facebook': 'facebook',
    'Instagram': 'instagram',
    'LinkedIn': 'linkedin',
    'Projects': 'projects',
    'Units Per Year': 'unitsPerYear',
    'Price Range': 'priceRange',
    'Year Established': 'yearEstablished',
    'Employees': 'employees',
    'Specialties': 'specialties'
  }
  
  const builders = parseCSV(csvText, mappings)
  
  // Normalize and enrich
  const enriched = builders.map((b, idx) => ({
    ...b,
    id: b.id || `builder-${Date.now()}-${idx}`,
    projects: parseInt(b.projects) || 0,
    unitsPerYear: parseInt(b.unitsPerYear) || 0,
    yearEstablished: parseInt(b.yearEstablished) || 2000,
    logo: b.logo || '🏗️',
    specialties: Array.isArray(b.specialties) ? b.specialties : 
                 (b.specialties ? b.specialties.split(',').map(s => s.trim()) : [])
  }))
  
  await clearModule('builders')
  const count = await addToModule('builders', enriched)
  return { count, sample: enriched.slice(0, 3) }
}

// Import agents from CSV
export const importAgentsCSV = async (csvText) => {
  const mappings = {
    'Name': 'name',
    'Agent Name': 'name',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Brokerage': 'brokerage',
    'Company': 'brokerage',
    'Broker of Record': 'brokerOfRecord',
    'BOR': 'brokerOfRecord',
    'Sales Rep': 'salesRep',
    'Email': 'email',
    'Phone': 'phone',
    'Mobile': 'mobile',
    'Facebook': 'facebook',
    'Instagram': 'instagram',
    'LinkedIn': 'linkedin',
    'City': 'city',
    'Region': 'region',
    'Province': 'region',
    'Specialties': 'specialties',
    'Status': 'status',
    'Years Experience': 'yearsExperience',
    'Sales Volume': 'salesVolume'
  }
  
  const agents = parseCSV(csvText, mappings)
  
  // Enrich
  const enriched = agents.map((a, idx) => ({
    ...a,
    id: a.id || `agent-${Date.now()}-${idx}`,
    status: a.status || 'new',
    yearsExperience: parseInt(a.yearsExperience) || 0,
    specialties: Array.isArray(a.specialties) ? a.specialties : 
                 (a.specialties ? a.specialties.split(',').map(s => s.trim()) : [])
  }))
  
  await clearModule('agents')
  const count = await addToModule('agents', enriched)
  return { count, sample: enriched.slice(0, 3) }
}

// Import lenders from CSV
export const importLendersCSV = async (csvText) => {
  const mappings = {
    'Name': 'name',
    'Lender Name': 'name',
    'Type': 'type',
    'Contact Name': 'contactName',
    'Email': 'email',
    'Phone': 'phone',
    'Asset Classes': 'assetClasses',
    'Loan Types': 'assetClasses',
    'Min Loan': 'minLoan',
    'Max Loan': 'maxLoan',
    'Rate Range': 'rateRange'
  }
  
  const lenders = parseCSV(csvText, mappings)
  
  const enriched = lenders.map((l, idx) => ({
    ...l,
    id: l.id || `lender-${Date.now()}-${idx}`,
    assetClasses: Array.isArray(l.assetClasses) ? l.assetClasses :
                  (l.assetClasses ? l.assetClasses.split(',').map(s => s.trim()) : [])
  }))
  
  await clearModule('lenders')
  const count = await addToModule('lenders', enriched)
  return { count, sample: enriched.slice(0, 3) }
}

// Export module to CSV
export const exportModuleToCSV = async (module) => {
  const data = await exportModule(module)
  if (data.length === 0) return null
  
  const headers = Object.keys(data[0]).filter(k => !k.startsWith('_') && k !== 'searchText' && k !== 'module')
  const rows = data.map(item => 
    headers.map(h => {
      const val = item[h]
      if (Array.isArray(val)) return `"${val.join(';')}"`
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`
      return val
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

// Download CSV file
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// Get import summary
export const getImportSummary = async () => {
  const counts = await getModuleCounts()
  const stats = await getModuleStats()
  
  return {
    counts,
    stats: Object.entries(stats).map(([module, data]) => ({
      module,
      count: data.count,
      topRegions: Object.entries(data.byRegion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topCities: Object.entries(data.byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }))
  }
}

// Clear all data
export const clearAllData = async () => {
  for (const module of ['builders', 'agents', 'lenders', 'properties', 'buyers']) {
    await clearModule(module)
  }
}

// Sample data for testing
export const getSampleBuilders = () => [
  {
    id: 'sample-1',
    name: 'Mattamy Homes',
    type: 'Production Home Builder',
    region: 'Ontario',
    city: 'Toronto',
    address: '1000 The Queensway, Toronto, ON',
    phone: '416-555-0100',
    email: 'info@mattamyhomes.com',
    website: 'mattamyhomes.com',
    facebook: 'MattamyHomes',
    instagram: '@mattamyhomes',
    linkedin: 'mattamy-homes',
    projects: 45,
    unitsPerYear: 2500,
    priceRange: '$600K - $1.5M',
    yearEstablished: 1978,
    employees: '1000+',
    specialties: ['Single Family', 'Townhomes', 'Condos'],
    logo: '🏗️'
  }
]

export const getSampleAgents = () => [
  {
    id: 'sample-1',
    name: 'Sarah Johnson',
    brokerage: 'RE/MAX Niagara',
    brokerOfRecord: 'John Mitchell',
    salesRep: 'Sarah Johnson',
    email: 'sarah.j@remax-niagara.com',
    phone: '905-555-0101',
    mobile: '416-555-0101',
    facebook: 'sarahjohnsonrealtor',
    instagram: '@sarah_sells_niagara',
    linkedin: 'sarah-johnson-realtor',
    city: 'St. Catharines',
    region: 'Niagara',
    specialties: ['First-time Buyers', 'Condos'],
    status: 'friend',
    yearsExperience: 8,
    salesVolume: '$45M'
  }
]
