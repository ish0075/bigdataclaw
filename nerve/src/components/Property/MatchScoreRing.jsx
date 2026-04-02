import React from 'react'

const MatchScoreRing = ({ score, size = 'md', showBreakdown = false }) => {
  // Size configurations
  const sizes = {
    sm: { width: 48, strokeWidth: 4, fontSize: 'text-xs' },
    md: { width: 64, strokeWidth: 5, fontSize: 'text-sm' },
    lg: { width: 96, strokeWidth: 6, fontSize: 'text-xl' },
    xl: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  }
  
  const { width, strokeWidth, fontSize } = sizes[size] || sizes.md
  const radius = (width - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  // Color based on score
  const getColor = () => {
    if (score >= 90) return '#27AE60' // accent-green
    if (score >= 70) return '#F39C12' // accent-yellow
    return '#E74C3C' // accent-red
  }
  
  const color = getColor()
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
        >
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="#2D2D2D"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`font-bold ${fontSize}`}
            style={{ color }}
          >
            {score}
          </span>
        </div>
      </div>
      
      {showBreakdown && (
        <div className="mt-3 text-center">
          <p className="text-xs text-text-muted">Match Score</p>
        </div>
      )}
    </div>
  )
}

export const MatchScoreBreakdown = ({ breakdown }) => {
  const items = [
    { key: 'recency', label: 'Recency', icon: '⏱️' },
    { key: 'capital', label: 'Capital', icon: '💰' },
    { key: 'asset', label: 'Asset Match', icon: '🏢' },
    { key: 'geo', label: 'Geography', icon: '📍' },
  ]
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-accent-green'
    if (score >= 70) return 'text-accent-yellow'
    return 'text-accent-red'
  }
  
  return (
    <div className="space-y-2">
      {items.map(({ key, label, icon }) => {
        const score = breakdown?.[key] || 0
        return (
          <div key={key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-text-secondary">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-bg-card rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    score >= 90 ? 'bg-accent-green' : 
                    score >= 70 ? 'bg-accent-yellow' : 'bg-accent-red'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`font-medium w-8 text-right ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MatchScoreRing
