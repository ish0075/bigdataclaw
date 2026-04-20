import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Network, Loader2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function PaperclipOrgChart() {
  const { companyId } = useParams()
  const [svgUrl, setSvgUrl] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    async function fetchSvg() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/paperclip/companies/${companyId}/org-chart.svg`)
        if (!res.ok) throw new Error('Failed to load org chart')
        const blob = await res.blob()
        setSvgUrl(URL.createObjectURL(blob))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSvg()
    return () => {
      if (svgUrl) URL.revokeObjectURL(svgUrl)
    }
  }, [companyId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/paperclip-companies/${companyId}`}
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to company
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Network className="w-6 h-6 text-accent-primary" />
            Org Chart
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Live organizational structure of the Paperclip agent company
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-bg-card border border-border-subtle p-6 min-h-[400px] flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>Loading org chart...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-400">
            <p className="font-medium">{error}</p>
            <p className="text-sm opacity-80 mt-1">
              The org chart may not be available for this company yet.
            </p>
          </div>
        )}

        {!loading && !error && svgUrl && (
          <img
            src={svgUrl}
            alt="Organization Chart"
            className="w-full h-auto max-w-4xl"
          />
        )}
      </div>
    </div>
  )
}
