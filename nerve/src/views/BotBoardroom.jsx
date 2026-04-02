import React, { useState, useEffect } from 'react'
import { 
  Users, Mic, Play, Clock, CheckCircle, XCircle, Loader2,
  MessageSquare, BarChart3, Plus, Trash2, RefreshCw, Zap,
  Terminal, Radio, Volume2
} from 'lucide-react'
import AgentVisualTask from '../components/Agent/AgentVisualTask'

const API_BASE = 'http://localhost:8081'

const AGENTS = {
  // Core Team
  recruiting_specialist: {
    name: 'Alex',
    role: 'Recruiting Specialist',
    team: 'Sales & Marketing',
    voice: 'alex',
    ttsVoice: { name: 'Alex', lang: 'en-US', pitch: 1.0, rate: 1.0 },
    color: 'bg-blue-500',
    icon: '👤',
    traits: ['analytical', 'persuasive', 'organized'],
    status: 'active'
  },
  deal_analyst: {
    name: 'Sam',
    role: 'Deal Analyst',
    team: 'Core Analysis',
    voice: 'sam',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.1, rate: 0.95 },
    color: 'bg-purple-500',
    icon: '💼',
    traits: ['analytical', 'detail-oriented', 'financial-focused'],
    status: 'active'
  },
  market_researcher: {
    name: 'Jordan',
    role: 'Market Researcher',
    team: 'Core Analysis',
    voice: 'jordan',
    ttsVoice: { name: 'Daniel', lang: 'en-GB', pitch: 0.9, rate: 1.0 },
    color: 'bg-green-500',
    icon: '📊',
    traits: ['curious', 'thorough', 'trend-spotter'],
    status: 'idle'
  },
  coordinator: {
    name: 'Taylor',
    role: 'Operations Coordinator',
    team: 'Operations',
    voice: 'taylor',
    ttsVoice: { name: 'Victoria', lang: 'en-US', pitch: 1.2, rate: 1.05 },
    color: 'bg-orange-500',
    icon: '📅',
    traits: ['organized', 'proactive', 'supportive'],
    status: 'idle'
  },
  
  // Property Analysis Team
  seller_profile_bot: {
    name: 'Parker',
    role: 'Seller Profiler',
    team: 'Property Analysis',
    voice: 'parker',
    ttsVoice: { name: 'Thomas', lang: 'en-US', pitch: 0.95, rate: 1.0 },
    color: 'bg-indigo-500',
    icon: '🕵️',
    traits: ['detective', 'analytical', 'strategic'],
    status: 'active'
  },
  legal_bot: {
    name: 'Quinn',
    role: 'Legal Compliance',
    team: 'Property Analysis',
    voice: 'quinn',
    ttsVoice: { name: 'Allison', lang: 'en-US', pitch: 1.0, rate: 0.95 },
    color: 'bg-red-600',
    icon: '⚖️',
    traits: ['precise', 'cautious', 'risk-aware'],
    status: 'idle'
  },
  watchdog_bot: {
    name: 'Radar',
    role: 'Deal Watchdog',
    team: 'Operations',
    voice: 'radar',
    ttsVoice: { name: 'Fred', lang: 'en-US', pitch: 0.8, rate: 1.1 },
    color: 'bg-yellow-600',
    icon: '🐕',
    traits: ['vigilant', 'persistent', 'reliable'],
    status: 'active'
  },
  property_research_bot: {
    name: 'Scout',
    role: 'Property Intelligence',
    team: 'Property Analysis',
    voice: 'scout',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.05, rate: 1.0 },
    color: 'bg-teal-500',
    icon: '🔍',
    traits: ['thorough', 'data-miner', 'historian'],
    status: 'active'
  },
  photo_inspector_bot: {
    name: 'Lens',
    role: 'Photo Inspector',
    team: 'Property Analysis',
    voice: 'lens',
    ttsVoice: { name: 'Victoria', lang: 'en-US', pitch: 1.1, rate: 0.9 },
    color: 'bg-cyan-500',
    icon: '📷',
    traits: ['visual', 'detail-oriented', 'safety-focused'],
    status: 'idle'
  },
  
  // Sales & Marketing Team
  sales_director_bot: {
    name: 'Ace',
    role: 'Sales Director',
    team: 'Sales & Marketing',
    voice: 'ace',
    ttsVoice: { name: 'Alex', lang: 'en-US', pitch: 1.0, rate: 1.05 },
    color: 'bg-pink-500',
    icon: '🎯',
    traits: ['confident', 'persuasive', 'closer'],
    status: 'active'
  },
  social_media_bot: {
    name: 'Buzz',
    role: 'Social Media Manager',
    team: 'Sales & Marketing',
    voice: 'buzz',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.15, rate: 1.1 },
    color: 'bg-rose-500',
    icon: '📱',
    traits: ['creative', 'trendy', 'engaging'],
    status: 'idle'
  },
  inquiries_bot: {
    name: 'Echo',
    role: 'Inquiry Specialist',
    team: 'Sales & Marketing',
    voice: 'echo',
    ttsVoice: { name: 'Allison', lang: 'en-US', pitch: 1.05, rate: 1.0 },
    color: 'bg-violet-500',
    icon: '💬',
    traits: ['fast', 'friendly', 'efficient'],
    status: 'idle'
  },
  
  // Operations
  deal_secretary_bot: {
    name: 'File',
    role: 'Deal Secretary',
    team: 'Operations',
    voice: 'file',
    ttsVoice: { name: 'Victoria', lang: 'en-US', pitch: 1.0, rate: 0.95 },
    color: 'bg-slate-500',
    icon: '📁',
    traits: ['meticulous', 'reliable', 'deadline-obsessed'],
    status: 'idle'
  },
  
  // NEW: Transaction Team
  buyer_bot: {
    name: 'Hunter',
    role: 'Buyer Specialist',
    team: 'Transaction Team',
    voice: 'hunter',
    ttsVoice: { name: 'Alex', lang: 'en-US', pitch: 1.05, rate: 1.0 },
    color: 'bg-emerald-600',
    icon: '🎯',
    traits: ['matchmaker', 'relationship-builder', 'persistent'],
    status: 'active'
  },
  listing_bot: {
    name: 'Stage',
    role: 'Listing Manager',
    team: 'Transaction Team',
    voice: 'stage',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.1, rate: 0.95 },
    color: 'bg-fuchsia-500',
    icon: '🏷️',
    traits: ['visual', 'market-savvy', 'detail-focused'],
    status: 'idle'
  },
  content_bot: {
    name: 'Scribe',
    role: 'Content Creator',
    team: 'Transaction Team',
    voice: 'scribe',
    ttsVoice: { name: 'Allison', lang: 'en-US', pitch: 1.0, rate: 1.05 },
    color: 'bg-amber-500',
    icon: '✍️',
    traits: ['creative', 'persuasive', ' SEO-savvy'],
    status: 'active'
  },
  
  // NEW: Specialized Bots
  buyer_matcher_bot: {
    name: 'Scout',
    role: 'Buyer Matcher',
    team: 'Specialized Bots',
    voice: 'scout',
    ttsVoice: { name: 'Daniel', lang: 'en-GB', pitch: 0.95, rate: 1.0 },
    color: 'bg-teal-600',
    icon: '🔍',
    traits: ['analytical', 'thorough', 'data-driven'],
    status: 'active'
  },
  seller_outreach_bot: {
    name: 'Ambassador',
    role: 'Seller Outreach',
    team: 'Specialized Bots',
    voice: 'ambassador',
    ttsVoice: { name: 'Victoria', lang: 'en-US', pitch: 1.05, rate: 0.95 },
    color: 'bg-rose-600',
    icon: '🤝',
    traits: ['diplomatic', 'persuasive', 'empathetic'],
    status: 'idle'
  },
  property_valuation_bot: {
    name: 'Appraiser',
    role: 'Property Valuation',
    team: 'Specialized Bots',
    voice: 'appraiser',
    ttsVoice: { name: 'Alex', lang: 'en-US', pitch: 0.9, rate: 0.95 },
    color: 'bg-indigo-600',
    icon: '💎',
    traits: ['precise', 'conservative', 'analytical'],
    status: 'idle'
  },
  marketing_campaign_bot: {
    name: 'Maven',
    role: 'Campaign Manager',
    team: 'Specialized Bots',
    voice: 'maven',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.15, rate: 1.05 },
    color: 'bg-violet-600',
    icon: '📊',
    traits: ['strategic', 'metrics-obsessed', 'results-driven'],
    status: 'active'
  },
  
  fact_checker_bot: {
    name: 'Skeptic',
    role: 'Fact Checker',
    team: 'Specialized Bots',
    voice: 'skeptic',
    ttsVoice: { name: 'Daniel', lang: 'en-GB', pitch: 1.0, rate: 0.95 },
    color: 'bg-lime-600',
    icon: '🔍',
    traits: ['rigorous', 'detail-oriented', 'truth-seeker'],
    status: 'active'
  },
  
  ideas_bot: {
    name: 'Spark',
    role: 'Critical Thinker',
    team: 'Specialized Bots',
    voice: 'spark',
    ttsVoice: { name: 'Samantha', lang: 'en-US', pitch: 1.2, rate: 1.05 },
    color: 'bg-sky-500',
    icon: '💡',
    traits: ['creative', 'challenger', 'optimizer'],
    status: 'active'
  }
}

