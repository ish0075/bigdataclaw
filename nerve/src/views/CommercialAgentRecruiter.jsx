import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, Search, Mail, Phone, Linkedin, Building2, Briefcase,
  ChevronDown, ChevronUp, ExternalLink, Activity, Database, 
  RefreshCw, Globe, MessageCircle, MoreHorizontal, X, CheckCircle,
  ArrowUpRight, MessageSquare, Share2, FileText, Link2,
  BarChart3, TrendingUp, Edit2
} from 'lucide-react';
import UniversalEditModal from '../components/Common/UniversalEditModal';

// API Base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud';

// Custom WeChat Icon
const WeChatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
  </svg>
);

// Google "G" Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Extract name from email if name is missing
const getDisplayName = (agent) => {
  if (agent?.name && agent.name.trim()) return agent.name;
  
  // Try to extract from email
  const email = agent?.email || '';
  if (email && '@' in email) {
    const local = email.split('@')[0];
    const name = local.replace(/[._]/g, ' ').replace(/\d+$/, '');
    return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  
  return 'Unknown Agent';
};

// Generate Quick Links for commercial agent
const generateCommercialQuickLinks = (agent) => {
  const displayName = getDisplayName(agent);
  const encodedName = encodeURIComponent(displayName);
  const encodedCompany = encodeURIComponent(agent.company || '');
  
  return {
    // Main Links - Use Google search with realtor keyword for better results
    linkedin: `https://www.google.com/search?q=${encodedName}+realtor+linkedin`,
    linkedin_direct: `https://www.linkedin.com/search/results/people/?keywords=${encodedName}%20commercial`,
    email: agent.email ? `mailto:${agent.email}` : null,
    google: `https://www.google.com/search?q=${encodedName}+realtor`,
    
    // Commercial Platforms - Google search format for reliability
    loopnet: `https://www.google.com/search?q=${encodedName}+realtor+loopnet`,
    loopnet_direct: `https://www.loopnet.com/search?q=${encodedName}`,
    costar: `https://www.google.com/search?q=${encodedName}+realtor+costar`,
    
    // Company
    company: agent.company ? `https://www.google.com/search?q=${encodedCompany}+commercial+real+estate` : null,
    
    // Social
    facebook: `https://www.google.com/search?q=${encodedName}+realtor+facebook`,
    twitter: `https://www.google.com/search?q=${encodedName}+realtor+twitter`,
    
    // Contact
    email_finder: `https://www.google.com/search?q=${encodedName}+realtor+email`,
    
    // Residential listing search
    realtor: `https://www.google.com/search?q=${encodedName}+realtor+realtor.ca`,
  };
};

// Quick Link Button Component
const QuickLinkButton = ({ href, icon, label, color, fullWidth = false }) => {
  const isMailto = href?.startsWith('mailto:');
  return (
    <a
      href={href}
      target={isMailto ? undefined : '_blank'}
      rel={isMailto ? undefined : 'noopener noreferrer'}
      className={`
        flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-white text-[10px] font-medium
        ${color} hover:opacity-90 transition-opacity whitespace-nowrap
        ${fullWidth ? 'w-full' : 'min-w-0'}
      `}
      title={label}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </a>
  );
};

// Agent Card Component
const AgentCard = ({ agent, onQuickLinksToggle, isExpanded, onEdit }) => {
  const links = generateCommercialQuickLinks(agent);
  const displayName = getDisplayName(agent);
  
  // Generate initials
  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : '??';
  
  // Company color mapping
  const companyColors = {
    'CBRE': 'bg-blue-600',
    'Colliers': 'bg-orange-500',
    'JLL': 'bg-red-600',
    'Cushman & Wakefield': 'bg-green-600',
    'Avison Young': 'bg-purple-600',
    'Coldwell Banker Commercial': 'bg-blue-500',
    'Savills': 'bg-teal-500',
    'BentallGreenOak': 'bg-indigo-600',
  };
  const avatarColor = companyColors[agent.company] || 'bg-slate-600';
  
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-lg">
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-14 h-14 rounded-xl ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
            {initials}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-200 truncate">{displayName}</h3>
              <button
                onClick={() => onEdit && onEdit(agent)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Edit agent"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 truncate">{agent.company || 'Commercial Agent'}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              {agent.verified && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Verified</span>}
              {agent.dealCount > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {agent.dealCount} deals
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm font-medium text-slate-300 capitalize">{agent.status}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Deals</p>
            <p className="text-sm font-medium text-slate-300">{agent.dealCount || 0}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-xs text-slate-500">Contact</p>
            <p className="text-sm font-medium text-slate-300">{agent.email ? 'Email' : 'Search'}</p>
          </div>
        </div>
      </div>
      
      {/* Main Action Buttons - Google Search Primary */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {/* Google Search - Primary */}
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <GoogleIcon />
            <span className="text-[10px] text-slate-400 group-hover:text-white">Google</span>
          </a>
          
          {/* LinkedIn */}
          <a
            href={links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-colors group"
          >
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            <span className="text-[10px] text-slate-400 group-hover:text-[#0A66C2]">LinkedIn</span>
          </a>
          
          {/* Email */}
          {agent.email ? (
            <button
              onClick={() => window.location.href = `mailto:${agent.email}`}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group w-full"
            >
              <Mail className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-400">Email</span>
            </button>
          ) : (
            <a
              href={links.email_finder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
            >
              <Mail className="w-5 h-5 text-slate-600" />
              <span className="text-[10px] text-slate-500">Find Email</span>
            </a>
          )}
          
          {/* Company */}
          {agent.company ? (
            <a
              href={links.company}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
            >
              <Building2 className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] text-slate-400 group-hover:text-blue-400">Company</span>
            </a>
          ) : (
            <a
              href={links.loopnet}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors group"
            >
              <Globe className="w-5 h-5 text-purple-500" />
              <span className="text-[10px] text-slate-500">Google</span>
            </a>
          )}
        </div>
      </div>
      
      {/* Expand Quick Links Button */}
      <button
        onClick={() => onQuickLinksToggle(agent.id)}
        className="w-full py-2 bg-slate-900/30 hover:bg-slate-700/50 border-t border-slate-700/50 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        {isExpanded ? (
          <><ChevronUp className="w-4 h-4" /> Hide Quick Links</>
        ) : (
          <><MoreHorizontal className="w-4 h-4" /> Quick Links</>
        )}
      </button>
      
      {/* Expanded Quick Links */}
      {isExpanded && (
        <div className="border-t border-slate-700/50 bg-slate-900/30 p-4 space-y-4">
          {/* Commercial Platforms */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BarChart3 className="w-3 h-3" />
              Commercial Platforms
            </p>
            <div className="grid grid-cols-2 gap-2">
              <QuickLinkButton 
                href={links.loopnet} 
                icon={<Globe className="w-3.5 h-3.5" />} 
                label="LoopNet (Google)"
                color="bg-purple-600"
              />
              <QuickLinkButton 
                href={links.loopnet_direct} 
                icon={<Globe className="w-3.5 h-3.5" />} 
                label="LoopNet (Direct)"
                color="bg-purple-700"
              />
              <QuickLinkButton 
                href={links.costar} 
                icon={<Database className="w-3.5 h-3.5" />} 
                label="CoStar"
                color="bg-blue-700"
              />
              <QuickLinkButton 
                href={links.google} 
                icon={<Search className="w-3.5 h-3.5" />} 
                label="Google"
                color="bg-slate-600"
              />
            </div>
          </div>
          
          {/* LinkedIn & Professional */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Linkedin className="w-3 h-3" />
              LinkedIn & Professional
            </p>
            <div className="grid grid-cols-2 gap-2">
              <QuickLinkButton 
                href={links.linkedin} 
                icon={<Linkedin className="w-3.5 h-3.5" />} 
                label="LinkedIn (Google)"
                color="bg-[#0A66C2]"
              />
              <QuickLinkButton 
                href={links.linkedin_direct} 
                icon={<ExternalLink className="w-3.5 h-3.5" />} 
                label="LinkedIn (Direct)"
                color="bg-[#004182]"
              />
            </div>
          </div>
          
          {/* Contact */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Contact
            </p>
            <div className="grid grid-cols-3 gap-2">
              {agent.email && (
                <QuickLinkButton 
                  href={`mailto:${agent.email}`} 
                  icon={<Mail className="w-3.5 h-3.5" />} 
                  label="Email"
                  color="bg-orange-500"
                />
              )}
              <QuickLinkButton 
                href={links.email_finder} 
                icon={<Search className="w-3.5 h-3.5" />} 
                label="Find Email"
                color="bg-amber-500"
              />
              <QuickLinkButton 
                href={links.facebook} 
                icon={<MessageCircle className="w-3.5 h-3.5" />} 
                label="Facebook"
                color="bg-[#1877F2]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const CommercialAgentRecruiter = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All Companies');
  
  // UI State
  const [expandedQuickLinks, setExpandedQuickLinks] = useState({});
  const [groupBy, setGroupBy] = useState('company');
  const [editingAgent, setEditingAgent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load agents
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      
      // Try to load full data first
      const response = await fetch('/data/commercial_agents_full.json');
      
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        setTotalCount(data.length);
      } else {
        // Fallback to sample
        const sampleResponse = await fetch('/data/commercial_agents_sample.json');
        if (sampleResponse.ok) {
          const data = await sampleResponse.json();
          setAgents(data);
          setTotalCount(data.length);
        }
      }
    } catch (error) {
      console.error('Failed to load commercial agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique companies
  const companies = useMemo(() => {
    const companySet = new Set(agents.map(a => a.company).filter(Boolean));
    return ['All Companies', ...Array.from(companySet).sort()];
  }, [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matches = 
          agent.name?.toLowerCase().includes(searchLower) ||
          agent.company?.toLowerCase().includes(searchLower) ||
          agent.email?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      
      if (selectedCompany !== 'All Companies' && agent.company !== selectedCompany) {
        return false;
      }
      
      return true;
    });
  }, [agents, searchQuery, selectedCompany]);

  // Group agents
  const groupedAgents = useMemo(() => {
    return filteredAgents.reduce((acc, agent) => {
      const key = groupBy === 'company' 
        ? (agent.company || 'Unknown Company')
        : (agent.status || 'new');
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(agent);
      return acc;
    }, {});
  }, [filteredAgents, groupBy]);

  const toggleQuickLinks = (agentId) => {
    setExpandedQuickLinks(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (updatedAgent) => {
    setAgents(prev => prev.map(a => 
      a.id === updatedAgent.id ? { ...a, ...updatedAgent } : a
    ));
    
    // Save to localStorage
    const savedEdits = localStorage.getItem('commercial_agent_edits') || '{}';
    const edits = JSON.parse(savedEdits);
    edits[updatedAgent.id] = updatedAgent;
    localStorage.setItem('commercial_agent_edits', JSON.stringify(edits));
    
    setIsEditModalOpen(false);
    setEditingAgent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
        <span className="ml-3 text-slate-400">Loading commercial agents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-violet-500" />
              Commercial Agent Recruiter
            </h1>
            <p className="text-slate-400 mt-1">Target commercial-focused agents and teams for recruitment and partnership.</p>
          </div>
          <button onClick={loadAgents} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>Filter agents by commercial experience and specialization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>Access brokerage breakdowns and board coverage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">•</span>
              <span>Build targeted outreach lists for CRE recruitment</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/20">
          <p className="text-2xl font-bold text-white">{totalCount.toLocaleString()}</p>
          <p className="text-slate-400 text-sm">Total Agents</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/20">
          <p className="text-2xl font-bold text-white">{companies.length - 1}</p>
          <p className="text-slate-400 text-sm">Companies</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-2xl font-bold text-white">
            {agents.filter(a => a.email).length.toLocaleString()}
          </p>
          <p className="text-slate-400 text-sm">With Email</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 rounded-xl p-4 border border-orange-500/20">
          <p className="text-2xl font-bold text-white">
            {agents.filter(a => a.dealCount > 0).length.toLocaleString()}
          </p>
          <p className="text-slate-400 text-sm">With Deal History</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents, companies, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500"
            />
          </div>
          
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200"
          >
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        {/* Group By */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-sm text-slate-400">Group By:</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setGroupBy('company')} 
              className={`px-3 py-1.5 rounded-lg text-sm ${groupBy === 'company' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              Company
            </button>
            <button 
              onClick={() => setGroupBy('status')} 
              className={`px-3 py-1.5 rounded-lg text-sm ${groupBy === 'status' ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              Status
            </button>
          </div>
        </div>
      </div>

      {/* Agent Groups */}
      <div className="space-y-4">
        {Object.entries(groupedAgents).map(([groupName, groupAgents]) => (
          <div key={groupName} className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800/50 flex items-center gap-3">
              {groupBy === 'company' ? <Building2 className="w-5 h-5 text-purple-400" /> : <Activity className="w-5 h-5 text-purple-400" />}
              <span className="font-semibold text-slate-200">{groupName}</span>
              <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs text-slate-300">{groupAgents.length}</span>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupAgents.map(agent => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onQuickLinksToggle={toggleQuickLinks}
                  isExpanded={expandedQuickLinks[agent.id]}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400">No agents found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Edit Agent Modal */}
      <UniversalEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAgent(null);
        }}
        onSave={handleEditSave}
        entity={editingAgent}
        entityType="agent"
        title="Edit Commercial Agent"
      />
    </div>
  );
};

export default CommercialAgentRecruiter;
