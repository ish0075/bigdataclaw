import React, { useState } from 'react'
import { 
  Users, Search, Filter, Phone, Mail, ExternalLink, Target, MapPin, DollarSign, 
  Building2, ChevronRight, Star, Download, Facebook, Linkedin, Instagram,
  Globe, MoreHorizontal, ChevronUp, MessageCircle, MessageSquare, Edit2
} from 'lucide-react'
import UniversalEditModal from '../components/Common/UniversalEditModal'

// Google "G" Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

// Sample buyers with contact info for Quick Links
const sampleBuyers = [
  { 
    id: '1', 
    entity: 'Dream Industrial REIT', 
    type: 'Industrial', 
    cash: 50000000, 
    locations: ['Niagara', 'Hamilton', 'GTA'], 
    minDeal: 2000000, 
    maxDeal: 20000000, 
    score: 95, 
    lastActive: '2 days ago', 
    contacts: 3,
    contactName: 'Brian Pauls',
    contactTitle: 'VP Acquisitions',
    phone: '416-555-0100',
    email: 'acquisitions@dream.ca'
  },
  { 
    id: '2', 
    entity: 'Carttera Private Equities', 
    type: 'Mixed-Use', 
    cash: 100000000, 
    locations: ['Niagara', 'Toronto'], 
    minDeal: 5000000, 
    maxDeal: 50000000, 
    score: 92, 
    lastActive: '5 days ago', 
    contacts: 5,
    contactName: 'Michael Kimel',
    contactTitle: 'President',
    phone: '416-555-0200',
    email: 'invest@carttera.com'
  },
  { 
    id: '3', 
    entity: 'Pure Industrial REIT', 
    type: 'Industrial', 
    cash: 75000000, 
    locations: ['Niagara', 'GTA', 'Hamilton'], 
    minDeal: 3000000, 
    maxDeal: 15000000, 
    score: 88, 
    lastActive: '1 week ago', 
    contacts: 2,
    contactName: 'Stephen Johnson',
    contactTitle: 'Managing Director',
    phone: '416-555-0300',
    email: 'deals@pureindustrial.ca'
  },
  { 
    id: '4', 
    entity: '2650687 Ontario Ltd', 
    type: 'Industrial', 
    cash: 15000000, 
    locations: ['West Lincoln', 'Welland'], 
    minDeal: 5000000, 
    maxDeal: 15000000, 
    score: 85, 
    lastActive: '3 days ago', 
    contacts: 1,
    contactName: 'David DeSantis',
    contactTitle: 'Principal',
    phone: '905-555-0400',
    email: 'dd@265ontario.ca'
  },
  { 
    id: '5', 
    entity: 'Turnberry Holdings Inc', 
    type: 'Retail', 
    cash: 25000000, 
    locations: ['Niagara', 'Lincoln'], 
    minDeal: 2000000, 
    maxDeal: 10000000, 
    score: 82, 
    lastActive: '1 day ago', 
    contacts: 4,
    contactName: 'Andrew Tumbas',
    contactTitle: 'CEO',
    phone: '416-555-0500',
    email: 'at@turnberry.ca'
  },
  { 
    id: '6', 
    entity: 'Stone Eagle Winery', 
    type: 'Agricultural', 
    cash: 12000000, 
    locations: ['NOTL', 'Niagara'], 
    minDeal: 3000000, 
    maxDeal: 8000000, 
    score: 78, 
    lastActive: '4 days ago', 
    contacts: 2,
    contactName: 'Robert Stone',
    contactTitle: 'Owner',
    phone: '905-555-0600',
    email: 'rstone@stoneeagle.ca'
  },
]

