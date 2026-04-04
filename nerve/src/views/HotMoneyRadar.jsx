import React, { useState, useMemo, useEffect } from 'react'
import { useMissionStore } from '../stores/missionStore'
import { 
  Flame, Phone, Mail, ExternalLink, Target, Calendar, MapPin, DollarSign, 
  Filter, Download, X, Check, Building, Home, Warehouse, Trees, 
  Edit3, Save, Plus, Search, Mic, ClipboardPaste, Sparkles, UserCircle, FileText
} from 'lucide-react'
import VoiceInput from '../components/Common/VoiceInput'

// Helper function to generate quick links for seller (hot money) and buyer
const generateQuickLinks = (entityName, contactName = null, buyerEntity = null) => {
  if (!entityName) return null
  const encoded = encodeURIComponent(entityName)
  const encodedContact = contactName ? encodeURIComponent(contactName) : encoded
  const encodedBuyer = buyerEntity ? encodeURIComponent(buyerEntity) : null
  
  return {
    // SELLER (Hot Money - Has the cash!)
    seller: {
      google: `https://www.google.com/search?q=${encoded}`,
      linkedin: `https://www.google.com/search?q=${encoded}+linkedin`,
      linkedinCompany: `https://www.linkedin.com/search/results/companies/?keywords=${encoded}`,
      linkedinPerson: contactName ? `https://www.linkedin.com/search/results/people/?keywords=${encodedContact}` : null,
      facebook: `https://www.facebook.com/search/pages?q=${encoded}`,
      corporation: `https://www.google.com/search?q=${encoded}+corporation+canada`,
      openCorporate: `https://opencorporates.com/companies?q=${encoded}`,
    },
    // BUYER (Purchased the property)
    buyer: encodedBuyer ? {
      google: `https://www.google.com/search?q=${encodedBuyer}`,
      linkedin: `https://www.google.com/search?q=${encodedBuyer}+linkedin`,
      linkedinCompany: `https://www.linkedin.com/search/results/companies/?keywords=${encodedBuyer}`,
      facebook: `https://www.facebook.com/search/pages?q=${encodedBuyer}`,
      corporation: `https://www.google.com/search?q=${encodedBuyer}+corporation+canada`,
      openCorporate: `https://opencorporates.com/companies?q=${encodedBuyer}`,
    } : null,
    // Individual contact (if available)
    person: contactName ? {
      google: `https://www.google.com/search?q=${encodedContact}`,
      linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodedContact}`,
    } : null,
  }
}

// Extract contact and buyer info from notes text
const parseNotesForContacts = (notes = '') => {
  if (!notes) return { contactName: null, buyerEntity: null }
  
  // Extract Attn: contact
  let contactName = null
  const attnMatch = notes.match(/Attn:\s*([^\n]+)/i)
  if (attnMatch) {
    contactName = attnMatch[1].trim()
  }
  
  // Extract buyer company from Transferee(s) block
  let buyerEntity = null
  const transfereeMatch = notes.match(/Transferee\(s\)\s*\n+([A-Za-z0-9][^\n]+)/i)
  if (transfereeMatch) {
    buyerEntity = transfereeMatch[1].trim()
    // Strip trailing phone numbers
    buyerEntity = buyerEntity.replace(/\s+\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\s*$/, '')
  }
  
  return { contactName, buyerEntity }
}

const API_BASE = '/api'

// Helper to convert API snake_case to frontend camelCase
const apiToFrontend = (lead) => {
  const notes = lead.notes || ''
  const { contactName, buyerEntity } = parseNotesForContacts(notes)
  return {
    id: String(lead.id),
    entity: lead.entity,
    cashAmount: lead.cash_amount,
    saleDate: lead.sale_date,
    location: lead.location,
    property: lead.property,
    matchScore: lead.match_score,
    propertyType: lead.property_type,
    assetClass: lead.asset_class,
    address: lead.address,
    daysAgo: lead.days_ago,
    notes: notes,
    contacts: lead.contacts || [],
    contactName: contactName,
    buyerEntity: buyerEntity,
    quickLinks: generateQuickLinks(lead.entity, contactName, buyerEntity)
  }
}

// Helper to convert frontend camelCase to API snake_case
const frontendToApi = (lead) => ({
  id: lead.id ? parseInt(lead.id) : undefined,
  entity: lead.entity,
  cash_amount: lead.cashAmount,
  sale_date: lead.saleDate,
  location: lead.location,
  property: lead.property,
  match_score: lead.matchScore,
  property_type: lead.propertyType,
  asset_class: lead.assetClass,
  address: lead.address,
  days_ago: lead.daysAgo,
  notes: lead.notes,
  contacts: lead.contacts
})

const HotMoneyRadar = () => {
  const { hotMoneyLeads } = useMissionStore()
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPasteModal, setShowPasteModal] = useState(false)
  
  const [filters, setFilters] = useState({
    propertyType: 'all',
    minCash: '',
    maxCash: '',
    location: '',
    daysAgo: 90
  })
  
  // Load leads from API
  useEffect(() => {
    fetchLeads()
  }, [filters.daysAgo])
  
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const days = filters.daysAgo || 90
      console.log('Fetching hot money leads...')
      const response = await fetch(`${API_BASE}/hotmoney?limit=200&days=${days}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const data = await response.json()
      console.log('Received data:', data)
      // API returns array directly or {leads: []} - handle both
      const leadsArray = Array.isArray(data) ? data : (data.leads || [])
      const mappedLeads = leadsArray.map(apiToFrontend)
      console.log('Mapped leads:', mappedLeads)
      setLeads(mappedLeads)
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError(`Failed to load leads: ${err.message}`)
      // Fallback to empty array
      setLeads([])
    } finally {
      setLoading(false)
    }
  }
  
  const allLeads = hotMoneyLeads.length > 0 ? hotMoneyLeads : leads
  
  // Apply filters
  const displayLeads = useMemo(() => {
    return allLeads.filter(lead => {
      if (filters.propertyType !== 'all') {
        const pt = lead.propertyType || ''
        const ac = lead.assetClass || ''
        const filterVal = filters.propertyType
        // Match either propertyType or assetClass (partial match supported)
        const matchesType = pt === filterVal || ac === filterVal || pt.includes(filterVal) || ac.includes(filterVal)
        if (!matchesType) return false
      }
      if (filters.minCash && lead.cashAmount < parseInt(filters.minCash)) return false
      if (filters.maxCash && lead.cashAmount > parseInt(filters.maxCash)) return false
      if (filters.location && !lead.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      return true
    })
  }, [allLeads, filters])
  
  const formatCash = (amount) => {
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
    return `$${amount}`
  }
  
  const handleViewProfile = (lead) => {
    console.log('Opening profile for:', lead)
    setSelectedLead(lead)
    setEditingLead(null)
    setShowDetailModal(true)
    // Force a re-render to ensure modal shows
    setTimeout(() => {
      console.log('Modal should be open. showDetailModal:', true, 'selectedLead:', lead)
    }, 100)
  }
  
  const handleSaveEdit = async (updatedLead) => {
    try {
      const apiLead = frontendToApi(updatedLead)
      const response = await fetch(`${API_BASE}/hotmoney/${updatedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiLead)
      })
      
      if (!response.ok) throw new Error('Failed to save lead')
      
      // Refresh leads from API and update selected lead
      const refreshed = await fetch(`${API_BASE}/hotmoney/${updatedLead.id}`)
      const savedData = await refreshed.json()
      const savedLead = apiToFrontend(savedData)
      
      // Update leads list
      setLeads(prev => prev.map(l => l.id === updatedLead.id ? savedLead : l))
      setSelectedLead(savedLead)
      setEditingLead(null)
    } catch (err) {
      console.error('Error saving lead:', err)
      alert('Failed to save changes. Please try again.')
    }
  }

  const spawnPaperclipMission = async (lead, e) => {
    e?.stopPropagation()
    e?.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/paperclip/hot-money-missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: frontendToApi(lead) })
      })
      if (!response.ok) throw new Error('Failed to create Paperclip mission')
      const data = await response.json()
      alert(`Paperclip company created: ${data.name}`)
      // Open the company in a new tab
      window.open(`/paperclip-companies/${data.company_id}`, '_blank')
    } catch (err) {
      console.error('Error creating Paperclip mission:', err)
      alert('Failed to create Paperclip mission. Please try again.')
    }
  }
  
  const totalCapital = displayLeads.reduce((sum, l) => sum + (l.cashAmount || 0), 0)
  
  return (
    <>
      <FilterModal 
        show={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
      />
      
      {showDetailModal && selectedLead ? (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedLead(null)
            setEditingLead(null)
          }}
          onEdit={() => setEditingLead({...selectedLead})}
          editingLead={editingLead}
          onSave={handleSaveEdit}
          formatCash={formatCash}
          onFilterByAssetClass={(assetClass) => {
            setFilters({...filters, propertyType: assetClass})
            setShowDetailModal(false)
          }}
        />
      ) : null}
      
      {showPasteModal && (
        <PasteDealModal
          onClose={() => setShowPasteModal(false)}
          onSuccess={(newLead) => {
            setLeads(prev => [newLead, ...prev])
            setShowPasteModal(false)
            // Optionally open the new lead
            setSelectedLead(newLead)
            setShowDetailModal(true)
          }}
          formatCash={formatCash}
        />
      )}
      
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500" />
            Who's got the money? Hot money radar
          </h1>
          <p className="text-slate-400 mt-1">
            {displayLeads.length} leads with {formatCash(totalCapital)} in fresh capital • Recently sold
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPasteModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Deal
          </button>
          <button 
            onClick={fetchLeads}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
            title="Refresh from database"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
            {Object.values(filters).some(v => v && v !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </button>
          <ExportButton leads={displayLeads} />
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">{formatCash(totalCapital)}</p>
              <p className="text-slate-400 text-sm">Total Hot Money</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{displayLeads.length}</p>
              <p className="text-slate-400 text-sm">Active Alerts</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {formatCash(totalCapital / (displayLeads.length || 1))}
              </p>
              <p className="text-slate-400 text-sm">Avg Cash Position</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <Check className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.round(displayLeads.reduce((sum, l) => sum + (l.matchScore || 0), 0) / (displayLeads.length || 1))}
              </p>
              <p className="text-slate-400 text-sm">Avg Match Score</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by entity name, location, or asset class... (or use voice 🎤)"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Trigger search
                }
              }}
              className="w-full pl-10 pr-28 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
              <VoiceInput
                onResult={(text) => setFilters({...filters, location: text})}
                size="sm"
                placeholder="Say: Find industrial leads..."
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Time Range Toggles */}
            <div className="flex items-center bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setFilters({...filters, daysAgo: days})}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filters.daysAgo === days
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
            
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="all">All Asset Classes</option>
              <option value="Industrial">Industrial</option>
              <option value="Retail">Retail</option>
              <option value="Office">Office</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Land">Land</option>
              <option value="Mixed-Use">Mixed-Use</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Hot Money List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Hot Money Leads</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Sorted by:</span>
              <select className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-slate-200">
                <option>Cash Amount (High → Low)</option>
                <option>Date (Newest)</option>
                <option>Match Score</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Loading leads from database...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <button 
                onClick={fetchLeads}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                Try Again
              </button>
            </div>
          ) : displayLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No leads found. Adjust your filters or refresh.
            </div>
          ) : (
            displayLeads.map((lead) => (
              <HotMoneyListItem 
                key={lead.id} 
                lead={lead} 
                formatCash={formatCash}
                onViewProfile={() => handleViewProfile(lead)}
                onSpawnPaperclip={(e) => spawnPaperclipMission(lead, e)}
                onFilterByAssetClass={(assetClass) => setFilters({...filters, propertyType: assetClass})}
              />
            ))
          )}
        </div>
      </div>
    </div>
    </>
  )
}

// Lead Detail Modal Component
const LeadDetailModal = ({ lead, onClose, onEdit, editingLead, onSave, formatCash, onFilterByAssetClass }) => {
  const [editedData, setEditedData] = useState(editingLead || lead)
  const [pullingProfile, setPullingProfile] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [showMatches, setShowMatches] = useState(false)
  
  // Load matching opportunities when modal opens
  useEffect(() => {
    if (lead?.id) {
      loadMatches()
    }
  }, [lead?.id])
  
  const loadMatches = async () => {
    setLoadingMatches(true)
    try {
      const response = await fetch(`${API_BASE}/hotmoney/${lead.id}/matches`)
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Error loading matches:', err)
    } finally {
      setLoadingMatches(false)
    }
  }
  
  const isEditing = editingLead !== null
  
  const handlePullProfile = async () => {
    if (!lead.entity) {
      console.log('No entity to pull profile for')
      return
    }
    
    console.log('Pulling profile for:', lead.entity)
    setPullingProfile(true)
    try {
      const response = await fetch(`${API_BASE}/llm/pull-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: lead.entity })
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to pull profile: ' + errorText)
      }
      
      const data = await response.json()
      console.log('Profile data received:', data)
      setProfileData(data.profile)
      setShowProfile(true)
    } catch (err) {
      console.error('Error pulling profile:', err)
      alert('Failed to pull profile: ' + err.message)
    } finally {
      setPullingProfile(false)
    }
  }
  
  const handleSaveToObsidian = async () => {
    if (!profileData) return
    
    try {
      await fetch(`${API_BASE}/obsidian/quick-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Profile - ${lead.entity}`,
          content: generateProfileMarkdown(lead, profileData),
          folder: 'Deals/Profiles'
        })
      })
      alert('Profile saved to Obsidian: Deals/Profiles/')
    } catch (err) {
      console.error('Error saving to Obsidian:', err)
    }
  }
  
  const generateProfileMarkdown = (lead, profile) => {
    return `# Profile: ${lead.entity}

## Overview
${profile.summary || 'No summary available.'}

## Company Information
- **Entity:** ${lead.entity}
- **Cash Available:** ${formatCash(lead.cashAmount)}
- **Property Type:** ${lead.propertyType}
- **Asset Class:** ${lead.assetClass || 'N/A'}
- **Location:** ${lead.location}

## Research Findings
${profile.research || 'No research data available.'}

## Potential Connections
${profile.connections || 'No connection data available.'}

## Investment Preferences
${profile.preferences || 'No preference data available.'}

## Quick Links
- [Google Search](https://www.google.com/search?q=${encodeURIComponent(lead.entity)})
- [LinkedIn Search](https://www.google.com/search?q=${encodeURIComponent(lead.entity)}+linkedin)
- [Corporation Search](https://www.google.com/search?q=${encodeURIComponent(lead.entity)}+corporation+canada)

## Related Properties
${lead.address ? `- ${lead.address}` : 'No properties listed.'}

## Notes
${lead.notes || 'No notes yet.'}

## Tags
#hot-money #${lead.propertyType?.toLowerCase().replace(/\s+/g, '-')} #${lead.location?.toLowerCase().replace(/\s+/g, '-')} #profile

---
*Profile generated: ${new Date().toLocaleString()}*
`
  }
  
  const handleSave = () => {
    onSave(editedData)
  }
  
  const handleChange = (field, value) => {
    setEditedData({...editedData, [field]: value})
  }
  
  const addContact = () => {
    const newContact = { type: 'phone', value: '', label: '' }
    setEditedData({
      ...editedData, 
      contacts: [...(editedData.contacts || []), newContact]
    })
  }
  
  const updateContact = (index, field, value) => {
    const updatedContacts = [...(editedData.contacts || [])]
    updatedContacts[index] = {...updatedContacts[index], [field]: value}
    setEditedData({...editedData, contacts: updatedContacts})
  }
  
  const removeContact = (index) => {
    const updatedContacts = (editedData.contacts || []).filter((_, i) => i !== index)
    setEditedData({...editedData, contacts: updatedContacts})
  }
  
  const data = isEditing ? editedData : lead
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-red-600/10 to-orange-600/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={data.entity}
                    onChange={(e) => handleChange('entity', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-64"
                  />
                ) : data.entity}
              </h2>
              <p className="text-slate-400 text-sm">Hot Money Lead • {data.saleDate || "Date unknown"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setEditingLead({...lead})}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Lead
              </button>
            )}
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            ) : (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Cash Amount */}
          <div className="bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-xl p-4 border border-red-500/20">
            <p className="text-slate-400 text-sm mb-1">Cash Available</p>
            {isEditing ? (
              <input
                type="number"
                value={data.cashAmount}
                onChange={(e) => handleChange('cashAmount', parseInt(e.target.value))}
                className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white w-full"
              />
            ) : (
              <p className="text-3xl font-bold text-red-400">{formatCash(data.cashAmount)}</p>
            )}
          </div>
          
          {/* Property Sold Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Property Sold
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Asset Class</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.assetClass || ''}
                    onChange={(e) => handleChange('assetClass', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-full"
                    placeholder="e.g. Industrial Warehouse"
                  />
                ) : (
                  <p className="text-white font-medium">
                    {onFilterByAssetClass && (data.assetClass || data.propertyType) ? (
                      <button
                        type="button"
                        onClick={() => onFilterByAssetClass(data.assetClass || data.propertyType)}
                        className="text-white hover:text-blue-400 hover:underline cursor-pointer transition-colors"
                        title={`Filter by ${data.assetClass || data.propertyType}`}
                      >
                        {data.assetClass || data.propertyType}
                      </button>
                    ) : (
                      <span>{data.assetClass || data.propertyType}</span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Property Type</p>
                {isEditing ? (
                  <select
                    value={data.propertyType}
                    onChange={(e) => handleChange('propertyType', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-full"
                  >
                    <option value="Industrial">Industrial</option>
                    <option value="Retail">Retail</option>
                    <option value="Office">Office</option>
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Land">Land</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                  </select>
                ) : (
                  <p className="text-white font-medium">{data.propertyType}</p>
                )}
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Address</p>
              {isEditing ? (
                <input
                  type="text"
                  value={data.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-full"
                  placeholder="Full property address"
                />
              ) : (
                <p className="text-white font-medium">{data.address || data.property}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Sale Date</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.saleDate}
                    onChange={(e) => handleChange('saleDate', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-full"
                  />
                ) : (
                  <p className="text-white font-medium">{data.saleDate}</p>
                )}
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={data.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-full"
                  />
                ) : (
                  <p className="text-white font-medium">{data.location}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Match Score */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Match Score</p>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={data.matchScore}
                      onChange={(e) => handleChange('matchScore', parseInt(e.target.value))}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white w-20"
                    />
                  ) : (
                    <span className={`text-2xl font-bold ${data.matchScore >= 90 ? 'text-emerald-400' : data.matchScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {data.matchScore}
                    </span>
                  )}
                  <span className="text-slate-400 text-sm">/ 100</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contacts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400" />
                Contacts
              </h3>
              {isEditing && (
                <button
                  onClick={addContact}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </button>
              )}
            </div>
            
            {(data.contacts || []).length === 0 ? (
              <p className="text-slate-500 text-sm italic">No contacts added yet. Click Edit to add.</p>
            ) : (
              <div className="space-y-2">
                {(data.contacts || []).map((contact, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <select
                          value={contact.type}
                          onChange={(e) => updateContact(idx, 'type', e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="website">Website</option>
                        </select>
                        <input
                          type="text"
                          value={contact.label}
                          onChange={(e) => updateContact(idx, 'label', e.target.value)}
                          placeholder="Label"
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm flex-1"
                        />
                        <input
                          type="text"
                          value={contact.value}
                          onChange={(e) => updateContact(idx, 'value', e.target.value)}
                          placeholder="Value"
                          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm flex-1"
                        />
                        <button
                          onClick={() => removeContact(idx)}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-400 text-sm capitalize w-20">{contact.type}</span>
                        <span className="text-slate-300 text-sm">{contact.label}</span>
                        <a 
                          href={contact.type === 'email' ? `mailto:${contact.value}` : contact.type === 'phone' ? `tel:${contact.value}` : contact.value}
                          className="text-blue-400 hover:text-blue-300 text-sm ml-auto"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {contact.value}
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Notes</h3>
            {isEditing ? (
              <textarea
                value={data.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
                placeholder="Add notes about this lead..."
              />
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-4 min-h-[100px]">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {data.notes || <span className="text-slate-500 italic">No notes added yet.</span>}
                </p>
              </div>
            )}
          </div>
          
          {/* Quick Links - Auto-generated from entity name */}
          {!isEditing && data.entity && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-amber-400">💰</span> Quick Links
              </h3>
              
              {/* SELLER (Hot Money - Has the Cash!) */}
              <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <span className="text-lg">💰</span> Seller (Hot Money Source)
                </p>
                <p className="text-sm text-slate-300">{data.entity}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(data.entity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Google
                  </a>
                  <a
                    href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(data.entity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Building className="w-4 h-4" />
                    LinkedIn Co
                  </a>
                  <a
                    href={`https://www.facebook.com/search/pages?q=${encodeURIComponent(data.entity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Facebook
                  </a>
                  <a
                    href={`https://opencorporates.com/companies?q=${encodeURIComponent(data.entity)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Building className="w-4 h-4" />
                    Corp Registry
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(data.entity)}+corporation+canada`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Canada Corp
                  </a>
                </div>
              </div>
              
              {/* BUYER (Purchased the Property) */}
              {(data.buyerEntity || (data.contacts && data.contacts.find(c => c.type === 'company'))) && (
                <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <span className="text-lg">🏢</span> Buyer (Property Purchaser)
                  </p>
                  <p className="text-sm text-slate-300">{data.buyerEntity || data.contacts.find(c => c.type === 'company').value}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(data.buyerEntity || data.contacts.find(c => c.type === 'company').value)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Google
                    </a>
                    <a
                      href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(data.buyerEntity || data.contacts.find(c => c.type === 'company').value)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Building className="w-4 h-4" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              )}
              
              {/* Individual/Person Contact */}
              {(data.contactName || (data.contacts && data.contacts.find(c => c.type === 'person'))) && (
                <div className="space-y-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <p className="text-xs text-purple-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <span className="text-lg">👤</span> Key Contact
                  </p>
                  <p className="text-sm text-slate-300">{data.contactName || data.contacts.find(c => c.type === 'person').value}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(data.contactName || data.contacts.find(c => c.type === 'person').value)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Google
                    </a>
                    <a
                      href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(data.contactName || data.contacts.find(c => c.type === 'person').value)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-700/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      LinkedIn Person
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Profile Section */}
          {!isEditing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-purple-400" />
                  Profile Intelligence
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullProfile}
                    disabled={pullingProfile}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    {pullingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Pull Profile
                      </>
                    )}
                  </button>
                  {profileData && (
                    <button
                      onClick={handleSaveToObsidian}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Save to Obsidian
                    </button>
                  )}
                </div>
              </div>
              
              {showProfile && profileData && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                  {profileData.summary && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Summary</h4>
                      <p className="text-slate-300 text-sm">{profileData.summary}</p>
                    </div>
                  )}
                  
                  {profileData.research && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Research Findings</h4>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{profileData.research}</p>
                    </div>
                  )}
                  
                  {profileData.connections && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Potential Connections</h4>
                      <p className="text-slate-300 text-sm">{profileData.connections}</p>
                    </div>
                  )}
                  
                  {profileData.preferences && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Investment Preferences</h4>
                      <p className="text-slate-300 text-sm">{profileData.preferences}</p>
                    </div>
                  )}
                </div>
              )}
              
              {!profileData && !pullingProfile && (
                <p className="text-slate-500 text-sm italic">
                  Click "Pull Profile" to use AI to research this entity and generate a comprehensive profile.
                </p>
              )}
            </div>
          )}
          
          {/* Matching Opportunities Section */}
          {!isEditing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Matching Opportunities
                  {matches.length > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                      {matches.length} found
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowMatches(!showMatches)}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  {showMatches ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {loadingMatches ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Finding matches...
                </div>
              ) : showMatches && (
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">
                      No matching opportunities found. Check back later or expand search criteria.
                    </p>
                  ) : (
                    matches.slice(0, 5).map((match, idx) => (
                      <div 
                        key={idx}
                        className="bg-gradient-to-r from-emerald-900/30 to-slate-800/50 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white">{match.opportunity.title || match.opportunity.address}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                match.match_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                match.match_score >= 60 ? 'bg-blue-500/20 text-blue-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {match.match_tier} ({match.match_score}%)
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{match.opportunity.address}</p>
                            <p className="text-sm text-emerald-400 font-medium mt-1">
                              {match.opportunity.previousPrice || match.opportunity.price}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {match.match_reasons.map((reason, ridx) => (
                                <span key={ridx} className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button className="ml-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {matches.length > 5 && (
                    <p className="text-center text-slate-500 text-sm">
                      + {matches.length - 5} more matches
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-900/50">
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Phone className="w-4 h-4" />
                Call Now
              </button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const ExportButton = ({ leads }) => {
  const handleExport = () => {
    const headers = ['Entity', 'Cash Amount', 'Sale Date', 'Location', 'Property', 'Asset Class', 'Address', 'Property Type', 'Match Score', 'Days Ago', 'Notes']
    const rows = leads.map(lead => [
      lead.entity,
      lead.cashAmount,
      lead.saleDate,
      lead.location,
      lead.property,
      lead.assetClass || lead.propertyType,
      lead.address || lead.property,
      lead.propertyType,
      lead.matchScore,
      lead.daysAgo,
      lead.notes || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hot-money-leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  )
}

const FilterModal = ({ show, onClose, filters, setFilters }) => {
  if (!show) return null
  
  const propertyTypes = ['all', 'Industrial', 'Retail', 'Office', 'Multi-Family', 'Agricultural', 'Land', 'Mixed-Use']
  
  const clearFilters = () => {
    setFilters({
      propertyType: 'all',
      minCash: '',
      maxCash: '',
      location: ''
    })
  }
  
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all')
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-md mx-4 rounded-xl border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-red-500" />
            Filter Hot Money Leads
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Property Type */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Property Type</label>
            <select 
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Types</option>
              <option value="Industrial">Industrial</option>
              <option value="Retail">Retail</option>
              <option value="Office">Office</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Land">Land</option>
              <option value="Mixed-Use">Mixed-Use</option>
            </select>
          </div>
          
          {/* Cash Range */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Cash Amount Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minCash}
                  onChange={(e) => setFilters({...filters, minCash: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                />
              </div>
              <span className="text-slate-500">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxCash}
                  onChange={(e) => setFilters({...filters, maxCash: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Location</label>
            <input
              type="text"
              placeholder="Search location..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <button 
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="text-sm text-slate-400 hover:text-white disabled:opacity-50"
          >
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

const HotMoneyListItem = ({ lead, formatCash, onViewProfile, onSpawnPaperclip, onFilterByAssetClass }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const assetClassLabel = lead.assetClass || lead.propertyType
  const ql = lead.quickLinks || {}
  
  return (
    <div 
      onClick={onViewProfile}
      className="p-5 hover:bg-slate-800/50 transition-colors group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Hot Badge */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
            <Flame className="w-5 h-5 text-red-500" />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              {/* Company Name */}
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="font-semibold text-white text-lg group-hover:text-red-400 transition-colors">{lead.entity}</h4>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                  Sale: {lead.saleDate || "Date unknown"}
                </span>
              </div>
              
              {/* Personal Contact Name */}
              {lead.contactName && (
                <p className="text-sm text-purple-400 mt-1 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="font-medium">Contact:</span>
                  <span>{lead.contactName}</span>
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-lg">{formatCash(lead.cashAmount)} cash</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>{lead.saleDate}</span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{lead.location}</span>
                </div>
              </div>
              
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                {onFilterByAssetClass && assetClassLabel && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFilterByAssetClass(assetClassLabel)
                    }}
                    className="text-slate-400 hover:text-blue-400 hover:underline cursor-pointer transition-colors"
                    title={`Filter by ${assetClassLabel}`}
                  >
                    {assetClassLabel}
                  </button>
                )}
                {(!onFilterByAssetClass || !assetClassLabel) && (
                  <span className="text-slate-400">{assetClassLabel}</span>
                )}
                <span className="mx-1">•</span>
                <span>{lead.address || lead.property}</span>
              </p>
              
              {/* Quick Links Bar */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {/* Company Google */}
                {ql.seller?.google && (
                  <a
                    href={ql.seller.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                    title="Google Search Company"
                  >
                    <Search className="w-3 h-3" />
                    Google
                  </a>
                )}
                
                {/* LinkedIn Company */}
                {ql.seller?.linkedinCompany && (
                  <a
                    href={ql.seller.linkedinCompany}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700/30 text-xs text-blue-300 transition-colors"
                    title="LinkedIn Company"
                  >
                    <Building className="w-3 h-3" />
                    LinkedIn Co
                  </a>
                )}
                
                {/* LinkedIn Person */}
                {ql.seller?.linkedinPerson && (
                  <a
                    href={ql.seller.linkedinPerson}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/30 text-xs text-purple-300 transition-colors"
                    title={`LinkedIn: ${lead.contactName}`}
                  >
                    <UserCircle className="w-3 h-3" />
                    LinkedIn Person
                  </a>
                )}
                
                {/* Facebook Company */}
                {ql.seller?.facebook && (
                  <a
                    href={ql.seller.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-700/30 text-xs text-indigo-300 transition-colors"
                    title="Facebook Company"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Facebook
                  </a>
                )}
                
                {/* OpenCorporates */}
                {ql.seller?.openCorporate && (
                  <a
                    href={ql.seller.openCorporate}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-700/30 text-xs text-emerald-300 transition-colors"
                    title="OpenCorporates Search"
                  >
                    <Building className="w-3 h-3" />
                    Corp Registry
                  </a>
                )}
                
                {/* Corporation Canada */}
                {ql.seller?.corporation && (
                  <a
                    href={ql.seller.corporation}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-900/20 hover:bg-amber-900/40 border border-amber-700/30 text-xs text-amber-300 transition-colors"
                    title="Corporation Canada Search"
                  >
                    <FileText className="w-3 h-3" />
                    Canada Corp
                  </a>
                )}
                
                {/* BUYER Quick Links */}
                {lead.buyerEntity && ql.buyer && (
                  <>
                    <span className="text-slate-600 mx-1">|</span>
                    <span className="text-xs text-slate-500">Buyer:</span>
                    <a
                      href={ql.buyer.google}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                      title={`Google: ${lead.buyerEntity}`}
                    >
                      <Search className="w-3 h-3" />
                      {lead.buyerEntity.length > 20 ? lead.buyerEntity.slice(0, 18) + '...' : lead.buyerEntity}
                    </a>
                    <a
                      href={ql.buyer.linkedinCompany}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-900/20 hover:bg-blue-900/40 border border-blue-700/30 text-xs text-blue-300 transition-colors"
                      title="LinkedIn Buyer"
                    >
                      <Building className="w-3 h-3" />
                      LI
                    </a>
                  </>
                )}
              </div>
            </div>
            
            {/* Score & Actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(lead.matchScore)}`}>
                  {lead.matchScore}
                </div>
                <div className="text-xs text-slate-500">Match Score</div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('View Profile clicked for:', lead.entity)
                    onViewProfile()
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={onSpawnPaperclip}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>Analyze</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Paste Deal Modal Component
const PasteDealModal = ({ onClose, onSuccess, formatCash }) => {
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('paste') // 'paste' or 'manual'
  
  // Manual form state
  const [manualData, setManualData] = useState({
    entity: '',
    cashAmount: '',
    propertyType: 'Industrial',
    assetClass: '',
    address: '',
    location: '',
    saleDate: '',
    matchScore: 85,
    notes: ''
  })

  // Smart parser for deal text
  const parseDealText = (text) => {
    if (!text.trim()) return null
    
    const result = {
      entity: '',
      cashAmount: 0,
      propertyType: 'Industrial',
      assetClass: '',
      address: '',
      location: '',
      saleDate: '',
      matchScore: 85,
      notes: text,
      daysAgo: 0
    }
    
    // Extract entity name (Ontario Inc/Ltd numbers or company names)
    const ontarioInc = text.match(/(\d{7})\s*(Ontario\s+(?:Inc\.?|Ltd\.?|Limited))/i)
    const ontarioNumbered = text.match(/(\d{7})/)
    const companyMatch = text.match(/([A-Z][A-Za-z0-9\s&]+(?:Holdings|Ltd|Inc|Corp|Company|Realty|Estates?|Developments?|Properties?|Investments?))/i)
    
    if (ontarioInc) {
      result.entity = `${ontarioInc[1]} ${ontarioInc[2]}`
    } else if (ontarioNumbered) {
      result.entity = `${ontarioNumbered[1]} Ontario Inc`
    } else if (companyMatch) {
      result.entity = companyMatch[1].trim()
    }
    
    // Extract cash amount (look for $X or X million/thousand)
    const cashMatch = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(M(?:illion)?|mil|K(?: Thousand)?)/i) ||
                     text.match(/\$([\d,]+(?:\.\d+)?)/)
    if (cashMatch) {
      let amount = parseFloat(cashMatch[1].replace(/,/g, ''))
      const unit = (cashMatch[2] || '').toLowerCase()
      if (unit.startsWith('m')) amount *= 1000000
      if (unit === 'k') amount *= 1000
      result.cashAmount = Math.round(amount)
    }
    
    // Extract property type
    const types = ['Industrial', 'Retail', 'Office', 'Multi-Family', 'Agricultural', 'Land', 'Mixed-Use']
    for (const type of types) {
      if (text.toLowerCase().includes(type.toLowerCase())) {
        result.propertyType = type
        break
      }
    }
    
    // Extract asset class (look for descriptive terms)
    const assetMatches = text.match(/(\w+\s*(?:Warehouse|Center|Centre|Plaza|Mall|Building|Complex|Facility|Land|Farm|Vineyard))/i)
    if (assetMatches) {
      result.assetClass = assetMatches[1]
    }
    
    // Extract location (Niagara region cities)
    const cities = ['St. Catharines', 'Niagara Falls', 'Welland', 'Thorold', 'Pelham', 'Lincoln', 'Grimsby', 'West Lincoln', 'Wainfleet', 'Port Colborne', 'Fort Erie', 'Niagara-on-the-Lake', 'Fonthill', 'Beamsville', 'Smithville']
    for (const city of cities) {
      if (text.includes(city) || text.includes(city.replace('St. ', 'St '))) {
        result.location = city
        break
      }
    }
    
    // Extract address (look for Rd, St, Ave, etc.)
    const addressMatch = text.match(/(\d+\s+[\w\s]+(?:Rd|Road|St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive))/i)
    if (addressMatch) {
      result.address = addressMatch[1]
    }
    
    // Extract date
    const dateMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4})/i) ||
                     text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
    if (dateMatch) {
      result.saleDate = dateMatch[0]
    }
    
    // Calculate days ago if date found
    if (result.saleDate) {
      try {
        const date = new Date(result.saleDate)
        const now = new Date()
        result.daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      } catch {}
    }
    
    return result
  }
  
  const handleTextChange = (text) => {
    setRawText(text)
    const parsed = parseDealText(text)
    setParsed(parsed)
    if (parsed) {
      setManualData(prev => ({
        ...prev,
        entity: parsed.entity || prev.entity,
        cashAmount: parsed.cashAmount || prev.cashAmount,
        propertyType: parsed.propertyType || prev.propertyType,
        assetClass: parsed.assetClass || prev.assetClass,
        address: parsed.address || prev.address,
        location: parsed.location || prev.location,
        saleDate: parsed.saleDate || prev.saleDate,
        matchScore: parsed.matchScore || prev.matchScore,
        notes: text
      }))
    }
  }
  
  const handleSave = async () => {
    const data = activeTab === 'paste' && parsed ? parsed : manualData
    
    if (!data.entity) {
      alert('Entity name is required')
      return
    }
    
    setSaving(true)
    
    try {
      // Create lead in database
      const apiLead = {
        entity: data.entity,
        cash_amount: parseInt(data.cashAmount) || 0,
        sale_date: data.saleDate || '',
        location: data.location || '',
        property: data.address || data.location || '',
        match_score: parseInt(data.matchScore) || 85,
        property_type: data.propertyType || 'Industrial',
        asset_class: data.assetClass || data.propertyType || 'Commercial',
        address: data.address || '',
        days_ago: data.daysAgo || 0,
        notes: data.notes || '',
        contacts: []
      }
      
      const response = await fetch(`${API_BASE}/hotmoney`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiLead)
      })
      
      if (!response.ok) throw new Error('Failed to create lead')
      
      const result = await response.json()
      
      // Get the full lead data
      const leadResponse = await fetch(`${API_BASE}/hotmoney/${result.id}`)
      const leadData = await leadResponse.json()
      const newLead = apiToFrontend(leadData)
      
      // Send to Obsidian
      await sendToObsidian(newLead)
      
      onSuccess(newLead)
    } catch (err) {
      console.error('Error saving deal:', err)
      alert('Failed to save deal: ' + err.message)
    } finally {
      setSaving(false)
    }
  }
  
  const sendToObsidian = async (lead) => {
    try {
      // Use the obsidian_integration endpoint if available
      await fetch(`${API_BASE}/obsidian/quick-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Hot Money: ${lead.entity}`,
          content: generateObsidianContent(lead),
          folder: 'Deals/Hot Money'
        })
      })
    } catch (err) {
      console.log('Obsidian integration not available, skipping')
    }
  }
  
  const generateObsidianContent = (lead) => {
    const quickLinks = generateQuickLinks(lead.entity)
    return `# Hot Money Lead: ${lead.entity}

## Deal Overview
- **Entity:** ${lead.entity}
- **Cash Available:** ${formatCash(lead.cashAmount)}
- **Property Type:** ${lead.propertyType}
- **Asset Class:** ${lead.assetClass || 'N/A'}
- **Match Score:** ${lead.matchScore}/100

## Property Details
- **Address:** ${lead.address || 'N/A'}
- **Location:** ${lead.location || 'N/A'}
- **Sale Date:** ${lead.saleDate || 'N/A'}

## Quick Links
- [Google Search](${quickLinks?.google || ''})
- [LinkedIn Search](${quickLinks?.linkedin || ''})
- [Corporation Search](${quickLinks?.corporation || ''})

## Notes
${lead.notes || 'No notes yet.'}

## Status
- [ ] Initial contact made
- [ ] Property requirements identified
- [ ] Deal packaged
- [ ] Closed

*Created: ${new Date().toLocaleString()}*
`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-emerald-600/10 to-teal-600/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ClipboardPaste className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Paste New Deal</h2>
              <p className="text-slate-400 text-sm">Copy & paste deal text to auto-extract details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'paste' 
                ? 'text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Smart Paste
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manual' 
                ? 'text-emerald-400 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Entry
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {activeTab === 'paste' ? (
            <>
              {/* Paste Text Area */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Paste deal text here (emails, listings, notes...)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={`Example:\n2650687 Ontario Inc sold their industrial warehouse at 1230 Thirty Rd, West Lincoln for $15M in May 2025. Looking to redeploy capital into commercial development.`}
                  rows={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              {/* Parsed Preview */}
              {parsed && parsed.entity && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/20">
                  <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Auto-Extracted Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {parsed.entity && (
                      <div>
                        <span className="text-slate-500">Entity:</span>
                        <span className="text-white ml-2">{parsed.entity}</span>
                      </div>
                    )}
                    {parsed.cashAmount > 0 && (
                      <div>
                        <span className="text-slate-500">Cash:</span>
                        <span className="text-white ml-2">{formatCash(parsed.cashAmount)}</span>
                      </div>
                    )}
                    {parsed.propertyType && (
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="text-white ml-2">{parsed.propertyType}</span>
                      </div>
                    )}
                    {parsed.location && (
                      <div>
                        <span className="text-slate-500">Location:</span>
                        <span className="text-white ml-2">{parsed.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Manual Entry Form */
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Entity Name *</label>
                <input
                  type="text"
                  value={manualData.entity}
                  onChange={(e) => setManualData({...manualData, entity: e.target.value})}
                  placeholder="e.g. 2650687 Ontario Inc"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cash Amount</label>
                <input
                  type="number"
                  value={manualData.cashAmount}
                  onChange={(e) => setManualData({...manualData, cashAmount: e.target.value})}
                  placeholder="15000000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Property Type</label>
                <select
                  value={manualData.propertyType}
                  onChange={(e) => setManualData({...manualData, propertyType: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Industrial">Industrial</option>
                  <option value="Retail">Retail</option>
                  <option value="Office">Office</option>
                  <option value="Multi-Family">Multi-Family</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Land">Land</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Asset Class</label>
                <input
                  type="text"
                  value={manualData.assetClass}
                  onChange={(e) => setManualData({...manualData, assetClass: e.target.value})}
                  placeholder="e.g. Industrial Warehouse"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={manualData.location}
                  onChange={(e) => setManualData({...manualData, location: e.target.value})}
                  placeholder="e.g. West Lincoln"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={manualData.address}
                  onChange={(e) => setManualData({...manualData, address: e.target.value})}
                  placeholder="Full property address"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Sale Date</label>
                <input
                  type="text"
                  value={manualData.saleDate}
                  onChange={(e) => setManualData({...manualData, saleDate: e.target.value})}
                  placeholder="e.g. May 2025"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Match Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={manualData.matchScore}
                  onChange={(e) => setManualData({...manualData, matchScore: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <textarea
                  value={manualData.notes}
                  onChange={(e) => setManualData({...manualData, notes: e.target.value})}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (activeTab === 'paste' && !parsed?.entity && !manualData.entity)}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Deal & Send to Obsidian
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HotMoneyRadar
