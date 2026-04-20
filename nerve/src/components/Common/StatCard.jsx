import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const StatCard = ({ title, value, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-accent-blue/10 text-accent-blue',
    red: 'bg-accent-red/10 text-accent-red',
    green: 'bg-accent-green/10 text-accent-green',
    yellow: 'bg-accent-yellow/10 text-accent-yellow',
  }
  
  return (
    <div className="card p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-text-primary mt-2">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1.5 mt-3">
              {trend.positive ? (
                <TrendingUp className="w-4 h-4 text-accent-green" />
              ) : (
                <TrendingDown className="w-4 h-4 text-accent-red" />
              )}
              <span className={`text-sm font-medium ${trend.positive ? 'text-accent-green' : 'text-accent-red'}`}>
                {trend.positive ? '+' : ''}{trend.value} {trend.label}
              </span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default StatCard
