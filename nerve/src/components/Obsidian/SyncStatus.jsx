import React, { useState, useEffect } from 'react'
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Cloud,
  HardDrive,
  FileText,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react'

const SyncStatus = () => {
  const [syncState, setSyncState] = useState({
    status: 'synced', // 'synced', 'syncing', 'error', 'offline'
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    filesSynced: 1247,
    pendingUploads: 0,
    pendingDownloads: 0,
    vaultPath: '~/Obsidian Vault/Mission Control',
    syncProgress: 100,
  })
  
  const [recentActivity, setRecentActivity] = useState([
    { action: 'upload', file: 'Seaway Mall Block.md', time: Date.now() - 60000 },
    { action: 'upload', file: 'Hot Money Q1 2025.md', time: Date.now() - 300000 },
    { action: 'download', file: 'Buyer Database.md', time: Date.now() - 600000 },
    { action: 'upload', file: 'Deal Pipeline.md', time: Date.now() - 900000 },
  ])
  
  const handleSync = () => {
    setSyncState(prev => ({ ...prev, status: 'syncing', syncProgress: 0 }))
    
    // Simulate sync progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setSyncState(prev => ({ ...prev, syncProgress: progress }))
      
      if (progress >= 100) {
        clearInterval(interval)
        setSyncState(prev => ({
          ...prev,
          status: 'synced',
          lastSync: new Date(),
          syncProgress: 100,
        }))
      }
    }, 200)
  }
  
  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'synced':
        return <CheckCircle2 className="w-5 h-5 text-accent-green" />
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-accent-yellow animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-accent-red" />
      case 'offline':
        return <Cloud className="w-5 h-5 text-text-muted" />
      default:
        return <Cloud className="w-5 h-5 text-text-muted" />
    }
  }
  
  const getStatusText = () => {
    switch (syncState.status) {
      case 'synced':
        return 'All changes synced'
      case 'syncing':
        return `Syncing... ${syncState.syncProgress}%`
      case 'error':
        return 'Sync failed'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }
  
  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }
  
  const formatLastSync = (date) => {
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    return date.toLocaleString()
  }
  
  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary flex items-center gap-2">
          <Cloud className="w-5 h-5 text-accent-blue" />
          Obsidian Sync
        </h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${
            syncState.status === 'synced' ? 'text-accent-green' :
            syncState.status === 'syncing' ? 'text-accent-yellow' :
            syncState.status === 'error' ? 'text-accent-red' :
            'text-text-muted'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      {/* Sync Progress */}
      {syncState.status === 'syncing' && (
        <div className="mb-4">
          <div className="h-2 bg-bg-input rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-blue rounded-full transition-all duration-200"
              style={{ width: `${syncState.syncProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-bg-input">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <FileText className="w-3 h-3" />
            Files Synced
          </div>
          <p className="text-xl font-bold text-text-primary">
            {syncState.filesSynced.toLocaleString()}
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-bg-input">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <Clock className="w-3 h-3" />
            Last Sync
          </div>
          <p className="text-sm font-medium text-text-primary">
            {formatLastSync(syncState.lastSync)}
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-bg-input">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <ArrowUp className="w-3 h-3" />
            Pending Upload
          </div>
          <p className={`text-xl font-bold ${
            syncState.pendingUploads > 0 ? 'text-accent-yellow' : 'text-text-primary'
          }`}>
            {syncState.pendingUploads}
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-bg-input">
          <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
            <ArrowDown className="w-3 h-3" />
            Pending Download
          </div>
          <p className={`text-xl font-bold ${
            syncState.pendingDownloads > 0 ? 'text-accent-yellow' : 'text-text-primary'
          }`}>
            {syncState.pendingDownloads}
          </p>
        </div>
      </div>
      
      {/* Vault Path */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-input mb-4">
        <HardDrive className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-secondary truncate">{syncState.vaultPath}</span>
      </div>
      
      {/* Recent Activity */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Recent Activity</h4>
        <div className="space-y-2">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {activity.action === 'upload' ? (
                  <ArrowUp className="w-3 h-3 text-accent-green" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-accent-blue" />
                )}
                <span className="text-text-primary truncate max-w-[180px]">{activity.file}</span>
              </div>
              <span className="text-xs text-text-muted">{formatTime(activity.time)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <button
        onClick={handleSync}
        disabled={syncState.status === 'syncing'}
        className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
        {syncState.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  )
}

export default SyncStatus
