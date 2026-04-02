import { create } from 'zustand'

export const useMissionStore = create((set, get) => ({
  // Mission state
  missions: [],
  activeMission: null,
  hotMoneyLeads: [],
  
  // Stats
  stats: {
    activeMissions: 0,
    hotMoneyAlerts: 0,
    trackedCapital: 0,
    matchesToday: 0,
  },
  
  // Actions
  addMission: (mission) => set((state) => ({
    missions: [mission, ...state.missions],
    stats: {
      ...state.stats,
      activeMissions: state.stats.activeMissions + 1,
    }
  })),
  
  updateMission: (id, updates) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ),
  })),
  
  setActiveMission: (mission) => set({ activeMission: mission }),
  
  completeMission: (id) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === id ? { ...m, status: 'completed', completedAt: new Date() } : m
    ),
    stats: {
      ...state.stats,
      activeMissions: Math.max(0, state.stats.activeMissions - 1),
      matchesToday: state.stats.matchesToday + 1,
    }
  })),
  
  abortMission: (id) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === id ? { ...m, status: 'aborted', abortedAt: new Date() } : m
    ),
    stats: {
      ...state.stats,
      activeMissions: Math.max(0, state.stats.activeMissions - 1),
    }
  })),
  
  // Hot money actions
  setHotMoneyLeads: (leads) => set({ 
    hotMoneyLeads: leads,
    stats: {
      ...get().stats,
      hotMoneyAlerts: leads.length,
      trackedCapital: leads.reduce((sum, l) => sum + (l.cashAmount || 0), 0),
    }
  }),
  
  addHotMoneyLead: (lead) => set((state) => ({
    hotMoneyLeads: [lead, ...state.hotMoneyLeads],
    stats: {
      ...state.stats,
      hotMoneyAlerts: state.stats.hotMoneyAlerts + 1,
      trackedCapital: state.stats.trackedCapital + (lead.cashAmount || 0),
    }
  })),
  
  // WebSocket updates
  updateMissionPhase: (missionId, phase, progress) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === missionId 
        ? { ...m, currentPhase: phase, phaseProgress: progress }
        : m
    ),
  })),
  
  addMissionLog: (missionId, log) => set((state) => ({
    missions: state.missions.map(m => 
      m.id === missionId 
        ? { ...m, logs: [...(m.logs || []), { ...log, timestamp: new Date() }] }
        : m
    ),
  })),
}))
