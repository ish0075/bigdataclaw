/**
 * Agent Workspace - Individual AI Agent Dashboard
 * Full workspace with tasks, memory, tools, SoulMD, and Commander chat
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bot, CheckCircle, Circle, Clock, AlertCircle, Brain, 
  MessageSquare, Wrench, History, Target, Shield, Zap,
  Send, ChevronDown, ChevronUp, MoreHorizontal, Plus,
  Trash2, Edit3, Save, X, Filter, Search, Layout,
  BookOpen, Activity, Sparkles, Users, Command, Radio
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Task Status Badge Component
const TaskStatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    blocked: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Review',
    completed: 'Completed',
    blocked: 'Blocked'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// Priority Indicator Component
const PriorityIndicator = ({ priority }) => {
  const styles = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400'
  };
  
  return (
    <div className={`flex items-center gap-1 ${styles[priority] || styles.medium}`}>
      <AlertCircle className="w-3 h-3" />
      <span className="text-xs uppercase font-medium">{priority}</span>
    </div>
  );
};

// SoulMD Display Component
const SoulMDPanel = ({ soulmd, isEditing, onEdit, onSave, onCancel }) => {
  const [editedSoul, setEditedSoul] = useState(soulmd || {});
  
  if (!soulmd && !isEditing) {
    return (
      <div className="card p-6 text-center">
        <Brain className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary">No SoulMD defined for this agent</p>
        <button 
          onClick={onEdit}
          className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-medium hover:opacity-90"
        >
          Define SoulMD
        </button>
      </div>
    );
  }
  
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Edit SoulMD
          </h3>
          <div className="flex gap-2">
            <button onClick={onCancel} className="p-2 hover:bg-bg-input rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSave(editedSoul)}
              className="px-3 py-1.5 bg-green-600 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Save
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary uppercase block mb-1">Purpose</label>
            <textarea
              value={editedSoul.purpose || ''}
              onChange={(e) => setEditedSoul({...editedSoul, purpose: e.target.value})}
              className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              rows={3}
              placeholder="Agent's primary mission..."
            />
          </div>
          
          <div>
            <label className="text-xs text-text-secondary uppercase block mb-1">Personality</label>
            <input
              type="text"
              value={editedSoul.personality || ''}
              onChange={(e) => setEditedSoul({...editedSoul, personality: e.target.value})}
              className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              placeholder="Agent's personality traits..."
            />
          </div>
          
          <div>
            <label className="text-xs text-text-secondary uppercase block mb-1">Voice</label>
            <input
              type="text"
              value={editedSoul.voice || ''}
              onChange={(e) => setEditedSoul({...editedSoul, voice: e.target.value})}
              className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              placeholder="Communication style..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Skills (comma separated)</label>
              <input
                type="text"
                value={(editedSoul.skills || []).join(', ')}
                onChange={(e) => setEditedSoul({...editedSoul, skills: e.target.value.split(',').map(s => s.trim())})}
                className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Goals (comma separated)</label>
              <input
                type="text"
                value={(editedSoul.goals || []).join(', ')}
                onChange={(e) => setEditedSoul({...editedSoul, goals: e.target.value.split(',').map(s => s.trim())})}
                className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-text-secondary uppercase block mb-1">Boundaries</label>
            <textarea
              value={(editedSoul.boundaries || []).join('\n')}
              onChange={(e) => setEditedSoul({...editedSoul, boundaries: e.target.value.split('\n')})}
              className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-sm text-text-primary"
              rows={3}
              placeholder="One boundary per line..."
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          SoulMD
        </h3>
        <button 
          onClick={onEdit}
          className="p-2 hover:bg-bg-input rounded-lg text-text-secondary hover:text-text-primary"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <h4 className="text-xs text-purple-400 uppercase font-medium mb-1">Purpose</h4>
          <p className="text-sm text-text-primary">{soulmd.purpose}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-bg-input rounded-lg">
            <h4 className="text-xs text-text-secondary uppercase mb-1">Personality</h4>
            <p className="text-sm text-text-primary">{soulmd.personality}</p>
          </div>
          <div className="p-3 bg-bg-input rounded-lg">
            <h4 className="text-xs text-text-secondary uppercase mb-1">Voice</h4>
            <p className="text-sm text-text-primary">{soulmd.voice}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs text-text-secondary uppercase mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {(soulmd.skills || []).map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs text-text-secondary uppercase mb-2">Goals</h4>
            <ul className="space-y-1">
              {(soulmd.goals || []).map((goal, idx) => (
                <li key={idx} className="text-sm text-text-secondary flex items-center gap-2">
                  <Target className="w-3 h-3 text-green-400" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs text-text-secondary uppercase mb-2">Boundaries</h4>
          <ul className="space-y-1">
            {(soulmd.boundaries || []).map((boundary, idx) => (
              <li key={idx} className="text-sm text-text-secondary flex items-center gap-2">
                <Shield className="w-3 h-3 text-amber-400" />
                {boundary}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Task Manager Component
const TaskManager = ({ agentId, tasks, onTaskUpdate, onTaskCreate, onTaskDelete }) => {
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [filter, setFilter] = useState('all');
  
  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });
  
  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    onTaskCreate(newTask);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setShowNewTask(false);
  };
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Tasks
          <span className="px-2 py-0.5 bg-bg-input rounded-full text-xs text-text-secondary">
            {tasks.length}
          </span>
        </h3>
        <button 
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
              filter === f 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'text-text-secondary hover:bg-bg-input'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      
      {/* New Task Form */}
      {showNewTask && (
        <div className="mb-4 p-4 bg-bg-input rounded-xl border border-cyan-500/30">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            placeholder="Task title..."
            className="w-full mb-2 p-2 bg-bg-primary border border-border-subtle rounded-lg text-sm"
            autoFocus
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            placeholder="Description..."
            className="w-full mb-2 p-2 bg-bg-primary border border-border-subtle rounded-lg text-sm"
            rows={2}
          />
          <div className="flex items-center justify-between">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              className="px-3 py-1 bg-bg-primary border border-border-subtle rounded-lg text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNewTask(false)}
                className="px-3 py-1 text-text-secondary hover:text-text-primary text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTask}
                className="px-3 py-1 bg-green-600 rounded-lg text-sm font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Task List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <p className="text-text-muted text-center py-8">No tasks found</p>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.task_id} 
              className={`p-3 rounded-xl border ${
                task.status === 'completed' 
                  ? 'bg-green-500/5 border-green-500/20 opacity-60' 
                  : 'bg-bg-input border-border-subtle'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => onTaskUpdate(task.task_id, { 
                        status: task.status === 'completed' ? 'pending' : 'completed' 
                      })}
                      className="text-text-secondary hover:text-green-400"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <span className={`text-sm font-medium ${
                      task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'
                    }`}>
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-text-secondary ml-7 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 ml-7">
                    <TaskStatusBadge status={task.status} />
                    <PriorityIndicator priority={task.priority} />
                    {task.deadline && (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onTaskDelete(task.task_id)}
                  className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Memory Panel Component
const MemoryPanel = ({ memories, onCreateMemory }) => {
  const [showNewMemory, setShowNewMemory] = useState(false);
  const [newMemory, setNewMemory] = useState({ content: '', memory_type: 'observation', importance: 5 });
  
  const handleCreate = () => {
    if (!newMemory.content.trim()) return;
    onCreateMemory(newMemory);
    setNewMemory({ content: '', memory_type: 'observation', importance: 5 });
    setShowNewMemory(false);
  };
  
  const memoryTypeColors = {
    observation: 'bg-blue-500/20 text-blue-400',
    learning: 'bg-green-500/20 text-green-400',
    conversation: 'bg-purple-500/20 text-purple-400',
    achievement: 'bg-amber-500/20 text-amber-400',
    error: 'bg-red-500/20 text-red-400'
  };
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          Memory
          <span className="px-2 py-0.5 bg-bg-input rounded-full text-xs text-text-secondary">
            {memories.length}
          </span>
        </h3>
        <button 
          onClick={() => setShowNewMemory(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </button>
      </div>
      
      {showNewMemory && (
        <div className="mb-4 p-4 bg-bg-input rounded-xl border border-amber-500/30">
          <textarea
            value={newMemory.content}
            onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
            placeholder="Store a memory, observation, or learning..."
            className="w-full mb-2 p-2 bg-bg-primary border border-border-subtle rounded-lg text-sm"
            rows={3}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <select
              value={newMemory.memory_type}
              onChange={(e) => setNewMemory({...newMemory, memory_type: e.target.value})}
              className="px-3 py-1 bg-bg-primary border border-border-subtle rounded-lg text-sm"
            >
              <option value="observation">Observation</option>
              <option value="learning">Learning</option>
              <option value="conversation">Conversation</option>
              <option value="achievement">Achievement</option>
              <option value="error">Error</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Importance:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={newMemory.importance}
                onChange={(e) => setNewMemory({...newMemory, importance: parseInt(e.target.value)})}
                className="w-20"
              />
              <span className="text-xs text-text-primary w-4">{newMemory.importance}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNewMemory(false)}
                className="px-3 py-1 text-text-secondary hover:text-text-primary text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="px-3 py-1 bg-amber-600 rounded-lg text-sm font-medium"
              >
                Store
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {memories.length === 0 ? (
          <p className="text-text-muted text-center py-8">No memories stored yet</p>
        ) : (
          memories.map(memory => (
            <div key={memory.id} className="p-3 bg-bg-input rounded-xl border border-border-subtle">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${memoryTypeColors[memory.memory_type] || memoryTypeColors.observation}`}>
                  {memory.memory_type}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < memory.importance ? 'bg-amber-400' : 'bg-bg-primary'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-text-primary">{memory.content}</p>
              {memory.summary && (
                <p className="text-xs text-text-secondary mt-1">{memory.summary}</p>
              )}
              <p className="text-xs text-text-muted mt-2">
                {new Date(memory.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Commander Chat Component
const CommanderChat = ({ agentId, conversations, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);
  
  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage('');
  };
  
  return (
    <div className="card p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400" />
          Commander Link
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Connected</span>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-xs mt-1">Communicate with your agent here</p>
          </div>
        ) : (
          [...conversations].reverse().map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' || msg.role === 'commander' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'user' || msg.role === 'commander'
                    ? 'bg-cyan-600 text-white rounded-br-md' 
                    : 'bg-bg-input text-text-primary rounded-bl-md'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.role === 'user' || msg.role === 'commander' ? 'text-cyan-200' : 'text-text-muted'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message your agent..."
          className="flex-1 px-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-sm focus:border-cyan-500"
        />
        <button 
          onClick={handleSend}
          className="p-2 bg-cyan-600 rounded-xl hover:bg-cyan-700"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Tools Panel Component
const ToolsPanel = ({ tools }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          Tools & Skills
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-xl border ${
              tool.enabled 
                ? 'bg-cyan-500/10 border-cyan-500/30' 
                : 'bg-bg-input border-border-subtle opacity-50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`w-4 h-4 ${tool.enabled ? 'text-cyan-400' : 'text-text-muted'}`} />
              <span className="text-sm font-medium text-text-primary capitalize">
                {tool.tool_name.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-text-secondary capitalize">{tool.tool_type}</p>
            {tool.requires_approval && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                Requires Approval
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main AgentWorkspace Component
const AgentWorkspace = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [memories, setMemories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [tools, setTools] = useState([]);
  const [editingSoul, setEditingSoul] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Load workspace data
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        
        // Load workspace details
        const wsRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}`);
        if (!wsRes.ok) throw new Error('Workspace not found');
        const wsData = await wsRes.json();
        setWorkspace(wsData);
        
        // Load tasks
        const tasksRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks`);
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
        
        // Load memories
        const memRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/memory`);
        const memData = await memRes.json();
        setMemories(memData);
        
        // Load conversations
        const convRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/conversations`);
        const convData = await convRes.json();
        setConversations(convData);
        
        // Load tools (mock for now)
        setTools([
          { tool_name: 'search', tool_type: 'core', enabled: true, requires_approval: false },
          { tool_name: 'api_call', tool_type: 'core', enabled: true, requires_approval: false },
          { tool_name: 'context_keep_read', tool_type: 'memory', enabled: true, requires_approval: false },
          { tool_name: 'context_keep_write', tool_type: 'memory', enabled: true, requires_approval: false },
          { tool_name: 'chat_commander', tool_type: 'communication', enabled: true, requires_approval: false },
          { tool_name: 'delegate_assistant', tool_type: 'delegation', enabled: true, requires_approval: true },
        ]);
        
      } catch (error) {
        console.error('Failed to load workspace:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (agentId) {
      loadWorkspace();
    }
  }, [agentId]);
  
  // Task handlers
  const handleTaskCreate = async (taskData) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        const tasksRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks`);
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };
  
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const tasksRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks`);
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };
  
  const handleTaskDelete = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.task_id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  // Memory handler
  const handleCreateMemory = async (memoryData) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryData)
      });
      if (res.ok) {
        const memRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/memory`);
        const memData = await memRes.json();
        setMemories(memData);
      }
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };
  
  // Chat handler
  const handleSendMessage = async (content) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, requires_response: true })
      });
      if (res.ok) {
        const convRes = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/conversations`);
        const convData = await convRes.json();
        setConversations(convData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  // SoulMD handlers
  const handleSaveSoulMD = async (soulmd) => {
    try {
      const res = await fetch(`${API_BASE}/api/agents/workspaces/${agentId}/soulmd`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(soulmd)
      });
      if (res.ok) {
        setWorkspace({ ...workspace, soulmd });
        setEditingSoul(false);
      }
    } catch (error) {
      console.error('Failed to update SoulMD:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Loading Agent Workspace...
        </div>
      </div>
    );
  }
  
  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Agent workspace not found</p>
        <button 
          onClick={() => navigate('/agent-workspaces')}
          className="mt-4 px-4 py-2 bg-cyan-600 rounded-lg"
        >
          View All Workspaces
        </button>
      </div>
    );
  }
  
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-3xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{workspace.agent_name}</h1>
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                  {workspace.agent_type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  workspace.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {workspace.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                <span className="flex items-center gap-1">
                  <Command className="w-4 h-4" />
                  {workspace.division}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Mood: {workspace.mood}
                </span>
                {workspace.current_activity && (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                    {workspace.current_activity}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/commander-dashboard/${workspace.commander_id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-input hover:bg-bg-primary border border-border-subtle rounded-xl text-sm"
            >
              <Users className="w-4 h-4" />
              View Commander
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-sm font-medium">
              <Radio className="w-4 h-4" />
              Contact
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{tasks.length}</p>
              <p className="text-xs text-text-secondary">Total Tasks</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{pendingTasks}</p>
              <p className="text-xs text-text-secondary">Pending</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{inProgressTasks}</p>
              <p className="text-xs text-text-secondary">In Progress</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{memories.length}</p>
              <p className="text-xs text-text-secondary">Memories</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - SoulMD & Tasks */}
        <div className="col-span-4 space-y-6">
          <SoulMDPanel 
            soulmd={workspace.soulmd}
            isEditing={editingSoul}
            onEdit={() => setEditingSoul(true)}
            onSave={handleSaveSoulMD}
            onCancel={() => setEditingSoul(false)}
          />
          
          <TaskManager 
            agentId={agentId}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskDelete={handleTaskDelete}
          />
        </div>
        
        {/* Middle Column - Memory & Tools */}
        <div className="col-span-4 space-y-6">
          <MemoryPanel 
            memories={memories}
            onCreateMemory={handleCreateMemory}
          />
          
          <ToolsPanel tools={tools} />
          
          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-purple-400" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
                <div>
                  <p className="text-text-primary">Task completed: Analyze buyer portfolio</p>
                  <p className="text-xs text-text-muted">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                <div>
                  <p className="text-text-primary">Memory stored: Learned new buyer pattern</p>
                  <p className="text-xs text-text-muted">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                <div>
                  <p className="text-text-primary">New task assigned: Research properties</p>
                  <p className="text-xs text-text-muted">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Commander Chat */}
        <div className="col-span-4">
          <CommanderChat 
            agentId={agentId}
            conversations={conversations}
            onSendMessage={handleSendMessage}
          />
          
          {/* Assistant Delegation */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-pink-400" />
              Assistant Delegation
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-bg-input rounded-xl border border-border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">Research Assistant</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">Handling property research subtasks</p>
              </div>
              <div className="p-3 bg-bg-input rounded-xl border border-border-subtle opacity-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">Data Entry Assistant</span>
                  <span className="px-2 py-0.5 bg-text-muted/20 text-text-muted rounded text-xs">Idle</span>
                </div>
              </div>
              <button className="w-full py-2 border border-dashed border-border-subtle rounded-xl text-text-secondary hover:text-text-primary hover:border-cyan-500 text-sm">
                + Delegate New Assistant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
