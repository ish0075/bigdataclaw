import React, { useState, useMemo } from 'react'
import { useDealStore } from '../stores/dealStore'
import { 
  Plus, Phone, Mail, Linkedin, MoreHorizontal, Calendar, Filter, Download, 
  X, Check, ChevronRight, ChevronLeft, Building2, MapPin, DollarSign, Search,
  MoveRight
} from 'lucide-react'

const stages = [
  { id: 'new', label: 'New', color: 'blue', icon: '🔵', bgColor: 'bg-accent-blue/10', borderColor: 'border-accent-blue/30' },
  { id: 'contacted', label: 'Contacted', color: 'yellow', icon: '🟡', bgColor: 'bg-accent-yellow/10', borderColor: 'border-accent-yellow/30' },
  { id: 'offer', label: 'Offer Out', color: 'orange', icon: '🟠', bgColor: 'bg-accent-orange/10', borderColor: 'border-accent-orange/30' },
  { id: 'closing', label: 'Closing', color: 'green', icon: '🟢', bgColor: 'bg-accent-green/10', borderColor: 'border-accent-green/30' },
]

const DealPipeline = () => {
  const { deals, moveDeal, addDeal, updateDeal } = useDealStore()
  const [draggedDeal, setDraggedDeal] = useState(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [showDealDetails, setShowDealDetails] = useState(null)
  const [filters, setFilters] = useState({
    type: 'all',
    minValue: '',
    maxValue: '',
    location: '',
    search: ''
  })
  
  // Apply filters
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (filters.type !== 'all' && deal.type !== filters.type) return false
      if (filters.minValue && deal.value < parseInt(filters.minValue)) return false
      if (filters.maxValue && deal.value > parseInt(filters.maxValue)) return false
      if (filters.location && !deal.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.search && !deal.entity.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [deals, filters])
  
  const getDealsForStage = (stageId) => {
    return filteredDeals.filter(d => d.stage === stageId)
  }
  
  const handleDragStart = (deal) => {
    setDraggedDeal(deal)
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
  }
  
  const handleDrop = (e, stageId) => {
    e.preventDefault()
    if (draggedDeal && draggedDeal.stage !== stageId) {
      moveDeal(draggedDeal.id, stageId)
      setDraggedDeal(null)
    }
  }
  
  const handleExport = () => {
    const headers = ['Entity', 'Value', 'Type', 'Location', 'Stage', 'Match Score', 'Last Activity']
    const rows = filteredDeals.map(deal => [
      deal.entity,
      deal.value,
      deal.type,
      deal.location,
      stages.find(s => s.id === deal.stage)?.label || deal.stage,
      deal.matchScore,
      new Date(deal.lastActivity).toLocaleDateString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deal-pipeline-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all')
  
  return (
    <>
      {/* Filter Modal */}
      <FilterModal 
        show={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        hasActiveFilters={hasActiveFilters}
      />
      
      {/* New Deal Modal */}
      <NewDealModal 
        show={showNewDealModal}
        onClose={() => setShowNewDealModal(false)}
        onAdd={addDeal}
      />
      
      {/* Deal Details Modal */}
      <DealDetailsModal
        show={!!showDealDetails}
        deal={showDealDetails}
        onClose={() => setShowDealDetails(null)}
        onMove={moveDeal}
        stages={stages}
        formatCurrency={formatCurrency}
      />
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Deal Pipeline</h1>
            <p className="text-text-secondary mt-1">
              Track your active deals from lead to close
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search deals..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-9 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent-red"
              />
            </div>
            <button 
              onClick={() => setShowFilterModal(true)}
              className="btn-secondary flex items-center gap-2 relative"
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-red"></span>
              )}
            </button>
            <button 
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => setShowNewDealModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </button>
          </div>
        </div>
        
        {/* Pipeline Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => {
            const stageDeals = getDealsForStage(stage.id)
            
            return (
              <div
                key={stage.id}
                className={`card flex flex-col max-h-[calc(100vh-280px)] ${stage.bgColor}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className={`p-4 border-b ${stage.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{stage.icon}</span>
                      <span className="font-semibold">{stage.label}</span>
                    </div>
                    <span className="text-sm text-text-muted">({stageDeals.length})</span>
                  </div>
                </div>
                
                {/* Deals */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      formatCurrency={formatCurrency}
                      onDragStart={() => handleDragStart(deal)}
                      onClick={() => setShowDealDetails(deal)}
                      stages={stages}
                      onMove={moveDeal}
                    />
                  ))}
                  
                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border-subtle rounded-xl">
                      No deals in {stage.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Pipeline Stats */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Pipeline Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-bg-input">
              <p className="text-text-muted text-sm">Total Pipeline Value</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(filteredDeals.reduce((sum, d) => sum + d.value, 0))}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-input">
              <p className="text-text-muted text-sm">Active Deals</p>
              <p className="text-2xl font-bold mt-1">{filteredDeals.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-bg-input">
              <p className="text-text-muted text-sm">Avg Match Score</p>
              <p className="text-2xl font-bold mt-1">
                {filteredDeals.length > 0 ? Math.round(filteredDeals.reduce((sum, d) => sum + d.matchScore, 0) / filteredDeals.length) : 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-input">
              <p className="text-text-muted text-sm">Closing This Month</p>
              <p className="text-2xl font-bold mt-1">
                {getDealsForStage('closing').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const DealCard = ({ deal, formatCurrency, onDragStart, onClick, stages, onMove }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-accent-green'
    if (score >= 70) return 'text-accent-yellow'
    return 'text-accent-red'
  }
  
  const currentStageIndex = stages.findIndex(s => s.id === deal.stage)
  const canMoveForward = currentStageIndex < stages.length - 1
  const canMoveBack = currentStageIndex > 0
  
  const handlePhone = () => {
    window.open(`tel:+1-555-0000`, '_self')
  }
  
  const handleEmail = () => {
    window.open(`mailto:contact@${deal.entity.toLowerCase().replace(/\s+/g, '')}.com?subject=RE: ${deal.type} Deal - ${deal.location}`, '_blank')
  }
  
  const handleLinkedIn = () => {
    window.open(`https://linkedin.com/search/results/companies/?keywords=${encodeURIComponent(deal.entity)}`, '_blank')
  }
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-4 rounded-xl bg-bg-card border border-border-subtle cursor-move hover:border-accent-red/30 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary truncate">{deal.entity}</h4>
          <p className="text-sm text-text-secondary mt-0.5">
            {formatCurrency(deal.value)} • {deal.type}
          </p>
          <p className="text-xs text-text-muted mt-1">{deal.location}</p>
        </div>
        
        <div className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}>
          {deal.matchScore}
        </div>
      </div>
      
      {/* Stage Navigation */}
      <div className="mt-3 flex items-center gap-1">
        {canMoveBack && (
          <button 
            onClick={(e) => { e.stopPropagation(); onMove(deal.id, stages[currentStageIndex - 1].id); }}
            className="p-1 rounded bg-bg-input text-text-muted hover:text-text-primary transition-colors"
            title={`Move to ${stages[currentStageIndex - 1].label}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-xs text-text-muted px-2 flex-1 text-center">
          {stages[currentStageIndex].label}
        </span>
        {canMoveForward && (
          <button 
            onClick={(e) => { e.stopPropagation(); onMove(deal.id, stages[currentStageIndex + 1].id); }}
            className="p-1 rounded bg-bg-input text-text-muted hover:text-accent-green transition-colors"
            title={`Move to ${stages[currentStageIndex + 1].label}`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); handlePhone(); }}
          className="p-1.5 rounded bg-bg-input text-text-secondary hover:text-accent-green hover:bg-accent-green/10 transition-colors" 
          title="Call"
        >
          <Phone className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleEmail(); }}
          className="p-1.5 rounded bg-bg-input text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 transition-colors" 
          title="Email"
        >
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleLinkedIn(); }}
          className="p-1.5 rounded bg-bg-input text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 transition-colors" 
          title="LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="p-1.5 rounded bg-bg-input text-text-secondary hover:text-text-primary transition-colors ml-auto" 
          title="More"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Last Activity */}
      <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
        <Calendar className="w-3 h-3" />
        <span>Updated {new Date(deal.lastActivity).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

const FilterModal = ({ show, onClose, filters, setFilters, hasActiveFilters }) => {
  if (!show) return null
  
  const dealTypes = ['all', 'Industrial', 'Retail', 'Office', 'Multi-Family', 'Agricultural', 'Land', 'Mixed-Use', 'Vineyard', 'Farm']
  
  const clearFilters = () => {
    setFilters({
      type: 'all',
      minValue: '',
      maxValue: '',
      location: '',
      search: ''
    })
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-accent-red" />
            Filter Deals
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Deal Type */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Property Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="Industrial">Industrial</option>
              <option value="Retail">Retail</option>
              <option value="Office">Office</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Land">Land</option>
              <option value="Mixed-Use">Mixed-Use</option>
              <option value="Vineyard">Vineyard</option>
              <option value="Farm">Farm</option>
            </select>
          </div>
          
          {/* Value Range */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Deal Value Range</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minValue}
                  onChange={(e) => setFilters({...filters, minValue: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg pl-7 pr-3 py-2"
                />
              </div>
              <span className="text-text-muted">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg pl-7 pr-3 py-2"
                />
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Location</label>
            <input
              type="text"
              placeholder="Search location..."
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 border-t border-border-subtle">
          <button 
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

const NewDealModal = ({ show, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    entity: '',
    value: '',
    type: 'Industrial',
    location: '',
    stage: 'new',
    matchScore: 85
  })
  
  if (!show) return null
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd({
      ...formData,
      value: parseInt(formData.value) || 0,
      matchScore: parseInt(formData.matchScore) || 85,
      lastActivity: new Date()
    })
    setFormData({
      entity: '',
      value: '',
      type: 'Industrial',
      location: '',
      stage: 'new',
      matchScore: 85
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-accent-red" />
            Add New Deal
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Entity/Company Name *</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                required
                placeholder="e.g., Dream Industrial REIT"
                value={formData.entity}
                onChange={(e) => setFormData({...formData, entity: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg pl-10 pr-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Deal Value ($) *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  required
                  placeholder="5000000"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="w-full bg-bg-input border border-border-subtle rounded-lg pl-10 pr-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Match Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.matchScore}
                onChange={(e) => setFormData({...formData, matchScore: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Property Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="Industrial">Industrial</option>
                <option value="Retail">Retail</option>
                <option value="Office">Office</option>
                <option value="Multi-Family">Multi-Family</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Land">Land</option>
                <option value="Mixed-Use">Mixed-Use</option>
                <option value="Vineyard">Vineyard</option>
                <option value="Farm">Farm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Stage</label>
              <select 
                value={formData.stage}
                onChange={(e) => setFormData({...formData, stage: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="offer">Offer Out</option>
                <option value="closing">Closing</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="e.g., Welland, Niagara"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg pl-10 pr-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DealDetailsModal = ({ show, deal, onClose, onMove, stages, formatCurrency }) => {
  if (!show || !deal) return null
  
  const currentStageIndex = stages.findIndex(s => s.id === deal.stage)
  
  const handlePhone = () => {
    window.open(`tel:+1-555-0000`, '_self')
  }
  
  const handleEmail = () => {
    window.open(`mailto:contact@${deal.entity.toLowerCase().replace(/\s+/g, '')}.com?subject=RE: ${deal.type} Deal - ${deal.location}`, '_blank')
  }
  
  const handleLinkedIn = () => {
    window.open(`https://linkedin.com/search/results/companies/?keywords=${encodeURIComponent(deal.entity)}`, '_blank')
  }
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-accent-green'
    if (score >= 70) return 'text-accent-yellow'
    return 'text-accent-red'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent-red" />
            Deal Details
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Entity Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{deal.entity}</h2>
              <p className="text-text-secondary mt-1">{deal.type} • {deal.location}</p>
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(deal.matchScore)}`}>
              {deal.matchScore}
            </div>
          </div>
          
          {/* Deal Value */}
          <div className="p-4 rounded-xl bg-bg-input">
            <p className="text-sm text-text-muted">Deal Value</p>
            <p className="text-3xl font-bold text-accent-red mt-1">
              {formatCurrency(deal.value)}
            </p>
          </div>
          
          {/* Current Stage */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Current Stage</label>
            <div className="flex items-center gap-2">
              {stages.map((stage, index) => (
                <button
                  key={stage.id}
                  onClick={() => onMove(deal.id, stage.id)}
                  className={`flex-1 p-2 rounded-lg text-sm font-medium transition-colors ${
                    stage.id === deal.stage 
                      ? `${stage.bgColor} border ${stage.borderColor} text-text-primary` 
                      : 'bg-bg-input text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="mr-1">{stage.icon}</span>
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">Quick Actions</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={handlePhone}
                className="p-3 rounded-xl bg-bg-input hover:bg-accent-green/10 hover:text-accent-green transition-colors flex flex-col items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm">Call</span>
              </button>
              <button 
                onClick={handleEmail}
                className="p-3 rounded-xl bg-bg-input hover:bg-accent-blue/10 hover:text-accent-blue transition-colors flex flex-col items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm">Email</span>
              </button>
              <button 
                onClick={handleLinkedIn}
                className="p-3 rounded-xl bg-bg-input hover:bg-accent-blue/10 hover:text-accent-blue transition-colors flex flex-col items-center gap-2"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm">LinkedIn</span>
              </button>
            </div>
          </div>
          
          {/* Last Activity */}
          <div className="flex items-center gap-2 text-sm text-text-muted pt-2 border-t border-border-subtle">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date(deal.lastActivity).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-end p-4 border-t border-border-subtle gap-3">
          {currentStageIndex > 0 && (
            <button 
              onClick={() => onMove(deal.id, stages[currentStageIndex - 1].id)}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Move Back
            </button>
          )}
          {currentStageIndex < stages.length - 1 && (
            <button 
              onClick={() => onMove(deal.id, stages[currentStageIndex + 1].id)}
              className="btn-primary flex items-center gap-2"
            >
              <MoveRight className="w-4 h-4" />
              Advance to {stages[currentStageIndex + 1].label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DealPipeline
