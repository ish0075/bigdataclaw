import React, { useState } from 'react'
import { Map as MapIcon, MapPin, Layers, Filter, Search, Building2, DollarSign, Maximize2, Navigation, Eye, Download, Plus, Minus } from 'lucide-react'

const sampleProperties = [
  { id: '1', address: '281 Chippawa Creek Road', city: 'Welland', lat: 42.992, lng: -79.248, type: 'Industrial', price: 5200000, size: 85000, status: 'active' },
  { id: '2', address: '1500 Michael Drive', city: 'Welland', lat: 42.978, lng: -79.256, type: 'Industrial', price: 3500000, size: 45000, status: 'active' },
  { id: '3', address: '238 Ontario Street', city: 'St. Catharines', lat: 43.159, lng: -79.243, type: 'Retail', price: 12000000, size: 425000, status: 'under-contract' },
  { id: '4', address: '500 Main Street', city: 'Hamilton', lat: 43.255, lng: -79.871, type: 'Industrial', price: 8500000, size: 120000, status: 'active' },
  { id: '5', address: '981 Pelham Street', city: 'Pelham', lat: 43.034, lng: -79.288, type: 'Industrial', price: 7000000, size: 65000, status: 'active' },
]

const MapView = () => {
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [mapView, setMapView] = useState('satellite') // 'satellite' or 'street'
  
  const filteredProperties = sampleProperties.filter(p => {
    if (filterType !== 'all' && p.type !== filterType) return false
    return true
  })
  
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${(value / 1e3).toFixed(0)}K`
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-accent-green'
      case 'under-contract': return 'bg-accent-yellow'
      case 'sold': return 'bg-accent-blue'
      default: return 'bg-text-muted'
    }
  }
  
  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-accent-green" />
            Map View
          </h1>
          <p className="text-text-secondary mt-1">Visualize properties and market data on the map</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Layers
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Map
          </button>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="card overflow-hidden flex flex-col h-full">
        {/* Map Toolbar */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search location..."
                className="pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm w-64"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Properties</option>
              <option value="Industrial">Industrial</option>
              <option value="Retail">Retail</option>
              <option value="Office">Office</option>
              <option value="Multi-Family">Multi-Family</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMapView(mapView === 'satellite' ? 'street' : 'satellite')}
              className="px-3 py-2 rounded-lg bg-bg-input text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {mapView === 'satellite' ? 'Satellite' : 'Street'}
            </button>
            <div className="flex items-center gap-1 bg-bg-input rounded-lg p-1">
              <button className="p-1.5 rounded hover:bg-bg-card transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-bg-card transition-colors">
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Map Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Area (Placeholder) */}
          <div className="flex-1 relative bg-bg-input">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-bg-input to-bg-card">
              {/* Grid lines to simulate map */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
              
              {/* Niagara Region Label */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-4xl font-bold text-text-muted/20">Niagara Region</p>
                <p className="text-lg text-text-muted/30 mt-2">Interactive Map</p>
                <p className="text-sm text-text-muted/40 mt-4">Map integration would connect to Google Maps or Mapbox</p>
              </div>
              
              {/* Property Markers */}
              {filteredProperties.map((property, index) => (
                <button
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    top: `${20 + (index * 15)}%`,
                    left: `${15 + (index * 20)}%`,
                  }}
                >
                  <div className={`w-10 h-10 rounded-full ${getStatusColor(property.status)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap bg-bg-card px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {property.address}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-bg-card/90 backdrop-blur p-3 rounded-lg shadow-lg">
              <h4 className="text-xs font-medium text-text-secondary mb-2">Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-green" />
                  <span className="text-xs text-text-secondary">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-yellow" />
                  <span className="text-xs text-text-secondary">Under Contract</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-blue" />
                  <span className="text-xs text-text-secondary">Sold</span>
                </div>
              </div>
            </div>
            
            {/* Stats Overlay */}
            <div className="absolute top-4 right-4 bg-bg-card/90 backdrop-blur p-4 rounded-lg shadow-lg">
              <h4 className="text-xs font-medium text-text-secondary mb-2">Map Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-secondary">Properties</span>
                  <span className="font-semibold text-text-primary">{filteredProperties.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-secondary">Total Value</span>
                  <span className="font-semibold text-accent-red">{formatCurrency(filteredProperties.reduce((sum, p) => sum + p.price, 0))}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-text-secondary">Avg Price</span>
                  <span className="font-semibold text-accent-blue">{formatCurrency(filteredProperties.reduce((sum, p) => sum + p.price, 0) / filteredProperties.length)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Property List Sidebar */}
          <div className="w-80 border-l border-border-subtle overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">Properties on Map</h3>
              <p className="text-xs text-text-secondary mt-1">{filteredProperties.length} properties</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {filteredProperties.map(property => (
                <div 
                  key={property.id} 
                  className={`p-4 cursor-pointer hover:bg-bg-input transition-colors ${
                    selectedProperty?.id === property.id ? 'bg-bg-input border-l-2 border-accent-red' : ''
                  }`}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-text-primary text-sm">{property.address}</h4>
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(property.status)}`} />
                  </div>
                  <p className="text-xs text-text-secondary">{property.city}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-accent-red font-medium">{formatCurrency(property.price)}</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">{property.type}</span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">{property.size?.toLocaleString()} SF</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedProperty(null)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="h-48 bg-bg-input flex items-center justify-center relative">
              <Building2 className="w-16 h-16 text-text-muted" />
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                ×
              </button>
              <div className="absolute bottom-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(selectedProperty.status)}`}>
                  {selectedProperty.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-text-primary text-lg">{selectedProperty.address}</h3>
              <p className="text-text-secondary">{selectedProperty.city}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Price</p>
                  <p className="font-semibold text-accent-red">{formatCurrency(selectedProperty.price)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Size</p>
                  <p className="font-semibold text-text-primary">{selectedProperty.size?.toLocaleString()} SF</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Type</p>
                  <p className="font-semibold text-text-primary">{selectedProperty.type}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
