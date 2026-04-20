import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  Tag,
  Calendar,
  Bot,
  User,
  AlertCircle,
  X,
  Copy,
  Check,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function ContextKeepView() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (tagFilter) params.append('tag', tagFilter)
      params.append('limit', '100')
      const res = await fetch(`${API_BASE}/api/contextkeep?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRecords(data.records || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, tagFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const deleteRecord = async (id) => {
    if (!confirm('Delete this record?')) return
    try {
      const res = await fetch(`${API_BASE}/api/contextkeep/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const copyContent = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const allTags = Array.from(
    new Set(records.flatMap((r) => r.tags || []))
  ).sort()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-accent-primary" />
            ContextKeep
          </h1>
          <p className="text-text-muted mt-1">
            Persistent memory store — everything you and your agents save lives here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRecords}
            disabled={loading}
            className="p-2 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-primary/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-9 pr-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-accent-primary"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-accent-primary"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-text-muted">
          {records.length} record{records.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent-red" />
          <p className="text-sm text-accent-red">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record List */}
        <div className="lg:col-span-1 space-y-3">
          {loading && records.length === 0 && (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading records...</span>
            </div>
          )}

          {!loading && records.length === 0 && (
            <div className="text-center py-12 text-text-muted bg-bg-card border border-border-subtle rounded-xl">
              <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No records yet.</p>
              <p className="text-xs mt-1">Say "context keep" to an agent and it will appear here.</p>
            </div>
          )}

          {records.map((record) => (
            <button
              key={record.id}
              onClick={() => setSelected(record)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === record.id
                  ? 'bg-accent-primary/5 border-accent-primary/30'
                  : 'bg-bg-card border-border-subtle hover:border-accent-primary/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {record.source === 'agent' ? (
                    <Bot className="w-4 h-4 text-accent-purple" />
                  ) : (
                    <User className="w-4 h-4 text-accent-primary" />
                  )}
                  <span className="text-sm font-medium text-text-primary truncate">
                    {record.topic || 'Untitled'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteRecord(record.id)
                  }}
                  className="p-1 hover:bg-accent-red/10 rounded text-text-muted hover:text-accent-red transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2 line-clamp-2">
                {record.content}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {record.tags?.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-bg-input rounded text-text-muted flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {t}
                  </span>
                ))}
                <span className="text-[10px] text-text-muted ml-auto flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(record.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selected.source === 'agent' ? (
                      <Bot className="w-4 h-4 text-accent-purple" />
                    ) : (
                      <User className="w-4 h-4 text-accent-primary" />
                    )}
                    <span className="text-xs text-text-muted capitalize">{selected.source}</span>
                    {selected.agent_id && (
                      <span className="text-xs text-text-muted">· {selected.agent_id}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {selected.topic || 'Untitled Record'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyContent(selected.content)}
                    className="px-3 py-1.5 bg-bg-input hover:bg-border-subtle rounded-lg text-xs text-text-secondary transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="bg-bg-input rounded-xl p-4 border border-border-subtle">
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {selected.content}
                </p>
              </div>

              {selected.related_sheet_id && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-accent-primary" />
                  <span className="text-text-muted">Linked sheet:</span>
                  <span className="text-text-primary font-mono text-xs">{selected.related_sheet_id}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-text-muted pt-2 border-t border-border-subtle">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {new Date(selected.created_at).toLocaleString()}</span>
                <span className="ml-auto">ID: {selected.id}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-bg-card border border-border-subtle rounded-2xl text-text-muted">
              <div className="text-center">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a record to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
