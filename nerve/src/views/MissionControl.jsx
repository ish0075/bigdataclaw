import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMissionStore } from '../stores/missionStore'
import { useDealStore } from '../stores/dealStore'
import StatCard from '../components/Common/StatCard'
import OpenClawChat from '../components/Mission/OpenClawChat'
import HotMoneyRadar from '../components/Mission/HotMoneyRadar'
import { Rocket, Activity, DollarSign, Target, TrendingUp, TrendingDown, Info, CheckCircle2 } from 'lucide-react'

const MissionControl = () => {
  const navigate = useNavigate()
  const { stats, missions, hotMoneyLeads } = useMissionStore()
  const { deals } = useDealStore()
  
  const newDealsCount = deals.filter(d => d.stage === 'new').length
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mission Control</h1>
          <p className="text-text-secondary mt-1 max-w-2xl">
            Your central command for commercial real estate intelligence. Track capital, spot opportunities, and manage agent missions in real time.
          </p>
        </div>
        <button 
          onClick={() => navigate('/opportunities')}
          className="btn-primary flex items-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          <span>New Mission</span>
        </button>
      </div>

      {/* What You Can Do Here */}
      <div className="card p-5 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Info className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">What You Can Do Here</h3>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                Monitor Hot Money alerts and distressed property signals
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                Match buyers, sellers, agents, and lenders to active listings
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                Generate referral agreements and outreach materials from intelligence reports
              </li>
            </ul>
          </div>
        </div>
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
        {/* OpenClaw Chat */}
        <OpenClawChat />
        
        {/* Hot Money Radar */}
        <HotMoneyRadar leads={hotMoneyLeads.slice(0, 5)} />
      </div>
      
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
            label="Obsidian Vault" 
            description="Browse research notes"
            icon="📝"
            to="/vault"
          />
        </div>
      </div>
    </div>
  )
}

const QuickActionButton = ({ label, description, icon, to }) => (
  <Link
    to={to}
    className="card-hover p-4 flex flex-col items-center text-center gap-2"
  >
    <span className="text-3xl">{icon}</span>
    <span className="font-medium text-text-primary">{label}</span>
    <span className="text-xs text-text-secondary">{description}</span>
  </Link>
)

export default MissionControl
