/**
 * Bot Swarm Demo - Marketing Visualization
 * Shows AI agents collaborating with animated effects
 * "Kimi Swarm" style visualization for marketing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Users, 
  MessageSquare, Zap, Target, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Agent definitions with colors
const AGENTS = [
  // Core Analysis
  { id: 'sam', name: 'Sam', role: 'Deal Analyst', team: 'Core Analysis', color: '#8B5CF6', x: 15, y: 20 },
  { id: 'jordan', name: 'Jordan', role: 'Market Researcher', team: 'Core Analysis', color: '#8B5CF6', x: 35, y: 20 },
  
  // Property Analysis
  { id: 'parker', name: 'Parker', role: 'Property Profiler', team: 'Property Analysis', color: '#3B82F6', x: 10, y: 45 },
  { id: 'quinn', name: 'Quinn', role: 'Legal/Compliance', team: 'Property Analysis', color: '#3B82F6', x: 25, y: 45 },
  { id: 'scout_prop', name: 'Scout', role: 'Property Intelligence', team: 'Property Analysis', color: '#3B82F6', x: 40, y: 45 },
  { id: 'lens', name: 'Lens', role: 'Photo Inspector', team: 'Property Analysis', color: '#3B82F6', x: 55, y: 45 },
  
  // Operations
  { id: 'taylor', name: 'Taylor', role: 'Operations Coordinator', team: 'Operations', color: '#F59E0B', x: 10, y: 70 },
  { id: 'radar', name: 'Radar', role: 'Deal Watchdog', team: 'Operations', color: '#F59E0B', x: 30, y: 70 },
  { id: 'file', name: 'File', role: 'Deal Secretary', team: 'Operations', color: '#F59E0B', x: 50, y: 70 },
  
  // Sales & Marketing
  { id: 'alex', name: 'Alex', role: 'Recruiting Specialist', team: 'Sales & Marketing', color: '#EC4899', x: 65, y: 25 },
  { id: 'ace', name: 'Ace', role: 'Sales Director', team: 'Sales & Marketing', color: '#EC4899', x: 80, y: 25 },
  { id: 'buzz', name: 'Buzz', role: 'Social Media Manager', team: 'Sales & Marketing', color: '#EC4899', x: 65, y: 45 },
  { id: 'echo', name: 'Echo', role: 'Inquiry Specialist', team: 'Sales & Marketing', color: '#EC4899', x: 80, y: 45 },
  
  // Transaction Team
  { id: 'hunter', name: 'Hunter', role: 'Buyer Specialist', team: 'Transaction', color: '#10B981', x: 65, y: 70 },
  { id: 'stage', name: 'Stage', role: 'Listing Manager', team: 'Transaction', color: '#10B981', x: 80, y: 70 },
  { id: 'scribe', name: 'Scribe', role: 'Content Creator', team: 'Transaction', color: '#10B981', x: 92, y: 70 },
];

// Demo scenarios
const DEMO_SCENARIOS = {
  'property_deal': {
    name: 'Property Deal Analysis',
    duration: 20000,
    events: [
      { time: 0, agent: 'taylor', type: 'speak', message: '🚨 New deal alert: 1500 Michael Drive, Welland', duration: 3000 },
      { time: 500, agent: 'taylor', type: 'activate' },
      { time: 2500, agent: 'parker', type: 'speak', message: '🔍 Starting property analysis...', duration: 4000 },
      { time: 3000, agent: 'parker', type: 'skill', skill: 'Property Analysis' },
      { time: 3000, agent: 'parker', type: 'progress', progress: 0 },
      { time: 3500, agent: 'scout_prop', type: 'speak', message: '📊 Searching comparable sales...', duration: 3500 },
      { time: 4000, agent: 'scout_prop', type: 'connect', to: 'parker' },
      { time: 4000, agent: 'scout_prop', type: 'skill', skill: 'Comparable Analysis' },
      { time: 6000, agent: 'parker', type: 'progress', progress: 40 },
      { time: 7000, agent: 'lens', type: 'speak', message: '📸 Analyzing property photos...', duration: 3000 },
      { time: 7500, agent: 'lens', type: 'skill', skill: 'Photo Analysis' },
      { time: 8000, agent: 'parker', type: 'progress', progress: 70 },
      { time: 9000, agent: 'quinn', type: 'speak', message: '⚖️ Running legal compliance check...', duration: 3000 },
      { time: 9500, agent: 'quinn', type: 'skill', skill: 'Legal Review' },
      { time: 10000, agent: 'parker', type: 'progress', progress: 100 },
      { time: 10500, agent: 'parker', type: 'speak', message: '✅ Analysis complete! Est. value: $2.1M', duration: 3000 },
      { time: 11000, agent: 'parker', type: 'complete' },
      { time: 12000, agent: 'hunter', type: 'speak', message: '🎯 Found 3 qualified cash buyers!', duration: 3000 },
      { time: 12500, agent: 'hunter', type: 'connect', to: 'parker' },
      { time: 12500, agent: 'hunter', type: 'skill', skill: 'Buyer Matching' },
      { time: 14000, agent: 'jordan', type: 'speak', message: '📈 Market conditions support this valuation', duration: 3000 },
      { time: 14500, agent: 'jordan', type: 'connect', to: 'hunter' },
      { time: 15000, agent: 'scribe', type: 'speak', message: '📝 Generating deal briefing...', duration: 3000 },
      { time: 15500, agent: 'scribe', type: 'skill', skill: 'Content Creation' },
      { time: 16000, agent: 'scribe', type: 'progress', progress: 50 },
      { time: 17000, agent: 'sam', type: 'speak', message: '📋 Deal approved for presentation!', duration: 3000 },
      { time: 17500, agent: 'sam', type: 'activate' },
      { time: 18000, all: true, type: 'consensus' },
    ]
  },
  'buyer_search': {
    name: 'Intensive Buyer Search',
    duration: 15000,
    events: [
      { time: 0, agent: 'ace', type: 'speak', message: '🔍 Need qualified buyers for industrial property', duration: 3000 },
      { time: 1000, agent: 'hunter', type: 'speak', message: 'Searching database...', duration: 2000 },
      { time: 1500, agent: 'hunter', type: 'skill', skill: 'Database Search' },
      { time: 2000, agent: 'buzz', type: 'speak', message: 'Checking social signals...', duration: 2000 },
      { time: 2500, agent: 'buzz', type: 'connect', to: 'hunter' },
      { time: 3000, agent: 'alex', type: 'speak', message: 'Contacting broker network...', duration: 2000 },
      { time: 5000, agent: 'hunter', type: 'speak', message: 'Found 5 potential buyers!', duration: 3000 },
      { time: 6000, agent: 'sam', type: 'speak', message: 'Analyzing buyer portfolios...', duration: 3000 },
      { time: 7000, agent: 'sam', type: 'skill', skill: 'Portfolio Analysis' },
      { time: 9000, agent: 'sam', type: 'speak', message: '3 buyers qualified with $5M+ capacity', duration: 3000 },
      { time: 10000, agent: 'echo', type: 'speak', message: 'Sending outreach messages...', duration: 3000 },
      { time: 11000, agent: 'echo', type: 'skill', skill: 'Outreach' },
      { time: 13000, all: true, type: 'consensus', message: 'Buyers identified and contacted!' },
    ]
  },
  'swarm_mode': {
    name: 'Full Swarm Activation',
    duration: 10000,
    events: [
      { time: 0, all: true, type: 'activate' },
      { time: 500, agent: 'sam', type: 'speak', message: 'Core systems online', duration: 2000 },
      { time: 1000, agent: 'parker', type: 'speak', message: 'Property analysis ready', duration: 2000 },
      { time: 1500, agent: 'taylor', type: 'speak', message: 'Operations standing by', duration: 2000 },
      { time: 2000, agent: 'hunter', type: 'speak', message: 'Transaction team ready', duration: 2000 },
      { time: 2500, agent: 'ace', type: 'speak', message: 'Sales systems active', duration: 2000 },
      { time: 3000, all: true, type: 'skill_showcase' },
      { time: 8000, all: true, type: 'consensus', message: '16 Agents. 1 Mission.' },
    ]
  }
};

// Typewriter hook
const useTypewriter = (text, speed = 30, isActive) => {
  const [displayed, setDisplayed] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!isActive) {
      setDisplayed('');
      setIsComplete(false);
      return;
    }
    
    let index = 0;
    setDisplayed('');
    setIsComplete(false);
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, isActive]);
  
  return { displayed, isComplete };
};

// Agent Card Component
const AgentCard = ({ agent, state, message, progress, skill, onClick }) => {
  const isActive = state === 'active' || state === 'speaking';
  const isComplete = state === 'complete';
  
  return (
    <div 
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer ${
        isActive ? 'z-20' : 'z-10'
      }`}
      style={{ 
        left: `${agent.x}%`, 
        top: `${agent.y}%`,
      }}
      onClick={onClick}
    >
      {/* Glow effect when active */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-2xl animate-pulse"
          style={{ 
            boxShadow: `0 0 40px ${agent.color}, 0 0 80px ${agent.color}40`,
            transform: 'scale(1.2)',
          }}
        />
      )}
      
      {/* Completion glow */}
      {isComplete && (
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{ 
            boxShadow: `0 0 20px #10B981, 0 0 40px #10B98140`,
          }}
        />
      )}
      
      {/* Card */}
      <div 
        className={`relative w-36 p-3 rounded-xl border transition-all duration-300 ${
          isActive 
            ? 'bg-bg-card border-2 scale-110' 
            : isComplete
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-bg-card/80 border-border-subtle hover:border-text-muted'
        }`}
        style={{ borderColor: isActive ? agent.color : undefined }}
      >
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold mb-2"
          style={{ 
            backgroundColor: `${agent.color}20`,
            color: agent.color,
            boxShadow: isActive ? `0 0 20px ${agent.color}40` : 'none'
          }}
        >
          {agent.name[0]}
        </div>
        
        {/* Info */}
        <p className="text-xs font-medium text-text-primary truncate">{agent.name}</p>
        <p className="text-xs text-text-muted truncate">{agent.role}</p>
        
        {/* Skill badge */}
        {skill && (
          <div 
            className="mt-2 px-2 py-0.5 rounded-full text-xs animate-pulse"
            style={{ 
              backgroundColor: `${agent.color}20`,
              color: agent.color,
            }}
          >
            {skill}
          </div>
        )}
        
        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-2">
            <div className="h-1 bg-bg-input rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: agent.color
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{progress}%</p>
          </div>
        )}
        
        {/* Complete checkmark */}
        {isComplete && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      
      {/* Speech bubble */}
      {message && (
        <div 
          className="absolute left-full ml-3 top-0 w-56 p-3 rounded-xl bg-bg-card border border-border-subtle shadow-xl z-30 animate-in fade-in slide-in-from-left-2"
          style={{ borderColor: `${agent.color}40` }}
        >
          <p className="text-sm text-text-primary">{message}</p>
          <div 
            className="absolute left-0 top-4 w-2 h-2 -translate-x-1/2 rotate-45 bg-bg-card border-l border-b border-border-subtle"
            style={{ borderColor: `${agent.color}40` }}
          />
        </div>
      )}
    </div>
  );
};

