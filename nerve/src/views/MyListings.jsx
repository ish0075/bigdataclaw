import React, { useState, useEffect } from 'react'
import { useListingStore } from '../stores/listingStore'
import { 
  Building2, Plus, Search, Filter, MapPin, DollarSign, 
  Maximize2, Users, Phone, Mail, ExternalLink, X, Check,
  Trash2, Edit3, Eye, Upload, Tag, FileText, TrendingUp,
  Target, ChevronRight, Home, MoreHorizontal, Download,
  Percent, Calendar, Image as ImageIcon
} from 'lucide-react'

const MyListings = () => {
  const { listings, buyers, matches, addListing, updateListing, deleteListing, setListingStatus, findMatches, getMatches, getStats } = useListingStore()
  const [view, setView] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAssetClass, setFilterAssetClass] = useState('all')
  const [selectedListing, setSelectedListing] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  const stats = getStats()
  
  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (searchQuery && !listing.address.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !listing.city.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterStatus !== 'all' && listing.status !== filterStatus) return false
    if (filterAssetClass !== 'all' && listing.assetClass !== filterAssetClass) return false
    return true
  })
  
  const handleViewMatches = (listing) => {
    setSelectedListing(listing)
    findMatches(listing.id)
    setShowMatchModal(true)
  }
  
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-accent-green/20 text-accent-green'
      case 'under-contract': return 'bg-accent-yellow/20 text-accent-yellow'
      case 'sold': return 'bg-accent-blue/20 text-accent-blue'
      default: return 'bg-text-muted/20 text-text-muted'
    }
  }
  
  return (
    <>
      {/* Add Listing Modal */}
      {showAddModal && (
        <AddListingModal 
          onClose={() => setShowAddModal(false)}
          onSave={addListing}
        />
      )}
      
      {/* Edit Listing Modal */}
      {showEditModal && selectedListing && (
        <EditListingModal 
          listing={selectedListing}
          onClose={() => { setShowEditModal(false); setSelectedListing(null) }}
          onSave={updateListing}
        />
      )}
      
      {/* Match Modal */}
      {showMatchModal && selectedListing && (
        <MatchModal 
          listing={selectedListing}
          matches={getMatches(selectedListing.id)}
          onClose={() => { setShowMatchModal(false); setSelectedListing(null) }}
        />
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal 
          listing={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => {
            deleteListing(showDeleteConfirm.id)
            setShowDeleteConfirm(null)
          }}
        />
      )}
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Building2 className="w-6 h-6 text-accent-red" />
              My Listings
            </h1>
            <p className="text-text-secondary mt-1">
              Manage your property listings and find matching buyers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="btn-secondary"
            >
              {view === 'grid' ? 'List View' : 'Grid View'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Listing
            </button>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-text-muted text-sm">Total Listings</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{stats.total}</p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Active</p>
            <p className="text-3xl font-bold text-accent-green mt-1">{stats.active}</p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Portfolio Value</p>
            <p className="text-3xl font-bold text-accent-red mt-1">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Avg Cap Rate</p>
            <p className="text-3xl font-bold text-accent-blue mt-1">{stats.avgCapRate.toFixed(1)}%</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="under-contract">Under Contract</option>
              <option value="sold">Sold</option>
            </select>
            <select 
              value={filterAssetClass}
              onChange={(e) => setFilterAssetClass(e.target.value)}
              className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="Industrial">Industrial</option>
              <option value="Retail">Retail</option>
              <option value="Office">Office</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Land">Land</option>
            </select>
          </div>
        </div>
        
        {/* Listings */}
        {filteredListings.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No listings found</h3>
            <p className="text-text-secondary mb-4">Add your first property listing to get started</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Listing
            </button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard 
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                onEdit={() => { setSelectedListing(listing); setShowEditModal(true) }}
                onDelete={() => setShowDeleteConfirm(listing)}
                onMatch={() => handleViewMatches(listing)}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-input border-b border-border-subtle">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Property</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Price</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Size</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Cap Rate</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map(listing => (
                  <tr key={listing.id} className="border-b border-border-subtle hover:bg-bg-input/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-text-primary">{listing.address}</p>
                        <p className="text-sm text-text-secondary">{listing.city}, {listing.region}</p>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary">{listing.assetClass}</td>
                    <td className="p-4 font-medium">{formatCurrency(listing.price)}</td>
                    <td className="p-4 text-text-secondary">{listing.size?.toLocaleString()} SF</td>
                    <td className="p-4 text-text-secondary">{listing.capRate}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewMatches(listing)}
                          className="p-2 rounded-lg hover:bg-bg-input text-text-secondary hover:text-accent-green transition-colors"
                          title="View Matches"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedListing(listing); setShowEditModal(true) }}
                          className="p-2 rounded-lg hover:bg-bg-input text-text-secondary hover:text-text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(listing)}
                          className="p-2 rounded-lg hover:bg-bg-input text-text-secondary hover:text-accent-red transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

