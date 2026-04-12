import React, { useState } from 'react'
import { 
  Building2, Search, Mail, Phone, Linkedin, 
  Users, Hammer, Landmark, Handshake, Tag,
  DollarSign, MapPin, Loader2, Sparkles, ArrowRight, FileText,
  X, Crown, LayoutGrid, List as ListIcon, Copy, Download, Flame
} from 'lucide-react'
import { API_BASE } from '../config/api'

const categories = [
  { key: 'buyers', label: 'Buyers', icon: DollarSign },
  { key: 'sellers', label: 'Sellers', icon: Tag },
  { key: 'brokers', label: 'Brokers', icon: Handshake },
  { key: 'lenders', label: 'Lenders', icon: Landmark },
  { key: 'builders', label: 'Builders', icon: Hammer },
  { key: 'opportunities', label: 'Opportunities', icon: Flame },
]

const tierColors = {
  A: 'bg-accent-green/20 text-accent-green border-accent-green/40',
  B: 'bg-accent-blue/20 text-accent-blue border-accent-blue/40',
  C: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/40',
  Distress: 'bg-accent-red/20 text-accent-red border-accent-red/40',
}

const PropertyMatcher = () => {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('buyers')
  const [error, setError] = useState(null)
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportEmail, setReportEmail] = useState('')
  const [sendingReport, setSendingReport] = useState(false)
  const [reportStatus, setReportStatus] = useState(null)
  
  // View mode for rapid LinkedIn connection sessions
  const [viewMode, setViewMode] = useState('grid')
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/matcher/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      const opp = data.matches?.opportunities || []
      if (data.is_distress_query && opp.length > 0) {
        setActiveTab('opportunities')
      } else {
        setActiveTab('buyers')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const sendReport = async () => {
    if (!reportEmail.trim() || !result) return
    setSendingReport(true)
    setReportStatus(null)
    try {
      const res = await fetch(`${API_BASE}/api/matcher/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reportEmail, report_data: result })
      })
      const data = await res.json()
      if (data.success) {
        setReportStatus({ type: 'success', message: data.message })
        setTimeout(() => { setShowReportModal(false); setReportStatus(null); setReportEmail(''); }, 1500)
      } else {
        setReportStatus({ type: 'error', message: data.error || 'Failed to queue report.' })
      }
    } catch (e) {
      setReportStatus({ type: 'error', message: e.message })
    } finally {
      setSendingReport(false)
    }
  }

  const copyLinkedInUrls = () => {
    if (!items.length) return
    const urls = items
      .map(i => i.actions?.linkedin)
      .filter(Boolean)
    navigator.clipboard.writeText(urls.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const openAllLinkedIn = () => {
    if (!items.length) return
    const urls = items
      .map(i => i.actions?.linkedin)
      .filter(Boolean)
      .slice(0, 12)
    urls.forEach((url, i) => {
      setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), i * 250)
    })
  }

  const exportCSV = () => {
    if (!result) return
    const rows = []
    const allCategories = categories
    allCategories.forEach(cat => {
      const catItems = result.matches?.[cat.key] || []
      catItems.forEach(item => {
        rows.push({
          category: cat.label,
          name: item.name || '',
          company: item.company || '',
          city: item.city || '',
          linkedin: item.actions?.linkedin || '',
          google_person: item.actions?.google_linkedin_person || '',
          google_executive: item.actions?.google_linkedin_executive || '',
          why: item.why || item.investment_thesis || item.motive || ''
        })
      })
    })
    if (!rows.length) return
    const headers = ['Category','Name','Company','City','LinkedIn','Google_Person','Google_Executive','Why']
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h.toLowerCase()] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `linkedin-connections-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const extracted = result?.extracted || {}
  const tier = result?.tier || 'B'
  const items = result?.matches?.[activeTab] || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Building2 className="w-7 h-7 text-accent-blue" />
            Property Matcher
          </h1>
          <p className="text-text-muted mt-1">
            Describe a property in plain text. Our local LLM extracts the details and surfaces the perfect network of buyers, sellers, brokers, lenders & builders.
          </p>
        </div>
        {result && (
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-card border border-border-subtle hover:border-accent-purple text-text-primary rounded-lg font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Report
            <span className="ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-purple/20 text-accent-purple text-[10px] font-bold">
              <Crown className="w-3 h-3" /> PRO
            </span>
          </button>
        )}
      </div>

      {/* Input Card */}
      <div className="bg-bg-card border border-border-subtle rounded-xl p-5">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Property description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 12-acre industrial parcel in Thorold, ON. Zoned employment. Asking $4.2M. Needs environmental phase II."
          className="w-full min-h-[120px] bg-bg-primary border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue resize-y"
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-muted">Powered by Kimi Code — instant extraction + smart matching</span>
          <button
            onClick={analyze}
            disabled={loading || !description.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze Property</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-lg px-4 py-3 text-sm">
          Error: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Extracted Bar */}
          <div className="bg-gradient-to-r from-accent-blue/10 to-accent-purple/5 border border-accent-blue/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Asset', value: extracted.asset_class },
                { label: 'Type', value: extracted.property_type },
                { label: 'Size', value: extracted.size },
                { label: 'Price', value: extracted.price_hint },
                { label: 'Condition', value: extracted.condition },
                { label: 'Urgency', value: extracted.urgency },
              ].map((p) => (
                p.value ? (
                  <span key={p.label} className="px-2.5 py-1 rounded-full bg-bg-input border border-border-subtle text-xs text-text-secondary">
                    {p.label}: <span className="text-text-primary font-medium">{p.value}</span>
                  </span>
                ) : null
              ))}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierColors[tier] || tierColors.B}`}>
              Tier {tier}
            </span>
          </div>

          {extracted.investment_thesis && (
            <p className="text-sm text-text-muted">{extracted.investment_thesis}</p>
          )}

          {/* Funnel Message */}
          <div className="flex items-start gap-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg px-4 py-3">
            <Linkedin className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">Your matches = your targeted network.</p>
              <p className="text-xs text-text-muted">Connect on LinkedIn → build audience → post for engagement. These are real buyers & sellers matched to this deal.</p>
            </div>
          </div>

          {/* Tabs + Tools */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const count = result?.matches?.[c.key]?.length || 0
                const isActive = activeTab === c.key
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveTab(c.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                        : 'bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted'
                    }`}
                  >
                    <c.icon className="w-4 h-4" />
                    {c.label}
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-accent-blue/20 text-accent-blue' : 'bg-bg-input text-text-muted'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
              >
                {viewMode === 'grid' ? <><ListIcon className="w-4 h-4" /> List</> : <><LayoutGrid className="w-4 h-4" /> Grid</>}
              </button>
              {items.length > 0 && (
                <>
                  <button
                    onClick={openAllLinkedIn}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors shadow-sm"
                  >
                    <Linkedin className="w-4 h-4" /> Open All LinkedIn
                  </button>
                  <button
                    onClick={copyLinkedInUrls}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                  >
                    <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Links'}
                  </button>
                </>
              )}
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 transition-colors"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Matches */}
          {items.length === 0 ? (
            <div className="bg-bg-card border border-border-subtle rounded-xl p-10 text-center text-text-muted text-sm">
              No matches found for this category.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item, idx) => (
                <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-text-muted/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">{item.name}</h3>
                      <p className="text-xs text-text-muted truncate">
                        {item.company || item.city || item.motive || item.specialty || item.address || ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {item.recent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/10 text-accent-green border border-accent-green/20 whitespace-nowrap">
                          Recent 90d
                        </span>
                      )}
                      {typeof item.propensity === 'number' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-purple/10 text-accent-purple border border-accent-purple/20 whitespace-nowrap">
                          {item.propensity}% Likely
                        </span>
                      )}
                      {item.urgency && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                          item.urgency === 'High' ? 'bg-accent-red/10 text-accent-red border-accent-red/20' :
                          item.urgency === 'Medium' ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' :
                          'bg-bg-input text-text-muted border-border-subtle'
                        }`}>
                          {item.urgency} Urgency
                        </span>
                      )}
                      {item.score && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/10 text-accent-blue border border-accent-blue/20 whitespace-nowrap">
                          Match {item.score}%
                        </span>
                      )}
                    </div>
                  </div>

                  {(item.why || item.investment_thesis) && (
                    <p className="text-xs text-text-secondary leading-relaxed mb-3 border-t border-border-subtle/50 pt-2">
                      {item.why || item.investment_thesis}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {item.actions?.linkedin && (
                      <a href={item.actions.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-accent-blue text-white text-[11px] font-medium hover:bg-accent-blue/90 transition-colors shadow-sm">
                        <Linkedin className="w-3.5 h-3.5" /> Connect
                      </a>
                    )}
                    {item.actions?.google_linkedin_person && (
                      <a href={item.actions.google_linkedin_person} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Search className="w-3 h-3" /> Find Person
                      </a>
                    )}
                    {item.actions?.google_linkedin_executive && (
                      <a href={item.actions.google_linkedin_executive} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Search className="w-3 h-3" /> Find Execs
                      </a>
                    )}
                    {item.actions?.google_company && (
                      <a href={item.actions.google_company} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Search className="w-3 h-3" /> Find Company
                      </a>
                    )}
                    {activeTab === 'brokers' && item.actions?.google_realtor && (
                      <a href={item.actions.google_realtor} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Search className="w-3 h-3" /> Google + Realtor
                      </a>
                    )}
                    {item.actions?.email && (
                      <a href={item.actions.email} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Mail className="w-3 h-3" /> Email
                      </a>
                    )}
                    {item.actions?.phone && (
                      <a href={item.actions.phone} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-input border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg-input border-b border-border-subtle">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">City</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">LinkedIn</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Google</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-bg-input/30">
                      <td className="px-4 py-3 text-text-primary font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-text-muted">{item.company || '—'}</td>
                      <td className="px-4 py-3 text-text-muted">{item.city || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {typeof item.propensity === 'number' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                              {item.propensity}%
                            </span>
                          )}
                          {item.urgency && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.urgency === 'High' ? 'bg-accent-red/10 text-accent-red border-accent-red/20' :
                              item.urgency === 'Medium' ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' :
                              'bg-bg-input text-text-muted border-border-subtle'
                            }`}>
                              {item.urgency}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.actions?.linkedin ? (
                          <a href={item.actions.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-accent-blue text-white text-xs font-medium hover:bg-accent-blue/90">
                            <Linkedin className="w-3.5 h-3.5" /> Connect
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3">
                          {item.actions?.google_linkedin_person && (
                            <a href={item.actions.google_linkedin_person} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs">
                              <Search className="w-3.5 h-3.5" /> Person
                            </a>
                          )}
                          {item.actions?.google_linkedin_executive && (
                            <a href={item.actions.google_linkedin_executive} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs">
                              <Search className="w-3.5 h-3.5" /> Execs
                            </a>
                          )}
                          {item.actions?.google_company && (
                            <a href={item.actions.google_company} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs">
                              <Search className="w-3.5 h-3.5" /> Company
                            </a>
                          )}
                          {activeTab === 'brokers' && item.actions?.google_realtor && (
                            <a href={item.actions.google_realtor} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs">
                              <Search className="w-3.5 h-3.5" /> Realtor
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border-subtle rounded-xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-purple" />
                Generate Report
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent-purple/20 text-accent-purple text-[10px] font-bold">
                <Crown className="w-3 h-3" /> PRO
              </span>
            </div>
            
            <p className="text-sm text-text-muted mb-4">
              Email a complete Property Matcher report including extracted details, tier analysis, and all matched contacts.
            </p>
            
            <label className="block text-sm font-medium text-text-secondary mb-2">Email address</label>
            <input
              type="email"
              value={reportEmail}
              onChange={(e) => setReportEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
            />
            
            {reportStatus && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${reportStatus.type === 'success' ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                {reportStatus.message}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendReport}
                disabled={sendingReport || !reportEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {sendingReport ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Mail className="w-4 h-4" /> Send Report</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyMatcher
