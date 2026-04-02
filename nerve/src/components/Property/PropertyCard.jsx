import React from 'react'
import { MapPin, Building2, DollarSign, Maximize2, Calendar, Phone, Mail, ExternalLink } from 'lucide-react'
import MatchScoreRing, { MatchScoreBreakdown } from './MatchScoreRing'

const PropertyCard = ({ property, buyer, matchScore, showActions = true }) => {
  const formatCurrency = (value) => {
    if (!value) return '$0'
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  return (
    <div className="card p-5 hover:border-accent-red/30 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary text-lg truncate">
            {property?.address || 'Unknown Property'}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{property?.city || 'Unknown Location'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              <span>{property?.assetClass || 'Unknown Type'}</span>
            </div>
          </div>
        </div>
        
        {matchScore && (
          <MatchScoreRing score={matchScore} size="md" />
        )}
      </div>
      
      {/* Property Details */}
      <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-y border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Price</p>
            <p className="font-medium text-text-primary">
              {formatCurrency(property?.price)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Size</p>
            <p className="font-medium text-text-primary">
              {property?.size ? `${property.size.toLocaleString()} SF` : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center">
            <Calendar className="w-4 h-4 text-accent-yellow" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Listed</p>
            <p className="font-medium text-text-primary">
              {property?.listedDate || 'Recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bg-input flex items-center justify-center">
            <Building2 className="w-4 h-4 text-accent-red" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Region</p>
            <p className="font-medium text-text-primary">
              {property?.region || 'Niagara'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Buyer Info (if provided) */}
      {buyer && (
        <div className="mt-4 p-3 rounded-xl bg-bg-input">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-red/10 flex items-center justify-center text-lg">
                {buyer.icon || '💼'}
              </div>
              <div>
                <p className="font-medium text-text-primary">{buyer.name}</p>
                <p className="text-xs text-text-secondary">
                  {buyer.range ? `Investment Range: ${buyer.range}` : 'Qualified Buyer'}
                </p>
              </div>
            </div>
            {buyer.matchScore && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  buyer.matchScore >= 90 ? 'text-accent-green' :
                  buyer.matchScore >= 70 ? 'text-accent-yellow' : 'text-accent-red'
                }`}>
                  {buyer.matchScore}
                </p>
                <p className="text-xs text-text-muted">Match</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border-subtle">
          <button className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            Contact
          </button>
          <button className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button className="p-2 rounded-lg bg-bg-input text-text-secondary hover:text-text-primary transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export const CompactPropertyCard = ({ property, matchScore, onClick }) => {
  const formatCurrency = (value) => {
    if (!value) return '$0'
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value}`
  }
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'border-accent-green bg-accent-green/5'
    if (score >= 70) return 'border-accent-yellow bg-accent-yellow/5'
    return 'border-accent-red bg-accent-red/5'
  }
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
        matchScore ? getScoreColor(matchScore) : 'border-border-subtle bg-bg-input'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary truncate">
            {property?.address || 'Unknown Property'}
          </h4>
          <p className="text-sm text-text-secondary mt-0.5">
            {formatCurrency(property?.price)} • {property?.assetClass || 'Unknown'}
          </p>
        </div>
        
        {matchScore && (
          <div className={`text-2xl font-bold ${
            matchScore >= 90 ? 'text-accent-green' :
            matchScore >= 70 ? 'text-accent-yellow' : 'text-accent-red'
          }`}>
            {matchScore}
          </div>
        )}
      </div>
    </div>
  )
}

export { MatchScoreRing, MatchScoreBreakdown }
export default PropertyCard
