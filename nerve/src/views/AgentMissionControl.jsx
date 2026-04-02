/**
 * Agent Mission Control
 * Visual task execution dashboard - see agents working in real-time
 * Inspired by Pixel Agents / VS Code agent visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Play, Pause, RotateCcw, Terminal, CheckCircle, 
  Clock, AlertCircle, Cpu, Activity, Zap, Target,
  Code, FileText, Search, Database, Globe, Sparkles,
  ChevronRight, ChevronDown, XCircle, Loader2, Eye,
  MessageSquare, Settings, Plus, Trash2, RefreshCw
} from 'lucide-react';
import AgentVisualTask from '../components/Agent/AgentVisualTask';

// Task types with icons
const TASK_TYPES = {
  code: { icon: Code, color: '#3b82f6', label: 'Code Generation' },
  research: { icon: Search, color: '#8b5cf6', label: 'Research' },
  data: { icon: Database, color: '#10b981', label: 'Data Processing' },
  web: { icon: Globe, color: '#f59e0b', label: 'Web Scraping' },
  analysis: { icon: Activity, color: '#ec4899', label: 'Analysis' },
  write: { icon: FileText, color: '#06b6d4', label: 'Content Writing' },
  verify: { icon: CheckCircle, color: '#65a30d', label: 'Fact Checking' },
  ideate: { icon: Sparkles, color: '#0ea5e9', label: 'Ideation' },
};

// Mock agents
const AGENTS = [
  { id: 'agent-1', name: 'CodeBuilder', type: 'Developer', status: 'idle', skills: ['React', 'Python', 'CSS'], avatar: '👨‍💻' },
  { id: 'agent-2', name: 'DataMiner', type: 'Analyst', status: 'idle', skills: ['SQL', 'Pandas', 'APIs'], avatar: '👩‍💻' },
  { id: 'agent-3', name: 'WebScout', type: 'Researcher', status: 'idle', skills: ['Scraping', 'Search', 'Validation'], avatar: '🔍' },
  { id: 'agent-4', name: 'ContentBot', type: 'Writer', status: 'idle', skills: ['Copy', 'Docs', 'Markdown'], avatar: '✍️' },
  { id: 'agent-5', name: 'TestRunner', type: 'QA', status: 'idle', skills: ['Testing', 'Debugging', 'Review'], avatar: '🧪' },
  { id: 'agent-6', name: 'Skeptic', type: 'Fact Checker', status: 'idle', skills: ['Validation', 'Sources', 'Logic'], avatar: '🔍' },
  { id: 'agent-7', name: 'Spark', type: 'Ideation', status: 'idle', skills: ['Brainstorming', 'Optimization', 'Strategy'], avatar: '💡' },
];

// Mock tasks queue
const INITIAL_TASKS = [
  { id: 1, title: 'Create PropertyCard component', type: 'code', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 2, title: 'Research Toronto market trends', type: 'research', priority: 'medium', status: 'pending', agent: null, progress: 0 },
  { id: 3, title: 'Scrape agent contact data', type: 'web', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 4, title: 'Write API documentation', type: 'write', priority: 'low', status: 'pending', agent: null, progress: 0 },
  { id: 5, title: 'Analyze buyer patterns', type: 'analysis', priority: 'medium', status: 'pending', agent: null, progress: 0 },
  { id: 6, title: 'Process database exports', type: 'data', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 7, title: 'Build dashboard widget', type: 'code', priority: 'medium', status: 'pending', agent: null, progress: 0 },
  { id: 8, title: 'Research zoning laws', type: 'research', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 9, title: 'Monitor price changes', type: 'web', priority: 'medium', status: 'pending', agent: null, progress: 0 },
  { id: 10, title: 'Draft email campaign', type: 'write', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 11, title: 'Score lead quality', type: 'analysis', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 12, title: 'Sync CRM records', type: 'data', priority: 'low', status: 'pending', agent: null, progress: 0 },
  { id: 13, title: 'Verify market report claims', type: 'verify', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 14, title: 'Fact-check listing descriptions', type: 'verify', priority: 'medium', status: 'pending', agent: null, progress: 0 },
  { id: 15, title: 'Optimize outreach workflow', type: 'ideate', priority: 'high', status: 'pending', agent: null, progress: 0 },
  { id: 16, title: 'Rethink buyer matching strategy', type: 'ideate', priority: 'medium', status: 'pending', agent: null, progress: 0 },
];

// Agent thought process simulation
const AGENT_THOUGHTS = {
  code: [
    'Analyzing requirements...',
    'Setting up component structure...',
    'Writing JSX markup...',
    'Adding Tailwind classes...',
    'Implementing state management...',
    'Adding event handlers...',
    'Testing component...',
    'Refactoring for optimization...',
  ],
  research: [
    'Formulating search queries...',
    'Scanning sources...',
    'Collecting data points...',
    'Verifying information...',
    'Cross-referencing facts...',
    'Summarizing findings...',
    'Compiling report...',
  ],
  web: [
    'Initializing browser...',
    'Navigating to target site...',
    'Locating data elements...',
    'Extracting contact info...',
    'Handling pagination...',
    'Validating scraped data...',
    'Cleaning and formatting...',
  ],
  data: [
    'Connecting to database...',
    'Running query...',
    'Processing records...',
    'Transforming data...',
    'Aggregating results...',
    'Generating exports...',
  ],
  analysis: [
    'Loading datasets...',
    'Running statistical models...',
    'Identifying patterns...',
    'Calculating metrics...',
    'Generating insights...',
    'Creating visualizations...',
  ],
  write: [
    'Researching topic...',
    'Outlining structure...',
    'Drafting content...',
    'Adding technical details...',
    'Reviewing for clarity...',
    'Polishing final version...',
  ],
  verify: [
    'Cross-referencing sources...',
    'Checking data consistency...',
    'Validating claims...',
    'Looking for contradictions...',
    'Confirming with external sources...',
    'Flagging uncertain statements...',
  ],
  ideate: [
    'Brainstorming angles...',
    'Connecting disparate concepts...',
    'Questioning assumptions...',
    'Evaluating trade-offs...',
    'Synthesizing best approach...',
    'Prioritizing by impact...',
  ],
};

const AgentMissionControl = () => {
  const [agents, setAgents] = useState(AGENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [agentLogs, setAgentLogs] = useState({});
  const [showLogs, setShowLogs] = useState(true);
  const [taskHistory, setTaskHistory] = useState([]);
  const simulationRef = useRef(null);
  const logsEndRef = useRef(null);
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);
  
  // Simulation loop
  useEffect(() => {
    if (!isRunning) {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
      return;
    }
    
    simulationRef.current = setInterval(() => {
      setTasks(prevTasks => {
        const newTasks = [...prevTasks];
        let hasChanges = false;
        
        // Find pending tasks and assign to idle agents
        const idleAgents = agents.filter(a => a.status === 'idle');
        const pendingTasks = newTasks.filter(t => t.status === 'pending');
        
        if (idleAgents.length > 0 && pendingTasks.length > 0) {
          const agent = idleAgents[0];
          const task = pendingTasks[0];
          
          // Assign task to agent
          task.status = 'in-progress';
          task.agent = agent.id;
          task.startTime = Date.now();
          
          // Update agent status
          setAgents(prev => prev.map(a => 
            a.id === agent.id 
              ? { ...a, status: 'working', currentTask: task.id }
              : a
          ));
          
          // Add log
          addLog(agent.id, `🚀 Started task: ${task.title}`, 'info');
          hasChanges = true;
        }
        
        // Progress in-progress tasks
        newTasks.forEach(task => {
          if (task.status === 'in-progress' && task.agent) {
            const increment = Math.random() * 6 + 2;
            task.progress = Math.min(task.progress + increment, 100);
            
            // Add random thought/process log
            if (Math.random() > 0.7) {
              const thoughts = AGENT_THOUGHTS[task.type] || ['Processing...'];
              const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
              addLog(task.agent, `💭 ${thought}`, 'thought');
            }
            
            // Task complete
            if (task.progress >= 100) {
              task.status = 'completed';
              task.completedAt = Date.now();
              
              // Free up agent
              setAgents(prev => prev.map(a => 
                a.id === task.agent 
                  ? { ...a, status: 'idle', currentTask: null }
                  : a
              ));
              
              addLog(task.agent, `✅ Completed: ${task.title}`, 'success');
              
              // Move to completed
              setCompletedTasks(prev => [task, ...prev]);
              
              // Add to history
              setTaskHistory(prev => [...prev, {
                task: task.title,
                agent: agents.find(a => a.id === task.agent)?.name,
                completedAt: new Date().toISOString(),
                duration: '2.5s'
              }]);
            }
            
            hasChanges = true;
          }
        });
        
        return hasChanges ? newTasks.filter(t => t.status !== 'completed') : newTasks;
      });
    }, 1500);
    
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [isRunning, agents]);
  
  const addLog = (agentId, message, type = 'info') => {
    setAgentLogs(prev => ({
      ...prev,
      [agentId]: [
        ...(prev[agentId] || []),
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type
        }
      ].slice(-20) // Keep last 20 logs
    }));
  };
  
  const addNewTask = () => {
    const types = Object.keys(TASK_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const titles = {
      code: ['Build dashboard widget', 'Fix API endpoint', 'Add auth middleware', 'Create form component'],
      research: ['Analyze competitor data', 'Research market trends', 'Find investor leads', 'Study zoning laws'],
      web: ['Scrape property listings', 'Extract agent emails', 'Monitor price changes', 'Collect reviews'],
      data: ['Clean dataset', 'Generate reports', 'Sync databases', 'Backup records'],
      analysis: ['Predict pricing', 'Score leads', 'Forecast trends', 'Analyze portfolios'],
      write: ['Draft email campaign', 'Write blog post', 'Create documentation', 'Summarize findings'],
      verify: ['Validate source claims', 'Fact-check report data', 'Verify contact details', 'Audit listing accuracy'],
      ideate: ['Brainstorm workflow improvements', 'Design faster pipeline', 'Rethink outreach strategy', 'Propose new feature'],
    };
    const randomTitle = titles[randomType][Math.floor(Math.random() * titles[randomType].length)];
    
    const newTask = {
      id: Date.now(),
      title: randomTitle,
      type: randomType,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      status: 'pending',
      agent: null,
      progress: 0
    };
    
    setTasks(prev => [...prev, newTask]);
  };
  
  const resetSimulation = () => {
    setIsRunning(false);
    setTasks(INITIAL_TASKS);
    setCompletedTasks([]);
    setAgents(AGENTS);
    setAgentLogs({});
    setTaskHistory([]);
  };
  
  const getAgentById = (id) => agents.find(a => a.id === id);
  const getTaskTypeConfig = (type) => TASK_TYPES[type] || TASK_TYPES.code;
  
  const stats = {
    total: tasks.length + completedTasks.length,
    completed: completedTasks.length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    activeAgents: agents.filter(a => a.status === 'working').length
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="h-14 bg-bg-card border-b border-border-subtle flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-text-primary">Agent Mission Control</h1>
            <p className="text-xs text-text-secondary">Visual Task Execution System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-text-secondary">{stats.completed} Done</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-text-secondary">{stats.inProgress} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-text-secondary">{stats.pending} Queued</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={addNewTask}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              onClick={resetSimulation}
              className="p-2 bg-bg-input hover:bg-bg-primary border border-border-subtle rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Agents */}
        <div className="w-80 bg-bg-card border-r border-border-subtle flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              Active Agents ({stats.activeAgents}/{agents.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {agents.map(agent => {
              const isWorking = agent.status === 'working';
              const currentTask = tasks.find(t => t.id === agent.currentTask);
              const taskConfig = currentTask ? getTaskTypeConfig(currentTask.type) : null;
              
              return (
                <div 
                  key={agent.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isWorking 
                      ? 'bg-cyan-500/10 border-cyan-500/50' 
                      : 'bg-bg-input border-border-subtle'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{agent.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-text-primary">{agent.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isWorking 
                            ? 'bg-cyan-500/20 text-cyan-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {isWorking ? 'Working' : 'Idle'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">{agent.type}</p>
                      
                      {isWorking && currentTask && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            {taskConfig && <taskConfig.icon className="w-3 h-3" style={{ color: taskConfig.color }} />}
                            <span className="text-xs text-text-secondary truncate">
                              {currentTask.title}
                            </span>
                          </div>
                          <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${currentTask.progress}%`,
                                backgroundColor: taskConfig?.color || '#3b82f6'
                              }}
                            />
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            {Math.round(currentTask.progress)}%
                          </p>
                          <div className="mt-2 h-16 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 overflow-hidden flex items-center justify-center">
                            <AgentVisualTask 
                              agentId={agent.id} 
                              status={agent.status} 
                              taskType={currentTask.type}
                            />
                          </div>
                        </div>
                      )}
                      {!isWorking && (
                        <div className="mt-2 h-16 rounded-xl bg-gradient-to-br from-slate-500/5 to-slate-500/10 border border-border-subtle/50 overflow-hidden flex items-center justify-center">
                          <AgentVisualTask 
                            agentId={agent.id} 
                            status="idle"
                          />
                        </div>
                      )}
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.skills.map(skill => (
                          <span key={skill} className="text-xs px-2 py-0.5 bg-bg-primary rounded text-text-muted">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Center Panel - Tasks */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Task Queue */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" />
                Task Queue
              </h2>
              <span className="text-sm text-text-secondary">
                {tasks.length} tasks remaining
              </span>
            </div>
            
            <div className="space-y-3">
              {tasks.map(task => {
                const config = getTaskTypeConfig(task.type);
                const agent = task.agent ? getAgentById(task.agent) : null;
                const isSelected = selectedTask?.id === task.id;
                
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-purple-500/10 border-purple-500/50' 
                        : 'bg-bg-card border-border-subtle hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <config.icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-text-primary">{task.title}</h3>
                            <p className="text-xs text-text-secondary">{config.label}</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 overflow-hidden flex items-center justify-center">
                            <AgentVisualTask agentId="agent-1" status="active" taskType={task.type} />
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {/* Progress */}
                        {task.status === 'in-progress' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-text-secondary">
                                {agent ? `Working by ${agent.name}` : 'Assigning...'}
                              </span>
                              <span className="text-xs font-medium" style={{ color: config.color }}>
                                {Math.round(task.progress)}%
                              </span>
                            </div>
                            <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${task.progress}%`,
                                  backgroundColor: config.color
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {task.status === 'pending' && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            Waiting for available agent...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {tasks.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>All tasks completed!</p>
                  <button 
                    onClick={addNewTask}
                    className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg text-sm"
                  >
                    Add New Task
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="h-48 border-t border-border-subtle bg-bg-card p-4">
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                ✅ Completed ({completedTasks.length})
              </h3>
              <div className="flex gap-3 overflow-x-auto">
                {completedTasks.slice(0, 10).map(task => {
                  const config = getTaskTypeConfig(task.type);
                  return (
                    <div 
                      key={task.id}
                      className="flex-shrink-0 w-48 p-3 bg-bg-primary rounded-lg border border-green-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" style={{ color: config.color }} />
                        <span className="text-sm text-text-primary truncate">{task.title}</span>
                      </div>
                      <p className="text-xs text-green-400 mt-1">✓ Completed</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Live Logs */}
        {showLogs && (
          <div className="w-96 bg-bg-card border-l border-border-subtle flex flex-col">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                Live Agent Logs
              </h2>
              <button 
                onClick={() => setShowLogs(false)}
                className="p-1 hover:bg-bg-input rounded"
              >
                <XCircle className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {agents.map(agent => {
                const logs = agentLogs[agent.id] || [];
                if (logs.length === 0) return null;
                
                return (
                  <div key={agent.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-text-muted sticky top-0 bg-bg-card py-1">
                      <span className="text-lg">{agent.avatar}</span>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="space-y-1 pl-6">
                      {logs.slice(-5).map((log, idx) => (
                        <div 
                          key={idx}
                          className={`text-xs ${
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'thought' ? 'text-purple-400' :
                            'text-text-secondary'
                          }`}
                        >
                          <span className="text-text-muted">[{log.timestamp}]</span>{' '}
                          {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(agentLogs).length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Start the simulation to see agent activity</p>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
      
      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="bg-bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border-subtle">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{selectedTask.title}</h2>
                  <p className="text-text-secondary mt-1">
                    {getTaskTypeConfig(selectedTask.type).label}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-bg-input rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Progress */}
              <div>
                <label className="text-xs text-text-muted uppercase">Progress</label>
                <div className="mt-2 h-3 bg-bg-input rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${selectedTask.progress}%`,
                      backgroundColor: getTaskTypeConfig(selectedTask.type).color
                    }}
                  />
                </div>
                <p className="text-right text-sm text-text-secondary mt-1">
                  {Math.round(selectedTask.progress)}%
                </p>
              </div>
              
              {/* Assigned Agent */}
              {selectedTask.agent && (
                <div>
                  <label className="text-xs text-text-muted uppercase">Assigned Agent</label>
                  <div className="mt-2 flex items-center gap-3 p-3 bg-bg-input rounded-xl">
                    <span className="text-2xl">{getAgentById(selectedTask.agent)?.avatar}</span>
                    <div>
                      <p className="font-medium text-text-primary">
                        {getAgentById(selectedTask.agent)?.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {getAgentById(selectedTask.agent)?.type}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recent Logs */}
              <div>
                <label className="text-xs text-text-muted uppercase">Recent Activity</label>
                <div className="mt-2 space-y-1">
                  {(agentLogs[selectedTask.agent] || [])
                    .slice(-5)
                    .map((log, idx) => (
                      <div key={idx} className="text-sm text-text-secondary">
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentMissionControl;
