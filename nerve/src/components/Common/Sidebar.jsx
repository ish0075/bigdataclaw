import React from 'react'
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
  Zap
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Mission Control', icon: LayoutDashboard },
  { path: '/research', label: 'Property Research', icon: Building2 },
  { path: '/hotmoney', label: 'Hot Money Radar', icon: Flame },
  { path: '/pipeline', label: 'Deal Pipeline', icon: Users },
  { path: '/opportunities', label: 'Opportunities', icon: Sparkles },
  { path: '/agents', label: 'Agent Workspace', icon: Cpu },
  { path: '/bot-boardroom', label: 'Bot Boardroom', icon: Radio, badge: 'AI' },
  { path: '/vault', label: 'Obsidian Vault', icon: Database },
]

const recruitmentNavItems = [
  { path: '/exp-agent-recruiter', label: 'EXP Agent Recruiter', icon: UserPlus, badge: '96K' },
  { path: '/commercial-agent-recruiter', label: 'Commercial Agents', icon: Briefcase, badge: '6.7K' },
  { path: '/brokerages', label: 'Brokerages', icon: Building },
]

const aiBotNavItems = [
  { path: '/buyer-bot', label: 'Buyer Intelligence', icon: Target, badge: 'AI' },
  { path: '/seller-outreach-bot', label: 'Seller Outreach', icon: Handshake, badge: 'AI' },
  { path: '/property-valuation-bot', label: 'Property Valuation', icon: Calculator, badge: 'AI' },
  { path: '/vigil', label: 'Vigil Monitor', icon: Shield, badge: '24/7' },
  { path: '/agent-workspaces', label: 'Agent Workspaces', icon: Activity, badge: 'NEW' },
  { path: '/bot-builder', label: 'Bot Builder', icon: Hammer, badge: 'BUILD' },
  { path: '/mission-control', label: 'Agent Visualizer', icon: Zap, badge: 'LIVE' },
]

const bottomNavItems = [
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

const Sidebar = () => {
  return (
    <aside className="w-64 bg-bg-card border-r border-border-subtle flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/control-shifter-logo.svg" alt="Control Shifter" className="w-full h-full" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Mission Control</h1>
            <p className="text-xs text-text-muted tracking-wider uppercase">Real Estate Command Center</p>
          </div>
        </div>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Main
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Recruitment
        </div>
        {recruitmentNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto px-1.5 py-0.5 bg-accent-blue/20 text-accent-blue text-[10px] rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
        
        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          AI Bots
        </div>
        {aiBotNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple text-[10px] rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
        
        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Tools
        </div>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom Status */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
