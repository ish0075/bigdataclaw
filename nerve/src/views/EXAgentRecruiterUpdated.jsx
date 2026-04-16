import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Users, Search, Mail, Linkedin, MapPin, Building, ChevronDown, ChevronUp, ExternalLink, Activity, Database, WifiOff, RefreshCw } from 'lucide-react';
import { List } from 'react-window';
import AgentCard from '../components/ResidentialRecruiter/AgentCard';

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud') + '/api';

const API_ENDPOINTS = {
  recruiters: `${API_BASE}/recruiters`,
  stats: `${API_BASE}/recruiters/stats`,
  search: `${API_BASE}/recruiters/search`,
  filterOptions: `${API_BASE}/recruiters/filter-options`,
  contact: (id) => `${API_BASE}/recruiters/${id}/contact`,
  health: `${API_BASE}/health`,
};

// Ontario Cities - hardcoded for search since data only has "Ontario" as city
const ONTARIO_CITIES = [
  'All Cities', 'St. Catharines', 'Niagara Falls', 'Welland', 'Thorold', 'Port Colborne',
  'Niagara-on-the-Lake', 'Fort Erie', 'Pelham', 'Lincoln', 'Grimsby', 'West Lincoln', 'Wainfleet',
  'Vaughan', 'Markham', 'Richmond Hill', 'Newmarket', 'Aurora', 
  'Whitchurch-Stouffville', 'King', 'East Gwillimbury', 'Georgina',
  'Mississauga', 'Brampton', 'Caledon',
  'Oshawa', 'Whitby', 'Ajax', 'Pickering', 'Clarington', 'Uxbridge', 'Scugog', 'Brock',
  'Oakville', 'Burlington', 'Milton', 'Halton Hills',
  'Kitchener', 'Waterloo', 'Cambridge', 'Woolwich', 'Wilmot', 'North Dumfries', 'Wellesley',
  'Toronto', 'North York', 'Scarborough', 'Etobicoke', 'York', 'East York',
  'Hamilton', 'Stoney Creek', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook', 'Mount Hope',
  'Ottawa', 'Kanata', 'Nepean', 'Orleans', 'Barrhaven', 'Stittsville',
  'London', 'Windsor', 'Barrie', 'Guelph', 'Kingston', 'Peterborough', 'Brantford',
  'Sarnia', 'Sault Ste. Marie', 'Sudbury', 'Thunder Bay', 'North Bay',
  'Orillia', 'Midland', 'Penetanguishene', 'Collingwood', 'Wasaga Beach',
  'Innisfil', 'Bradford West Gwillimbury', 'New Tecumseth',
  'Guelph/Eramosa', 'Centre Wellington', 'Fergus', 'Elora', 'Mapleton', 
  'Wellington North', 'Minto', 'Puslinch', 'Erin',
  'Woodstock', 'Stratford', 'Ingersoll', 'Tillsonburg', 'Listowel', 'Strathroy',
  'Chatham', 'Leamington', 'Amherstburg', 'Tecumseh', 'LaSalle',
  'Simcoe', 'Delhi', 'Port Dover', 'Waterford', 'Caledonia', 'Cayuga', 'Dunnville',
  'Orangeville', 'Shelburne', 'Grand Valley', 'Perth', 'Smiths Falls',
  'Carleton Place', 'Brockville', 'Prescott', 'Gananoque', 'Napanee', 'Belleville',
  'Trenton', 'Quinte West', 'Cobourg', 'Port Hope', 'Lindsay', 'Bobcaygeon',
  'Fenelon Falls', 'Picton', 'Wellington', 'Bloomfield', 'Pembroke', 'Renfrew',
  'Arnprior', 'Kemptville', 'Cornwall', 'Alexandria', 'Morrisburg',
  'Hawkesbury', 'L\'Orignal', 'Huntsville', 'Bracebridge', 'Gravenhurst', 'Parry Sound',
  'Temagami', 'Mattawa', 'Sturgeon Falls', 'Espanola', 'Elliot Lake',
  'Blind River', 'Thessalon', 'Wawa', 'White River', 'Marathon', 'Greenstone',
  'Red Lake', 'Dryden', 'Kenora', 'Sioux Lookout', 'Fort Frances', 'Atikokan',
  'Rainy River', 'Emo', 'Manitouwadge', 'Terrace Bay', 'Schreiber', 'Nipigon'
];

