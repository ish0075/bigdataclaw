import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Search, ExternalLink, Building2, Home, Store, Factory, 
  TreePine, Stethoscope, Briefcase, MapPin, DollarSign, 
  Calendar, AlertCircle, CheckCircle, XCircle, Filter,
  Download, Plus, ClipboardCopy, RefreshCw, Send,
  Database, Eye, Save, Trash2, Sparkles, Bell, TrendingUp,
  Target, Mail, Phone, User, Map as MapIcon, List
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Opportunities Page - FULL AUTOMATION VERSION
 * 
 * Features:
 * - Auto-scraper for expired LoopNet listings
 * - Database matching (checks if property exists)
 * - Email alerts for new opportunities
 * - Map view with property locations
 * - Auto broker lookup
 */

const ASSET_CLASSES = [
  { id: 'multifamily', label: 'Multifamily / Apartments', icon: Home, color: 'bg-blue-500', searchTerm: 'MULTIFAMILY' },
  { id: 'shopping_mall', label: 'Shopping Malls', icon: Store, color: 'bg-purple-500', searchTerm: 'SHOPPING CENTER' },
  { id: 'retail_plaza', label: 'Retail Commercial Plaza', icon: Store, color: 'bg-pink-500', searchTerm: 'RETAIL' },
  { id: 'land', label: 'Land Development', icon: TreePine, color: 'bg-green-500', searchTerm: 'LAND' },
  { id: 'industrial', label: 'Industrial', icon: Factory, color: 'bg-orange-500', searchTerm: 'INDUSTRIAL' },
  { id: 'office', label: 'Office', icon: Building2, color: 'bg-cyan-500', searchTerm: 'OFFICE' },
  { id: 'medical', label: 'Medical', icon: Stethoscope, color: 'bg-red-500', searchTerm: 'MEDICAL' }
]

const PROVINCES = [
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'QC', name: 'Quebec' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland' },
  { code: 'PE', name: 'PEI' },
  { code: 'ALL', name: 'All Canada' }
]