// Connection Line Component
const ConnectionLine = ({ from, to, color, active }) => {
  if (!from || !to) return null;
  
  const fromAgent = AGENTS.find(a => a.id === from);
  const toAgent = AGENTS.find(a => a.id === to);
  
  if (!fromAgent || !toAgent) return null;
  
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <linearGradient id={`grad-${from}-${to}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1={`${fromAgent.x}%`}
        y1={`${fromAgent.y}%`}
        x2={`${toAgent.x}%`}
        y2={`${toAgent.y}%`}
        stroke={active ? `url(#grad-${from}-${to})` : 'transparent'}
        strokeWidth="2"
        strokeDasharray="5,5"
        className={active ? 'animate-dash' : ''}
      />
      {active && (
        <circle r="3" fill={color}>
          <animateMotion 
            dur="1s" 
            repeatCount="indefinite"
            path={`M ${fromAgent.x} ${fromAgent.y} L ${toAgent.x} ${toAgent.y}`}
          />
        </circle>
      )}
    </svg>
  );
};

// Main Component
const BotSwarmDemo = () => {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState('property_deal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [agentStates, setAgentStates] = useState({});
  const [messages, setMessages] = useState({});
  const [progress, setProgress] = useState({});
  const [skills, setSkills] = useState({});
  const [connections, setConnections] = useState([]);
  const [showConsensus, setShowConsensus] = useState(false);
  
  const scenario = DEMO_SCENARIOS[selectedScenario];
  const animationRef = useRef();
  const startTimeRef = useRef();
  
  // Reset simulation
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAgentStates({});
    setMessages({});
    setProgress({});
    setSkills({});
    setConnections([]);
    setShowConsensus(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);
  
  // Process events at current time
  useEffect(() => {
    if (!isPlaying) return;
    
    scenario.events.forEach(event => {
      if (event.time <= currentTime && event.time > currentTime - 100) {
        // Process event
        if (event.all) {
          // Global event
          if (event.type === 'activate') {
            const newStates = {};
            AGENTS.forEach(a => newStates[a.id] = 'active');
            setAgentStates(newStates);
          } else if (event.type === 'consensus') {
            setShowConsensus(true);
            setTimeout(() => setShowConsensus(false), 3000);
          } else if (event.type === 'skill_showcase') {
            const newSkills = {};
            AGENTS.forEach(a => newSkills[a.id] = a.role.split(' ')[0]);
            setSkills(newSkills);
          }
        } else {
          // Agent-specific event
          const agentId = event.agent;
          
          switch (event.type) {
            case 'speak':
              setMessages(prev => ({ ...prev, [agentId]: event.message }));
              setAgentStates(prev => ({ ...prev, [agentId]: 'speaking' }));
              setTimeout(() => {
                setMessages(prev => {
                  const next = { ...prev };
                  delete next[agentId];
                  return next;
                });
                setAgentStates(prev => ({ ...prev, [agentId]: 'active' }));
              }, event.duration || 3000);
              break;
              
            case 'activate':
              setAgentStates(prev => ({ ...prev, [agentId]: 'active' }));
              break;
              
            case 'complete':
              setAgentStates(prev => ({ ...prev, [agentId]: 'complete' }));
              break;
              
            case 'skill':
              setSkills(prev => ({ ...prev, [agentId]: event.skill }));
              setTimeout(() => {
                setSkills(prev => {
                  const next = { ...prev };
                  delete next[agentId];
                  return next;
                });
              }, 3000);
              break;
              
            case 'progress':
              setProgress(prev => ({ ...prev, [agentId]: event.progress }));
              break;
              
            case 'connect':
              setConnections(prev => [...prev, { from: agentId, to: event.to, color: AGENTS.find(a => a.id === agentId)?.color }]);
              setTimeout(() => {
                setConnections(prev => prev.filter(c => !(c.from === agentId && c.to === event.to)));
              }, 2000);
              break;
          }
        }
      }
    });
  }, [currentTime, isPlaying, scenario]);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const animate = () => {
      setCurrentTime(prev => {
        if (prev >= scenario.duration) {
          setIsPlaying(false);
          return scenario.duration;
        }
        return prev + 50; // 50ms increments
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, scenario.duration]);
  
  // Change scenario
  useEffect(() => {
    reset();
  }, [selectedScenario, reset]);
  
  return (
    <div className="min-h-screen bg-bg-primary p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Bot Swarm Visualization</h1>
            <p className="text-text-secondary">Watch AI agents collaborate in real-time</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/bot-boardroom')}
            className="px-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm hover:bg-bg-card"
          >
            Back to Boardroom
          </button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-6">
          {/* Scenario selector */}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-text-secondary" />
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="px-3 py-1.5 bg-bg-input border border-border-subtle rounded-lg text-sm"
              disabled={isPlaying}
            >
              {Object.entries(DEMO_SCENARIOS).map(([id, scen]) => (
                <option key={id} value={id}>{scen.name}</option>
              ))}
            </select>
          </div>
          
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={reset}
              className="p-2 bg-bg-input hover:bg-bg-card border border-border-subtle rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex-1">
            <div className="h-2 bg-bg-input rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${(currentTime / scenario.duration) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Time */}
          <div className="text-sm text-text-secondary w-20 text-right">
            {Math.round(currentTime / 1000)}s / {Math.round(scenario.duration / 1000)}s
          </div>
        </div>
      </div>
      
      {/* Swarm Visualization */}
      <div className="relative h-[600px] card overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        {/* Team labels */}
        <div className="absolute top-4 left-4 text-xs text-text-muted">Core Analysis</div>
        <div className="absolute top-4 left-[30%] text-xs text-text-muted">Property Analysis</div>
        <div className="absolute top-4 left-[55%] text-xs text-text-muted">Operations</div>
        <div className="absolute top-4 right-4 text-xs text-text-muted">Transaction Team</div>
        
        {/* Connection lines */}
        {connections.map((conn, idx) => (
          <ConnectionLine key={idx} {...conn} active={true} />
        ))}
        
        {/* Agent cards */}
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            state={agentStates[agent.id]}
            message={messages[agent.id]}
            progress={progress[agent.id]}
            skill={skills[agent.id]}
            onClick={() => {}}
          />
        ))}
        
        {/* Consensus overlay */}
        {showConsensus && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="text-center animate-in zoom-in duration-500">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Consensus Reached!</h2>
              <p className="text-text-secondary">All agents agree on the recommendation</p>
            </div>
          </div>
        )}
        
        {/* Stats overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-text-secondary">{Object.keys(agentStates).length} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-text-secondary">{Object.keys(messages).length} Speaking</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-text-secondary">{Object.keys(skills).length} Skills Active</span>
            </div>
          </div>
          
          <div className="text-xs text-text-muted">
            {scenario.name}
          </div>
        </div>
      </div>
      
      {/* Feature highlights */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="card p-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="font-medium text-text-primary mb-1">16 AI Agents</h3>
          <p className="text-sm text-text-secondary">Across 6 specialized teams working together</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-medium text-text-primary mb-1">Real-time Collab</h3>
          <p className="text-sm text-text-secondary">Agents communicate and share insights instantly</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="font-medium text-text-primary mb-1">Consensus Building</h3>
          <p className="text-sm text-text-secondary">3-round decision making for optimal outcomes</p>
        </div>
        <div className="card p-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-medium text-text-primary mb-1">Skill Showcase</h3>
          <p className="text-sm text-text-secondary">30+ specialized skills across all agents</p>
        </div>
      </div>
    </div>
  );
};

export default BotSwarmDemo;
