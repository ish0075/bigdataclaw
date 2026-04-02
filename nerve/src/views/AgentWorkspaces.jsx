/**
 * Agent Workspaces Overview
 * View all agent workspaces organized by division
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, Users, LayoutGrid, List, Search, Filter,
  ChevronRight, Activity, CheckCircle, Brain, Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentWorkspaces = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [commanders, setCommanders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filterDivision, setFilterDivision] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load workspaces
        const wsRes = await fetch('http://localhost:8000/api/agents/workspaces');
        const wsData = await wsRes.json();
        setWorkspaces(wsData);
        
        // Load commanders
        const cmdrRes = await fetch('http://localhost:8000/api/agents/commanders');
        const cmdrData = await cmdrRes.json();
        setCommanders(cmdrData);
        
        // Load division stats
        const statsRes = await fetch('http://localhost:8000/api/agents/divisions/stats');
        const statsData = await statsRes.json();
        setStats(statsData.divisions || {});
        
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const divisions = ['Intelligence', 'Recruitment', 'Capital', 'Operations', 'Monitoring', 'Strategy'];
  
  const filteredWorkspaces = workspaces.filter(ws => {
    const matchesDivision = filterDivision === 'all' || ws.division === filterDivision;
    const matchesSearch = !searchQuery || 
      ws.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.agent_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDivision && matchesSearch;
  });
  
  const getDivisionColor = (division) => {
    const colors = {
      'Intelligence': 'from-purple-600 to-indigo-600',
      'Recruitment': 'from-cyan-600 to-blue-600',
      'Capital': 'from-green-600 to-emerald-600',
      'Operations': 'from-orange-600 to-amber-600',
      'Monitoring': 'from-red-600 to-rose-600',
      'Strategy': 'from-pink-600 to-fuchsia-600'
    };
    return colors[division] || 'from-slate-600 to-slate-700';
  };
  
  const getDivisionIcon = (division) => {
    const icons = {
      'Intelligence': Brain,
      'Recruitment': Users,
      'Capital': Activity,
      'Operations': CheckCircle,
      'Monitoring': Radio,
      'Strategy': LayoutGrid
    };
    return icons[division] || Bot;
  };
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Loading Agent Workspaces...
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Agent Workspaces</h1>
            <p className="text-text-secondary">Manage your AI agent fleet across all divisions</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-bg-input border border-border-subtle rounded-xl hover:bg-bg-primary"
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Division Stats */}
        <div className="grid grid-cols-6 gap-4 mt-6">
          {divisions.map(division => {
            const divisionStats = stats[division] || { agents: 0, tasks: { total: 0, completed: 0 } };
            const Icon = getDivisionIcon(division);
            return (
              <button
                key={division}
                onClick={() => setFilterDivision(filterDivision === division ? 'all' : division)}
                className={`card p-4 text-left transition-all ${
                  filterDivision === division ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getDivisionColor(division)} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-text-primary">{division}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold text-text-primary">{divisionStats.agents}</span>
                  <span className="text-xs text-text-secondary">agents</span>
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  {divisionStats.tasks?.completed || 0}/{divisionStats.tasks?.total || 0} tasks
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or type..."
            className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-text-primary"
          />
        </div>
        <select
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          className="px-4 py-2 bg-bg-input border border-border-subtle rounded-xl text-text-primary"
        >
          <option value="all">All Divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      
      {/* Agents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-4">
          {filteredWorkspaces.map(workspace => {
            const commander = commanders.find(c => c.commander_id === workspace.commander_id);
            return (
              <div 
                key={workspace.agent_id}
                onClick={() => navigate(`/agent-workspace/${workspace.agent_id}`)}
                className="card p-5 cursor-pointer hover:border-cyan-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getDivisionColor(workspace.division)} flex items-center justify-center`}>
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    workspace.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {workspace.status}
                  </span>
                </div>
                
                <h3 className="font-semibold text-text-primary mb-1">{workspace.agent_name}</h3>
                <p className="text-xs text-text-secondary capitalize mb-3">{workspace.agent_type}</p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-bg-input rounded text-xs text-text-secondary">
                    {workspace.division}
                  </span>
                  {commander && (
                    <span className="px-2 py-0.5 bg-cyan-500/10 rounded text-xs text-cyan-400">
                      {commander.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <CheckCircle className="w-3 h-3" />
                      <span>12</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Brain className="w-3 h-3" />
                      <span>{workspace.mood}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-input border-b border-border-subtle">
              <tr>
                <th className="text-left text-xs font-medium text-text-secondary uppercase p-4">Agent</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase p-4">Division</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase p-4">Commander</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase p-4">Status</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase p-4">Mood</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkspaces.map(workspace => {
                const commander = commanders.find(c => c.commander_id === workspace.commander_id);
                return (
                  <tr 
                    key={workspace.agent_id}
                    onClick={() => navigate(`/agent-workspace/${workspace.agent_id}`)}
                    className="border-b border-border-subtle hover:bg-bg-input/50 cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getDivisionColor(workspace.division)} flex items-center justify-center`}>
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{workspace.agent_name}</p>
                          <p className="text-xs text-text-secondary capitalize">{workspace.agent_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-bg-input rounded text-sm text-text-secondary">
                        {workspace.division}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {commander?.name || 'Unassigned'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        workspace.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {workspace.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text-secondary capitalize">
                      {workspace.mood}
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="w-4 h-4 text-text-muted inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {filteredWorkspaces.length === 0 && (
        <div className="text-center py-16">
          <Bot className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No agents found</p>
          <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default AgentWorkspaces;
