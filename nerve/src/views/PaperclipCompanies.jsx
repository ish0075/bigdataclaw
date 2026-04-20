import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight, RefreshCw } from 'lucide-react'
import { usePaperclipCompanies } from '../hooks/usePaperclip'

export default function PaperclipCompanies() {
  const { companies, loading, error, refetch } = usePaperclipCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Companies</h1>
          <p className="text-text-muted">Paperclip-powered AI companies orchestrating your missions</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle hover:border-accent-primary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {loading && (
        <div className="p-8 text-center text-text-muted">
          <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full mx-auto mb-4" />
          Loading Paperclip companies...
        </div>
      )}

      {error && (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-medium">Error loading companies</p>
          <p className="text-sm opacity-80">{error}</p>
          <p className="text-sm mt-2">Make sure the Paperclip server is running on port 3100.</p>
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-bg-card border border-border-subtle border-dashed">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-text-muted" />
          <h3 className="text-lg font-medium mb-1">No companies yet</h3>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Create a new mission in Mission Control and a Paperclip company will be spawned automatically.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Link
            key={company.id}
            to={`/paperclip-companies/${company.id}`}
            className="group p-5 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-primary transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent-primary" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                company.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {company.status}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{company.name}</h3>
            <p className="text-text-muted text-sm line-clamp-2 mb-4">
              {company.mission || 'No mission statement'}
            </p>
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Budget: ${(company.budgetMonthlyCents / 100).toLocaleString()}/mo</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
