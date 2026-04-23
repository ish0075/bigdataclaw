import React, { useState, useEffect, useMemo } from 'react'
import { 
  Building2, Phone, Mail, MapPin, Globe, Linkedin, Facebook, 
  Instagram, Twitter, Edit2, Save, X, Plus, Search, Filter,
  ChevronDown, ChevronUp, ExternalLink, MoreHorizontal
} from 'lucide-react'

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'https://13f0-142-189-188-192.ngrok-free.app') + '/api'

// Sample Brokerages Data (fallback if API fails)
const SAMPLE_BROKERAGES = [
  {
    id: '1',
    displayName: 'RE/MAX',
    legalName: 'RE/MAX Ontario Inc.',
    name: 'RE/MAX',
    agentCount: 2850,
    cities: new Set(['Toronto', 'Mississauga', 'Oakville', 'Vaughan', 'Markham']),
    phone: '905-848-9800',
    email: 'info@remax-ontario.com',
    website: 'https://www.remax.ca',
    address: '7101 Syntex Drive, Mississauga, ON L5N 6H5',
    city: 'Mississauga',
    province: 'Ontario',
    brokerOfRecord: 'John Smith',
    managingBroker: 'Sarah Johnson',
    president: 'Michael Brown',
    vpSales: 'Jennifer Davis',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/remax',
      facebook: 'https://www.facebook.com/REMAX',
      instagram: 'https://www.instagram.com/remax',
      twitter: 'https://twitter.com/REMAX'
    },
    notes: 'Canada\'s largest real estate network with over 20,000 agents nationwide.'
  },
  {
    id: '2',
    displayName: 'Century 21',
    legalName: 'Century 21 Canada Limited Partnership',
    name: 'Century 21',
    agentCount: 1950,
    cities: new Set(['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kitchener']),
    phone: '416-555-0100',
    email: 'info@century21.ca',
    website: 'https://www.century21.ca',
    address: '123 Main Street, Toronto, ON M5V 3A8',
    city: 'Toronto',
    province: 'Ontario',
    brokerOfRecord: 'David Wilson',
    managingBroker: 'Lisa Anderson',
    president: 'Robert Taylor',
    vpSales: 'Amanda White',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/century-21',
      facebook: 'https://www.facebook.com/Century21',
      instagram: 'https://www.instagram.com/century21',
      twitter: null
    },
    notes: 'Global real estate brand with strong presence in residential and commercial markets.'
  },
  {
    id: '3',
    displayName: 'Sutton Group',
    legalName: 'Sutton Group Realty Services Inc.',
    name: 'Sutton Group',
    agentCount: 1420,
    cities: new Set(['Toronto', 'Richmond Hill', 'North York', 'Scarborough']),
    phone: '416-555-0200',
    email: 'info@sutton.com',
    website: 'https://www.sutton.com',
    address: '4711 Yonge Street, North York, ON M2N 6K8',
    city: 'North York',
    province: 'Ontario',
    brokerOfRecord: 'James Mitchell',
    managingBroker: 'Patricia Lee',
    president: 'Christopher Wong',
    vpSales: 'Michelle Chen',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/sutton-group',
      facebook: 'https://www.facebook.com/SuttonGroup',
      instagram: 'https://www.instagram.com/suttongroup',
      twitter: null
    },
    notes: 'Canadian-owned real estate brokerage with focus on personalized service.'
  },
  {
    id: '4',
    displayName: 'Royal LePage',
    legalName: 'Royal LePage Real Estate Services Ltd.',
    name: 'Royal LePage',
    agentCount: 2100,
    cities: new Set(['Toronto', 'Ottawa', 'Vancouver', 'Calgary', 'Montreal']),
    phone: '905-555-0300',
    email: 'info@royallepage.ca',
    website: 'https://www.royallepage.ca',
    address: '39 Wynford Drive, Toronto, ON M3C 3K5',
    city: 'Toronto',
    province: 'Ontario',
    brokerOfRecord: 'William Turner',
    managingBroker: 'Elizabeth Green',
    president: 'Richard Martin',
    vpSales: 'Susan Clark',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/royal-lepage',
      facebook: 'https://www.facebook.com/RoyalLePage',
      instagram: 'https://www.instagram.com/royallepage',
      twitter: 'https://twitter.com/RoyalLePage'
    },
    notes: 'Proudly Canadian since 1913. Leading provider of residential and commercial real estate services.'
  },
  {
    id: '5',
    displayName: 'Keller Williams',
    legalName: 'Keller Williams Realty Centres',
    name: 'Keller Williams',
    agentCount: 980,
    cities: new Set(['Toronto', 'Mississauga', 'Brampton', 'Markham']),
    phone: '905-555-0400',
    email: 'info@kwrealty.com',
    website: 'https://www.kwrealty.com',
    address: '700 Kerr Street, Oakville, ON L6K 3C7',
    city: 'Oakville',
    province: 'Ontario',
    brokerOfRecord: 'Thomas Harris',
    managingBroker: 'Karen Lewis',
    president: 'Daniel Walker',
    vpSales: 'Nancy Hall',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/keller-williams-realty',
      facebook: 'https://www.facebook.com/KellerWilliams',
      instagram: 'https://www.instagram.com/kwrealty',
      twitter: null
    },
    notes: 'Fast-growing real estate franchise with agent-centric business model.'
  },
  {
    id: '6',
    displayName: 'EXP Realty',
    legalName: 'EXP Realty Canada',
    name: 'EXP Realty',
    agentCount: 1650,
    cities: new Set(['Toronto', 'Vancouver', 'Calgary', 'Ottawa']),
    phone: '1-800-555-0500',
    email: 'info@exprealty.ca',
    website: 'https://www.exprealty.ca',
    address: '120 Adelaide Street West, Toronto, ON M5H 1T1',
    city: 'Toronto',
    province: 'Ontario',
    brokerOfRecord: 'Glenn Sanford',
    managingBroker: 'Pamela Kuda',
    president: 'Michael Valdes',
    vpSales: 'Marc Mancini',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/exp-realty',
      facebook: 'https://www.facebook.com/EXPrealty',
      instagram: 'https://www.instagram.com/exp_realty',
      twitter: 'https://twitter.com/EXPrealty'
    },
    notes: 'Cloud-based brokerage with virtual office environment and revenue share model.'
  },
  {
    id: '7',
    displayName: 'Right at Home Realty',
    legalName: 'Right at Home Realty Inc.',
    name: 'Right at Home Realty',
    agentCount: 890,
    cities: new Set(['Toronto', 'North York', 'Etobicoke', 'Scarborough']),
    phone: '416-555-0600',
    email: 'info@rightathomerealty.com',
    website: 'https://www.rightathomerealty.com',
    address: '1650 Elgin Mills Road East, Richmond Hill, ON L4S 0B2',
    city: 'Richmond Hill',
    province: 'Ontario',
    brokerOfRecord: 'Daniel Di Tomaso',
    managingBroker: 'John Bianchi',
    president: 'Mario Di Tomaso',
    vpSales: 'Angela Di Tomaso',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/right-at-home-realty',
      facebook: 'https://www.facebook.com/RightAtHomeRealty',
      instagram: 'https://www.instagram.com/rightathomerealty',
      twitter: null
    },
    notes: 'Independent brokerage serving the Greater Toronto Area since 2002.'
  },
  {
    id: '8',
    displayName: 'Homelife',
    legalName: 'Homelife Realty Services Inc.',
    name: 'Homelife',
    agentCount: 750,
    cities: new Set(['Toronto', 'Mississauga', 'Brampton', 'Vaughan']),
    phone: '905-555-0700',
    email: 'info@homelife.ca',
    website: 'https://www.homelife.ca',
    address: ' Brokerage Network, Various Locations',
    city: 'Toronto',
    province: 'Ontario',
    brokerOfRecord: 'Steven Smith',
    managingBroker: 'Maria Rodriguez',
    president: 'Carlos Mendez',
    vpSales: 'Lucia Garcia',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/homelife-realty',
      facebook: 'https://www.facebook.com/HomelifeRealty',
      instagram: 'https://www.instagram.com/homeliferealty',
      twitter: null
    },
    notes: 'Full-service real estate brokerage with focus on family homes and investments.'
  }
]

