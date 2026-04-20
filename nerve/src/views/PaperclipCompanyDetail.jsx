import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Target,
  CheckCircle2,
  DollarSign,
  LayoutDashboard,
  Activity,
  Loader2,
  Network
} from 'lucide-react'
import {
  usePaperclipCompany,
  usePaperclipCompanyAgents,
  usePaperclipCompanyIssues,
  usePaperclipCompanyGoals,
  usePaperclipCompanyCosts,
} from '../hooks/usePaperclip'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'issues', label: 'Issues', icon: CheckCircle2 },
  { id: 'costs', label: 'Costs', icon: DollarSign },
]

export default function PaperclipCompanyDetail() {
  const { companyId } = useParams()
  const [activeTab, setActiveTab] = useState('dashboard')
  const { company, loading, error } = usePaperclipCompany(companyId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        <p className="font-medium">Failed to load company</p>
        <p className="text-sm">{error || 'Company not found'}</p>
        <Link to="/paperclip-companies" className="text-sm underline mt-2 inline-block">
          ← Back to companies
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/paperclip-companies"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to companies
          </Link>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-text-muted text-sm mt-1 max-w-2xl">
            {company.mission || 'No mission statement'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/paperclip-companies/${companyId}/org`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-subtle hover:border-accent-primary transition-colors text-sm"
          >
            <Network className="w-4 h-4" />
            Org Chart
          </Link>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            company.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            {company.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-subtle">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'dashboard' && <DashboardTab companyId={companyId} />}
        {activeTab === 'agents' && <AgentsTab companyId={companyId} />}
        {activeTab === 'goals' && <GoalsTab companyId={companyId} />}
        {activeTab === 'issues' && <IssuesTab companyId={companyId} />}
        {activeTab === 'costs' && <CostsTab companyId={companyId} />}
      </div>
    </div>
  )
}

function DashboardTab({ companyId }) {
  const { agents, loading: agentsLoading } = usePaperclipCompanyAgents(companyId)
  const { issues, loading: issuesLoading } = usePaperclipCompanyIssues(companyId)
  const { goals, loading: goalsLoading } = usePaperclipCompanyGoals(companyId)

  const activeIssues = issues.filter((i) => i.status === 'in_progress').length
  const backlogIssues = issues.filter((i) => i.status === 'backlog').length
  const doneIssues = issues.filter((i) => i.status === 'done').length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Agents" value={agentsLoading ? '...' : agents.length} icon={Users} />
      <StatCard label="Active Goals" value={goalsLoading ? '...' : goals.filter(g => g.status === 'active').length} icon={Target} />
      <StatCard label="In Progress" value={issuesLoading ? '...' : activeIssues} icon={Activity} />
      <StatCard label="Done" value={issuesLoading ? '...' : doneIssues} icon={CheckCircle2} />
    </div>
  )
}

function AgentsTab({ companyId }) {
  const { agents, loading } = usePaperclipCompanyAgents(companyId)

  if (loading) return <LoadingState />
  if (agents.length === 0) return <EmptyState message="No agents hired yet." />

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="p-4 rounded-xl bg-bg-card border border-border-subtle"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold">
              {agent.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-medium">{agent.name}</h3>
              <p className="text-xs text-text-muted uppercase">{agent.role}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <span className={`capitalize ${agent.status === 'idle' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {agent.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-text-muted">Adapter</span>
            <span className="text-text-secondary">{agent.adapterType}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GoalsTab({ companyId }) {
  const { goals, loading } = usePaperclipCompanyGoals(companyId)

  if (loading) return <LoadingState />
  if (goals.length === 0) return <EmptyState message="No goals defined yet." />

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="p-4 rounded-xl bg-bg-card border border-border-subtle"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium">{goal.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              goal.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {goal.status}
            </span>
          </div>
          <p className="text-sm text-text-muted">{goal.description}</p>
        </div>
      ))}
    </div>
  )
}

function IssuesTab({ companyId }) {
  const { issues, loading } = usePaperclipCompanyIssues(companyId)

  if (loading) return <LoadingState />
  if (issues.length === 0) return <EmptyState message="No issues created yet." />

  const statusColors = {
    backlog: 'bg-slate-500/10 text-slate-400',
    in_progress: 'bg-amber-500/10 text-amber-400',
    done: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-400',
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="p-4 rounded-xl bg-bg-card border border-border-subtle flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-muted font-mono">{issue.identifier}</span>
              <h3 className="font-medium truncate">{issue.title}</h3>
            </div>
            {issue.body && (
              <p className="text-sm text-text-muted line-clamp-2">{issue.body}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColors[issue.status] || statusColors.backlog}`}>
            {issue.status.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  )
}

function CostsTab({ companyId }) {
  const { costs, loading } = usePaperclipCompanyCosts(companyId)

  if (loading) return <LoadingState />
  if (!costs) return <EmptyState message="No cost data available yet." />

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Monthly Budget"
        value={`$${(costs.budgetMonthlyCents / 100).toLocaleString()}`}
        icon={DollarSign}
      />
      <StatCard
        label="Monthly Spent"
        value={`$${(costs.spentMonthlyCents / 100).toLocaleString()}`}
        icon={Activity}
      />
      <StatCard
        label="Remaining"
        value={`$${((costs.budgetMonthlyCents - costs.spentMonthlyCents) / 100).toLocaleString()}`}
        icon={CheckCircle2}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-subtle">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent-primary" />
        </div>
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-text-muted">
      <Activity className="w-10 h-10 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  )
}
