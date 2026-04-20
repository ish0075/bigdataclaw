import { create } from 'zustand'

const defaultListings = [
  {
    id: '1',
    address: '281 Chippawa Creek Road',
    city: 'Welland',
    region: 'Niagara',
    postalCode: 'L3B 5N5',
    assetClass: 'Industrial',
    price: 5200000,
    size: 85000,
    capRate: 6.2,
    description: 'Modern industrial facility with 26\' clear height, 4 dock doors, and 2 drive-in doors. Fully sprinklered.',
    features: ['26\' Clear Height', '4 Dock Doors', '2 Drive-in Doors', 'Sprinklered'],
    images: [],
    status: 'active',
    createdAt: new Date('2025-03-20'),
    updatedAt: new Date('2025-03-27'),
    contacts: [
      { name: 'John Smith', role: 'Broker', phone: '905-555-0100', email: 'john@example.com' }
    ]
  },
  {
    id: '2',
    address: '1500 Michael Drive',
    city: 'Welland',
    region: 'Niagara',
    postalCode: 'L3C 5W3',
    assetClass: 'Industrial',
    price: 3500000,
    size: 45000,
    capRate: 7.1,
    description: 'Well-maintained industrial building on 2.5 acres. Excellent highway access.',
    features: ['2.5 Acres', 'Highway Access', 'Office Space', ' fenced Yard'],
    images: [],
    status: 'active',
    createdAt: new Date('2025-03-22'),
    updatedAt: new Date('2025-03-26'),
    contacts: [
      { name: 'Sarah Johnson', role: 'Agent', phone: '905-555-0200', email: 'sarah@example.com' }
    ]
  },
  {
    id: '3',
    address: '238 Ontario Street',
    city: 'St. Catharines',
    region: 'Niagara',
    postalCode: 'L2N 4W5',
    assetClass: 'Retail',
    price: 12000000,
    size: 425000,
    capRate: 5.8,
    description: 'Seaway Mall Block - Prime retail location with anchor tenants.',
    features: ['Anchor Tenants', 'High Traffic', 'Parking', 'Renovated 2020'],
    images: [],
    status: 'under-contract',
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-25'),
    contacts: [
      { name: 'Mike Wilson', role: 'Broker', phone: '905-555-0300', email: 'mike@example.com' }
    ]
  }
]

// Sample buyers for matching
const sampleBuyers = [
  { id: 'b1', entity: 'Dream Industrial REIT', type: 'Industrial', minDeal: 2000000, maxDeal: 20000000, locations: ['Niagara', 'Hamilton'], matchScore: 95 },
  { id: 'b2', entity: 'Carttera Private Equities', type: 'Mixed-Use', minDeal: 5000000, maxDeal: 50000000, locations: ['Niagara', 'Toronto'], matchScore: 92 },
  { id: 'b3', entity: 'Pure Industrial REIT', type: 'Industrial', minDeal: 3000000, maxDeal: 15000000, locations: ['Niagara', 'GTA'], matchScore: 88 },
  { id: 'b4', entity: '2650687 Ontario Ltd', type: 'Industrial', minDeal: 5000000, maxDeal: 15000000, locations: ['West Lincoln', 'Welland'], matchScore: 85 },
  { id: 'b5', entity: 'Turnberry Holdings', type: 'Retail', minDeal: 2000000, maxDeal: 10000000, locations: ['Niagara', 'Lincoln'], matchScore: 82 },
]

export const useListingStore = create((set, get) => ({
  listings: defaultListings,
  buyers: sampleBuyers,
  matches: {},
  
  // Add new listing
  addListing: (listing) => set((state) => ({
    listings: [{ 
      ...listing, 
      id: Date.now().toString(), 
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    }, ...state.listings]
  })),
  
  // Update listing
  updateListing: (id, updates) => set((state) => ({
    listings: state.listings.map(l => 
      l.id === id 
        ? { ...l, ...updates, updatedAt: new Date() }
        : l
    )
  })),
  
  // Delete listing
  deleteListing: (id) => set((state) => ({
    listings: state.listings.filter(l => l.id !== id),
    matches: { ...state.matches, [id]: [] }
  })),
  
  // Change listing status
  setListingStatus: (id, status) => set((state) => ({
    listings: state.listings.map(l => 
      l.id === id 
        ? { ...l, status, updatedAt: new Date() }
        : l
    )
  })),
  
  // Find matching buyers for a listing
  findMatches: (listingId) => {
    const listing = get().listings.find(l => l.id === listingId)
    if (!listing) return []
    
    const matches = get().buyers.map(buyer => {
      let score = 0
      const reasons = []
      
      // Asset class match (40%)
      if (buyer.type === listing.assetClass || buyer.type === 'Mixed-Use') {
        score += 40
        reasons.push('Asset class match')
      }
      
      // Price range match (30%)
      if (listing.price >= buyer.minDeal && listing.price <= buyer.maxDeal) {
        score += 30
        reasons.push('Price range match')
      }
      
      // Location match (20%)
      if (buyer.locations.some(loc => 
        listing.region.toLowerCase().includes(loc.toLowerCase()) ||
        listing.city.toLowerCase().includes(loc.toLowerCase())
      )) {
        score += 20
        reasons.push('Location match')
      }
      
      // Size preference (10%) - rough estimate
      if (listing.size >= 30000 && listing.size <= 150000) {
        score += 10
        reasons.push('Size preference')
      }
      
      return {
        ...buyer,
        matchScore: Math.min(score, 100),
        matchReasons: reasons
      }
    }).filter(m => m.matchScore >= 60).sort((a, b) => b.matchScore - a.matchScore)
    
    set((state) => ({
      matches: { ...state.matches, [listingId]: matches }
    }))
    
    return matches
  },
  
  // Get matches for a listing
  getMatches: (listingId) => {
    return get().matches[listingId] || []
  },
  
  // Get stats
  getStats: () => {
    const listings = get().listings
    return {
      total: listings.length,
      active: listings.filter(l => l.status === 'active').length,
      underContract: listings.filter(l => l.status === 'under-contract').length,
      sold: listings.filter(l => l.status === 'sold').length,
      totalValue: listings.reduce((sum, l) => sum + l.price, 0),
      avgCapRate: listings.reduce((sum, l) => sum + (l.capRate || 0), 0) / listings.length
    }
  }
}))
