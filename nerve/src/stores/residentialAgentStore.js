import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Sample data for demonstration
const sampleAgents = [
  {
    id: '1',
    name: 'Sarah Johnson',
    brokerage: 'RE/MAX Niagara',
    email: 'sarah.j@remax-niagara.com',
    phone: '905-555-0101',
    facebook: 'https://facebook.com/sarahjohnsonrealtor',
    instagram: '@sarah_sells_niagara',
    city: 'St. Catharines',
    specialties: ['First-time Buyers', 'Condos'],
    status: 'friend',
    notes: [
      { id: 'n1', date: '2026-03-20', content: 'Met at networking event, very interested in joining team', type: 'meeting' }
    ],
    tags: ['hot-lead', 'experienced'],
    dateAdded: '2026-03-15',
    lastContacted: '2026-03-20'
  },
  {
    id: '2',
    name: 'Michael Chen',
    brokerage: 'Royal LePage',
    email: 'mchen@royallepage.ca',
    phone: '905-555-0202',
    facebook: 'https://facebook.com/michaelchenrealtor',
    instagram: '@michael_chen_realty',
    city: 'Niagara Falls',
    specialties: ['Luxury Homes', 'Investors'],
    status: 'contacted',
    notes: [
      { id: 'n2', date: '2026-03-25', content: 'Sent recruitment email, waiting for response', type: 'email' }
    ],
    tags: ['luxury'],
    dateAdded: '2026-03-18',
    lastContacted: '2026-03-25'
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    brokerage: 'Keller Williams',
    email: 'jwilliams@kw.com',
    phone: '905-555-0303',
    facebook: 'https://facebook.com/jenwilliamsrealtor',
    city: 'Welland',
    specialties: ['Residential', 'New Construction'],
    status: 'new',
    notes: [],
    tags: [],
    dateAdded: '2026-03-26'
  },
  {
    id: '4',
    name: 'David Martinez',
    brokerage: 'Sutton Group',
    email: 'dmartinez@sutton.com',
    phone: '905-555-0404',
    instagram: '@dave_martinez_realestate',
    city: 'Thorold',
    specialties: ['Family Homes'],
    status: 'added',
    notes: [
      { id: 'n3', date: '2026-03-22', content: 'Phone call - discussed commission structure', type: 'call' },
      { id: 'n4', date: '2026-03-24', content: 'Added on Facebook, sent follow-up message', type: 'other' }
    ],
    tags: ['follow-up'],
    dateAdded: '2026-03-20',
    lastContacted: '2026-03-24'
  },
  {
    id: '5',
    name: 'Amanda Taylor',
    brokerage: 'Century 21',
    email: 'ataylor@c21.ca',
    phone: '905-555-0505',
    facebook: 'https://facebook.com/amandataylorrealtor',
    instagram: '@amanda_taylor_homes',
    city: 'Port Colborne',
    specialties: ['Waterfront', 'Cottages'],
    status: 'declined',
    notes: [
      { id: 'n5', date: '2026-03-21', content: 'Not interested in switching brokerages at this time', type: 'email' }
    ],
    tags: ['not-interested'],
    dateAdded: '2026-03-19',
    lastContacted: '2026-03-21'
  },
  {
    id: '6',
    name: 'Robert Anderson',
    brokerage: 'RE/MAX',
    email: 'randerson@remax.com',
    phone: '905-555-0606',
    linkedin: 'https://linkedin.com/in/robertandersonrealtor',
    city: 'Niagara-on-the-Lake',
    specialties: ['Luxury', 'Wine Country'],
    status: 'new',
    notes: [],
    tags: ['high-value'],
    dateAdded: '2026-03-27'
  }
]

const STATUS_COLORS = {
  new: { color: 'gray', label: 'New' },
  contacted: { color: 'yellow', label: 'Contacted' },
  added: { color: 'blue', label: 'Added' },
  friend: { color: 'green', label: 'Friend' },
  declined: { color: 'red', label: 'Declined' }
}

