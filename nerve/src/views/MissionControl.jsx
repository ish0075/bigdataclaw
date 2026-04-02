import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMissionStore } from '../stores/missionStore'
import { useAgentStore } from '../stores/agentStore'
import { useDealStore } from '../stores/dealStore'
import StatCard from '../components/Common/StatCard'
import ActiveMissions from '../components/Mission/ActiveMissions'
import HotMoneyRadar from '../components/Mission/HotMoneyRadar'
import AgentFleet from '../components/Agent/AgentFleet'
import { Rocket, Activity, DollarSign, Target, TrendingUp, TrendingDown } from 'lucide-react'

const MissionControl = () => {
  const navigate = useNavigate()
  const { stats, missions, hotMoneyLeads } = useMissionStore()
  const { agents } = useAgentStore()
  const { deals } = useDealStore()
  
  const activeAgentsCount = agents.filter(a => a.status === 'active').length
  const newDealsCount = deals.filter(d => d.stage === 'new').length
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mission Control</h1>
          <p className="text-text-secondary mt-1">
            Real-time CRE intelligence & agent orchestration
          </p>
        </div>
        <button 
          onClick={() => navigate('/research')}
          className="btn-primary flex items-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          <span>New Mission</span>
        </button>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Missions"
          value={stats.activeMissions}
          trend={{ value: 3, label: 'new', positive: true }}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Hot Money Alerts"
          value={stats.hotMoneyAlerts}
          trend={{ value: 8, label: 'new', positive: true }}
          icon={DollarSign}
          color="red"
        />
        <StatCard
          title="Tracked Capital"
          value={`$${(stats.trackedCapital / 1e9).toFixed(1)}B`}
          trend={{ value: 12, label: 'growth', positive: true }}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Matches Today"
          value={stats.matchesToday}
          trend={{ value: 24, label: 'new', positive: true }}
          icon={Target}
          color="yellow"
        />
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <ActiveMissions missions={missions.filter(m => m.status === 'active')} />
        
        {/* Hot Money Radar */}
        <HotMoneyRadar leads={hotMoneyLeads.slice(0, 5)} />
      </div>
      
      {/* Agent Fleet */}
      <AgentFleet agents={agents} />
      
      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton 
            label="Research Property" 
            description="Start new property analysis"
            icon="🎯"
            to="/research"
          />
          <QuickActionButton 
            label="View Hot Money" 
            description="See recent seller leads"
            icon="🔥"
            to="/hotmoney"
          />
          <QuickActionButton 
            label="Deal Pipeline" 
            description={`${newDealsCount} new deals waiting`}
            icon="📊"
            to="/pipeline"
          />
          <QuickActionButton 
            label="Agent Workspace" 
            description={`${activeAgentsCount} agents active`}
            icon="🤖"
            to="/agents"
          />
        </div>
      </div>
    </div>
  )
}

const QuickActionButton = ({ label, description, icon, to }) => (
  <a 
    href={to}
    className="card-hover p-4 flex flex-col items-center text-center gap-2"
  >
    <span className="text-3xl">{icon}</span>
    <span className="font-medium text-text-primary">{label}</span>
    <span className="text-xs text-text-secondary">{description}</span>
  </a>
)

export default MissionControl
