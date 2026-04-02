import { create } from 'zustand'

const defaultAgents = [
  {
    id: 'transaction-scout',
    name: 'Transaction Scout',
    description: 'Find recent transactions in target market',
    icon: '🎯',
    status: 'active',
    activeMissions: 0,
    completedMissions: 42,
    uptime: '99.9%',
    lastLog: null,
  },
  {
    id: 'hot-money-tracker',
    name: 'Hot Money Tracker',
    description: 'Identify sellers with fresh capital',
    icon: '🔥',
    status: 'idle',
    activeMissions: 0,
    watchingCount: 156,
    alertCount: 0,
    latency: '45ms',
    lastLog: null,
  },
  {
    id: 'portfolio-analyzer',
    name: 'Portfolio Analyzer',
    description: 'Match asset class portfolios',
    icon: '💼',
    status: 'active',
    activeMissions: 0,
    pendingCount: 0,
    avgTime: '3m',
    lastLog: null,
  },
  {
    id: 'agent-finder',
    name: 'Agent Finder',
    description: 'Find active brokers in market',
    icon: '👤',
    status: 'idle',
    activeMissions: 0,
    lastLog: null,
  },
  {
    id: 'lender-matcher',
    name: 'Lender Matcher',
    description: 'Match financing sources',
    icon: '🏦',
    status: 'active',
    activeMissions: 0,
    lastLog: null,
  },
  {
    id: 'obsidian-sync',
    name: 'Obsidian Sync',
    description: 'Sync with Obsidian vault',
    icon: '📝',
    status: 'idle',
    lastSync: null,
    fileCount: 1247,
    lastLog: null,
  },
]

export const useAgentStore = create((set, get) => ({
  agents: defaultAgents,
  logs: [],
  
  // Actions
  updateAgentStatus: (agentId, status) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId ? { ...a, status } : a
    ),
  })),
  
  startAgent: (agentId) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId ? { ...a, status: 'active' } : a
    ),
  })),
  
  stopAgent: (agentId) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId ? { ...a, status: 'idle' } : a
    ),
  })),
  
  pauseAgent: (agentId) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId ? { ...a, status: 'queued' } : a
    ),
  })),
  
  addAgentLog: (agentId, message, level = 'info') => set((state) => {
    const log = { agentId, message, level, timestamp: new Date() }
    return {
      logs: [log, ...state.logs].slice(0, 100),
      agents: state.agents.map(a => 
        a.id === agentId ? { ...a, lastLog: log } : a
      ),
    }
  }),
  
  incrementAgentMissions: (agentId) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId 
        ? { 
            ...a, 
            activeMissions: a.activeMissions + 1,
            completedMissions: (a.completedMissions || 0) + (a.status === 'active' ? 0 : 0)
          } 
        : a
    ),
  })),
  
  updateAgentStats: (agentId, stats) => set((state) => ({
    agents: state.agents.map(a => 
      a.id === agentId ? { ...a, ...stats } : a
    ),
  })),

  setAgents: (agents) => set({ agents }),
  
  getAgentLogs: (agentId) => {
    return get().logs.filter(l => l.agentId === agentId)
  },
  
  clearLogs: (agentId) => set((state) => ({
    logs: state.logs.filter(l => l.agentId !== agentId)
  })),
}))
