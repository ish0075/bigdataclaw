import React, { useEffect, useState } from 'react'
import { TrendingUp, Calendar, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const candidates = [import.meta.env.VITE_API_URL || 'http://localhost:8000', 'http://localhost:3090']
let resolvedApiBase = candidates[0]

const fetchApi = async (path, init) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${normalizedPath}`, init)
      if (response.ok) {
        resolvedApiBase = base
        return response
      }
    } catch (e) {
      // try next base
    }
  }
  throw new Error('All API bases failed')
}

export default function MarketTrends() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(90)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchApi(`/api/market-insights?days=${days}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setError('Failed to load market insights')
      }
    } catch (e) {
      setError('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const maxCount = data?.by_asset_class?.[0]?.count || 1

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Market Trends
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live transaction breakdown from BigDataClaw NERVE
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-transparent text-sm text-slate-200 outline-none"
          >
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last 12 months</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-slate-400 text-sm">Loading market insights...</div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Total Transactions</div>
              <div className="text-3xl font-bold text-white mt-1">{data.total_transactions.toLocaleString()}</div>
              <div className="text-slate-500 text-xs mt-1">since {data.cutoff_date}</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Top Asset Class</div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{data.by_asset_class[0]?.asset_class || '—'}</div>
              <div className="text-slate-500 text-xs mt-1">{data.by_asset_class[0]?.count || 0} sales</div>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide">Asset Classes Tracked</div>
              <div className="text-3xl font-bold text-blue-400 mt-1">{data.by_asset_class.length}</div>
              <div className="text-slate-500 text-xs mt-1">distinct categories</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              Asset Class Breakdown
            </h2>
            <div className="space-y-3">
              {data.by_asset_class.map((item, idx) => {
                const pct = Math.round((item.count / data.total_transactions) * 100)
                const prev = data.by_asset_class[idx - 1]
                const trend = prev
                  ? item.count > prev.count
                    ? 'up'
                    : item.count < prev.count
                    ? 'down'
                    : 'flat'
                  : 'up'
                return (
                  <div key={item.asset_class} className="flex items-center gap-4">
                    <div className="w-28 text-sm text-slate-300 truncate">{item.asset_class}</div>
                    <div className="flex-1 h-8 bg-slate-800 rounded-md overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-md"
                        style={{ width: `${Math.max((item.count / maxCount) * 100, 4)}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-white font-medium text-right">{item.count}</div>
                    <div className="w-12 text-xs text-slate-400 text-right">{pct}%</div>
                    <div className="w-6 flex justify-center">
                      {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                      {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                      {trend === 'flat' && <Minus className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
