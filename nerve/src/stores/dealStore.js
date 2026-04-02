import { create } from 'zustand'

const defaultDeals = [
  { id: '1', entity: 'Dream Industrial REIT', value: 5000000, type: 'Industrial', location: 'Welland', stage: 'new', matchScore: 95, lastActivity: new Date() },
  { id: '2', entity: 'Stone Eagle Winery', value: 7000000, type: 'Vineyard', location: 'NOTL', stage: 'new', matchScore: 92, lastActivity: new Date() },
  { id: '3', entity: 'Tregunno Fruit Farms', value: 8000000, type: 'Farm', location: 'NOTL', stage: 'contacted', matchScore: 88, lastActivity: new Date() },
  { id: '4', entity: 'Walker Industries', value: 4000000, type: 'Land', location: 'Niagara', stage: 'contacted', matchScore: 85, lastActivity: new Date() },
  { id: '5', entity: 'Pure Industrial', value: 3500000, type: 'Industrial', location: 'Welland', stage: 'offer', matchScore: 88, lastActivity: new Date() },
  { id: '6', entity: 'Carttera', value: 12000000, type: 'Mixed-Use', location: 'Niagara', stage: 'closing', matchScore: 92, lastActivity: new Date() },
]

export const useDealStore = create((set) => ({
  deals: defaultDeals,
  
  // Actions
  addDeal: (deal) => set((state) => ({
    deals: [{ ...deal, id: Date.now().toString(), createdAt: new Date() }, ...state.deals]
  })),
  
  moveDeal: (dealId, newStage) => set((state) => ({
    deals: state.deals.map(d => 
      d.id === dealId 
        ? { ...d, stage: newStage, lastActivity: new Date() }
        : d
    ),
  })),
  
  updateDeal: (dealId, updates) => set((state) => ({
    deals: state.deals.map(d => 
      d.id === dealId ? { ...d, ...updates, lastActivity: new Date() } : d
    ),
  })),
  
  deleteDeal: (dealId) => set((state) => ({
    deals: state.deals.filter(d => d.id !== dealId),
  })),
  
  // Getters
  getDealsByStage: (stage) => {
    return set.getState().deals.filter(d => d.stage === stage)
  },
  
  getStageCounts: () => {
    const deals = set.getState().deals
    return {
      new: deals.filter(d => d.stage === 'new').length,
      contacted: deals.filter(d => d.stage === 'contacted').length,
      offer: deals.filter(d => d.stage === 'offer').length,
      closing: deals.filter(d => d.stage === 'closing').length,
    }
  },
}))
