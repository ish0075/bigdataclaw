import React, { useState, useMemo } from 'react'
import {
  Search, Building2, DollarSign, MapPin, TrendingUp,
  Phone, Mail, Globe, Linkedin, FileText, Download,
  Target, Flame, Users, Landmark, Briefcase, Activity,
  ChevronRight, Star, ArrowUpRight, Layers, Send,
  BarChart3, Home, Warehouse, Store, LandPlot,
  Calendar, CheckCircle, Check, ExternalLink, X, Loader2, Copy, Zap, AlertCircle, MessageSquare, User
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const ASSET_TYPES = [
  { label: 'Office', icon: Building2 },
  { label: 'Industrial', icon: Warehouse },
  { label: 'Retail', icon: Store },
  { label: 'Multifamily', icon: Home },
  { label: 'Hotel', icon: LandPlot },
  { label: 'Land', icon: LandPlot },
  { label: 'Senior Living', icon: Home },
  { label: 'Mixed-Use', icon: Building2 },
]

const QUICK_LINK_ICONS = {
  google: { label: 'Google', color: 'bg-blue-500' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-600' },
  linkedin_president: { label: 'CEO Search', color: 'bg-sky-700' },
  news: { label: 'News', color: 'bg-amber-500' },
  key_people: { label: 'Key People', color: 'bg-purple-500' },
  website: { label: 'Website', color: 'bg-emerald-500' },
  loopnet: { label: 'LoopNet', color: 'bg-indigo-500' },
  contact_page: { label: 'Contact', color: 'bg-rose-500' },
}

const TIER_COLORS = {
  'Tier 1 (Call NOW)': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Tier 2 (Email + Feature Sheet)': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Tier 3 (Broker Network / Research)': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default function BuyerIntelligence() {
  const [form, setForm] = useState({
    property_type: 'Office',
    address: '',
    city: 'Mississauga',
    province: 'ON',
    size_sqft: 100000,
    price: 25000000,
    net_income: 1400000,
    cap_rate: 5.6,
    occupancy: 'stabilized',
    notes: 'Value-add potential near airport corridor',
    target_count: 25,
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('buyers')
  const [featureSheet, setFeatureSheet] = useState(null)
  const [featureSheetLoading, setFeatureSheetLoading] = useState(false)
  const [teaserEmail, setTeaserEmail] = useState(null)
  const [teaserEmailLoading, setTeaserEmailLoading] = useState(false)
  const [outreachPack, setOutreachPack] = useState(null)
  const [outreachPackLoading, setOutreachPackLoading] = useState(false)
  const [copiedTeaser, setCopiedTeaser] = useState(null)
  const [expandedPayload, setExpandedPayload] = useState(null)
  const [showInternalTeasers, setShowInternalTeasers] = useState(false)
  const [bucketFilter, setBucketFilter] = useState('All')
  const [batchCopied, setBatchCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setFeatureSheet(null)
    try {
      const res = await fetch(`${API_BASE}/api/buyer-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateFeatureSheet = async () => {
    setFeatureSheetLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/property-feature-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_type: form.property_type,
          address: form.address,
          city: form.city,
          province: form.province,
          size_sqft: form.size_sqft,
          price: form.price,
          net_income: form.net_income,
          cap_rate: form.cap_rate,
          occupancy: form.occupancy,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setFeatureSheet(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setFeatureSheetLoading(false)
    }
  }

  const generateTeaserEmail = async (recipientType = 'buyer') => {
    setTeaserEmailLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/buyer-intelligence/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_type: form.property_type,
          address: form.address,
          city: form.city,
          province: form.province,
          size_sqft: form.size_sqft,
          price: form.price,
          net_income: form.net_income,
          cap_rate: form.cap_rate,
          occupancy: form.occupancy,
          notes: form.notes,
          feature_sheet_url: featureSheet?.url || '',
          recipient_type: recipientType,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTeaserEmail(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setTeaserEmailLoading(false)
    }
  }

  const generateOutreachPack = async () => {
    setOutreachPackLoading(true)
    setOutreachPack(null)
    try {
      const res = await fetch(`${API_BASE}/api/outreach-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_type: form.property_type,
          address: form.address,
          city: form.city,
          province: form.province,
          size_sqft: form.size_sqft,
          price: form.price,
          net_income: form.net_income,
          cap_rate: form.cap_rate,
          occupancy: form.occupancy,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setOutreachPack(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setOutreachPackLoading(false)
    }
  }

  const copyTeaser = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopiedTeaser(label)
    setTimeout(() => setCopiedTeaser(null), 1500)
  }

  const copyPayload = (text, buyerName = '') => {
    navigator.clipboard.writeText(text)
    setCopiedTeaser('payload')
    setTimeout(() => setCopiedTeaser(null), 1500)
    // Log action
    if (outreachPack?.pack_id && buyerName) {
      fetch(`${API_BASE}/api/outreach-action/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_id: outreachPack.pack_id,
          buyer_name: buyerName,
          action: 'snippet_copied',
          channel: '',
          metadata: { source: 'buyer_intelligence_panel' },
        }),
      }).catch(() => {})
    }
  }

  const copyAllCallNow = async () => {
    if (!outreachPack?.assets?.buyer_outreach_payloads) return
    const callNow = outreachPack.assets.buyer_outreach_payloads.filter(p => p.bucket === 'Call Now')
    if (!callNow.length) return
    const combined = callNow.map(p => `--- ${p.buyer_name} (${p.recommended_channel}) ---\n${p.personalized_snippet}`).join('\n\n')
    await navigator.clipboard.writeText(combined)
    setBatchCopied(true)
    setTimeout(() => setBatchCopied(false), 2000)
    fetch(`${API_BASE}/api/outreach-action/batch-export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: outreachPack.pack_id, bucket_filter: 'Call Now', format: 'text' }),
    }).catch(() => {})
  }

  const copyAllSendTeaser = async () => {
    if (!outreachPack?.assets?.buyer_outreach_payloads) return
    const teasers = outreachPack.assets.buyer_outreach_payloads.filter(p => p.bucket === 'Send Teaser')
    if (!teasers.length) return
    const combined = teasers.map(p => `--- ${p.buyer_name} (${p.recommended_channel}) ---\n${p.personalized_snippet}`).join('\n\n')
    await navigator.clipboard.writeText(combined)
    setBatchCopied(true)
    setTimeout(() => setBatchCopied(false), 2000)
    fetch(`${API_BASE}/api/outreach-action/batch-export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: outreachPack.pack_id, bucket_filter: 'Send Teaser', format: 'text' }),
    }).catch(() => {})
  }

  const exportOutreachBatch = async (bucket) => {
    if (!outreachPack?.assets?.buyer_outreach_payloads) return
    const filtered = bucket === 'All'
      ? outreachPack.assets.buyer_outreach_payloads
      : outreachPack.assets.buyer_outreach_payloads.filter(p => p.bucket === bucket)
    const exportData = {
      pack_id: outreachPack.pack_id,
      generated_at: new Date().toISOString(),
      bucket_filter: bucket,
      count: filtered.length,
      payloads: filtered.map(p => ({
        buyer_name: p.buyer_name,
        bucket: p.bucket,
        score: p.score,
        channel: p.recommended_channel,
        signal: p.buyer_reason_signal,
        snippet: p.personalized_snippet,
        quick_links: p.quick_links,
      })),
    }
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
    setBatchCopied(true)
    setTimeout(() => setBatchCopied(false), 2000)
    fetch(`${API_BASE}/api/outreach-action/batch-export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pack_id: outreachPack.pack_id,
        bucket_filter: bucket,
        format: 'json',
      }),
    }).catch(() => {})
  }

  const tabs = useMemo(() => {
    if (!report) return []
    return [
      { key: 'buyers', label: `Ranked Buyers (${report.summary.hot_money_buyers_found + report.summary.registered_buyers_found})`, icon: Target },
      { key: 'sellers', label: `Sellers With Capital (${report.summary.sellers_with_capital_found})`, icon: Flame },
      { key: 'lenders', label: `Lenders (${report.summary.lenders_found})`, icon: Landmark },
      { key: 'agents', label: `Agents (${report.summary.agents_found})`, icon: Briefcase },
      { key: 'deals', label: `Comps (${report.summary.comparable_deals_found})`, icon: Activity },
      { key: 'outreach', label: `Outreach List`, icon: Send },
    ]
  }, [report])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-accent-purple" />
            Buyer Intelligence & Outreach Pack
          </h1>
          <p className="text-text-muted mt-1">
            Find who has the money, who just sold, and how to reach them — in 30 seconds.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent-primary" />
          Subject Property
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Asset Type */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Asset Type</label>
            <select
              value={form.property_type}
              onChange={(e) => setForm({ ...form, property_type: e.target.value })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.label} value={t.label}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="Mississauga"
            />
          </div>

          {/* Province */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Province</label>
            <input
              type="text"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
              placeholder="ON"
            />
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Size (SF)</label>
            <input
              type="number"
              value={form.size_sqft}
              onChange={(e) => setForm({ ...form, size_sqft: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Price ($)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* NOI */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Net Operating Income ($)</label>
            <input
              type="number"
              value={form.net_income}
              onChange={(e) => setForm({ ...form, net_income: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Cap Rate */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Cap Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.cap_rate}
              onChange={(e) => setForm({ ...form, cap_rate: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>

          {/* Target Count */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Target Results</label>
            <input
              type="number"
              value={form.target_count}
              onChange={(e) => setForm({ ...form, target_count: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="text-xs text-text-muted mb-1.5 block">Notes / Investment Thesis</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-primary resize-none"
            placeholder="Value-add potential, airport corridor, etc."
          />
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Generating Intelligence...' : 'Generate Buyer Intelligence'}
          </button>
          {report && (
            <button
              onClick={() => setReport(null)}
              className="px-4 py-2.5 bg-bg-input hover:bg-bg-card border border-border-subtle rounded-xl text-text-secondary text-sm transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 text-sm text-accent-red bg-accent-red/5 border border-accent-red/20 rounded-lg px-3 py-2">
            Error: {error}
          </div>
        )}
      </div>

      {/* Report */}
      {report && (
        <div className="space-y-6">
          {/* Property Card */}
          <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  {report.subject_property.property_type} — {report.subject_property.city}
                </h3>
                <p className="text-text-muted text-sm mt-1">{report.subject_property.notes}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent-primary">
                  ${(report.subject_property.price / 1_000_000).toFixed(1)}M
                </p>
                <p className="text-xs text-text-muted">
                  {report.subject_property.size_sqft?.toLocaleString()} SF · {report.subject_property.cap_rate}% cap
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border-subtle/50">
              <div>
                <p className="text-xs text-text-muted">Total Buyer Capacity</p>
                <p className="text-lg font-semibold text-text-primary">
                  ${(report.summary.estimated_total_buyer_capacity / 1_000_000_000).toFixed(1)}B
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Buyers Found</p>
                <p className="text-lg font-semibold text-text-primary">
                  {report.summary.hot_money_buyers_found + report.summary.registered_buyers_found}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Sellers With Capital</p>
                <p className="text-lg font-semibold text-text-primary">
                  {report.summary.sellers_with_capital_found}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Lenders + Agents</p>
                <p className="text-lg font-semibold text-text-primary">
                  {report.summary.lenders_found + report.summary.agents_found}
                </p>
              </div>
            </div>
          </div>

          {/* BUILD OUTREACH PACK — Primary Action */}
          <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-purple" />
                  Build Outreach Pack
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  One command: intelligence → feature sheet → teaser emails → tracking
                </p>
              </div>
              <button
                onClick={generateOutreachPack}
                disabled={outreachPackLoading}
                className="px-6 py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {outreachPackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {outreachPackLoading ? 'Building Pack...' : 'Build Outreach Pack'}
              </button>
            </div>

            {/* Phased Progress */}
            {outreachPackLoading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-purple" />
                  <span>Analyzing buyers, lenders, and agents...</span>
                </div>
              </div>
            )}
          </div>

          {/* Outreach Pack Result */}
          {outreachPack && (
            <div className="space-y-4">
              {/* Phase Status */}
              <div className="flex flex-wrap gap-2">
                {outreachPack.phases.map((phase, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      phase.status === 'complete'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : phase.status === 'error'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-bg-input text-text-muted border border-border-subtle'
                    }`}
                  >
                    {phase.status === 'complete' ? <CheckCircle className="w-3 h-3" /> : phase.status === 'error' ? <AlertCircle className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                    {phase.phase.replace('_', ' ')}
                  </span>
                ))}
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature Sheet */}
                {outreachPack.assets.feature_sheet && (
                  <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-accent-primary" />
                      <span className="text-sm font-medium text-text-primary">Feature Sheet</span>
                    </div>
                    <a
                      href={outreachPack.assets.feature_sheet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 w-full justify-center"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Feature Sheet
                    </a>
                  </div>
                )}

                {/* Buyers */}
                {outreachPack.assets.buyers && (
                  <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-accent-purple" />
                      <span className="text-sm font-medium text-text-primary">Top Buyers ({outreachPack.assets.buyers.length})</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {outreachPack.assets.buyers.slice(0, 5).map((buyer, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-text-primary">{buyer.name}</span>
                          <span className="text-text-muted">{buyer.score}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Buyer Outreach Payloads — Internal, Buyer-Centric */}
              {outreachPack.assets.buyer_outreach_payloads && outreachPack.assets.buyer_outreach_payloads.length > 0 && (
                <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-purple" />
                      <h4 className="text-sm font-medium text-text-primary">Buyer Outreach Payloads</h4>
                      <span className="text-[10px] px-1.5 py-0.5 bg-accent-purple/10 text-accent-purple rounded-full">
                        {outreachPack.assets.buyer_outreach_payloads.length} ready
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Internal Use</span>
                  </div>

                  {/* Bucket Summary + Batch Actions */}
                  <div className="px-4 py-3 border-b border-border-subtle bg-bg-input/30 space-y-3">
                    {/* Bucket counts */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(outreachPack.assets.bucket_summary || {}).map(([bucket, count]) => {
                        const color = bucket === 'Call Now' ? 'bg-green-500/10 text-green-400 border-green-500/20' : bucket === 'Send Teaser' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : bucket === 'Research First' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-bg-input text-text-muted border-border-subtle'
                        return (
                          <span key={bucket} className={`px-2 py-1 rounded-full text-[10px] font-medium border ${color}`}>
                            {bucket}: {count}
                          </span>
                        )
                      })}
                    </div>
                    {/* Filter + Batch actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-text-muted uppercase">Filter:</span>
                      {['All', 'Call Now', 'Send Teaser', 'Research First', 'Hold'].map(b => (
                        <button
                          key={b}
                          onClick={() => setBucketFilter(b)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                            bucketFilter === b
                              ? 'bg-accent-purple text-white'
                              : 'bg-bg-card hover:bg-border-subtle text-text-secondary'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <button
                        onClick={copyAllCallNow}
                        className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        {batchCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy All Call Now
                      </button>
                      <button
                        onClick={copyAllSendTeaser}
                        className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        {batchCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy All Send Teaser
                      </button>
                      <button
                        onClick={() => exportOutreachBatch(bucketFilter)}
                        className="px-3 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        {batchCopied ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                        Export {bucketFilter !== 'All' ? bucketFilter : 'All'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {outreachPack.assets.buyer_outreach_payloads
                      .filter(p => bucketFilter === 'All' || p.bucket === bucketFilter)
                      .slice(0, 12)
                      .map((payload, idx) => {
                        const isExpanded = expandedPayload === idx
                        const bucketColor = payload.bucket === 'Call Now' ? 'text-green-400 bg-green-500/10 border-green-500/20' : payload.bucket === 'Send Teaser' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : payload.bucket === 'Research First' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'bg-bg-input text-text-muted border-border-subtle'
                        const channelIcon = payload.recommended_channel === 'phone' ? <Phone className="w-3 h-3" /> : payload.recommended_channel === 'email' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />
                        return (
                          <div key={idx} className="border border-border-subtle rounded-xl overflow-hidden">
                            {/* Header */}
                            <div className="p-3 bg-bg-input/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-text-muted" />
                                  <span className="text-sm font-semibold text-text-primary">{payload.buyer_name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${bucketColor}`}>
                                    {payload.bucket}
                                  </span>
                                  {payload.signal_strength && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${payload.signal_strength === 'strong' ? 'bg-accent-purple/10 text-accent-purple' : payload.signal_strength === 'medium' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-input text-text-muted'}`}>
                                      {payload.signal_strength}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-muted">{payload.score}</span>
                                  {channelIcon}
                                </div>
                              </div>
                              {/* Why This Buyer — Right Now */}
                              <p className="mt-2 text-xs text-text-primary leading-relaxed">
                                {payload.buyer_reason_signal}
                              </p>
                              {/* Reason for Bucket */}
                              {payload.reason_for_bucket && (
                                <p className="mt-1.5 text-[10px] text-text-muted leading-relaxed italic">
                                  {payload.reason_for_bucket}
                                </p>
                              )}
                              {/* Quick Actions */}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => copyPayload(payload.personalized_snippet, payload.buyer_name)}
                                  className="px-2 py-1 bg-bg-card hover:bg-border-subtle rounded text-[10px] text-text-secondary transition-colors flex items-center gap-1"
                                >
                                  {copiedTeaser === 'payload' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  Copy Snippet
                                </button>
                                <button
                                  onClick={() => setExpandedPayload(isExpanded ? null : idx)}
                                  className="px-2 py-1 bg-bg-card hover:bg-border-subtle rounded text-[10px] text-text-secondary transition-colors"
                                >
                                  {isExpanded ? 'Hide Details' : 'Show Details'}
                                </button>
                              </div>
                            </div>
                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="p-3 border-t border-border-subtle space-y-2">
                                {payload.reason_signals && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(payload.reason_signals).map(([k, v]) => {
                                      if (!v) return null
                                      return (
                                        <span key={k} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted border border-border-subtle">
                                          {k.replace(/_/g, ' ')}: {v}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                                <div className="text-[10px] text-text-muted grid grid-cols-2 gap-2">
                                  <span>Confidence: {payload.identity_confidence}</span>
                                  <span>Channel: {payload.recommended_channel}</span>
                                  {payload.cash_amount > 0 && <span>Capacity: ${(payload.cash_amount / 1_000_000).toFixed(1)}M</span>}
                                  <span>Type: {payload.type}</span>
                                  {payload.contactability && <span>Contactable: {payload.contactability.score}/4</span>}
                                </div>
                                {payload.quick_links && payload.quick_links.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {payload.quick_links.map((link, li) => (
                                      <a
                                        key={li}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full hover:underline"
                                      >
                                        {link.label || link.type}
                                      </a>
                                    ))}
                                  </div>
                                )}
                                <div className="bg-bg-input p-2 rounded text-[11px] text-text-primary whitespace-pre-wrap">
                                  {payload.personalized_snippet}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Top Buyer Matches Summary */}
              {outreachPack.assets.top_buyer_matches && (
                <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-accent-primary" />
                    <h4 className="text-sm font-medium text-text-primary">Top Buyer Matches Summary</h4>
                  </div>
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {outreachPack.assets.top_buyer_matches}
                  </pre>
                </div>
              )}

              {/* External Teaser Emails */}
              {outreachPack.assets.teaser_buyer && (
                <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                    <h4 className="text-sm font-medium text-text-primary">External Teaser Emails</h4>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Property-Centric</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {['buyer', 'lender', 'broker'].map((type) => {
                      const teaser = outreachPack.assets[`teaser_${type}`]
                      if (!teaser) return null
                      return (
                        <div key={type} className="flex items-center justify-between p-3 bg-bg-input rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-text-primary capitalize">{type} Teaser</p>
                            <p className="text-xs text-text-muted truncate max-w-[300px]">{teaser.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyTeaser(teaser.text_body, `${type}-text`)}
                              className="px-3 py-1.5 bg-bg-card hover:bg-border-subtle rounded-lg text-xs text-text-secondary transition-colors flex items-center gap-1.5"
                            >
                              {copiedTeaser === `${type}-text` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              {copiedTeaser === `${type}-text` ? 'Copied' : 'Copy Text'}
                            </button>
                            <button
                              onClick={() => copyTeaser(teaser.html_preview, `${type}-html`)}
                              className="px-3 py-1.5 bg-bg-card hover:bg-border-subtle rounded-lg text-xs text-text-secondary transition-colors flex items-center gap-1.5"
                            >
                              {copiedTeaser === `${type}-html` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                              {copiedTeaser === `${type}-html` ? 'Copied' : 'Copy HTML'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pack ID Footer */}
              <div className="flex items-center justify-between text-xs text-text-muted px-2">
                <span>Pack ID: {outreachPack.pack_id}</span>
                <span>{outreachPack.assets.buyers?.length || 0} buyers · {outreachPack.assets.lenders?.length || 0} lenders · {outreachPack.assets.agents?.length || 0} agents</span>
              </div>
            </div>
          )}

          {/* One-Click Actions (legacy) */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(report.upsells).map(([key, upsell]) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'feature_sheet') generateFeatureSheet()
                  if (key === 'teaser_email') generateTeaserEmail('buyer')
                }}
                disabled={featureSheetLoading && key === 'feature_sheet'}
                className="px-4 py-2 bg-bg-card border border-border-subtle hover:border-accent-primary/30 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {key === 'feature_sheet' && (featureSheetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />)}
                {key === 'teaser_email' && <Send className="w-4 h-4" />}
                {key === 'outreach_package' && <Download className="w-4 h-4" />}
                {upsell.description}
              </button>
            ))}
          </div>

          {/* Feature Sheet Result */}
          {featureSheet && (
            <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Feature Sheet Ready</p>
                <p className="text-xs text-text-muted">ID: {featureSheet.id}</p>
              </div>
              <a
                href={featureSheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Feature Sheet
              </a>
            </div>
          )}

          {/* Teaser Email Result */}
          {teaserEmail && (
            <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Teaser Email Ready</p>
                  <p className="text-xs text-text-muted">{teaserEmail.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(teaserEmail.text_body)}
                    className="px-3 py-1.5 bg-bg-input hover:bg-border-subtle rounded-lg text-xs text-text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Text
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(teaserEmail.html_body)}
                    className="px-3 py-1.5 bg-bg-input hover:bg-border-subtle rounded-lg text-xs text-text-secondary transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    Copy HTML
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-text-muted mb-2">Preview:</p>
                <iframe
                  srcDoc={teaserEmail.html_body}
                  className="w-full h-64 rounded-lg border border-border-subtle bg-white"
                  title="Teaser Preview"
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                    : 'bg-bg-card border border-border-subtle text-text-muted hover:text-text-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'buyers' && <RankedBuyers buyers={report.ranked_buyers} />}
            {activeTab === 'sellers' && <SellersWithCapital sellers={report.sellers_with_capital} />}
            {activeTab === 'lenders' && <LendersList lenders={report.capable_lenders} />}
            {activeTab === 'agents' && <AgentsList agents={report.active_agents} />}
            {activeTab === 'deals' && <ComparableDeals deals={report.comparable_deals} />}
            {activeTab === 'outreach' && <OutreachList items={report.priority_outreach_list} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- SUB-COMPONENTS ----------

function ScoreBadge({ score }) {
  let color = 'bg-slate-500/10 text-slate-400'
  if (score >= 75) color = 'bg-red-500/10 text-red-400'
  else if (score >= 55) color = 'bg-amber-500/10 text-amber-400'
  else if (score >= 40) color = 'bg-emerald-500/10 text-emerald-400'
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${color}`}>
      {score}/100
    </span>
  )
}

function QuickLinks({ links }) {
  if (!links) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Object.entries(links).map(([key, url]) => {
        if (!url) return null
        const meta = QUICK_LINK_ICONS[key]
        if (!meta) return null
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-2 py-0.5 rounded text-[10px] text-white hover:opacity-80 transition-opacity ${meta.color}`}
          >
            {meta.label}
          </a>
        )
      })}
    </div>
  )
}

function RankedBuyers({ buyers }) {
  const [expandedBuyer, setExpandedBuyer] = useState(null)
  if (!buyers?.length) return <EmptyState message="No ranked buyers found. Try adjusting your criteria." />
  return (
    <div className="grid gap-3">
      {buyers.map((buyer, idx) => {
        const isExpanded = expandedBuyer === idx
        const hasReasonSignal = Boolean(buyer.buyer_reason_signal)
        const missingValidation = !hasReasonSignal || !buyer.quick_links || buyer.score === undefined
        return (
          <div key={idx} className={`bg-bg-card border rounded-xl p-4 hover:border-accent-primary/20 transition-colors ${missingValidation ? 'border-accent-red/30' : 'border-border-subtle'}`}>
            {/* Header: rank, name, score, capacity */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted w-6">#{idx + 1}</span>
                  <h4 className="font-semibold text-text-primary">{buyer.name}</h4>
                  <ScoreBadge score={buyer.score} />
                  {buyer.cash_amount > 0 && (
                    <span className="text-xs text-accent-primary bg-accent-primary/5 px-2 py-0.5 rounded">
                      ${(buyer.cash_amount / 1_000_000).toFixed(1)}M capacity
                    </span>
                  )}
                  {missingValidation && (
                    <span className="text-[10px] text-accent-red bg-accent-red/10 px-2 py-0.5 rounded border border-accent-red/20">
                      Needs review
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                  {buyer.asset_class && <span>{buyer.asset_class}</span>}
                  {buyer.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{buyer.location}</span>}
                  {buyer.sale_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{buyer.sale_date}</span>}
                  {buyer.days_ago !== null && <span>{buyer.days_ago}d ago</span>}
                </div>
              </div>
            </div>

            {/* Why This Buyer — REQUIRED, prominent */}
            {hasReasonSignal ? (
              <div className="mt-3 p-3 bg-accent-purple/5 border border-accent-purple/10 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-accent-purple font-semibold mb-1">
                  Why This Buyer — Right Now
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {buyer.buyer_reason_signal}
                </p>
                {buyer.reason_signals && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(buyer.reason_signals).map(([k, v]) => {
                      if (!v) return null
                      return (
                        <span key={k} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted border border-border-subtle">
                          {k.replace(/_/g, ' ')}: {v}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 p-3 bg-accent-red/5 border border-accent-red/10 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-accent-red font-semibold mb-1">
                  Validation Gate Failed
                </p>
                <p className="text-sm text-text-secondary">
                  Missing buyer reason signal. Cannot generate personalized outreach. Run intelligence again or flag for manual review.
                </p>
              </div>
            )}

            {/* Expand toggle for supporting evidence */}
            <button
              onClick={() => setExpandedBuyer(isExpanded ? null : idx)}
              className="mt-2 text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 transition-colors"
            >
              {isExpanded ? '▲ Hide details' : '▼ Show supporting evidence'}
            </button>

            {/* Expanded: score breakdown + raw signals */}
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-border-subtle/50 space-y-2">
                {buyer.score_breakdown && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(buyer.score_breakdown).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 bg-bg-input rounded text-text-muted">
                        {k.replace(/_/g, ' ')}: {v}
                      </span>
                    ))}
                  </div>
                )}
                {buyer.enriched && (
                  <pre className="text-[10px] text-text-muted bg-bg-input p-2 rounded overflow-x-auto">
                    {JSON.stringify(buyer.enriched, null, 2)}
                  </pre>
                )}
              </div>
            )}

            <QuickLinks links={buyer.quick_links} />
          </div>
        )
      })}
    </div>
  )
}

function SellersWithCapital({ sellers }) {
  if (!sellers?.length) return <EmptyState message="No sellers with capital found." />
  return (
    <div className="grid gap-3">
      {sellers.map((seller, idx) => (
        <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-red-500/20 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <h4 className="font-semibold text-text-primary">{seller.name}</h4>
                <ScoreBadge score={seller.score} />
                <span className={`text-xs px-2 py-0.5 rounded border ${TIER_COLORS[seller.tier] || TIER_COLORS['Tier 3 (Broker Network / Research)']}`}>
                  {seller.redeploy_probability} redeploy
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">{seller.notes}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                {seller.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{seller.city}</span>}
                {seller.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{seller.email}</span>}
                {seller.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{seller.phone}</span>}
              </div>
            </div>
          </div>
          <QuickLinks links={seller.quick_links} />
        </div>
      ))}
    </div>
  )
}

function LendersList({ lenders }) {
  if (!lenders?.length) return <EmptyState message="No lenders found." />
  return (
    <div className="grid gap-3">
      {lenders.map((lender, idx) => (
        <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-accent-primary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-accent-primary" />
            <h4 className="font-semibold text-text-primary">{lender.name}</h4>
            <ScoreBadge score={lender.score} />
            {lender.lender_type && (
              <span className="text-xs text-text-muted bg-bg-input px-2 py-0.5 rounded">{lender.lender_type}</span>
            )}
          </div>
          {lender.asset_specializations && (
            <p className="text-xs text-text-muted mt-1">{lender.asset_specializations}</p>
          )}
          <QuickLinks links={lender.quick_links} />
        </div>
      ))}
    </div>
  )
}

function AgentsList({ agents }) {
  if (!agents?.length) return <EmptyState message="No agents found." />
  return (
    <div className="grid gap-3">
      {agents.map((agent, idx) => (
        <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-accent-primary/20 transition-colors">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent-primary" />
            <h4 className="font-semibold text-text-primary">{agent.name}</h4>
            <ScoreBadge score={agent.score} />
            {agent.brokerage && (
              <span className="text-xs text-text-muted bg-bg-input px-2 py-0.5 rounded">{agent.brokerage}</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
            {agent.role && <span>{agent.role}</span>}
            {agent.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agent.city}</span>}
            {agent.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agent.email}</span>}
          </div>
          <QuickLinks links={agent.quick_links} />
        </div>
      ))}
    </div>
  )
}

function ComparableDeals({ deals }) {
  if (!deals?.length) return <EmptyState message="No comparable deals found." />
  return (
    <div className="grid gap-3">
      {deals.map((deal, idx) => (
        <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-text-primary text-sm">{deal.address || 'Unknown address'}</h4>
              <p className="text-xs text-text-muted">{deal.city} · {deal.asset_class}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">
                ${deal.sale_price ? (deal.sale_price / 1_000_000).toFixed(1) + 'M' : 'N/A'}
              </p>
              <p className="text-xs text-text-muted">{deal.sale_date}</p>
            </div>
          </div>
          {deal.description && (
            <p className="text-xs text-text-muted mt-1">{deal.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function OutreachList({ items }) {
  if (!items?.length) return <EmptyState message="No outreach items found." />
  const byTier = items.reduce((acc, item) => {
    acc[item.tier] = acc[item.tier] || []
    acc[item.tier].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(byTier).map(([tier, tierItems]) => (
        <div key={tier}>
          <h3 className={`text-sm font-semibold mb-2 px-3 py-1 rounded-lg inline-block ${TIER_COLORS[tier] || ''}`}>
            {tier} — {tierItems.length}
          </h3>
          <div className="grid gap-2">
            {tierItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-bg-card border border-border-subtle rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-primary font-medium">{item.name}</span>
                  <span className="text-xs text-text-muted capitalize">{item.type.replace(/_/g, ' ')}</span>
                </div>
                <ScoreBadge score={item.score} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-12 text-text-muted">
      <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
