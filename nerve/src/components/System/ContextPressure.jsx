import React from 'react'
import { Brain, AlertTriangle, CheckCircle2 } from 'lucide-react'

const ContextPressure = ({ percentage = 45 }) => {
  const getStatus = () => {
    if (percentage < 50) return { label: 'Optimal', color: 'text-accent-green', icon: CheckCircle2 }
    if (percentage < 80) return { label: 'Moderate', color: 'text-accent-yellow', icon: AlertTriangle }
    return { label: 'High', color: 'text-accent-red', icon: AlertTriangle }
  }
  
  const status = getStatus()
  const StatusIcon = status.icon
  
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent-blue" />
          <span className="text-sm font-medium text-text-primary">Context Window</span>
        </div>
        <div className={`flex items-center gap-1 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{status.label}</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-bg-input rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            percentage < 50 ? 'bg-accent-green' : 
            percentage < 80 ? 'bg-accent-yellow' : 'bg-accent-red'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>{percentage}% used</span>
        <span>{Math.round((1 - percentage / 100) * 128)}k tokens free</span>
      </div>
    </div>
  )
}

export default ContextPressure
