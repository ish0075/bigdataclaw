import React, { useState } from 'react'
import { 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Search,
  RefreshCw,
  Plus,
  MoreHorizontal,
  File,
  Image as ImageIcon,
  Database
} from 'lucide-react'

const VaultBrowser = ({ onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['Research', 'Deals', 'Buyers']))
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock vault structure
  const vaultStructure = [
    {
      id: 'research',
      name: 'Research',
      type: 'folder',
      children: [
        {
          id: 'welland-industrial',
          name: 'Welland Industrial Properties.md',
          type: 'file',
          size: '12.4 KB',
          modified: '2 hours ago',
        },
        {
          id: 'niagara-farms',
          name: 'Niagara Farm Analysis.md',
          type: 'file',
          size: '8.2 KB',
          modified: '1 day ago',
        },
        {
          id: 'hot-money-q1',
          name: 'Hot Money Q1 2025.md',
          type: 'file',
          size: '24.1 KB',
          modified: '3 days ago',
        },
      ]
    },
    {
      id: 'deals',
      name: 'Deals',
      type: 'folder',
      children: [
        {
          id: 'seaway-mall',
          name: 'Seaway Mall Block.md',
          type: 'file',
          size: '45.2 KB',
          modified: '1 hour ago',
        },
        {
          id: 'active-deals',
          name: 'Active Deals Tracker.md',
          type: 'file',
          size: '18.7 KB',
          modified: '5 hours ago',
        },
      ]
    },
    {
      id: 'buyers',
      name: 'Buyers',
      type: 'folder',
      children: [
        {
          id: 'dream-industrial',
          name: 'Dream Industrial REIT.md',
          type: 'file',
          size: '6.3 KB',
          modified: '2 days ago',
        },
        {
          id: 'carttera',
          name: 'Carttera Private Equities.md',
          type: 'file',
          size: '5.8 KB',
          modified: '1 week ago',
        },
        {
          id: 'tier-1-buyers',
          name: 'Tier 1 Cash Buyers.md',
          type: 'file',
          size: '32.4 KB',
          modified: '3 days ago',
        },
      ]
    },
    {
      id: 'templates',
      name: 'Templates',
      type: 'folder',
      children: [
        {
          id: 'property-research',
          name: 'Property Research Template.md',
          type: 'file',
          size: '3.2 KB',
          modified: '2 weeks ago',
        },
        {
          id: 'deal-summary',
          name: 'Deal Summary Template.md',
          type: 'file',
          size: '2.8 KB',
          modified: '2 weeks ago',
        },
      ]
    },
    {
      id: 'sync-status',
      name: 'Sync Status.md',
      type: 'file',
      size: '1.2 KB',
      modified: 'Just now',
    },
  ]
  
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }
  
  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-accent-blue" />
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) return <ImageIcon className="w-4 h-4 text-accent-green" />
    if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) return <Database className="w-4 h-4 text-accent-yellow" />
    return <File className="w-4 h-4 text-text-muted" />
  }
  
  const renderFileTree = (items, depth = 0) => {
    return items.map(item => {
      if (item.type === 'folder') {
        const isExpanded = expandedFolders.has(item.id)
        return (
          <div key={item.id}>
            <div
              onClick={() => toggleFolder(item.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-input transition-colors ${
                depth > 0 ? 'ml-4' : ''
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
              <Folder className="w-4 h-4 text-accent-yellow" />
              <span className="text-sm text-text-primary">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div>
                {renderFileTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        )
      }
      
      return (
        <div
          key={item.id}
          onClick={() => onFileSelect?.(item)}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
            depth > 0 ? 'ml-4' : ''
          } ${
            selectedFile?.id === item.id 
              ? 'bg-accent-red/10 border-l-2 border-accent-red' 
              : 'hover:bg-bg-input'
          }`}
        >
          <div className="w-4" /> {/* Spacer for alignment */}
          {getFileIcon(item.name)}
          <div className="flex-1 min-w-0">
            <span className="text-sm text-text-primary truncate block">{item.name}</span>
          </div>
          <span className="text-xs text-text-muted">{item.modified}</span>
        </div>
      )
    })
  }
  
  return (
    <div className="card flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text-primary">Vault Browser</h3>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors" title="New Note">
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors" title="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-field pl-9 py-2 text-sm"
          />
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {renderFileTree(vaultStructure)}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>1,247 files</span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            Synced
          </span>
        </div>
      </div>
    </div>
  )
}

export default VaultBrowser
