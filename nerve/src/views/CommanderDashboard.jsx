/**
 * Commander Dashboard
 * Division oversight, agent monitoring, and reporting to Supreme Commander
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, CheckCircle, AlertCircle, Send, FileText,
  TrendingUp, Clock, Bot, Radio, MessageSquare, ChevronRight,
  Target, Zap, Shield, Bell, BarChart3, LayoutDashboard
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CommanderDashboard = () => {
  const { commanderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/agents/commanders/${commanderId}/dashboard`);
        if (!res.ok) throw new Error('Dashboard not found');
        const data = await res.json();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (commanderId) {
      loadDashboard();
    }
  }, [commanderId]);
  
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/agents/commanders/${commanderId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: broadcastMessage, requires_response: false })
      });
      
      if (res.ok) {
        setBroadcastMessage('');
        setShowBroadcast(false);
        alert('Broadcast sent to all agents in division');
      }
    } catch (error) {
      console.error('Failed to broadcast:', error);
    }
  };
  
  const generateReport = async () => {
    // In production, this would generate and send a report
    alert(`Report generated for ${dashboard?.commander?.division} Division`);
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Loading Commander Dashboard...
        </div>
      </div>
    );
  }
  
  if (!dashboard) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Commander dashboard not found</p>
      </div>
    );
  }
  
  const { commander, agents, task_stats, alerts, recent_reports } = dashboard;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'busy': return 'bg-amber-500/20 text-amber-400';
      case 'idle': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-bg-input text-text-secondary';
    }
  };
  
  const completionRate = task_stats.total_tasks > 0 
    ? Math.round((task_stats.completed / task_stats.total_tasks) * 100) 
    : 0;
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{commander.name}</h1>
                <p className="text-text-secondary">{commander.title} • {commander.division} Division</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBroadcast(!showBroadcast)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-input hover:bg-bg-primary border border-border-subtle rounded-xl text-sm"
            >
              <Radio className="w-4 h-4" />
              Broadcast
            </button>
            <button 
              onClick={generateReport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
        
        {/* Broadcast Panel */}
        {showBroadcast && (
          <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Broadcast message to all agents in division..."
                className="flex-1 px-4 py-2 bg-bg-primary border border-border-subtle rounded-lg text-text-primary"
                autoFocus
              />
              <button 
                onClick={handleBroadcast}
                className="px-4 py-2 bg-cyan-600 rounded-lg font-medium"
              >
                <Send className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowBroadcast(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-text-secondary">Total Agents</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{agents.length}</p>
          <p className="text-xs text-green-400 mt-1">
            {agents.filter(a => a.status === 'active').length} active
          </p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-text-secondary">Total Tasks</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{task_stats.total_tasks || 0}</p>
          <p className="text-xs text-text-secondary mt-1">
            {task_stats.active_tasks || 0} in progress
          </p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-text-secondary">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{completionRate}%</p>
          <p className="text-xs text-text-secondary mt-1">
            {task_stats.completed || 0} completed
          </p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-text-secondary">Pending</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{task_stats.pending || 0}</p>
          <p className="text-xs text-amber-400 mt-1">
            {task_stats.critical_open || 0} critical
          </p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-text-secondary">Alerts</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{alerts.length}</p>
          <p className="text-xs text-red-400 mt-1">
            Requires attention
          </p>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Agent Fleet */}
        <div className="col-span-2 space-y-6">
          {/* Agent Status */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                Agent Fleet Status
              </h3>
              <span className="text-xs text-text-secondary">
                {agents.filter(a => a.status === 'active').length} of {agents.length} active
              </span>
            </div>
            
            <div className="space-y-3">
              {agents.map(agent => (
                <div 
                  key={agent.agent_id}
                  onClick={() => navigate(`/agent-workspace/${agent.agent_id}`)}
                  className="flex items-center justify-between p-4 bg-bg-input rounded-xl hover:bg-bg-primary cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{agent.agent_name}</p>
                      <p className="text-xs text-text-secondary capitalize">{agent.agent_type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-text-secondary capitalize">{agent.mood}</p>
                      {agent.current_activity && (
                        <p className="text-xs text-cyan-400 truncate max-w-[150px]">
                          {agent.current_activity}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Task Progress */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Task Distribution
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">Pending</span>
                  <span className="text-text-primary">{task_stats.pending || 0}</span>
                </div>
                <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${task_stats.total_tasks ? (task_stats.pending / task_stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">In Progress</span>
                  <span className="text-text-primary">{task_stats.active_tasks || 0}</span>
                </div>
                <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${task_stats.total_tasks ? (task_stats.active_tasks / task_stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text-secondary">Completed</span>
                  <span className="text-text-primary">{task_stats.completed || 0}</span>
                </div>
                <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${task_stats.total_tasks ? (task_stats.completed / task_stats.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Alerts & Reports */}
        <div className="space-y-6">
          {/* Critical Alerts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-400" />
                Alerts
              </h3>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                  {alerts.length} new
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-text-muted text-center py-4">No alerts</p>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                        <p className="text-xs text-text-secondary">{alert.blocked_reason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-muted">{alert.agent_id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            alert.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Recent Reports */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              Recent Reports
            </h3>
            
            <div className="space-y-3">
              {recent_reports.length === 0 ? (
                <p className="text-text-muted text-center py-4">No reports yet</p>
              ) : (
                recent_reports.map((report, idx) => (
                  <div key={idx} className="p-3 bg-bg-input rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{report.title}</p>
                        <p className="text-xs text-text-secondary">{report.report_type}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        report.delivery_status === 'delivered' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {report.delivery_status}
                      </span>
                    </div>
                    {report.summary && (
                      <p className="text-xs text-text-secondary mt-1">{report.summary}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Actions
            </h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/agent-workspaces')}
                className="w-full p-3 bg-bg-input hover:bg-bg-primary rounded-xl text-left text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span className="text-text-primary">View All Agents</span>
                </div>
              </button>
              
              <button 
                onClick={() => setShowBroadcast(true)}
                className="w-full p-3 bg-bg-input hover:bg-bg-primary rounded-xl text-left text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  <span className="text-text-primary">Message All Agents</span>
                </div>
              </button>
              
              <button 
                onClick={generateReport}
                className="w-full p-3 bg-bg-input hover:bg-bg-primary rounded-xl text-left text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-text-primary">Send Status Report</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommanderDashboard;