// Generate Quick Links for Buyers
// Format: Google + company name + social media
// AND Google + personal name + social media  
// AND Google + person's name + president + social media
const generateBuyerQuickLinks = (buyer) => {
  const encodedEntity = encodeURIComponent(buyer.entity)
  const encodedContact = buyer.contactName ? encodeURIComponent(buyer.contactName) : ''
  const cleanPhone = buyer.phone ? buyer.phone.replace(/\D/g, '') : ''
  
  // Helper to create Google search URLs
  const googleSearch = (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`
  
  return {
    // Main card buttons - Company-based searches
    google: googleSearch(buyer.entity),
    facebook: googleSearch(`${buyer.entity} facebook`),
    linkedin: googleSearch(`${buyer.entity} linkedin`),
    linkedinPresident: googleSearch(`${buyer.entity} President CEO linkedin`),
    
    // Contact person searches (if available)
    contactGoogle: encodedContact ? googleSearch(buyer.contactName) : null,
    contactLinkedin: encodedContact ? googleSearch(`${buyer.contactName} linkedin`) : null,
    contactPresident: encodedContact ? googleSearch(`${buyer.contactName} President`) : null,
    
    // Company social media
    instagram: googleSearch(`${buyer.entity} instagram`),
    twitter: googleSearch(`${buyer.entity} twitter`),
    youtube: googleSearch(`${buyer.entity} youtube`),
    
    // Messaging
    phone: cleanPhone ? `tel:${cleanPhone}` : null,
    email: buyer.email ? `mailto:${buyer.email}` : null,
    whatsapp: cleanPhone ? `https://wa.me/${cleanPhone}` : null,
    
    // Professional
    website: googleSearch(`${buyer.entity} website`),
    news: googleSearch(`${buyer.entity} news`),
    deals: googleSearch(`${buyer.entity} acquisitions deals`),
    
    // Executive searches
    president: googleSearch(`${buyer.entity} President`),
    acquisitions: googleSearch(`${buyer.entity} VP Acquisitions`),
    
    // Contact page
    contactPage: googleSearch(`${buyer.entity} contact`)
  }
}