const MEETING_TYPES = [
  { id: 'daily_standup', name: 'Daily Standup', icon: '🌅', description: 'Quick sync on daily priorities' },
  { id: 'deal_review', name: 'Deal Review', icon: '🏢', description: 'Review hot property deals' },
  { id: 'deep_dive_dd', name: 'Deep Dive Due Diligence', icon: '🔬', description: 'Full property & legal analysis' },
  { id: 'weekly_ops', name: 'Weekly Operations', icon: '⚙️', description: 'Pipeline, deadlines & blockers' },
  { id: 'sales_strategy', name: 'Sales & Marketing Strategy', icon: '📈', description: 'Lead gen, content & closing' },
  { id: 'emergency_council', name: 'Emergency Deal Council', icon: '🚨', description: 'Urgent deal issues & risks' },
  { id: 'full_council', name: 'Full Mission Control Council', icon: '🏛️', description: 'All 13 agents - major decisions' },
  { id: 'recruiting_sync', name: 'Recruiting Sync', icon: '👥', description: 'Agent recruitment updates' },
  { id: 'strategy_session', name: 'Strategy Session', icon: '🎯', description: 'Long-term planning discussion' },
  { id: 'hot_money_brief', name: 'Hot Money Brief', icon: '🔥', description: 'Cash-rich buyer updates' },
  { id: 'buyer_matching', name: 'Buyer Matching Session', icon: '🔍', description: 'Match buyers to properties' },
  { id: 'seller_outreach', name: 'Seller Outreach Blitz', icon: '🤝', description: 'Proactive seller contact' },
  { id: 'property_valuation', name: 'Property Valuation', icon: '💎', description: 'Analyze property values' },
  { id: 'marketing_campaign', name: 'Campaign Planning', icon: '📊', description: 'Design marketing campaigns' }
]