const ListingCard = ({ listing, onView, onEdit, onDelete, onMatch, formatCurrency, getStatusColor }) => {
  return (
    <div className="card overflow-hidden group">
      {/* Image Placeholder */}
      <div className="h-48 bg-bg-input flex items-center justify-center relative">
        <ImageIcon className="w-16 h-16 text-text-muted" />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-text-primary">{listing.address}</h3>
            <p className="text-sm text-text-secondary">{listing.city}, {listing.region}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-bg-input">
            <p className="text-xs text-text-muted">Price</p>
            <p className="font-medium text-accent-red">{formatCurrency(listing.price)}</p>
          </div>
          <div className="p-2 rounded-lg bg-bg-input">
            <p className="text-xs text-text-muted">Size</p>
            <p className="font-medium">{listing.size?.toLocaleString()} SF</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-3 h-3 text-text-muted" />
          <span className="text-sm text-text-secondary">{listing.assetClass}</span>
          {listing.capRate && (
            <>
              <span className="text-text-muted">•</span>
              <Percent className="w-3 h-3 text-text-muted" />
              <span className="text-sm text-text-secondary">{listing.capRate}% Cap</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onMatch}
            className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
          >
            <Target className="w-4 h-4" />
            Find Buyers
          </button>
          <button 
            onClick={onEdit}
            className="p-2 rounded-lg bg-bg-input hover:bg-bg-card text-text-secondary transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete}
            className="p-2 rounded-lg bg-bg-input hover:bg-bg-card text-text-secondary hover:text-accent-red transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const AddListingModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    region: 'Niagara',
    postalCode: '',
    assetClass: 'Industrial',
    price: '',
    size: '',
    capRate: '',
    description: '',
    features: '',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      price: parseInt(formData.price) || 0,
      size: parseInt(formData.size) || 0,
      capRate: parseFloat(formData.capRate) || 0,
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
      contacts: formData.contactName ? [{
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail,
        role: 'Broker'
      }] : []
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle sticky top-0 bg-bg-card z-10">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-accent-red" />
            Add New Listing
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Address *</label>
              <input
                required
                type="text"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">City *</label>
              <input
                required
                type="text"
                placeholder="Welland"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Region</label>
              <select 
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="Niagara">Niagara</option>
                <option value="Toronto">Toronto</option>
                <option value="Hamilton">Hamilton</option>
                <option value="GTA">GTA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Asset Class</label>
              <select 
                value={formData.assetClass}
                onChange={(e) => setFormData({...formData, assetClass: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="Industrial">Industrial</option>
                <option value="Retail">Retail</option>
                <option value="Office">Office</option>
                <option value="Multi-Family">Multi-Family</option>
                <option value="Land">Land</option>
                <option value="Mixed-Use">Mixed-Use</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Price *</label>
              <input
                required
                type="number"
                placeholder="5000000"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Size (SF)</label>
              <input
                type="number"
                placeholder="50000"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Cap Rate (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="6.5"
                value={formData.capRate}
                onChange={(e) => setFormData({...formData, capRate: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Property description..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-1">Features (comma separated)</label>
            <input
              type="text"
              placeholder="26' Clear Height, Dock Doors, Sprinklered"
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="border-t border-border-subtle pt-4">
            <h4 className="font-medium text-text-primary mb-3">Contact Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="905-555-0100"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" />
              Add Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditListingModal = ({ listing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    address: listing.address,
    city: listing.city,
    region: listing.region,
    assetClass: listing.assetClass,
    price: listing.price,
    size: listing.size,
    capRate: listing.capRate,
    description: listing.description,
    features: listing.features?.join(', ') || '',
    status: listing.status
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(listing.id, {
      ...formData,
      price: parseInt(formData.price) || 0,
      size: parseInt(formData.size) || 0,
      capRate: parseFloat(formData.capRate) || 0,
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle sticky top-0 bg-bg-card">
          <h3 className="font-semibold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-accent-red" />
            Edit Listing
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="under-contract">Under Contract</option>
                <option value="sold">Sold</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Size (SF)</label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const MatchModal = ({ listing, matches, onClose }) => {
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-red" />
              Buyer Matches
            </h3>
            <p className="text-sm text-text-secondary">{listing.address}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {matches.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No matches found for this listing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((buyer, index) => (
                <div key={buyer.id} className="p-4 rounded-xl bg-bg-input border border-border-subtle">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary">{buyer.entity}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green text-xs">
                          {buyer.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {buyer.type} • {formatCurrency(buyer.minDeal)} - {formatCurrency(buyer.maxDeal)}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {buyer.matchReasons.map((reason, i) => (
                          <span key={i} className="text-xs text-text-muted flex items-center gap-1">
                            <Check className="w-3 h-3 text-accent-green" />
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent-green">{buyer.matchScore}</p>
                      <p className="text-xs text-text-muted">Match Score</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button className="flex-1 py-2 rounded-lg bg-accent-red text-white text-sm hover:bg-accent-red/90 transition-colors flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact
                    </button>
                    <button className="flex-1 py-2 rounded-lg bg-bg-card text-text-secondary text-sm hover:text-text-primary transition-colors flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button className="p-2 rounded-lg bg-bg-card text-text-secondary hover:text-text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border-subtle">
          <button onClick={onClose} className="w-full btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

const DeleteConfirmModal = ({ listing, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-subtle">
          <h3 className="font-semibold text-accent-red flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Listing
          </h3>
        </div>
        <div className="p-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">{listing.address}</strong>?
          </p>
          <p className="text-sm text-text-muted mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border-subtle">
          <button onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-secondary bg-accent-red/20 text-accent-red hover:bg-accent-red/30">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyListings
