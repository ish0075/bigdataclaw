import React, { useState } from 'react'
import { Zap, Code, Database, Globe, Shield, Cpu, Play, Pause, Settings, Terminal, CheckCircle2, XCircle, Clock, Plus, Trash2, Edit3, ChevronRight, Star, Activity } from 'lucide-react'

const skills = [
  { id: '1', name: 'Property Data Extractor', description: 'Extract structured data from property documents', icon: <Database className="w-5 h-5" />, category: 'Data Processing', active: true, usage: 1247 },
  { id: '2', name: 'Market Analyzer', description: 'Analyze market trends and comparables', icon: <Activity className="w-5 h-5" />, category: 'Analysis', active: true, usage: 892 },
  { id: '3', name: 'Buyer Matcher', description: 'Match properties with qualified buyers', icon: <Zap className="w-5 h-5" />, category: 'Matching', active: true, usage: 2156 },
  { id: '4', name: 'Document Parser', description: 'Parse PDFs, Word docs, and spreadsheets', icon: <Code className="w-5 h-5" />, category: 'Data Processing', active: true, usage: 3421 },
  { id: '5', name: 'Web Scraper', description: 'Scrape public property listings and data', icon: <Globe className="w-5 h-5" />, category: 'Data Collection', active: false, usage: 567 },
  { id: '6', name: 'Email Automation', description: 'Automated email campaigns to buyers', icon: <Zap className="w-5 h-5" />, category: 'Communication', active: true, usage: 1890 },
  { id: '7', name: 'Security Validator', description: 'Validate data security and compliance', icon: <Shield className="w-5 h-5" />, category: 'Security', active: true, usage: 432 },
  { id: '8', name: 'AI Model Handler', description: 'Manage local LLM and AI models', icon: <Cpu className="w-5 h-5" />, category: 'AI/ML', active: true, usage: 2341 },
]

const agents = [
  { id: 'a1', name: 'Transaction Scout', status: 'active', lastRun: '2 min ago', success: 99.2, tasks: 45 },
  { id: 'a2', name: 'Hot Money Tracker', status: 'active', lastRun: '5 min ago', success: 98.8, tasks: 156 },
  { id: 'a3', name: 'Portfolio Analyzer', status: 'paused', lastRun: '1 hour ago', success: 97.5, tasks: 23 },
  { id: 'a4', name: 'Obsidian Sync', status: 'active', lastRun: 'Just now', success: 99.9, tasks: 1247 },
]

const SkillsAndAgents = () => {
  const [activeTab, setActiveTab] = useState('skills')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [customAgents, setCustomAgents] = useState(agents)
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    type: 'scraper'
  })
  
  const toggleSkill = (skillId) => {
    // Toggle skill active state
  }
  
  const toggleAgent = (agentId) => {
    // Toggle agent status
    setCustomAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
        : agent
    ))
  }
  
  const handleCreateAgent = () => {
    if (!newAgent.name.trim()) return
    
    const agent = {
      id: `a${Date.now()}`,
      name: newAgent.name,
      status: 'paused',
      lastRun: 'Never',
      success: 100,
      tasks: 0
    }
    
    setCustomAgents(prev => [...prev, agent])
    setNewAgent({ name: '', description: '', type: 'scraper' })
    setShowCreateAgent(false)
  }
  
  const deleteAgent = (agentId) => {
    setCustomAgents(prev => prev.filter(a => a.id !== agentId))
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent-yellow" />
          Skills & Agents
        </h1>
        <p className="text-text-secondary mt-1">Manage AI skills and agent configurations</p>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle">
        <button 
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'skills' 
              ? 'border-accent-red text-accent-red' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Skills ({skills.length})
        </button>
        <button 
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'agents' 
              ? 'border-accent-red text-accent-red' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Custom Agents ({agents.length})
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs' 
              ? 'border-accent-red text-accent-red' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          System Logs
        </button>
      </div>
      
      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(skill => (
            <div 
              key={skill.id} 
              className={`card p-5 transition-all cursor-pointer hover:shadow-lg ${
                skill.active ? 'border-accent-green/30' : 'border-border-subtle opacity-75'
              }`}
              onClick={() => setSelectedSkill(skill)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  skill.active ? 'bg-accent-green/20 text-accent-green' : 'bg-bg-input text-text-muted'
                }`}>
                  {skill.icon}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleSkill(skill.id) }}
                  className={`p-2 rounded-lg transition-colors ${
                    skill.active 
                      ? 'bg-accent-green/20 text-accent-green' 
                      : 'bg-bg-input text-text-muted'
                  }`}
                >
                  {skill.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
              </div>
              <h3 className="font-semibold text-text-primary">{skill.name}</h3>
              <p className="text-sm text-text-secondary mt-1">{skill.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                <span className="text-xs text-text-muted">{skill.category}</span>
                <span className="text-xs text-accent-blue">{skill.usage.toLocaleString()} uses</span>
              </div>
            </div>
          ))}
          
          {/* Add New Skill Card */}
          <div className="card p-5 border-dashed border-2 border-border-subtle flex flex-col items-center justify-center text-center hover:border-accent-red/50 transition-colors cursor-pointer min-h-[200px]">
            <div className="w-12 h-12 rounded-xl bg-bg-input flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-text-muted" />
            </div>
            <h3 className="font-medium text-text-primary">Add Custom Skill</h3>
            <p className="text-sm text-text-secondary mt-1">Create a new AI skill</p>
          </div>
        </div>
      )}
      
      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Custom Agents ({customAgents.length})</h3>
            <button 
              onClick={() => setShowCreateAgent(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {customAgents.map(agent => (
              <div key={agent.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agent.status === 'active' ? 'bg-accent-green/20 text-accent-green' : 
                      agent.status === 'paused' ? 'bg-accent-yellow/20 text-accent-yellow' : 
                      'bg-text-muted/20 text-text-muted'
                    }`}>
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{agent.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {agent.lastRun}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {agent.success}% success
                        </span>
                        <span>{agent.tasks} tasks</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      agent.status === 'active' ? 'bg-accent-green/20 text-accent-green' :
                      agent.status === 'paused' ? 'bg-accent-yellow/20 text-accent-yellow' :
                      'bg-text-muted/20 text-text-muted'
                    }`}>
                      {agent.status}
                    </span>
                    <button 
                      onClick={() => toggleAgent(agent.id)}
                      className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                    >
                      {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 rounded-lg hover:bg-accent-red/20 text-text-secondary hover:text-accent-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">System Logs</h3>
            <button className="text-sm text-accent-red hover:underline">Clear All</button>
          </div>
          <div className="bg-black p-4 font-mono text-sm h-96 overflow-y-auto">
            <div className="space-y-1">
              <div className="flex gap-3">
                <span className="text-text-muted">10:42:15 AM</span>
                <span className="text-accent-green">[SUCCESS]</span>
                <span className="text-text-primary">Transaction Scout completed scan - 3 new transactions found</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-muted">10:41:32 AM</span>
                <span className="text-accent-blue">[INFO]</span>
                <span className="text-text-primary">Property Data Extractor processed document #1247</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-muted">10:40:18 AM</span>
                <span className="text-accent-yellow">[WARN]</span>
                <span className="text-text-primary">API rate limit approaching for Hot Money Tracker</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-muted">10:38:45 AM</span>
                <span className="text-accent-green">[SUCCESS]</span>
                <span className="text-text-primary">Buyer Matcher completed - 5 matches found for 281 Chippawa Creek</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-muted">10:35:22 AM</span>
                <span className="text-accent-blue">[INFO]</span>
                <span className="text-text-primary">Obsidian Sync completed - 3 files updated</span>
              </div>
              <div className="flex gap-3">
                <span className="text-text-muted">10:30:00 AM</span>
                <span className="text-accent-green">[SUCCESS]</span>
                <span className="text-text-primary">Daily backup completed successfully</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedSkill(null)}>
          <div className="card w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedSkill.active ? 'bg-accent-green/20 text-accent-green' : 'bg-bg-input text-text-muted'
                }`}>
                  {selectedSkill.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{selectedSkill.name}</h3>
                  <p className="text-sm text-text-secondary">{selectedSkill.category}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-text-secondary">{selectedSkill.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Total Uses</p>
                  <p className="font-semibold text-text-primary">{selectedSkill.usage.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-bg-input">
                  <p className="text-xs text-text-muted">Status</p>
                  <p className={`font-semibold ${selectedSkill.active ? 'text-accent-green' : 'text-text-muted'}`}>
                    {selectedSkill.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleSkill(selectedSkill.id)}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    selectedSkill.active 
                      ? 'bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30' 
                      : 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30'
                  }`}
                >
                  {selectedSkill.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {selectedSkill.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Agent Modal */}
      {showCreateAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCreateAgent(false)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent-red" />
                Create New Agent
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g., My Custom Scraper"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-red"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">Description</label>
                <textarea
                  placeholder="What does this agent do?"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({...newAgent, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-red resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">Agent Type</label>
                <select
                  value={newAgent.type}
                  onChange={(e) => setNewAgent({...newAgent, type: e.target.value})}
                  className="w-full px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-red"
                >
                  <option value="scraper">Web Scraper</option>
                  <option value="analyzer">Data Analyzer</option>
                  <option value="matcher">Matcher</option>
                  <option value="monitor">Monitor</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleCreateAgent}
                  disabled={!newAgent.name.trim()}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Create Agent
                </button>
                <button 
                  onClick={() => setShowCreateAgent(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SkillsAndAgents