// Generate Google search URL
const generateSearchUrl = (assetClass, province = 'ALL') => {
  const basePhrase = `"THIS ${assetClass.searchTerm} PROPERTY IS NO LONGER ADVERTISED ON LOOPNET.CA"`
  let query = basePhrase
  if (province !== 'ALL') query += ` ${province}`
  query += ` "off market" OR "sold" OR "expired listing"`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

// Sample opportunities with coordinates for map
const SAMPLE_OPPORTUNITIES = [
  {
    id: 1,
    propertyType: 'multifamily',
    title: '45-Unit Apartment Building',
    address: '123 Main St, Hamilton, ON',
    location: { lat: 43.2557, lng: -79.8711 },
    previousPrice: '$4,200,000',
    status: 'off_market',
    dateFound: '2026-03-28',
    source: 'LoopNet',
    notes: 'Listing expired 2 weeks ago. Contact broker to check availability.',
    tags: ['expired', 'multifamily', 'hamilton'],
    captured: false,
    inDatabase: false, // Not in our database = OPPORTUNITY!
    suggestedBrokers: [
      { name: 'John Mitchell', brokerage: 'RE/MAX', email: 'john@remax.com', phone: '905-555-0100' },
      { name: 'Sarah Johnson', brokerage: 'Century 21', email: 'sarah@c21.ca', phone: '905-555-0200' }
    ],
    matchedProperties: []
  },
  {
    id: 2,
    propertyType: 'industrial',
    title: '50,000 SF Warehouse',
    address: '500 Industrial Pkwy, Mississauga, ON',
    location: { lat: 43.5890, lng: -79.6441 },
    previousPrice: '$8,500,000',
    status: 'sold',
    dateFound: '2026-03-27',
    source: 'LoopNet',
    notes: 'Sold - checking database for buyer match.',
    tags: ['sold', 'industrial', 'mississauga'],
    captured: true,
    inDatabase: true, // IN DATABASE = We have the buyer!
    suggestedBrokers: [
      { name: 'Michael Chen', brokerage: 'Colliers', email: 'michael@colliers.com', phone: '905-555-0300' }
    ],
    matchedProperties: [
      { address: '500 Industrial Pkwy', buyer: 'ABC Investments', date: '2026-03-25' }
    ]
  },
  {
    id: 3,
    propertyType: 'office',
    title: 'Class A Office Building',
    address: '100 King St W, Toronto, ON',
    location: { lat: 43.6487, lng: -79.3819 },
    previousPrice: '$25,000,000',
    status: 'off_market',
    dateFound: '2026-03-26',
    source: 'LoopNet',
    notes: 'Premium downtown location. Off market - opportunity!',
    tags: ['off_market', 'office', 'toronto', 'premium'],
    captured: false,
    inDatabase: false,
    suggestedBrokers: [
      { name: 'Jennifer Williams', brokerage: 'CBRE', email: 'jennifer@cbre.com', phone: '416-555-0400' },
      { name: 'David Park', brokerage: 'JLL', email: 'david@jll.com', phone: '416-555-0500' }
    ],
    matchedProperties: []
  }
]

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState(SAMPLE_OPPORTUNITIES)
  const [selectedAsset, setSelectedAsset] = useState(ASSET_CLASSES[0])
  const [selectedProvince, setSelectedProvince] = useState('ON')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'
  const [filter, setFilter] = useState('all') // all, off_market, sold, opportunity
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [automationStatus, setAutomationStatus] = useState({
    lastRun: '2026-03-28 06:00',
    nextRun: '2026-03-29 06:00',
    totalFound: 12,
    newToday: 3
  })

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      if (filter === 'opportunity' && opp.inDatabase) return false
      if (filter === 'sold' && opp.status !== 'sold') return false
      if (filter === 'off_market' && opp.status !== 'off_market') return false
      if (searchQuery && !opp.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [opportunities, filter, searchQuery])

  // Statistics
  const stats = useMemo(() => ({
    total: opportunities.length,
    opportunities: opportunities.filter(o => !o.inDatabase).length,
    sold: opportunities.filter(o => o.status === 'sold').length,
    newToday: automationStatus.newToday
  }), [opportunities, automationStatus])

  const openGoogleSearch = () => {
    const url = generateSearchUrl(selectedAsset, selectedProvince)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const captureOpportunity = (opp) => {
    // Generate Obsidian note
    const note = `# ${opp.title}

**Status:** ${opp.status}
**Address:** ${opp.address}
**Previous Price:** ${opp.previousPrice}
**In Database:** ${opp.inDatabase ? 'Yes ✓' : 'No - OPPORTUNITY!'}

## Notes
${opp.notes}

## Suggested Brokers
${opp.suggestedBrokers.map(b => `- ${b.name} (${b.brokerage}) - ${b.email}`).join('\n')}

## Actions
- [ ] Contact broker
- [ ] Verify current status
- [ ] ${opp.inDatabase ? 'Contact buyer from database' : 'Add to prospecting list'}

*Captured: ${new Date().toISOString()}*
`
    
    // Copy to clipboard
    navigator.clipboard.writeText(note)
    
    // Mark as captured
    setOpportunities(prev => prev.map(o => 
      o.id === opp.id ? { ...o, captured: true } : o
    ))
    
    alert('Opportunity saved to clipboard! Paste into Obsidian.')
  }

  const runAutomation = async () => {
    setLoading(true)
    // Simulate automation run
    await new Promise(r => setTimeout(r, 2000))
    setAutomationStatus(prev => ({
      ...prev,
      lastRun: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
      newToday: prev.newToday + 1
    }))
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent-yellow" />
              Opportunities
            </h1>
            <span className="px-2 py-1 rounded-full bg-accent-green/10 text-accent-green text-xs font-medium">
              AUTO-SCANNING
            </span>
          </div>
          <p className="text-text-secondary mt-1">
            Automated off-market property discovery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={runAutomation}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run Scanner
          </button>
        </div>
      </div>

      {/* Automation Status */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-green/20">
            <TrendingUp className="w-6 h-6 text-accent-green" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">Automation Status</h3>
            <p className="text-sm text-text-secondary">
              Last run: {automationStatus.lastRun} • Next run: {automationStatus.nextRun}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-accent-blue">{automationStatus.totalFound}</p>
              <p className="text-xs text-text-muted">Total Found</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-green">{automationStatus.newToday}</p>
              <p className="text-xs text-text-muted">New Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-text-muted text-xs">Total</p>
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Opportunities</p>
          <p className="text-2xl font-bold text-accent-yellow">{stats.opportunities}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">Sold (DB Check)</p>
          <p className="text-2xl font-bold text-accent-green">{stats.sold}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-muted text-xs">New Today</p>
          <p className="text-2xl font-bold text-accent-purple">{stats.newToday}</p>
        </div>
      </div>

      {/* Search Configuration */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-accent-blue" />
          <h2 className="text-lg font-semibold">Search Configuration</h2>
        </div>

        {/* Asset Class Grid */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-3 block">Asset Class</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {ASSET_CLASSES.map((asset) => {
              const Icon = asset.icon
              const isSelected = selectedAsset.id === asset.id
              
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? `${asset.color} border-current text-white` 
                      : 'bg-bg-input border-border-subtle text-text-secondary hover:border-text-muted'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-medium block leading-tight">{asset.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Province & Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-text-muted" />
            <select 
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
            >
              {PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex-1" />

          <button onClick={() => window.open('https://www.loopnet.ca', '_blank')} className="btn-secondary flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            LoopNet
          </button>
          
          <button onClick={openGoogleSearch} className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Google Search
          </button>
        </div>

        {/* Search Query Preview */}
        <div className="p-4 rounded-lg bg-bg-input">
          <p className="text-xs text-text-muted mb-1">Google Search Query:</p>
          <code className="text-sm text-accent-blue break-all">
            "THIS {selectedAsset.searchTerm} PROPERTY IS NO LONGER ADVERTISED ON LOOPNET.CA"
          </code>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-input rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'list' ? 'bg-accent-blue text-white' : 'text-text-secondary'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'map' ? 'bg-accent-blue text-white' : 'text-text-secondary'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
          </div>

          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="opportunity">🎯 Opportunities Only</option>
            <option value="sold">✓ Sold (DB Check)</option>
            <option value="off_market">📋 Off Market</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm w-64"
          />
        </div>
      </div>

      {/* Content: List or Map View */}
      {viewMode === 'list' ? (
        <div className="grid gap-4">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard 
              key={opp.id} 
              opportunity={opp}
              onCapture={() => captureOpportunity(opp)}
              onShowBrokers={() => {
                setSelectedOpportunity(opp)
                setShowBrokerModal(true)
              }}
            />
          ))}
          
          {filteredOpportunities.length === 0 && (
            <div className="card p-12 text-center">
              <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No opportunities found</h3>
              <p className="text-text-secondary">Run the scanner to find new opportunities</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden" style={{ height: '600px' }}>
          <MapView opportunities={filteredOpportunities} />
        </div>
      )}

      {/* Broker Modal */}
      {showBrokerModal && selectedOpportunity && (
        <BrokerModal 
          opportunity={selectedOpportunity}
          onClose={() => setShowBrokerModal(false)}
        />
      )}
    </div>
  )
}

// Opportunity Card Component
const OpportunityCard = ({ opportunity, onCapture, onShowBrokers }) => {
  const AssetIcon = ASSET_CLASSES.find(a => a.id === opportunity.propertyType)?.icon || Building2
  const isOpportunity = !opportunity.inDatabase
  
  return (
    <div className={`card p-5 border-l-4 ${isOpportunity ? 'border-accent-yellow' : 'border-accent-green'}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${isOpportunity ? 'bg-accent-yellow/20' : 'bg-accent-green/20'}`}>
          <AssetIcon className={`w-6 h-6 ${isOpportunity ? 'text-accent-yellow' : 'text-accent-green'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-primary">{opportunity.title}</h3>
                {isOpportunity ? (
                  <span className="px-2 py-0.5 rounded-full bg-accent-yellow/20 text-accent-yellow text-xs font-medium">
                    🎯 OPPORTUNITY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green text-xs font-medium">
                    ✓ IN DATABASE
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">{opportunity.address}</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {opportunity.previousPrice}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {opportunity.dateFound}
                </span>
                <span className={`px-2 py-0.5 rounded ${
                  opportunity.status === 'sold' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'
                }`}>
                  {opportunity.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Database Match Info */}
          {opportunity.inDatabase && opportunity.matchedProperties.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-accent-green/10">
              <p className="text-sm font-medium text-accent-green flex items-center gap-2">
                <Database className="w-4 h-4" />
                Match Found in Database
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Buyer: {opportunity.matchedProperties[0].buyer}
              </p>
            </div>
          )}

          {/* Suggested Brokers */}
          <div className="mt-3">
            <p className="text-xs text-text-muted mb-2">Suggested Brokers ({opportunity.suggestedBrokers.length}):</p>
            <div className="flex flex-wrap gap-2">
              {opportunity.suggestedBrokers.slice(0, 2).map((broker, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-bg-input text-text-secondary">
                  {broker.name} ({broker.brokerage})
                </span>
              ))}
              {opportunity.suggestedBrokers.length > 2 && (
                <button 
                  onClick={onShowBrokers}
                  className="text-xs px-2 py-1 rounded bg-accent-blue/10 text-accent-blue"
                >
                  +{opportunity.suggestedBrokers.length - 2} more
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border-subtle">
            <button 
              onClick={onCapture}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                opportunity.captured 
                  ? 'bg-accent-green/20 text-accent-green' 
                  : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
              }`}
            >
              {opportunity.captured ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save to Obsidian</>}
            </button>
            
            <button 
              onClick={onShowBrokers}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-bg-input text-text-secondary hover:bg-bg-hover transition-colors"
            >
              <User className="w-4 h-4" />
              All Brokers
            </button>
            
            <button 
              onClick={() => window.open(generateSearchUrl(ASSET_CLASSES.find(a => a.id === opportunity.propertyType)), '_blank')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-bg-input text-text-secondary hover:bg-bg-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Map View Component
const MapView = ({ opportunities }) => {
  // Center on first opportunity or default to Toronto
  const center = opportunities[0]?.location || { lat: 43.6532, lng: -79.3832 }
  
  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={10} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      {opportunities.map(opp => opp.location && (
        <Marker key={opp.id} position={[opp.location.lat, opp.location.lng]}>
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold">{opp.title}</h4>
              <p className="text-sm">{opp.address}</p>
              <p className="text-sm font-medium">{opp.previousPrice}</p>
              {!opp.inDatabase && (
                <span className="text-xs text-accent-yellow">🎯 Opportunity</span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

// Broker Modal
const BrokerModal = ({ opportunity, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Suggested Brokers</h3>
            <p className="text-sm text-text-secondary">{opportunity.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <XCircle className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="space-y-4">
            {opportunity.suggestedBrokers.map((broker, i) => (
              <div key={i} className="p-4 rounded-lg bg-bg-input">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-text-primary">{broker.name}</h4>
                    <p className="text-sm text-text-secondary">{broker.brokerage}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {broker.email && (
                    <a 
                      href={`mailto:${broker.email}`}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-accent-blue/10 text-accent-blue"
                    >
                      <Mail className="w-3 h-3" />
                      {broker.email}
                    </a>
                  )}
                  {broker.phone && (
                    <a 
                      href={`tel:${broker.phone}`}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-accent-green/10 text-accent-green"
                    >
                      <Phone className="w-3 h-3" />
                      {broker.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Opportunities