export const useResidentialAgentStore = create(
  persist(
    (set, get) => ({
      agents: sampleAgents,
      filters: {
        search: '',
        status: 'all',
        brokerage: 'all',
        city: 'all'
      },
      
      // Actions
      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
      
      clearFilters: () => set({
        filters: { search: '', status: 'all', brokerage: 'all', city: 'all' }
      }),
      
      importAgents: (newAgents) => set((state) => ({
        agents: [...state.agents, ...newAgents.map(agent => ({
          ...agent,
          id: agent.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: agent.status || 'new',
          notes: agent.notes || [],
          tags: agent.tags || [],
          dateAdded: agent.dateAdded || new Date().toISOString().split('T')[0]
        }))]
      })),
      
      updateStatus: (agentId, status) => set((state) => ({
        agents: state.agents.map(a => 
          a.id === agentId 
            ? { ...a, status, lastContacted: new Date().toISOString().split('T')[0] }
            : a
        )
      })),
      
      addNote: (agentId, content, type = 'other') => set((state) => {
        const newNote = {
          id: `note-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          content,
          type
        }
        return {
          agents: state.agents.map(a => 
            a.id === agentId 
              ? { 
                  ...a, 
                  notes: [newNote, ...a.notes],
                  lastContacted: newNote.date
                }
              : a
          )
        }
      }),
      
      deleteNote: (agentId, noteId) => set((state) => ({
        agents: state.agents.map(a => 
          a.id === agentId 
            ? { ...a, notes: a.notes.filter(n => n.id !== noteId) }
            : a
        )
      })),
      
      updateAgent: (agentId, data) => set((state) => ({
        agents: state.agents.map(a => 
          a.id === agentId ? { ...a, ...data } : a
        )
      })),
      
      deleteAgent: (agentId) => set((state) => ({
        agents: state.agents.filter(a => a.id !== agentId)
      })),
      
      addTag: (agentId, tag) => set((state) => {
        const agent = state.agents.find(a => a.id === agentId)
        if (agent && !agent.tags.includes(tag)) {
          return {
            agents: state.agents.map(a => 
              a.id === agentId ? { ...a, tags: [...a.tags, tag] } : a
            )
          }
        }
        return state
      }),
      
      removeTag: (agentId, tag) => set((state) => ({
        agents: state.agents.map(a => 
          a.id === agentId ? { ...a, tags: a.tags.filter(t => t !== tag) } : a
        )
      })),
      
      // Getters
      getFilteredAgents: () => {
        const { agents, filters } = get()
        return agents.filter(agent => {
          if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            const matchesName = agent.name.toLowerCase().includes(searchLower)
            const matchesBrokerage = agent.brokerage.toLowerCase().includes(searchLower)
            const matchesCity = agent.city?.toLowerCase().includes(searchLower)
            const matchesEmail = agent.email?.toLowerCase().includes(searchLower)
            if (!matchesName && !matchesBrokerage && !matchesCity && !matchesEmail) return false
          }
          if (filters.status !== 'all' && agent.status !== filters.status) return false
          if (filters.brokerage !== 'all' && agent.brokerage !== filters.brokerage) return false
          if (filters.city !== 'all' && agent.city !== filters.city) return false
          return true
        })
      },
      
      getStats: () => {
        const { agents } = get()
        const total = agents.length
        const byStatus = {
          new: agents.filter(a => a.status === 'new').length,
          contacted: agents.filter(a => a.status === 'contacted').length,
          added: agents.filter(a => a.status === 'added').length,
          friend: agents.filter(a => a.status === 'friend').length,
          declined: agents.filter(a => a.status === 'declined').length
        }
        const recentContacts = agents.filter(a => {
          if (!a.lastContacted) return false
          const daysSince = (new Date() - new Date(a.lastContacted)) / (1000 * 60 * 60 * 24)
          return daysSince <= 7
        }).length
        
        const brokerages = [...new Set(agents.map(a => a.brokerage))].length
        
        return { total, byStatus, recentContacts, brokerages }
      },
      
      getUniqueValues: (field) => {
        const { agents } = get()
        return [...new Set(agents.map(a => a[field]).filter(Boolean))].sort()
      },
      
      exportToCSV: () => {
        const { agents } = get()
        const headers = ['name', 'brokerage', 'email', 'phone', 'facebook', 'instagram', 'linkedin', 'city', 'specialties', 'status', 'tags', 'dateAdded', 'lastContacted']
        const rows = agents.map(a => [
          a.name,
          a.brokerage,
          a.email,
          a.phone || '',
          a.facebook || '',
          a.instagram || '',
          a.linkedin || '',
          a.city || '',
          (a.specialties || []).join(';'),
          a.status,
          (a.tags || []).join(';'),
          a.dateAdded,
          a.lastContacted || ''
        ])
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      }
    }),
    {
      name: 'residential-agent-storage',
      partialize: (state) => ({ agents: state.agents })
    }
  )
)
