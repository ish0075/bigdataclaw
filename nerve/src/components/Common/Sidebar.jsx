import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  MessageSquare, 
  Building2, 
  Users, 
  UserCircle, 
  Landmark, 
  Upload, 
  Cpu, 
  Map, 
  LayoutDashboard,
  Flame,
  Database,
  UserPlus,
  Hammer,
  Settings,
  Sparkles,
  Briefcase,
  Building,
  FileText,
  Palette,
  Radio,
  Target,
  Handshake,
  Calculator,
  Shield,
  Activity,
  Code,
  Zap,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Bot
} from 'lucide-react'

const SECTIONS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { path: '/', label: 'Mission Control', icon: LayoutDashboard },
      { path: '/research', label: 'Property Research', icon: Building2 },
      { path: '/hotmoney', label: 'Hot Money Radar', icon: Flame },
      { path: '/pipeline', label: 'Deal Pipeline', icon: Users },
      { path: '/opportunities', label: 'Opportunities', icon: Sparkles },
      { path: '/agents', label: 'Agent Workspace', icon: Cpu },
      { path: '/bot-boardroom', label: 'Bot Boardroom', icon: Radio, badge: 'AI' },
      { path: '/vault', label: 'Obsidian Vault', icon: Database },
    ]
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    items: [
      { path: '/exp-agent-recruiter', label: 'EXP Agent Recruiter', icon: UserPlus, badge: '96K' },
      { path: '/commercial-agent-recruiter', label: 'Commercial Agents', icon: Briefcase, badge: '6.7K' },
      { path: '/brokerages', label: 'Brokerages', icon: Building },
    ]
  },
  {
    id: 'aiBots',
    label: 'AI Bots',
    items: [
      { path: '/buyer-bot', label: 'Buyer Intelligence', icon: Target, badge: 'AI' },
      { path: '/seller-outreach-bot', label: 'Seller Outreach', icon: Handshake, badge: 'AI' },
      { path: '/property-valuation-bot', label: 'Property Valuation', icon: Calculator, badge: 'AI' },
      { path: '/vigil', label: 'Vigil Monitor', icon: Shield, badge: '24/7' },
      { path: '/agent-workspaces', label: 'Agent Workspaces', icon: Activity, badge: 'NEW' },
      { path: '/bot-builder', label: 'Bot Builder', icon: Hammer, badge: 'BUILD' },
      { path: '/mission-control', label: 'Agent Visualizer', icon: Zap, badge: 'LIVE' },
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { path: '/listings', label: 'My Listings', icon: Building2 },
      { path: '/buyers', label: 'Buyer Matcher', icon: Users },
      { path: '/agents-matcher', label: 'Agent Matcher', icon: UserCircle },
      { path: '/lenders', label: 'Lender Matcher', icon: Landmark },
      { path: '/builders', label: 'Builder Directory', icon: Hammer },
      { path: '/upload', label: 'Property Upload', icon: Upload },
      { path: '/olena-feature-sheet', label: 'Olena Marketing', icon: FileText, badge: 'NEW' },
      { path: '/canva-editor', label: 'Canva Editor', icon: Palette, badge: 'NEW' },
      { path: '/skills', label: 'Skills & Agents', icon: Cpu },
      { path: '/map', label: 'Map View', icon: Map },
      { path: '/data-manager', label: 'Data Manager', icon: Database },
      { path: '/ai-builder', label: 'AI Builder', icon: Code, badge: 'CODE' },
    ]
  }
]

const STORAGE_KEY = 'nerve-sidebar-state'

const Sidebar = () => {
  const [compact, setCompact] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.compact === 'boolean') setCompact(parsed.compact)
        if (parsed.collapsedSections) setCollapsedSections(parsed.collapsedSections)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ compact, collapsedSections }))
  }, [compact, collapsedSections, mounted])

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const expandAll = () => setCollapsedSections({})
  const collapseAll = () => {
    const all = {}
    SECTIONS.forEach(s => all[s.id] = true)
    setCollapsedSections(all)
  }

  return (
    <aside className={`bg-bg-card border-r border-border-subtle flex flex-col transition-all duration-300 ${compact ? 'w-[72px]' : 'w-64'}`}>
      {/* Logo / Compact Toggle */}
      <div className={`border-b border-border-subtle flex items-center justify-between ${compact ? 'p-3 flex-col gap-3' : 'p-4'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="/control-shifter-logo.svg" alt="Control Shifter" className="w-full h-full" />
          </div>
          {!compact && (
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight truncate">Mission Control</h1>
              <p className="text-xs text-text-muted tracking-wider uppercase truncate">Real Estate Command Center</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCompact(!compact)}
          className="p-1.5 rounded-lg hover:bg-bg-input text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {compact ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {!compact && (
          <div className="px-2 pb-2 flex items-center gap-2">
            <button
              onClick={collapseAll}
              className="text-[10px] px-2 py-1 rounded bg-bg-input text-text-muted hover:text-text-primary transition-colors"
            >
              Collapse all
            </button>
            <button
              onClick={expandAll}
              className="text-[10px] px-2 py-1 rounded bg-bg-input text-text-muted hover:text-text-primary transition-colors"
            >
              Expand all
            </button>
          </div>
        )}

        {SECTIONS.map((section) => {
          const isCollapsed = collapsedSections[section.id]
          const hasActive = section.items.some(i => {
            if (typeof window === 'undefined') return false
            return window.location.pathname === i.path || window.location.pathname.startsWith(i.path + '/')
          })
          
          return (
            <div key={section.id} className="mb-1">
              {!compact ? (
                <>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                      hasActive ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span>{section.label}</span>
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-1">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => 
                            `nav-item ${isActive ? 'active' : ''}`
                          }
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`ml-auto px-1.5 py-0.5 text-[10px] rounded flex-shrink-0 ${
                              section.id === 'recruitment' ? 'bg-accent-blue/20 text-accent-blue' :
                              section.id === 'aiBots' ? 'bg-accent-purple/20 text-accent-purple' :
                              'bg-accent-green/20 text-accent-green'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Compact mode: icons only with section separators
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={`${section.label} › ${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                      className={({ isActive }) => 
                        `group relative flex items-center justify-center p-2.5 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-accent-blue/15 text-accent-blue' 
                            : 'text-text-muted hover:bg-bg-input hover:text-text-primary'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-purple" />
                      )}
                      {/* Tooltip */}
                      <span className="absolute left-full ml-2 px-2 py-1 bg-bg-input border border-border-subtle rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                        {item.label}
                      </span>
                    </NavLink>
                  ))}
                  {section.id !== 'tools' && <div className="h-px bg-border-subtle/50 mx-2 my-1" />}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      
      {/* Bottom Status */}
      <div className={`border-t border-border-subtle ${compact ? 'p-3 flex justify-center' : 'p-4'}`}>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
          {!compact && <span>System Online</span>}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