// Generate Quick Links for a brokerage
const generateBrokerageQuickLinks = (brokerage) => {
  const encodedName = encodeURIComponent(brokerage.name || '')
  
  return {
    google: `https://www.google.com/search?q=${encodedName}`,
    bor: `https://www.google.com/search?q=${encodedName}+broker+of+record`,
    realtor: `https://www.google.com/search?q=${encodedName}+realtor.ca`,
    broker: `https://www.google.com/search?q=${encodedName}+broker`,
    linkedin: `https://www.google.com/search?q=${encodedName}+linkedin`,
    facebook: `https://www.google.com/search?q=${encodedName}+facebook`,
    instagram: `https://www.google.com/search?q=${encodedName}+instagram`,
    website: brokerage.website || `https://www.google.com/search?q=${encodedName}+official+website`,
    president: `https://www.google.com/search?q=${encodedName}+President+OR+CEO+linkedin`,
    careers: `https://www.google.com/search?q=${encodedName}+careers+jobs`,
    reviews: `https://www.google.com/search?q=${encodedName}+reviews`,
    news: `https://www.google.com/search?q=${encodedName}+news`,
  }
}

// Clean up brokerage name
const cleanBrokerageName = (name) => {
  if (!name) return 'Unknown'
  return name
    .replace(/\s*Ontario\s+Inc\.?\s*\d*\s*$/i, '')
    .replace(/\s*Inc\.?\s*\d*\s*$/i, '')
    .replace(/\s*Ltd\.?\s*$/i, '')
    .replace(/\s*Limited\s*$/i, '')
    .trim()
}

// Filter out Ontario Inc brokerages
const isOntarioInc = (name) => {
  return /Ontario\s+Inc\.?\s*\d*$/i.test(name)
}

// Edit Modal Component
const EditBrokerageModal = ({ brokerage, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(brokerage || {})

  useEffect(() => {
    if (brokerage) {
      setFormData(brokerage)
    }
  }, [brokerage])

  if (!isOpen || !brokerage) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }))
  }

  const handleSave = () => {
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Brokerage</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Brokerage Name</label>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => handleChange('displayName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Legal Name</label>
                <input
                  type="text"
                  value={formData.legalName || ''}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Address</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Province</label>
                <input
                  type="text"
                  value={formData.province || 'Ontario'}
                  onChange={(e) => handleChange('province', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Leadership */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Leadership</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Broker of Record</label>
                <input
                  type="text"
                  value={formData.brokerOfRecord || ''}
                  onChange={(e) => handleChange('brokerOfRecord', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Managing Broker</label>
                <input
                  type="text"
                  value={formData.managingBroker || ''}
                  onChange={(e) => handleChange('managingBroker', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">President/CEO</label>
                <input
                  type="text"
                  value={formData.president || ''}
                  onChange={(e) => handleChange('president', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">VP of Sales</label>
                <input
                  type="text"
                  value={formData.vpSales || ''}
                  onChange={(e) => handleChange('vpSales', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Social Media</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.socialLinks?.linkedin || ''}
                  onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Facebook</label>
                <input
                  type="url"
                  value={formData.socialLinks?.facebook || ''}
                  onChange={(e) => handleSocialChange('facebook', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Instagram</label>
                <input
                  type="url"
                  value={formData.socialLinks?.instagram || ''}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Twitter/X</label>
                <input
                  type="url"
                  value={formData.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialChange('twitter', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase">Notes</h3>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Add any additional notes about this brokerage..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// Brokerage Card Component
const BrokerageCard = ({ brokerage, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const links = generateBrokerageQuickLinks(brokerage)

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600 transition-colors">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-200 truncate">{brokerage.displayName}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {brokerage.agentCount} agent{brokerage.agentCount !== 1 ? 's' : ''}
              {brokerage.city && ` • ${brokerage.city}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(brokerage)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Edit brokerage"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Contact Info Preview */}
        {(brokerage.phone || brokerage.email || brokerage.website) && (
          <div className="mt-3 space-y-1 text-sm">
            {brokerage.phone && (
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5" />
                <span>{brokerage.phone}</span>
              </div>
            )}
            {brokerage.email && (
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{brokerage.email}</span>
              </div>
            )}
            {brokerage.website && (
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="w-3.5 h-3.5" />
                <a href={brokerage.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                  {brokerage.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Front Card Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {/* B.O.R Button */}
          <a
            href={links.bor}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Find Broker of Record"
          >
            <span className="font-bold">B.O.R</span>
          </a>
          
          {/* Realtor.ca Button */}
          <a
            href={links.realtor}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Search on Realtor.ca"
          >
            <span>Realtor</span>
          </a>
          
          {/* Broker Button */}
          <a
            href={links.broker}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-medium transition-colors"
            title="Search Broker"
          >
            <span>Broker</span>
          </a>
          
          {/* Google Button */}
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors"
            title="Google Search"
          >
            <span>Google</span>
          </a>
        </div>
        
        {/* Quick Links Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 w-full mt-3 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-400 text-xs transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{isExpanded ? 'Less' : 'More'} Quick Links</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Expanded Quick Links */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {/* B.O.R */}
            <a
              href={links.bor}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>B.O.R</span>
            </a>
            
            {/* Realtor.ca */}
            <a
              href={links.realtor}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Realtor.ca</span>
            </a>
            
            {/* Broker */}
            <a
              href={links.broker}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Broker</span>
            </a>
            
            {/* Google */}
            <a
              href={links.google}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Google</span>
            </a>
            
            {/* LinkedIn */}
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
            
            {/* Facebook */}
            <a
              href={links.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>
            
            {/* Instagram */}
            <a
              href={links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            
            {/* Twitter */}
            <a
              href={links.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </a>
            
            {/* President/CEO */}
            <a
              href={links.president}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <span className="font-bold">CEO</span>
              <span>President</span>
            </a>
            
            {/* Careers */}
            <a
              href={links.careers}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <span>Careers</span>
            </a>
          </div>

          {/* Leadership Info if available */}
          {(brokerage.brokerOfRecord || brokerage.managingBroker || brokerage.president) && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Leadership</h4>
              <div className="space-y-1 text-sm">
                {brokerage.brokerOfRecord && (
                  <div className="text-slate-300">
                    <span className="text-slate-500">Broker of Record:</span> {brokerage.brokerOfRecord}
                  </div>
                )}
                {brokerage.managingBroker && (
                  <div className="text-slate-300">
                    <span className="text-slate-500">Managing Broker:</span> {brokerage.managingBroker}
                  </div>
                )}
                {brokerage.president && (
                  <div className="text-slate-300">
                    <span className="text-slate-500">President/CEO:</span> {brokerage.president}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes if available */}
          {brokerage.notes && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Notes</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{brokerage.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main Brokerages View Component
const BrokeragesView = () => {
  const [brokerages, setBrokerages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingBrokerage, setEditingBrokerage] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Load brokerages from agent data and localStorage
  useEffect(() => {
    const loadBrokerages = async () => {
      setLoading(true)
      try {
        let brokerageMap = new Map()
        let usedSampleData = false
        
        // Try to load from API first
        try {
          const response = await fetch(`${API_BASE}/recruiters`)
          let agents = []
          
          if (response.ok) {
            const data = await response.json()
            agents = data.recruiters || []
          } else {
            // Fallback to JSON file
            const jsonResponse = await fetch('/data/recruiters_sample.json')
            if (jsonResponse.ok) {
              agents = await jsonResponse.json()
            }
          }

          // Extract unique brokerages from agent data
          agents.forEach(agent => {
            const fullName = agent.brokerage
            if (!fullName || isOntarioInc(fullName)) return
            
            const cleanName = cleanBrokerageName(fullName)
            
            if (!brokerageMap.has(fullName)) {
              brokerageMap.set(fullName, {
                id: fullName,
                displayName: cleanName,
                legalName: fullName,
                name: cleanName,
                agentCount: 0,
                cities: new Set(),
                phone: agent.phone || null,
                email: null,
                website: null,
                address: null,
                city: agent.city || null,
                province: 'Ontario',
                brokerOfRecord: null,
                managingBroker: null,
                president: null,
                vpSales: null,
                socialLinks: {
                  linkedin: null,
                  facebook: null,
                  instagram: null,
                  twitter: null
                },
                notes: ''
              })
            }
            
            const brokerage = brokerageMap.get(fullName)
            brokerage.agentCount++
            if (agent.city) brokerage.cities.add(agent.city)
          })
        } catch (apiError) {
          console.log('API failed, using sample data')
        }
        
        // If no brokerages loaded from API, use sample data
        if (brokerageMap.size === 0) {
          usedSampleData = true
          SAMPLE_BROKERAGES.forEach(brokerage => {
            brokerageMap.set(brokerage.id, { ...brokerage })
          })
        }

        // Load saved edits from localStorage
        const savedEdits = localStorage.getItem('brokerage_edits')
        if (savedEdits) {
          try {
            const edits = JSON.parse(savedEdits)
            if (Array.isArray(edits)) {
              edits.forEach(edit => {
                if (brokerageMap.has(edit.id)) {
                  brokerageMap.set(edit.id, { ...brokerageMap.get(edit.id), ...edit })
                }
              })
            }
          } catch (e) {
            console.error('Error parsing saved edits:', e)
          }
        }

        // Convert to array and sort by agent count
        const brokerageList = Array.from(brokerageMap.values())
          .sort((a, b) => b.agentCount - a.agentCount)
        
        setBrokerages(brokerageList)
        
        if (usedSampleData) {
          console.log(`Loaded ${brokerageList.length} sample brokerages`)
        } else {
          console.log(`Loaded ${brokerageList.length} brokerages from data`)
        }
      } catch (error) {
        console.error('Error loading brokerages:', error)
        // Final fallback - just use sample data
        setBrokerages(SAMPLE_BROKERAGES.map(b => ({ ...b })))
      } finally {
        setLoading(false)
      }
    }

    loadBrokerages()
  }, [])

  // Filter brokerages based on search
  const filteredBrokerages = useMemo(() => {
    if (!searchQuery.trim()) return brokerages
    
    const query = searchQuery.toLowerCase()
    return brokerages.filter(b => 
      (b.displayName && b.displayName.toLowerCase().includes(query)) ||
      (b.legalName && b.legalName.toLowerCase().includes(query)) ||
      (b.city && b.city.toLowerCase().includes(query)) ||
      (b.brokerOfRecord && b.brokerOfRecord.toLowerCase().includes(query)) ||
      (b.managingBroker && b.managingBroker.toLowerCase().includes(query))
    )
  }, [brokerages, searchQuery])

  // Handle edit
  const handleEdit = (brokerage) => {
    setEditingBrokerage(brokerage)
    setIsEditModalOpen(true)
  }

  // Handle save
  const handleSave = (updatedBrokerage) => {
    const updatedList = brokerages.map(b => 
      b.id === updatedBrokerage.id ? updatedBrokerage : b
    )
    setBrokerages(updatedList)
    
    // Save to localStorage
    const savedEdits = localStorage.getItem('brokerage_edits')
    const edits = savedEdits ? JSON.parse(savedEdits) : []
    const existingIndex = edits.findIndex(e => e.id === updatedBrokerage.id)
    
    if (existingIndex >= 0) {
      edits[existingIndex] = updatedBrokerage
    } else {
      edits.push(updatedBrokerage)
    }
    
    localStorage.setItem('brokerage_edits', JSON.stringify(edits))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading brokerages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            Brokerages
          </h1>
          <p className="text-slate-400 mt-1">Analyze Ontario brokerages by size, market coverage, and agent concentration.</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Search brokerages by name and city</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>View agent counts, boards, and geographic coverage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Identify boutique vs. national players for partnership</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full lg:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search brokerages, cities, brokers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Brokerage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBrokerages.map((brokerage) => (
          <BrokerageCard
            key={brokerage.id}
            brokerage={brokerage}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredBrokerages.length === 0 && !loading && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400">No brokerages found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search</p>
        </div>
      )}

      {/* Edit Modal */}
      <EditBrokerageModal
        brokerage={editingBrokerage}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBrokerage(null)
        }}
        onSave={handleSave}
      />
    </div>
  )
}

export default BrokeragesView
