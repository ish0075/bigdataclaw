import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, ChevronRight, Clock } from 'lucide-react'

const ActiveMissions = ({ missions }) => {
  const navigate = useNavigate()
  const sampleMissions = [
    {
      id: '1',
      property: { address: '1500 Michael Drive, Welland', type: 'Industrial' },
      currentPhase: 2,
      totalPhases: 6,
      phaseProgress: 45,
      status: 'active',
    },
    {
      id: '2',
      property: { address: 'Ridgeway 40-acre Farm, Port Colborne', type: 'Agricultural' },
      currentPhase: 1,
      totalPhases: 6,
      phaseProgress: 0,
      status: 'queued',
    },
  ]
  
  const displayMissions = missions.length > 0 ? missions : sampleMissions
  
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>🎯</span>
          Active Missions
        </h3>
        <span className="text-sm text-text-muted">
          {displayMissions.length} running
        </span>
      </div>
      
      <div className="space-y-4">
        {displayMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
        
        {displayMissions.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <p>No active missions</p>
            <p className="text-sm mt-1">Start a new research mission</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('/research')}
        className="w-full mt-4 py-3 border border-dashed border-border-subtle rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-2"
      >
        <span>+</span>
        <span>New Mission</span>
      </button>
    </div>
  )
}

const MissionCard = ({ mission }) => {
  const isActive = mission.status === 'active'
  
  return (
    <div className={`p-4 rounded-xl border ${isActive ? 'border-accent-blue/30 bg-accent-blue/5' : 'border-border-subtle bg-bg-input'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-green animate-pulse' : 'bg-accent-yellow'}`} />
            <h4 className="font-medium text-text-primary">
              {mission.property?.address || 'Property Research'}
            </h4>
          </div>
          
          <p className="text-sm text-text-secondary mt-1">
            {mission.property?.type || 'Mixed-Use'} • Phase {mission.currentPhase}/{mission.totalPhases}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-blue rounded-full transition-all duration-500"
                style={{ width: `${mission.phaseProgress}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              {isActive ? 'Running analysis...' : 'Queued • Starting soon'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button className="p-2 rounded-lg hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
          {isActive && (
            <button className="p-2 rounded-lg hover:bg-accent-red/20 transition-colors text-text-secondary hover:text-accent-red">
              <Square className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActiveMissions
