import { 
  Cpu, 
  Play, 
  Square, 
  RefreshCw, 
  Terminal,
  Globe,
  FileText,
  Search,
  Users,
  MapPin,
  Database,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Sample Skills Data
const SKILLS = [
  { 
    id: 'browser', 
    name: 'Browser Automation', 
    description: 'Control Chrome browser for research and data extraction',
    icon: Globe,
    status: 'active',
    lastRun: '2 min ago'
  },
  { 
    id: 'scrape', 
    name: 'Web Scraper', 
    description: 'Extract data from real estate listing sites',
    icon: Search,
    status: 'idle',
    lastRun: '1 hour ago'
  },
  { 
    id: 'ocr', 
    name: 'OCR Reader', 
    description: 'Extract text from property documents and images',
    icon: FileText,
    status: 'idle',
    lastRun: '3 hours ago'
  },
  { 
    id: 'match', 
    name: 'Buyer Matcher', 
    description: 'AI matching algorithm for buyers and properties',
    icon: Users,
    status: 'active',
    lastRun: 'Running'
  },
  { 
    id: 'geocode', 
    name: 'Geocoder', 
    description: 'Convert addresses to coordinates for mapping',
    icon: MapPin,
    status: 'idle',
    lastRun: 'Never'
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian Sync', 
    description: 'Sync data with Obsidian vault',
    icon: Database,
    status: 'error',
    lastRun: 'Failed'
  },
];

// Sample Subagents
const SUBAGENTS = [
  { id: 1, name: 'Listing_Research_001', task: 'Researching 1500 Michael Drive', status: 'running', progress: 67 },
  { id: 2, name: 'Buyer_Match_003', task: 'Matching buyers for Welland properties', status: 'completed', progress: 100 },
  { id: 3, name: 'Market_Analysis_012', task: 'Analyzing Q4 market trends', status: 'idle', progress: 0 },
];

// Sample Terminal Logs
const LOGS = [
  { time: '14:32:15', level: 'info', message: 'Browser session initialized' },
  { time: '14:32:18', level: 'success', message: 'Connected to Chrome (v120.0)' },
  { time: '14:32:25', level: 'info', message: 'Navigating to: realtor.ca' },
  { time: '14:32:45', level: 'success', message: 'Page loaded in 892ms' },
  { time: '14:33:12', level: 'info', message: 'Executing search: Welland Industrial' },
  { time: '14:33:45', level: 'success', message: 'Found 12 matching properties' },
  { time: '14:34:02', level: 'info', message: 'Extracting property data...' },
  { time: '14:34:15', level: 'warning', message: 'Rate limit detected, backing off...' },
  { time: '14:34:45', level: 'success', message: 'Data extraction complete' },
  { time: '14:35:00', level: 'info', message: 'Saving to database...' },
];

// Skill Card Component
function SkillCard({ skill }) {
  const Icon = skill.icon;
  const statusColors = {
    active: 'bg-status-active/10 text-status-active border-status-active/20',
    idle: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    error: 'bg-status-sold/10 text-status-sold border-status-sold/20',
    running: 'bg-coral/10 text-coral border-coral/20'
  };
  
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 hover:border-coral/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-background-tertiary rounded-lg">
          <Icon size={20} className="text-coral" />
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[skill.status]}`}>
          {skill.status}
        </span>
      </div>
      <h3 className="font-semibold text-white mb-1">{skill.name}</h3>
      <p className="text-xs text-gray-500 mb-3">{skill.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{skill.lastRun}</span>
        <div className="flex gap-1">
          {skill.status === 'active' || skill.status === 'running' ? (
            <button className="p-1.5 text-status-sold hover:bg-status-sold/10 rounded-lg transition-colors">
              <Square size={14} />
            </button>
          ) : (
            <button className="p-1.5 text-status-active hover:bg-status-active/10 rounded-lg transition-colors">
              <Play size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Subagent Card
function SubagentCard({ agent }) {
  const statusIcons = {
    running: <RefreshCw size={14} className="animate-spin text-coral" />,
    completed: <CheckCircle2 size={14} className="text-status-active" />,
    idle: <Clock size={14} className="text-gray-500" />
  };
  
  return (
    <div className="bg-background-tertiary rounded-lg p-3 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{agent.name}</span>
        {statusIcons[agent.status]}
      </div>
      <p className="text-xs text-gray-500 mb-2">{agent.task}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-background-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              agent.status === 'completed' ? 'bg-status-active' : 'bg-coral'
            }`}
            style={{ width: `${agent.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{agent.progress}%</span>
      </div>
    </div>
  );
}

// Terminal Component
function TerminalPanel() {
  const levelColors = {
    info: 'text-blue-400',
    success: 'text-status-active',
    warning: 'text-status-pending',
    error: 'text-status-sold'
  };
  
  return (
    <div className="bg-[#0d0d12] border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-coral" />
          <span className="text-sm font-medium text-white">Agent Logs</span>
        </div>
        <button className="p-1 text-gray-500 hover:text-white">
          <RefreshCw size={12} />
        </button>
      </div>
      <div className="p-3 font-mono text-xs h-64 overflow-y-auto scrollbar-thin">
        {LOGS.map((log, idx) => (
          <div key={idx} className="mb-1">
            <span className="text-gray-600">[{log.time}]</span>{' '}
            <span className={levelColors[log.level]}>[{log.level.toUpperCase()}]</span>{' '}
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
        <div className="animate-pulse">
          <span className="text-gray-600">[14:35:05]</span>{' '}
          <span className="text-coral">_</span>
        </div>
      </div>
    </div>
  );
}

// Main Skills View
export default function SkillsView() {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Cpu size={20} className="text-coral" />
          <h1 className="text-2xl font-bold text-white">Skills & Agents</h1>
        </div>
        <p className="text-gray-500 text-sm">Manage AI capabilities and monitor agent activity</p>
      </div>
      
      {/* Skills Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {SKILLS.map(skill => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Subagents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Active Subagents</h2>
            <button className="text-xs text-coral hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {SUBAGENTS.map(agent => (
              <SubagentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
        
        {/* Terminal */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">System Logs</h2>
          <TerminalPanel />
        </div>
      </div>
    </div>
  );
}
