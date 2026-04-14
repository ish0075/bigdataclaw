import React, { useState, useEffect } from 'react'
import { 
  Paperclip, 
  Activity, 
  Users, 
  Building2, 
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Zap,
  DollarSign,
  Briefcase,
  Plus,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react'

/**
 * Paperclip Dashboard
 * Real-time tracking of companies, agents, goals, and issues
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PaperclipDashboard = () => {
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [companyDetails, setCompanyDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [expandedCompanies, setExpandedCompanies] = useState({})

  // Fetch all companies on mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/paperclip/companies`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      const data = await res.json()
      setCompanies(data || [])
      
      // Auto-expand first company
      if (data && data.length > 0) {
        const firstId = data[0].id
        setExpandedCompanies({ [firstId]: true })
        fetchCompanyDetails(firstId)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const fetchCompanyDetails = async (companyId) => {
    try {
      // Fetch agents, goals, and issues in parallel
      const [agentsRes, goalsRes, issuesRes, dashboardRes] = await Promise.all([
        fetch(`${API_BASE}/api/paperclip/companies/${companyId}/agents`),
        fetch(`${API_BASE}/api/paperclip/companies/${companyId}/goals`),
        fetch(`${API_BASE}/api/paperclip/companies/${companyId}/issues`),
        fetch(`${API_BASE}/api/paperclip/companies/${companyId}/dashboard`).catch(() => null)
      ])

      const agents = agentsRes.ok ? await agentsRes.json() : []
      const goals = goalsRes.ok ? await goalsRes.json() : []
      const issues = issuesRes.ok ? await issuesRes.json() : []
      const dashboard = dashboardRes?.ok ? await dashboardRes.json() : null

      setCompanyDetails(prev => ({
        ...prev,
        [companyId]: {
          agents: Array.isArray(agents) ? agents : [],
          goals: Array.isArray(goals) ? goals : [],
          issues: Array.isArray(issues) ? issues : [],
          dashboard,
          lastUpdated: new Date().toISOString()
        }
      }))
    } catch (err) {
      console.error('Failed to fetch company details:', err)
    }
  }

  const toggleCompany = (companyId) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }))
    
    // Fetch details if expanding and not already loaded
    if (!expandedCompanies[companyId] && !companyDetails[companyId]) {
      fetchCompanyDetails(companyId)
    }
  }

  const refreshAll = async () => {
    setRefreshing(true)
    await fetchCompanies()
    // Refresh details for expanded companies
    for (const [companyId, isExpanded] of Object.entries(expandedCompanies)) {
      if (isExpanded) {
        await fetchCompanyDetails(companyId)
      }
    }
    setRefreshing(false)
  }

  // Calculate global stats
  const globalStats = {
    totalCompanies: companies.length,
    totalAgents: Object.values(companyDetails).reduce((acc, d) => acc + (d.agents?.length || 0), 0),
    totalGoals: Object.values(companyDetails).reduce((acc, d) => acc + (d.goals?.length || 0), 0),
    totalIssues: Object.values(companyDetails).reduce((acc, d) => acc + (d.issues?.length || 0), 0),
    activeIssues: Object.values(companyDetails).reduce((acc, d) => 
      acc + (d.issues?.filter(i => i.status === 'in_progress')?.length || 0), 0
    ),
    completedIssues: Object.values(companyDetails).reduce((acc, d) => 
      acc + (d.issues?.filter(i => i.status === 'done')?.length || 0), 0
    )
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'bg-accent-blue text-accent-blue'
      case 'done':
      case 'completed':
        return 'bg-accent-green text-accent-green'
      case 'backlog':
      case 'pending':
        return 'bg-accent-orange text-accent-orange'
      default:
        return 'bg-text-muted text-text-muted'
    }
  }

  const getIssueStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-accent-green" />
      case 'in_progress':
        return <Zap className="w-4 h-4 text-accent-blue" />
      case 'backlog':
        return <Clock className="w-4 h-4 text-accent-orange" />
      default:
        return <AlertCircle className="w-4 h-4 text-text-muted" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
        <span className="ml-3 text-text-secondary">Loading Paperclip data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-accent-red mx-auto mb-3" />
          <p className="text-text-secondary">{error}</p>
          <button onClick={fetchCompanies} className="btn-primary mt-4">
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Paperclip className="w-6 h-6 text-sky-500" />
              Paperclip Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage your Paperclip agent companies, issues, and organizational charts.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshAll}
              className="btn-secondary flex items-center gap-2"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a 
              href="/paperclip-companies"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Company
            </a>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">•</span>
              <span>Browse companies and their assigned Paperclip agents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">•</span>
              <span>Track open issues and task assignments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">•</span>
              <span>View org charts and team hierarchies</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-blue" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.totalCompanies}</p>
          <p className="text-sm text-text-muted">Companies</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-purple" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.totalAgents}</p>
          <p className="text-sm text-text-muted">Agents</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-green" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.totalGoals}</p>
          <p className="text-sm text-text-muted">Goals</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-orange/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent-orange" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.totalIssues}</p>
          <p className="text-sm text-text-muted">Total Issues</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-yellow" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.activeIssues}</p>
          <p className="text-sm text-text-muted">Active</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent-green" />
            </div>
          </div>
          <p className="text-3xl font-bold text-text-primary">{globalStats.completedIssues}</p>
          <p className="text-sm text-text-muted">Completed</p>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent-blue" />
          Companies ({companies.length})
        </h2>

        {companies.length === 0 ? (
          <div className="card p-8 text-center">
            <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No companies found</p>
            <a href="/paperclip-companies" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Create Company
            </a>
          </div>
        ) : (
          companies.map(company => {
            const details = companyDetails[company.id]
            const isExpanded = expandedCompanies[company.id]
            
            return (
              <div key={company.id} className="card overflow-hidden">
                {/* Company Header */}
                <button
                  onClick={() => toggleCompany(company.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-bg-input/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-text-primary">{company.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {details?.agents?.length || 0} agents
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {details?.goals?.length || 0} goals
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {details?.issues?.length || 0} issues
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      company.status === 'active' 
                        ? 'bg-accent-green/10 text-accent-green' 
                        : 'bg-accent-orange/10 text-accent-orange'
                    }`}>
                      {company.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && details && (
                  <div className="border-t border-border-subtle p-4 space-y-4">
                    {/* Agents */}
                    {details.agents?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Agents ({details.agents.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {details.agents.map(agent => (
                            <div 
                              key={agent.id} 
                              className="p-3 rounded-lg bg-bg-input flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-accent-blue" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary text-sm truncate">{agent.name}</p>
                                <p className="text-xs text-text-muted truncate">{agent.role}</p>
                              </div>
                              {agent.status && (
                                <span className={`w-2 h-2 rounded-full ${
                                  agent.status === 'active' ? 'bg-accent-green' : 'bg-accent-orange'
                                }`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Goals */}
                    {details.goals?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Goals ({details.goals.length})
                        </h4>
                        <div className="space-y-2">
                          {details.goals.map(goal => (
                            <div 
                              key={goal.id} 
                              className="p-3 rounded-lg bg-bg-input flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <Target className="w-4 h-4 text-accent-green" />
                                <div>
                                  <p className="font-medium text-text-primary text-sm">{goal.title}</p>
                                  {goal.description && (
                                    <p className="text-xs text-text-muted">{goal.description}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(goal.status)} bg-opacity-20`}>
                                {goal.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issues */}
                    {details.issues?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Issues ({details.issues.length})
                        </h4>
                        <div className="space-y-2">
                          {details.issues.map(issue => (
                            <div 
                              key={issue.id} 
                              className="p-3 rounded-lg bg-bg-input flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                {getIssueStatusIcon(issue.status)}
                                <div>
                                  <p className="font-medium text-text-primary text-sm">{issue.title}</p>
                                  {issue.body && (
                                    <p className="text-xs text-text-muted line-clamp-1">{issue.body}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(issue.status)} bg-opacity-20`}>
                                {issue.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                      <a 
                        href={`/paperclip-companies/${company.id}`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </a>
                      <a 
                        href={`/paperclip-companies/${company.id}/org`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Org Chart
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Integration Status */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-blue" />
          Integration Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-green/10">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <div>
              <p className="font-medium text-text-primary">Paperclip API</p>
              <p className="text-xs text-text-muted">Connected on port 3100</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-blue/10">
            <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
            <div>
              <p className="font-medium text-text-primary">Bridge Active</p>
              <p className="text-xs text-text-muted">Proxying requests</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-purple/10">
            <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
            <div>
              <p className="font-medium text-text-primary">NERVE Gateway</p>
              <p className="text-xs text-text-muted">Agents can query API</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-yellow/10">
            <div className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
            <div>
              <p className="font-medium text-text-primary">Auto-Spawn</p>
              <p className="text-xs text-text-muted">Missions create companies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaperclipDashboard
