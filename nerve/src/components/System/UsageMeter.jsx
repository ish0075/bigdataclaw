import React from 'react'
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react'

const UsageMeter = ({ compact = false }) => {
  const usage = {
    daily: 12.40,
    limit: 100,
    missions: 5,
    tokens: 45600,
  }
  
  const percentage = (usage.daily / usage.limit) * 100
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-input">
        <CreditCard className="w-4 h-4 text-text-muted" />
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-bg-card rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                percentage > 80 ? 'bg-accent-red' : 
                percentage > 50 ? 'bg-accent-yellow' : 'bg-accent-green'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-text-secondary">${usage.daily.toFixed(2)}</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-accent-blue" />
          API Usage
        </h3>
        <span className="text-sm text-text-muted">Today</span>
      </div>
      
      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-text-primary">
            ${usage.daily.toFixed(2)}
          </span>
          <span className="text-sm text-text-muted">
            of ${usage.limit} limit
          </span>
        </div>
        <div className="h-3 bg-bg-input rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              percentage > 80 ? 'bg-accent-red' : 
              percentage > 50 ? 'bg-accent-yellow' : 'bg-accent-green'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-bg-input">
          <p className="text-xs text-text-muted">Missions Today</p>
          <p className="text-xl font-bold text-text-primary">{usage.missions}</p>
        </div>
        <div className="p-3 rounded-lg bg-bg-input">
          <p className="text-xs text-text-muted">Tokens Used</p>
          <p className="text-xl font-bold text-text-primary">{(usage.tokens / 1000).toFixed(0)}k</p>
        </div>
      </div>
      
      {percentage > 80 && (
        <div className="mt-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" />
          <p className="text-sm text-accent-red">
            Approaching daily limit. Consider upgrading your plan.
          </p>
        </div>
      )}
    </div>
  )
}

export default UsageMeter