const BotBoardroom = () => {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [health, setHealth] = useState(null)
  
  // Form state
  const [newMeeting, setNewMeeting] = useState({
    meeting_type: 'daily_standup',
    participants: ['recruiting_specialist', 'deal_analyst'],
    rounds: 3,
    generate_audio: false,
    dispatch_telegram: false
  })

  // Check health on load
  useEffect(() => {
    checkHealth()
    loadMeetings()
  }, [])

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`)
      const data = await res.json()
      setHealth(data)
    } catch (err) {
      console.error('Health check failed:', err)
      setHealth({ status: 'error', error: err.message })
    }
  }

  const loadMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents/meetings?limit=10`)
      const data = await res.json()
      setMeetings(data)
    } catch (err) {
      console.error('Failed to load meetings:', err)
    }
  }

  const createMeeting = async () => {
    if (newMeeting.participants.length < 2) {
      alert('Select at least 2 participants')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/agents/meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting)
      })
      
      if (!res.ok) throw new Error('Failed to create meeting')
      
      const data = await res.json()
      setShowCreateModal(false)
      setNewMeeting({
        meeting_type: 'daily_standup',
        participants: ['recruiting_specialist', 'deal_analyst'],
        rounds: 3,
        generate_audio: false,
        dispatch_telegram: false
      })
      
      // Reload meetings list
      await loadMeetings()
      
      // Poll for completion
      pollMeetingStatus(data.meeting_id)
    } catch (err) {
      alert('Error creating meeting: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const pollMeetingStatus = async (meetingId) => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/agents/meeting/${meetingId}`)
        const meeting = await res.json()
        
        // Update meetings list
        setMeetings(prev => prev.map(m => 
          m.meeting_id === meetingId ? { ...m, status: meeting.status } : m
        ))
        
        if (meeting.status === 'completed') {
          // Reload full meeting data
          loadMeetings()
          if (selectedMeeting?.meeting_id === meetingId) {
            setSelectedMeeting(meeting)
          }
        } else if (meeting.status === 'in_progress') {
          setTimeout(checkStatus, 2000)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }
    
    checkStatus()
  }

  // Browser TTS for playing agent messages
  const speakMessage = (text, agentId) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech not supported in this browser')
      return
    }
    
    const agent = AGENTS[agentId]
    if (!agent) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Try to find matching voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes(agent.ttsVoice.name) || 
      v.lang === agent.ttsVoice.lang
    )
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.pitch = agent.ttsVoice.pitch
    utterance.rate = agent.ttsVoice.rate
    utterance.lang = agent.ttsVoice.lang
    
    window.speechSynthesis.speak(utterance)
  }
  
  // Play all messages in sequence
  const playFullConversation = (conversation) => {
    if (!window.speechSynthesis) {
      alert('Text-to-speech not supported in this browser')
      return
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    let index = 0
    
    const speakNext = () => {
      if (index >= conversation.length) return
      
      const entry = conversation[index]
      const agent = AGENTS[entry.agent]
      
      if (!agent) {
        index++
        speakNext()
        return
      }
      
      const utterance = new SpeechSynthesisUtterance(entry.message)
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => 
        v.name.includes(agent.ttsVoice.name) || 
        v.lang === agent.ttsVoice.lang
      )
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      utterance.pitch = agent.ttsVoice.pitch
      utterance.rate = agent.ttsVoice.rate
      utterance.lang = agent.ttsVoice.lang
      
      utterance.onend = () => {
        index++
        setTimeout(speakNext, 500) // Small pause between speakers
      }
      
      window.speechSynthesis.speak(utterance)
    }
    
    speakNext()
  }
  
  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  const viewMeeting = async (meetingId) => {
    try {
      const res = await fetch(`${API_BASE}/agents/meeting/${meetingId}`)
      const data = await res.json()
      setSelectedMeeting(data)
    } catch (err) {
      alert('Failed to load meeting details')
    }
  }

  const toggleParticipant = (agentId) => {
    setNewMeeting(prev => ({
      ...prev,
      participants: prev.participants.includes(agentId)
        ? prev.participants.filter(id => id !== agentId)
        : [...prev.participants, agentId]
    }))
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '--'
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Radio className="w-6 h-6 text-accent-red animate-pulse" />
            Bot Boardroom
          </h1>
          <p className="text-text-secondary mt-1">
            Autonomous AI agent meetings & 3-round consensus
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Health Status */}
          <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
            health?.status === 'healthy' 
              ? 'bg-accent-green/20 text-accent-green' 
              : 'bg-accent-red/20 text-accent-red'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              health?.status === 'healthy' ? 'bg-accent-green animate-pulse' : 'bg-accent-red'
            }`} />
            {health?.status === 'healthy' ? 'Connected' : 'Disconnected'}
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </button>
        </div>
      </div>

      {/* Agents Overview - Grouped by Team */}
      
      {/* Core Analysis Team */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Core Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Core Analysis').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Property Analysis Team */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Property Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Property Analysis').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Operations Team */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Operations').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Sales & Marketing Team */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Sales & Marketing</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Sales & Marketing').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Team (NEW) */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Transaction Team</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Transaction Team').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Specialized Bots (NEW) */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">Specialized Bots</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(AGENTS).filter(([id, a]) => a.team === 'Specialized Bots').map(([id, agent]) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center text-2xl`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{agent.name}</h3>
                  <p className="text-xs text-text-secondary">{agent.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 bg-bg-input rounded-full text-text-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <AgentVisualTask agentId={id} status={agent.status || 'idle'} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      <div className="card">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent-blue" />
            Recent Meetings
          </h2>
          <button 
            onClick={loadMeetings}
            className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="divide-y divide-border-subtle">
          {meetings.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <Terminal className="w-12 h-12 mx-auto mb-3 text-text-muted" />
              <p>No meetings yet</p>
              <p className="text-sm mt-1">Create your first AI agent meeting</p>
            </div>
          ) : (
            meetings.map(meeting => (
              <div 
                key={meeting.meeting_id}
                onClick={() => viewMeeting(meeting.meeting_id)}
                className="p-4 hover:bg-bg-input/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      meeting.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
                      meeting.status === 'in_progress' ? 'bg-accent-blue/20 text-accent-blue' :
                      meeting.status === 'failed' ? 'bg-accent-red/20 text-accent-red' :
                      'bg-bg-input text-text-muted'
                    }`}>
                      {meeting.status === 'in_progress' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : meeting.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : meeting.status === 'failed' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary capitalize">
                        {meeting.meeting_type?.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {meeting.participants?.length || 0} agents • {new Date(meeting.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    meeting.status === 'completed' ? 'bg-accent-green/20 text-accent-green' :
                    meeting.status === 'in_progress' ? 'bg-accent-blue/20 text-accent-blue' :
                    meeting.status === 'failed' ? 'bg-accent-red/20 text-accent-red' :
                    'bg-bg-input text-text-muted'
                  }`}>
                    {meeting.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Radio className="w-5 h-5 text-accent-red" />
                Schedule AI Agent Meeting
              </h3>
            </div>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Quick Team Presets */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Quick Select Team</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['recruiting_specialist', 'deal_analyst', 'market_researcher', 'coordinator']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-blue bg-accent-blue/5 text-left"
                  >
                    <span className="text-lg">🎯</span>
                    <span className="text-sm text-text-primary ml-2">Core Analysis</span>
                  </button>
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['seller_profile_bot', 'property_research_bot', 'legal_bot', 'watchdog_bot', 'photo_inspector_bot']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-green bg-accent-green/5 text-left"
                  >
                    <span className="text-lg">🏢</span>
                    <span className="text-sm text-text-primary ml-2">Property Analysis</span>
                  </button>
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['watchdog_bot', 'deal_secretary_bot', 'coordinator']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-orange bg-accent-orange/5 text-left"
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="text-sm text-text-primary ml-2">Operations</span>
                  </button>
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['sales_director_bot', 'social_media_bot', 'inquiries_bot', 'recruiting_specialist']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-purple bg-accent-purple/5 text-left"
                  >
                    <span className="text-lg">🚀</span>
                    <span className="text-sm text-text-primary ml-2">Sales & Marketing</span>
                  </button>
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['buyer_bot', 'listing_bot', 'content_bot']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-emerald bg-accent-emerald/5 text-left col-span-2"
                  >
                    <span className="text-lg">🤝</span>
                    <span className="text-sm text-text-primary ml-2">Transaction Team</span>
                  </button>
                  <button
                    onClick={() => setNewMeeting({...newMeeting, participants: ['buyer_matcher_bot', 'seller_outreach_bot', 'property_valuation_bot', 'marketing_campaign_bot', 'fact_checker_bot', 'ideas_bot']})}
                    className="p-3 rounded-lg border border-border-subtle hover:border-accent-violet bg-accent-violet/5 text-left col-span-2"
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-sm text-text-primary ml-2">Specialized Bots</span>
                  </button>
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Meeting Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {MEETING_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewMeeting({...newMeeting, meeting_type: type.id})}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        newMeeting.meeting_type === type.id
                          ? 'border-accent-red bg-accent-red/10'
                          : 'border-border-subtle hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <p className="font-medium text-text-primary">{type.name}</p>
                          <p className="text-xs text-text-secondary">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Participants ({newMeeting.participants.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(AGENTS).map(([id, agent]) => (
                    <button
                      key={id}
                      onClick={() => toggleParticipant(id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        newMeeting.participants.includes(id)
                          ? 'border-accent-green bg-accent-green/10'
                          : 'border-border-subtle hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{agent.icon}</span>
                        <div>
                          <p className="font-medium text-text-primary">{agent.name}</p>
                          <p className="text-xs text-text-secondary">{agent.role}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Consensus Rounds: {newMeeting.rounds}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newMeeting.rounds}
                  onChange={(e) => setNewMeeting({...newMeeting, rounds: parseInt(e.target.value)})}
                  className="w-full"
                />
                <p className="text-xs text-text-muted mt-1">
                  More rounds = deeper discussion but longer meeting
                </p>
              </div>

              {/* Options */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMeeting.generate_audio}
                    onChange={(e) => setNewMeeting({...newMeeting, generate_audio: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm text-text-secondary">Generate Audio</span>
                  <Volume2 className="w-4 h-4 text-text-muted" />
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMeeting.dispatch_telegram}
                    onChange={(e) => setNewMeeting({...newMeeting, dispatch_telegram: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm text-text-secondary">Send to Telegram</span>
                </label>
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle flex gap-2">
              <button 
                onClick={createMeeting}
                disabled={loading || newMeeting.participants.length < 2}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Meeting
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary capitalize">
                  {selectedMeeting.meeting_type?.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm text-text-secondary">
                  {new Date(selectedMeeting.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedMeeting(null)}
                className="p-2 rounded-lg hover:bg-bg-input"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Status */}
              <div className={`p-3 rounded-lg ${
                selectedMeeting.status === 'completed' ? 'bg-accent-green/10' :
                selectedMeeting.status === 'failed' ? 'bg-accent-red/10' :
                'bg-bg-input'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedMeeting.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-accent-green" />
                  ) : selectedMeeting.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-accent-red" />
                  ) : (
                    <Clock className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="font-medium capitalize">{selectedMeeting.status}</span>
                </div>
              </div>

              {/* Audio Controls */}
              {selectedMeeting.status === 'completed' && selectedMeeting.conversation?.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => playFullConversation(selectedMeeting.conversation)}
                    className="flex-1 py-2 bg-accent-blue/20 text-accent-blue rounded-lg flex items-center justify-center gap-2 hover:bg-accent-blue/30 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play Full Conversation
                  </button>
                  <button
                    onClick={stopSpeech}
                    className="px-4 py-2 bg-accent-red/20 text-accent-red rounded-lg hover:bg-accent-red/30 transition-colors"
                  >
                    Stop
                  </button>
                </div>
              )}

              {/* Conversation */}
              {selectedMeeting.conversation?.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversation ({selectedMeeting.conversation.length} messages)
                  </h4>
                  <div className="space-y-3">
                    {selectedMeeting.conversation.map((entry, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${
                          AGENTS[entry.agent]?.color || 'bg-bg-input'
                        }`}>
                          {AGENTS[entry.agent]?.icon || '🤖'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary">
                                {AGENTS[entry.agent]?.name || entry.agent}
                              </span>
                              <span className="text-xs text-text-muted">Round {entry.round}</span>
                            </div>
                            {/* Play button for each message */}
                            <button
                              onClick={() => speakMessage(entry.message, entry.agent)}
                              className="p-1.5 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
                              title="Play message"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-text-secondary">{entry.message}</p>
                          {entry.audio_url && (
                            <audio controls className="mt-2 w-full h-8">
                              <source src={`${API_BASE}${entry.audio_url}`} type="audio/mpeg" />
                            </audio>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {selectedMeeting.summary && (
                <div className="bg-bg-input rounded-lg p-4">
                  <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Meeting Summary
                  </h4>
                  
                  {selectedMeeting.summary.key_points?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-text-secondary mb-1">Key Points:</p>
                      <ul className="list-disc list-inside text-sm text-text-primary">
                        {selectedMeeting.summary.key_points.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedMeeting.summary.decisions?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-text-secondary mb-1">Decisions:</p>
                      <ul className="list-disc list-inside text-sm text-text-primary">
                        {selectedMeeting.summary.decisions.map((dec, i) => (
                          <li key={i}>{dec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedMeeting.summary.action_items?.length > 0 && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Action Items:</p>
                      <ul className="list-disc list-inside text-sm text-text-primary">
                        {selectedMeeting.summary.action_items.map((item, i) => (
                          <li key={i}>{item.agent}: {item.action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      Consensus: {selectedMeeting.summary.consensus_reached ? '✅ Reached' : '❌ Not Reached'}
                    </span>
                    <span className="text-sm text-text-secondary">
                      Confidence: {Math.round((selectedMeeting.summary.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BotBoardroom