const QuickLinkButton = ({ href, icon, label, color }) => {
  if (!href) return null
  const isMailto = href?.startsWith('mailto:')
  const isTel = href?.startsWith('tel:')
  
  return (
    <a
      href={href}
      target={isMailto || isTel ? undefined : '_blank'}
      rel={isMailto || isTel ? undefined : 'noopener noreferrer'}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-[11px] font-medium ${color} hover:opacity-90 transition-opacity`}
    >
      {icon}
      <span>{label}</span>
    </a>
  )
}

const BuyerMatcher = () => {
  const [buyers, setBuyers] = useState(sampleBuyers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [expandedQuickLinks, setExpandedQuickLinks] = useState({})
  const [editingBuyer, setEditingBuyer] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const filteredBuyers = buyers.filter(buyer => {
    if (searchQuery && !buyer.entity.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterType !== 'all' && buyer.type !== filterType) return false
    return true
  })

  const handleEdit = (buyer) => {
    setEditingBuyer(buyer)
    setIsEditModalOpen(true)
  }

  const handleEditSave = (updatedBuyer) => {
    setBuyers(prev => prev.map(b => 
      b.id === updatedBuyer.id ? { ...b, ...updatedBuyer } : b
    ))
    
    // Save to localStorage
    const savedEdits = localStorage.getItem('buyer_edits') || '{}'
    const edits = JSON.parse(savedEdits)
    edits[updatedBuyer.id] = updatedBuyer
    localStorage.setItem('buyer_edits', JSON.stringify(edits))
    
    setIsEditModalOpen(false)
    setEditingBuyer(null)
  }
  
  const formatCurrency = (value) => {
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${(value / 1e3).toFixed(0)}K`
  }
  
  const toggleQuickLinks = (buyerId) => {
    setExpandedQuickLinks(prev => ({ ...prev, [buyerId]: !prev[buyerId] }))
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent-red" />
            Buyer Matcher
          </h1>
          <p className="text-text-secondary mt-1">Find qualified buyers for your properties</p>
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export List
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-text-muted text-sm">Total Buyers</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{sampleBuyers.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">High Match (90%+)</p>
          <p className="text-3xl font-bold text-accent-green mt-1">{sampleBuyers.filter(b => b.score >= 90).length}</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">Total Capital</p>
          <p className="text-3xl font-bold text-accent-red mt-1">{formatCurrency(sampleBuyers.reduce((sum, b) => sum + b.cash, 0))}</p>
        </div>
        <div className="card p-5">
          <p className="text-text-muted text-sm">Avg Match Score</p>
          <p className="text-3xl font-bold text-accent-blue mt-1">{Math.round(sampleBuyers.reduce((sum, b) => sum + b.score, 0) / sampleBuyers.length)}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-sm"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-bg-input border border-border-subtle rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Industrial">Industrial</option>
            <option value="Retail">Retail</option>
            <option value="Office">Office</option>
            <option value="Mixed-Use">Mixed-Use</option>
            <option value="Agricultural">Agricultural</option>
          </select>
        </div>
      </div>
      
      {/* Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuyers.map(buyer => {
          const links = generateBuyerQuickLinks(buyer)
          const isExpanded = expandedQuickLinks[buyer.id]
          
          return (
            <div key={buyer.id} className="card p-5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-text-primary truncate">{buyer.entity}</h3>
                    <button
                      onClick={() => handleEdit(buyer)}
                      className="p-1.5 hover:bg-bg-input rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                      title="Edit buyer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-text-secondary">{buyer.type}</p>
                  {buyer.contactName && (
                    <p className="text-xs text-text-muted mt-1">
                      Contact: {buyer.contactName} {buyer.contactTitle && `(${buyer.contactTitle})`}
                    </p>
                  )}
                </div>
                <div className="text-right ml-2">
                  <p className={`text-2xl font-bold ${buyer.score >= 90 ? 'text-accent-green' : buyer.score >= 80 ? 'text-accent-yellow' : 'text-text-muted'}`}>
                    {buyer.score}
                  </p>
                  <p className="text-xs text-text-muted">Match</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-text-muted" />
                  <span className="text-text-secondary">Cash: {formatCurrency(buyer.cash)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-text-muted" />
                  <span className="text-text-secondary">Range: {formatCurrency(buyer.minDeal)} - {formatCurrency(buyer.maxDeal)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-text-muted" />
                  <span className="text-text-secondary">{buyer.locations.join(', ')}</span>
                </div>
              </div>
              
              {/* Quick Links - Main Card Buttons */}
              <div className="px-2 pb-3">
                <div className="grid grid-cols-4 gap-2">
                  {/* Google Search - Primary */}
                  <a
                    href={links.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <GoogleIcon />
                    <span className="text-[10px] text-text-secondary group-hover:text-text-primary">Google</span>
                  </a>
                  
                  {/* Facebook */}
                  <a
                    href={links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors group"
                  >
                    <Facebook className="w-5 h-5 text-[#1877F2]" />
                    <span className="text-[10px] text-text-secondary group-hover:text-[#1877F2]">FB</span>
                  </a>
                  
                  {/* LinkedIn */}
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors group"
                  >
                    <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    <span className="text-[10px] text-text-secondary group-hover:text-[#0A66C2]">LI</span>
                  </a>
                  
                  {/* Call */}
                  <a
                    href={links.phone}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group"
                    title={buyer.phone ? `Call: ${buyer.phone}` : 'No phone'}
                  >
                    <Phone className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] text-text-secondary group-hover:text-emerald-400">Call</span>
                  </a>
                </div>
              </div>
              
              {/* Expand Quick Links Button */}
              <button
                onClick={() => toggleQuickLinks(buyer.id)}
                className="w-full py-2 bg-bg-input/50 hover:bg-bg-input border-t border-border-subtle flex items-center justify-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Quick Links
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="w-4 h-4" />
                    Quick Links
                  </>
                )}
              </button>
              
              {/* Expanded Quick Links */}
              {isExpanded && (
                <div className="border-t border-border-subtle bg-bg-input/30 p-4 space-y-4">
                  {/* Company Links */}
                  <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Company Links
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <QuickLinkButton 
                        href={links.website} 
                        icon={<Globe className="w-3.5 h-3.5" />} 
                        label="Website"
                        color="bg-purple-500"
                      />
                      <QuickLinkButton 
                        href={links.news} 
                        icon={<ExternalLink className="w-3.5 h-3.5" />} 
                        label="News"
                        color="bg-blue-600"
                      />
                      <QuickLinkButton 
                        href={links.deals} 
                        icon={<Target className="w-3.5 h-3.5" />} 
                        label="Deals"
                        color="bg-orange-500"
                      />
                    </div>
                  </div>
                  
                  {/* Social Media */}
                  <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Social Media
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <QuickLinkButton 
                        href={links.instagram} 
                        icon={<Instagram className="w-3.5 h-3.5" />} 
                        label="Instagram"
                        color="bg-pink-600"
                      />
                      <QuickLinkButton 
                        href={links.twitter} 
                        icon={<MessageCircle className="w-3.5 h-3.5" />} 
                        label="Twitter/X"
                        color="bg-slate-700"
                      />
                      <QuickLinkButton 
                        href={links.youtube} 
                        icon={<ExternalLink className="w-3.5 h-3.5" />} 
                        label="YouTube"
                        color="bg-red-600"
                      />
                    </div>
                  </div>
                  
                  {/* Executive Search */}
                  <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Executive Search
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <QuickLinkButton 
                        href={links.linkedinPresident} 
                        icon={<Linkedin className="w-3.5 h-3.5" />} 
                        label="Pres/CEO"
                        color="bg-blue-700"
                      />
                      <QuickLinkButton 
                        href={links.acquisitions} 
                        icon={<Users className="w-3.5 h-3.5" />} 
                        label="VP Acq"
                        color="bg-indigo-600"
                      />
                      <QuickLinkButton 
                        href={links.contactPage} 
                        icon={<Mail className="w-3.5 h-3.5" />} 
                        label="Contact"
                        color="bg-teal-600"
                      />
                    </div>
                  </div>
                  
                  {/* Contact Person (if available) */}
                  {buyer.contactName && (
                    <div>
                      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                        Contact: {buyer.contactName}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <QuickLinkButton 
                          href={links.contactGoogle} 
                          icon={<Search className="w-3.5 h-3.5" />} 
                          label="Google"
                          color="bg-blue-500"
                        />
                        <QuickLinkButton 
                          href={links.contactLinkedin} 
                          icon={<Linkedin className="w-3.5 h-3.5" />} 
                          label="LinkedIn"
                          color="bg-[#0A66C2]"
                        />
                        <QuickLinkButton 
                          href={links.contactPresident} 
                          icon={<Star className="w-3.5 h-3.5" />} 
                          label="President"
                          color="bg-amber-600"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Contact Actions */}
                  <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Actions
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <QuickLinkButton 
                        href={links.phone} 
                        icon={<Phone className="w-3.5 h-3.5" />} 
                        label="Call"
                        color="bg-green-600"
                      />
                      <QuickLinkButton 
                        href={links.email} 
                        icon={<Mail className="w-3.5 h-3.5" />} 
                        label="Email"
                        color="bg-blue-500"
                      />
                      <QuickLinkButton 
                        href={links.whatsapp} 
                        icon={<MessageSquare className="w-3.5 h-3.5" />} 
                        label="WhatsApp"
                        color="bg-green-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Buyer Detail Modal */}
      {selectedBuyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedBuyer(null)}>
          <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <div>
                <h3 className="font-semibold text-text-primary">{selectedBuyer.entity}</h3>
                <p className="text-sm text-text-secondary">{selectedBuyer.type}</p>
              </div>
              <button onClick={() => setSelectedBuyer(null)} className="p-2 hover:bg-bg-input rounded-lg">
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-center">
                <div className={`text-5xl font-bold ${selectedBuyer.score >= 90 ? 'text-accent-green' : 'text-accent-yellow'}`}>
                  {selectedBuyer.score}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Cash Position</p>
                  <p className="font-semibold text-text-primary">{formatCurrency(selectedBuyer.cash)}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Deal Range</p>
                  <p className="font-semibold text-text-primary">{formatCurrency(selectedBuyer.minDeal)} - {formatCurrency(selectedBuyer.maxDeal)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-2">Preferred Locations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuyer.locations.map(loc => (
                    <span key={loc} className="px-2 py-1 rounded bg-accent-red/10 text-accent-red text-xs">{loc}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Buyer Modal */}
      <UniversalEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBuyer(null)
        }}
        onSave={handleEditSave}
        entity={editingBuyer}
        entityType="buyer"
        title="Edit Buyer"
      />
    </div>
  )
}

export default BuyerMatcher
