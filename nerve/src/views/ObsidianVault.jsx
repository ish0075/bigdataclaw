import React, { useState, useEffect } from 'react'
import { 
  Database, Plus, Search, FolderOpen, RefreshCw, Settings as SettingsIcon, 
  X, Check, FileText, ExternalLink, Trash2, Download, Edit3, DollarSign, ClipboardPaste, Sparkles
} from 'lucide-react'
import VaultBrowser from '../components/Obsidian/VaultBrowser'
import NotePreview from '../components/Obsidian/NotePreview'
import SyncStatus from '../components/Obsidian/SyncStatus'

const ObsidianVault = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showPasteSalesModal, setShowPasteSalesModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState('2 minutes ago')
  const [salesMessage, setSalesMessage] = useState(null)
  
  // Vault stats with live updates
  const [graphStats, setGraphStats] = useState({
    totalNotes: 1247,
    totalLinks: 3420,
    orphanNotes: 23,
    lastModified: '2 minutes ago',
  })
  
  const recentNotes = [
    { name: 'Seaway Mall Block.md', date: '1 hour ago', tags: ['deal', 'retail'] },
    { name: 'Hot Money Q1 2025.md', date: '3 hours ago', tags: ['analysis', 'hot-money'] },
    { name: 'Dream Industrial Profile.md', date: '1 day ago', tags: ['buyer', 'industrial'] },
    { name: 'Niagara Market Update.md', date: '2 days ago', tags: ['market', 'research'] },
  ]
  
  // Handle sync
  const handleSync = async () => {
    setSyncing(true)
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSyncing(false)
    setLastSync('Just now')
    // Update stats randomly
    setGraphStats(prev => ({
      ...prev,
      totalNotes: prev.totalNotes + Math.floor(Math.random() * 3),
      lastModified: 'Just now'
    }))
  }
  
  // Handle new note
  const handleNewNote = (noteData) => {
    // In a real app, this would create a file
    console.log('Creating new note:', noteData)
    setShowNewNoteModal(false)
    setGraphStats(prev => ({
      ...prev,
      totalNotes: prev.totalNotes + 1,
      lastModified: 'Just now'
    }))
  }
  
  // Handle opening Obsidian
  const handleOpenObsidian = () => {
    // Try to open Obsidian URI
    window.open('obsidian://open?vault=Mission Control', '_blank')
  }
  
  // Handle global search
  const handleGlobalSearch = () => {
    const query = prompt('Search all notes:')
    if (query) {
      setSearchQuery(query)
      // In a real app, this would search the vault
      console.log('Searching for:', query)
    }
  }
  
  return (
    <>
      {/* New Note Modal */}
      {showNewNoteModal && (
        <NewNoteModal 
          onClose={() => setShowNewNoteModal(false)}
          onSave={handleNewNote}
        />
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)}
        />
      )}
      
      {/* Post Sales Data Modal */}
      {showSalesModal && (
        <PostSalesModal 
          onClose={() => setShowSalesModal(false)}
          onSuccess={(msg) => {
            setSalesMessage(msg)
            setTimeout(() => setSalesMessage(null), 3000)
          }}
        />
      )}
      
      {/* Paste Multiple Sales Modal */}
      {showPasteSalesModal && (
        <PasteSalesModal 
          onClose={() => setShowPasteSalesModal(false)}
          onSuccess={(msg) => {
            setSalesMessage(msg)
            setTimeout(() => setSalesMessage(null), 3000)
          }}
        />
      )}
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Database className="w-6 h-6 text-accent-blue" />
              Obsidian Vault
            </h1>
            <p className="text-text-secondary mt-1">
              Browse, search, and sync your research notes
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {salesMessage && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                {salesMessage}
              </span>
            )}
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button 
              onClick={() => setShowPasteSalesModal(true)}
              className="btn-primary bg-blue-600 hover:bg-blue-500 flex items-center gap-2"
              title="Paste raw text with multiple sales"
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste Sales
            </button>
            <button 
              onClick={() => setShowSalesModal(true)}
              className="btn-primary bg-green-600 hover:bg-green-500 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Post Sale
            </button>
            <button 
              onClick={() => setShowNewNoteModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-text-muted text-sm">Total Notes</p>
            <p className="text-3xl font-bold text-text-primary mt-1">
              {graphStats.totalNotes.toLocaleString()}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Total Links</p>
            <p className="text-3xl font-bold text-text-primary mt-1">
              {graphStats.totalLinks.toLocaleString()}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Orphan Notes</p>
            <p className="text-3xl font-bold text-accent-yellow mt-1">
              {graphStats.orphanNotes}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-text-muted text-sm">Last Modified</p>
            <p className="text-lg font-bold text-text-primary mt-1">
              {lastSync}
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Vault Browser */}
          <div className="lg:col-span-1">
            <VaultBrowser 
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
          
          {/* Center: Note Preview */}
          <div className="lg:col-span-1">
            <NotePreview 
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onExport={(file) => {
                // Download the note as markdown
                const content = `# ${file.name}\n\nExported from Mission Control NERVE\n`
                const blob = new Blob([content], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = file.name
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            />
          </div>
          
          {/* Right: Sync Status & Recent */}
          <div className="lg:col-span-1 space-y-6">
            <SyncStatus onSync={handleSync} syncing={syncing} />
            
            {/* Recent Notes */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary">Recent Notes</h3>
                <button className="text-sm text-accent-red hover:underline">
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentNotes.map((note, i) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedFile({ 
                      id: note.name, 
                      name: note.name, 
                      modified: note.date,
                      size: '12.4 KB'
                    })}
                    className="p-3 rounded-lg bg-bg-input hover:bg-bg-card cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary font-medium">{note.name}</span>
                      <span className="text-xs text-text-muted">{note.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {note.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded bg-accent-red/10 text-accent-red text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="card p-5">
              <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleOpenObsidian}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-bg-input hover:bg-bg-card transition-colors text-left"
                >
                  <FolderOpen className="w-5 h-5 text-accent-blue" />
                  <div>
                    <p className="text-sm text-text-primary">Open in Obsidian</p>
                    <p className="text-xs text-text-muted">Launch desktop app</p>
                  </div>
                </button>
                <button 
                  onClick={handleGlobalSearch}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-bg-input hover:bg-bg-card transition-colors text-left"
                >
                  <Search className="w-5 h-5 text-accent-green" />
                  <div>
                    <p className="text-sm text-text-primary">Global Search</p>
                    <p className="text-xs text-text-muted">Search all notes</p>
                  </div>
                </button>
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-bg-input hover:bg-bg-card transition-colors text-left"
                >
                  <SettingsIcon className="w-5 h-5 text-accent-yellow" />
                  <div>
                    <p className="text-sm text-text-primary">Vault Settings</p>
                    <p className="text-xs text-text-muted">Configure sync</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const NewNoteModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    folder: 'Research',
    content: '',
    tags: ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-accent-red" />
            Create New Note
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Note Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Welland Industrial Analysis"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Folder</label>
            <select 
              value={formData.folder}
              onChange={(e) => setFormData({...formData, folder: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            >
              <option value="Research">Research</option>
              <option value="Deals">Deals</option>
              <option value="Buyers">Buyers</option>
              <option value="Templates">Templates</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g., deal, industrial, welland"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Content</label>
            <textarea
              rows={6}
              placeholder="# Note content..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PasteSalesModal = ({ onClose, onSuccess }) => {
  const [rawText, setRawText] = useState('')
  const [parsedTransactions, setParsedTransactions] = useState([])
  const [parsing, setParsing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiEnrich, setAiEnrich] = useState(true)
  const [enriching, setEnriching] = useState(false)
  const [enrichedDeals, setEnrichedDeals] = useState([])
  const [activeTab, setActiveTab] = useState('parsed') // 'parsed' or 'enriched'
  
  const handleParse = async () => {
    if (!rawText.trim()) return
    
    setParsing(true)
    try {
      // If AI enrich is enabled, use the enrich endpoint
      if (aiEnrich) {
        setEnriching(true)
        const response = await fetch('/api/transactions/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawText })
        })
        
        if (response.ok) {
          const data = await response.json()
          setParsedTransactions(data.transactions || [])
          setEnrichedDeals(data.enriched || [])
          setActiveTab('enriched')
        }
      } else {
        // Just parse without enrichment
        const response = await fetch('/api/transactions/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawText })
        })
        
        if (response.ok) {
          const data = await response.json()
          setParsedTransactions(data.transactions || [])
          setActiveTab('parsed')
        }
      }
    } catch (err) {
      console.error('Error parsing:', err)
    } finally {
      setParsing(false)
      setEnriching(false)
    }
  }
  
  const handleSubmit = async () => {
    if (parsedTransactions.length === 0) return
    
    setSubmitting(true)
    try {
      // Save to database
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedTransactions)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // If enriched deals exist, save them to Obsidian
        if (enrichedDeals.length > 0) {
          await fetch('/api/obsidian/save-deals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deals: enrichedDeals })
          })
        }
        
        onSuccess(`Posted ${result.count} sales to database + Obsidian!`)
        onClose()
      } else {
        alert('Failed to post sales')
      }
    } catch (err) {
      console.error('Error posting:', err)
      alert('Error posting sales')
    } finally {
      setSubmitting(false)
    }
  }
  
  const formatPrice = (price) => {
    return '$' + price.toLocaleString()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-blue-500" />
            Paste Multiple Sales
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Input */}
          <div className="w-1/2 p-4 border-r border-border-subtle flex flex-col">
            <label className="block text-sm text-text-secondary mb-2">
              Paste Raw Text <span className="text-text-muted">(from land registry, reports, etc.)</span>
            </label>
            <textarea
              className="flex-1 w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs resize-none"
              placeholder={`Example format:
ASHBURN RD
COCHRANE ST
Whitby : Durham Region
27 Mar 2026      $36,656,000      

Transferor(s)
Brooklin Development General Partner Ltd

Transferee(s)
TF Brooklin South Developments Ltd

Site
Conc 6 - East Whitby,
Part Lots 27 & 28

55.25 acre

Consideration
cash: $36,656,000`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            
            {/* AI Enrich Toggle */}
            <div className="mt-3 flex items-center justify-between p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-text-primary">AI Research & Enrich</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnrich}
                  onChange={(e) => setAiEnrich(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {aiEnrich 
                ? "AI will search the web for property details, market data, and create rich Obsidian notes" 
                : "Parse only basic deal info without web research"}
            </p>
            
            <button 
              onClick={handleParse}
              disabled={!rawText.trim() || parsing || enriching}
              className="mt-3 btn-primary bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {(parsing || enriching) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {enriching ? 'Researching with AI...' : parsing ? 'Parsing...' : aiEnrich ? 'Parse & Research' : 'Parse Sales'}
            </button>
          </div>
          
          {/* Right: Preview */}
          <div className="w-1/2 p-4 flex flex-col bg-bg-card">
            {/* Tabs */}
            {enrichedDeals.length > 0 && (
              <div className="flex items-center gap-1 mb-3 bg-bg-input rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('parsed')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === 'parsed' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Basic ({parsedTransactions.length})
                </button>
                <button
                  onClick={() => setActiveTab('enriched')}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    activeTab === 'enriched' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  AI Enriched ({enrichedDeals.length})
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text-primary">
                {activeTab === 'enriched' ? 'AI-Researched Deals' : 'Parsed Sales'} 
                ({activeTab === 'enriched' ? enrichedDeals.length : parsedTransactions.length})
              </h4>
              {parsedTransactions.length > 0 && (
                <span className="text-sm text-green-400">
                  Total: {formatPrice(parsedTransactions.reduce((sum, t) => sum + (t.sale_price || 0), 0))}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {parsedTransactions.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  <ClipboardPaste className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Paste text and click "Parse Sales"</p>
                  <p className="text-xs mt-1">
                    {aiEnrich 
                      ? "AI will research each property online and create rich Obsidian notes" 
                      : "The system will extract property details, prices, sellers, and buyers"}
                  </p>
                </div>
              ) : activeTab === 'enriched' && enrichedDeals.length > 0 ? (
                // Show enriched deals
                enrichedDeals.map((deal, i) => (
                  <div key={i} className="p-3 bg-gradient-to-r from-purple-900/30 to-slate-800/50 rounded-lg border border-purple-500/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <p className="font-semibold text-white">{deal.property_address || deal.address}</p>
                        </div>
                        <p className="text-sm text-emerald-400 font-medium mt-1">{deal.price}</p>
                        {deal.research_summary && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-3">{deal.research_summary}</p>
                        )}
                        {deal.key_findings && deal.key_findings.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deal.key_findings.slice(0, 3).map((finding, fidx) => (
                              <span key={fidx} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                {finding}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Show basic parsed deals
                parsedTransactions.map((tx, i) => (
                  <div key={i} className="p-3 bg-bg-input rounded-lg border border-border-subtle">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{tx.property_address}</p>
                        <p className="text-sm text-text-secondary">{tx.city} • {tx.sale_date}</p>
                        <p className="text-xs text-text-muted mt-1 truncate">Seller: {tx.seller_name}</p>
                        {tx.buyer_name && (
                          <p className="text-xs text-text-muted truncate">Buyer: {tx.buyer_name}</p>
                        )}
                        {tx.notes && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">{tx.notes}</p>
                        )}
                      </div>
                      <div className="ml-3 text-right">
                        <p className="font-bold text-green-400">{formatPrice(tx.sale_price)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {parsedTransactions.length > 0 && (
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-3 btn-primary bg-green-600 hover:bg-green-500 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Posting...' : `Post ${parsedTransactions.length} Sales`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PostSalesModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    seller_name: '',
    buyer_name: '',
    property_address: '',
    city: '',
    province: 'ON',
    sale_price: '',
    property_type: 'Commercial',
    asset_class: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sale_price: parseInt(formData.sale_price.replace(/[^0-9]/g, ''))
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        onSuccess('Sale posted successfully!')
        onClose()
      } else {
        alert('Failed to post sale')
      }
    } catch (err) {
      console.error('Error posting sale:', err)
      alert('Error posting sale')
    } finally {
      setSubmitting(false)
    }
  }
  
  const formatPrice = (value) => {
    const num = value.replace(/[^0-9]/g, '')
    if (!num) return ''
    return '$' + parseInt(num).toLocaleString()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Post New Sale
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Seller Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., ABC Holdings Ltd"
                value={formData.seller_name}
                onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Buyer Name</label>
              <input
                type="text"
                placeholder="e.g., XYZ Investments Inc"
                value={formData.buyer_name}
                onChange={(e) => setFormData({...formData, buyer_name: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Property Address *</label>
            <input
              type="text"
              required
              placeholder="e.g., 123 Main Street"
              value={formData.property_address}
              onChange={(e) => setFormData({...formData, property_address: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">City</label>
              <input
                type="text"
                placeholder="e.g., Toronto"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Province</label>
              <select 
                value={formData.province}
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="ON">Ontario</option>
                <option value="BC">British Columbia</option>
                <option value="AB">Alberta</option>
                <option value="QC">Quebec</option>
                <option value="MB">Manitoba</option>
                <option value="SK">Saskatchewan</option>
                <option value="NS">Nova Scotia</option>
                <option value="NB">New Brunswick</option>
                <option value="NL">Newfoundland</option>
                <option value="PE">PEI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Sale Price *</label>
              <input
                type="text"
                required
                placeholder="$2,500,000"
                value={formatPrice(formData.sale_price)}
                onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Property Type</label>
              <select 
                value={formData.property_type}
                onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              >
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Retail">Retail</option>
                <option value="Office">Office</option>
                <option value="Multi-Family">Multi-Family</option>
                <option value="Land">Land</option>
                <option value="Mixed-Use">Mixed-Use</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Asset Class</label>
              <input
                type="text"
                placeholder="e.g., Office Building"
                value={formData.asset_class}
                onChange={(e) => setFormData({...formData, asset_class: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Sale Date</label>
              <input
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-secondary mb-2">Notes</label>
            <textarea
              rows={3}
              placeholder="Additional details about the sale..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="btn-primary bg-green-600 hover:bg-green-500 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting ? 'Posting...' : 'Post Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SettingsModal = ({ onClose }) => {
  const [settings, setSettings] = useState({
    vaultPath: '~/Documents/BDAIV2',
    autoSync: true,
    syncInterval: 5,
    notifications: true,
    backupEnabled: true
  })
  
  const handleSave = () => {
    // Save settings
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-accent-red" />
            Vault Settings
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-input rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Vault Path</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.vaultPath}
                onChange={(e) => setSettings({...settings, vaultPath: e.target.value})}
                className="flex-1 bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
              <button className="p-2 rounded-lg bg-bg-input hover:bg-bg-card transition-colors">
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">Auto-sync</span>
              <input 
                type="checkbox" 
                checked={settings.autoSync}
                onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                className="w-4 h-4 rounded border-border-subtle bg-bg-input"
              />
            </label>
          </div>
          
          {settings.autoSync && (
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Sync Interval (minutes)
              </label>
              <input 
                type="number" 
                min="1" 
                max="60"
                value={settings.syncInterval}
                onChange={(e) => setSettings({...settings, syncInterval: parseInt(e.target.value)})}
                className="w-full bg-bg-input border border-border-subtle rounded-lg px-3 py-2"
              />
            </div>
          )}
          
          <div>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">Enable notifications</span>
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="w-4 h-4 rounded border-border-subtle bg-bg-input"
              />
            </label>
          </div>
          
          <div>
            <label className="flex items-center justify-between py-2">
              <span className="text-sm">Enable backups</span>
              <input 
                type="checkbox" 
                checked={settings.backupEnabled}
                onChange={(e) => setSettings({...settings, backupEnabled: e.target.checked})}
                className="w-4 h-4 rounded border-border-subtle bg-bg-input"
              />
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border-subtle">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default ObsidianVault
