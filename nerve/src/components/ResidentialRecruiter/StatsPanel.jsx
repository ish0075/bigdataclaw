import React from 'react'
import { Users, UserCheck, Clock, Building2, TrendingUp, MessageCircle } from 'lucide-react'

const STATUS_COLORS = {
  new: 'bg-gray-500',
  contacted: 'bg-yellow-500',
  added: 'bg-blue-500',
  friend: 'bg-green-500',
  declined: 'bg-red-500'
}

const StatsPanel = ({ stats }) => {
  const { total, byStatus, recentContacts, brokerages } = stats
  
  const conversionRate = total > 0 
    ? Math.round(((byStatus.friend + byStatus.added) / total) * 100) 
    : 0
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Agents */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">Total Agents</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{total}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-purple/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-accent-purple" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">
            {byStatus.friend} Friends
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
            {byStatus.added} Added
          </span>
        </div>
      </div>
      
      {/* Conversion Rate */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">Conversion Rate</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{conversionRate}%</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-green/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-accent-green" />
          </div>
        </div>
        <div className="mt-3 text-xs text-text-muted">
          {byStatus.friend + byStatus.added} converted out of {total}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">Recent Contacts</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{recentContacts}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-yellow/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-accent-yellow" />
          </div>
        </div>
        <div className="mt-3 text-xs text-text-muted">
          Contacts in last 7 days
        </div>
      </div>
      
      {/* Brokerages */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">Brokerages</p>
            <p className="text-3xl font-bold text-text-primary mt-1">{brokerages}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center">
            <Building2 className="w-6 h-4 text-accent-blue" />
          </div>
        </div>
        <div className="mt-3 text-xs text-text-muted">
          Unique brokerages represented
        </div>
      </div>
      
      {/* Status Breakdown Bar */}
      <div className="card p-4 lg:col-span-4">
        <p className="text-text-muted text-sm mb-3">Recruitment Pipeline</p>
        <div className="flex items-center gap-1 h-8 rounded-lg overflow-hidden">
          {Object.entries(byStatus).map(([status, count]) => {
            if (count === 0) return null
            const percentage = (count / total) * 100
            return (
              <div
                key={status}
                className={`${STATUS_COLORS[status]} h-full relative group`}
                style={{ width: `${percentage}%`, minWidth: count > 0 ? '2%' : 0 }}
              >
                {percentage > 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {count}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-bg-card border border-border-subtle text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          {Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
              <span className="text-text-secondary capitalize">{status}</span>
              <span className="text-text-muted">({count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