// Agent row component for virtual list
const AgentRow = ({ agent, onQuickAction }) => (
  <div className="p-4 hover:bg-slate-700/30 transition-colors border-b border-slate-700/50">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-semibold text-slate-200 truncate">{agent.name}</h4>
          {agent.status === 'contacted' && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex-shrink-0">
              Contacted
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
          {agent.brokerage && (
            <span className="flex items-center gap-1">
              <Building className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{agent.brokerage}</span>
            </span>
          )}
          {agent.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {agent.city}
            </span>
          )}
          {agent.job_title && (
            <span className="text-slate-500">{agent.job_title}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {agent.linkedin && (
          <button
            onClick={() => onQuickAction('linkedin', agent.linkedin, agent.id)}
            className="p-2 bg-slate-700 hover:bg-blue-600 rounded-lg transition-colors group"
            title="Open LinkedIn"
          >
            <Linkedin className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        )}
        {agent.email && (
          <button
            onClick={() => onQuickAction('email', `mailto:${agent.email}`, agent.id)}
            className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-lg transition-colors group"
            title={`Email ${agent.email}`}
          >
            <Mail className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        )}
        {agent.quick_links && (
          <button
            onClick={() => {
              const firstLink = Object.values(agent.quick_links)[0];
              if (firstLink) onQuickAction('quick', firstLink, agent.id);
            }}
            className="p-2 bg-slate-700 hover:bg-purple-600 rounded-lg transition-colors group"
            title="Quick Links"
          >
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        )}
      </div>
    </div>
  </div>
);

// Virtual list inner element
const InnerElement = React.forwardRef(({ children, ...rest }, ref) => (
  <div ref={ref} {...rest} className="divide-y divide-slate-700/50">
    {children}
  </div>
));

const EXAgentRecruiterUpdated = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalAgents, setTotalAgents] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [useApi, setUseApi] = useState(true);
  const [jsonMode, setJsonMode] = useState('sample'); // 'sample' or 'full'
  
  // Use a ref for full JSON data to avoid React state bloat
  const fullJsonRef = useRef(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrokerage, setSelectedBrokerage] = useState('All Brokerages');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  
  // Options
  const [brokerages, setBrokerages] = useState(['All Brokerages']);
  const [statuses, setStatuses] = useState(['All Status']);
  const [stats, setStats] = useState(null);
  
  // UI State
  const [activeGroup, setActiveGroup] = useState('brokerage');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Check API health and load filter options
  useEffect(() => {
    fetch(API_ENDPOINTS.health)
      .then(r => {
        if (!r.ok) throw new Error('API unhealthy');
        return r.json();
      })
      .then(() => {
        setUseApi(true);
        // Load filter options from API
        fetch(API_ENDPOINTS.filterOptions)
          .then(r => r.json())
          .then(data => {
            setBrokerages(['All Brokerages', ...data.brokerages]);
            setStatuses(['All Status', ...data.statuses]);
          })
          .catch(console.error);
        
        fetch(API_ENDPOINTS.stats)
          .then(r => r.json())
          .then(setStats)
          .catch(console.error);
      })
      .catch(() => {
        setUseApi(false);
        // Load filter options from JSON fallback
        fetch('/data/recruiters_meta.json')
          .then(r => r.json())
          .then(data => {
            setBrokerages(['All Brokerages', ...(data.brokerages || [])]);
            setStatuses(['All Status', 'new', 'contacted', 'engaged', 'converted', 'archived']);
            setStats({
              total: data.total || 0,
              by_city: {},
              by_brokerage: {},
              by_status: { new: data.total || 0 }
            });
          })
          .catch(() => {
            setBrokerages(['All Brokerages']);
            setStatuses(['All Status']);
          });
      });
  }, []);

  // Build effective search query (combines text search + city)
  const effectiveSearch = useMemo(() => {
    const parts = [];
    if (searchQuery) parts.push(searchQuery);
    if (selectedCity !== 'All Cities') parts.push(selectedCity);
    return parts.join(' ').trim();
  }, [searchQuery, selectedCity]);

  // Check if agent is with EXP Realty
  const isExpAgent = useCallback((agent) => {
    if (!agent.brokerage) return false;
    const brokerageLower = agent.brokerage.toLowerCase();
    return brokerageLower.includes('exp') || brokerageLower.includes('eXp');
  }, []);

  // Filter function for JSON data
  const filterJsonData = useCallback((data) => {
    let results = data;
    
    if (effectiveSearch) {
      const searchLower = effectiveSearch.toLowerCase();
      results = results.filter(agent => 
        (agent.name && agent.name.toLowerCase().includes(searchLower)) ||
        (agent.brokerage && agent.brokerage.toLowerCase().includes(searchLower)) ||
        (agent.email && agent.email.toLowerCase().includes(searchLower)) ||
        (agent.city && agent.city.toLowerCase().includes(searchLower)) ||
        (agent.job_title && agent.job_title.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedBrokerage !== 'All Brokerages') {
      results = results.filter(agent => agent.brokerage === selectedBrokerage);
    }
    
    if (selectedStatus !== 'All Status') {
      results = results.filter(agent => agent.status === selectedStatus);
    }
    
    // Sort: Non-EXP agents first, EXP agents last
    results.sort((a, b) => {
      const aIsExp = isExpAgent(a);
      const bIsExp = isExpAgent(b);
      if (aIsExp && !bIsExp) return 1;
      if (!aIsExp && bIsExp) return -1;
      return 0;
    });
    
    return results;
  }, [effectiveSearch, selectedBrokerage, selectedStatus, isExpAgent]);

  // Load recruiters
  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      if (useApi) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });
        
        if (effectiveSearch) params.append('search', effectiveSearch);
        if (selectedBrokerage !== 'All Brokerages') params.append('brokerage', selectedBrokerage);
        if (selectedStatus !== 'All Status') params.append('status', selectedStatus);
        
        try {
          const r = await fetch(`${API_ENDPOINTS.recruiters}?${params}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const data = await r.json();
          if (!cancelled) {
            // Sort: Non-EXP agents first, EXP agents last
            const recruiters = data.recruiters || [];
            recruiters.sort((a, b) => {
              const aIsExp = isExpAgent(a);
              const bIsExp = isExpAgent(b);
              if (aIsExp && !bIsExp) return 1;
              if (!aIsExp && bIsExp) return -1;
              return 0;
            });
            setAgents(recruiters);
            setTotalAgents(data.total || 0);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error loading agents from API:', err);
          if (!cancelled) {
            setUseApi(false);
            setLoading(false);
          }
        }
      } else {
        // JSON fallback - load sample or full based on mode
        const jsonUrl = jsonMode === 'sample' ? '/data/recruiters_sample.json' : '/data/recruiters_full.json';
        
        try {
          let data;
          if (jsonMode === 'full' && fullJsonRef.current) {
            data = fullJsonRef.current;
          } else {
            const r = await fetch(jsonUrl);
            if (!r.ok) throw new Error('Failed to load recruiter data');
            data = await r.json();
            if (jsonMode === 'full') {
              fullJsonRef.current = data;
            }
          }
          
          const filtered = filterJsonData(data);
          const total = filtered.length;
          const startIdx = (page - 1) * pageSize;
          const paginated = filtered.slice(startIdx, startIdx + pageSize);
          
          if (!cancelled) {
            setAgents(paginated);
            setTotalAgents(total);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error loading agents:', err);
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => { cancelled = true; };
  }, [page, pageSize, effectiveSearch, selectedBrokerage, selectedStatus, useApi, jsonMode, filterJsonData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedBrokerage, selectedCity, selectedStatus, jsonMode]);

  // Group agents
  const groupedAgents = useMemo(() => {
    const groups = {};
    
    agents.forEach(agent => {
      let key;
      switch (activeGroup) {
        case 'brokerage':
          key = agent.brokerage || 'Unknown Brokerage';
          break;
        case 'city':
          key = agent.city || 'Unknown City';
          break;
        case 'status':
          key = agent.status || 'new';
          break;
        default:
          key = 'All Agents';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(agent);
    });
    
    // Sort groups by count descending
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [agents, activeGroup]);

  const handleQuickAction = (type, url, agentId) => {
    if (url) {
      window.open(url, '_blank');
    }
    
    if (agentId && useApi) {
      fetch(API_ENDPOINTS.contact(agentId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: type })
      }).catch(console.error);
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleLoadFullJson = () => {
    setJsonMode('full');
    setLoading(true);
  };

  const handleLoadSampleJson = () => {
    setJsonMode('sample');
    fullJsonRef.current = null;
    setLoading(true);
  };

  const totalPages = Math.ceil(totalAgents / pageSize);

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading {totalAgents > 0 ? totalAgents.toLocaleString() : ''} agents...</p>
        </div>
      </div>
    );
  }

  if (error && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load agents</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total?.toLocaleString() || totalAgents.toLocaleString()}</p>
              <p className="text-slate-400 text-sm">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 rounded-lg p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Building className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">{Object.keys(stats?.by_brokerage || {}).length || brokerages.length - 1}</p>
              <p className="text-slate-400 text-sm">Brokerages</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-lg p-4 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-white">{Object.keys(stats?.by_city || {}).length || 1}</p>
              <p className="text-slate-400 text-sm">Cities</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats?.by_status?.contacted || 0}</p>
              <p className="text-slate-400 text-sm">Contacted</p>
            </div>
          </div>
        </div>
      </div>

      {/* API / JSON Status Indicator */}
      {!useApi && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <WifiOff className="w-4 h-4" />
            API unavailable. Showing data from local JSON file.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSampleJson}
              disabled={jsonMode === 'sample'}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                jsonMode === 'sample' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Load Sample (500)
            </button>
            <button
              onClick={handleLoadFullJson}
              disabled={jsonMode === 'full'}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                jsonMode === 'full' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Load Full Dataset ({(stats?.total || 96265).toLocaleString()})
            </button>
            {jsonMode === 'full' && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Stored in memory ref (not React state)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search agents, brokerages, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedBrokerage}
              onChange={(e) => setSelectedBrokerage(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {brokerages.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {ONTARIO_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Group By Tabs */}
      <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700 w-fit">
        {['brokerage', 'city', 'status'].map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeGroup === group
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By {group.charAt(0).toUpperCase() + group.slice(1)}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          Showing {agents.length.toLocaleString()} of {totalAgents.toLocaleString()} agents
          {effectiveSearch && <span className="text-blue-400 ml-2">"{effectiveSearch}"</span>}
        </p>
        
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-slate-300"
          >
            Previous
          </button>
          <span className="text-slate-400 px-2">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-slate-300"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-sm"
          >
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={200}>200/page</option>
            <option value={500}>500/page</option>
          </select>
        </div>
      </div>

      {/* Agent Groups */}
      <div className="space-y-4">
        {groupedAgents.map(([groupName, groupAgents]) => {
          const expanded = expandedGroups[groupName] !== false;
          const useVirtualList = groupAgents.length > 100 && pageSize >= 200;
          
          return (
            <div key={groupName} className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-4 py-3 bg-slate-700/50 flex items-center justify-between hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {activeGroup === 'brokerage' && <Building className="w-5 h-5 text-blue-400" />}
                  {activeGroup === 'city' && <MapPin className="w-5 h-5 text-emerald-400" />}
                  {activeGroup === 'status' && <Activity className="w-5 h-5 text-amber-400" />}
                  <span className="font-semibold text-slate-200">{groupName}</span>
                  <span className="px-2 py-0.5 bg-slate-600 rounded-full text-xs text-slate-300">
                    {groupAgents.length}
                  </span>
                  {useVirtualList && (
                    <span className="text-xs text-purple-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Virtual scroll
                    </span>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              
              {expanded && (
                <div className="divide-y divide-slate-700/50">
                  {useVirtualList ? (
                    <div style={{ height: Math.min(groupAgents.length * 180, 800) }}>
                      <List
                        height={Math.min(groupAgents.length * 180, 800)}
                        itemCount={groupAgents.length}
                        itemSize={180}
                        innerElementType={InnerElement}
                      >
                        {({ index, style }) => (
                          <div style={style}>
                            <AgentCard 
                              agent={groupAgents[index]} 
                              onClick={() => handleQuickAction('details', null, groupAgents[index].id)} 
                            />
                          </div>
                        )}
                      </List>
                    </div>
                  ) : (
                    groupAgents.map(agent => (
                      <AgentCard 
                        key={agent.id} 
                        agent={agent} 
                        onClick={() => handleQuickAction('details', null, agent.id)} 
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Pagination */}
      <div className="flex items-center justify-end pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-slate-300"
          >
            Previous
          </button>
          <span className="text-slate-400 px-2">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages || 1, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-slate-300"
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-1 bg-slate-700 rounded text-slate-300 text-sm"
          >
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={200}>200/page</option>
            <option value={500}>500/page</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EXAgentRecruiterUpdated;
