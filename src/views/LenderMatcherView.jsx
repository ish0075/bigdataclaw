import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter,
  Landmark,
  Globe,
  Linkedin,
  Mail,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  MapPin,
  Briefcase,
  FileText,
  MoreHorizontal
} from 'lucide-react';

const API_URL = 'http://localhost:8000';

// Lender Type Badge
function LenderTypeBadge({ type }) {
  const colors = {
    'Bank': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Insurance': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Mortgage Lender': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Private Lender': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[type] || colors['Other']}`}>
      {type}
    </span>
  );
}

// Asset Class Badge
function AssetClassBadge({ specialization }) {
  const classes = specialization?.split(',').map(s => s.trim()).filter(Boolean) || [];
  
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {classes.map((cls, idx) => (
        <span key={idx} className="px-2 py-0.5 bg-coral/10 text-coral text-xs rounded">
          {cls}
        </span>
      ))}
    </div>
  );
}

// Quick Links Dropdown
function QuickLinksMenu({ links }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!links || Object.keys(links).length === 0) return null;
  
  const linkConfigs = [
    { key: 'website', label: 'Website', icon: Globe, color: 'text-blue-400' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-[#0077b5]' },
    { key: 'linkedin_president', label: 'CEO LinkedIn', icon: Briefcase, color: 'text-amber-400' },
    { key: 'google', label: 'Google Search', icon: Search, color: 'text-green-400' },
    { key: 'contact', label: 'Contact Page', icon: Mail, color: 'text-coral' },
    { key: 'facebook', label: 'Facebook', icon: ExternalLink, color: 'text-blue-500' },
    { key: 'instagram', label: 'Instagram', icon: ExternalLink, color: 'text-pink-400' },
    { key: 'twitter', label: 'Twitter/X', icon: ExternalLink, color: 'text-sky-400' },
  ];
  
  const availableLinks = linkConfigs.filter(cfg => links[cfg.key]);
  
  if (availableLinks.length === 0) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-background-tertiary hover:bg-background-tertiary/80 text-gray-300 text-sm rounded-lg transition-colors"
      >
        <MoreHorizontal size={14} />
        Quick Links
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-background-secondary border border-border rounded-lg shadow-xl z-50 py-1">
            {availableLinks.map(({ key, label, icon: Icon, color }) => (
              <a
                key={key}
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-background-tertiary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Icon size={14} className={color} />
                {label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Primary Action Links (shown directly on card)
function PrimaryLinks({ links }) {
  if (!links) return null;
  
  const items = [];
  
  if (links.website) {
    items.push(
      <a
        key="web"
        href={links.website}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
      >
        <Globe size={14} />
        Web
      </a>
    );
  }
  
  if (links.linkedin) {
    items.push(
      <a
        key="linkedin"
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/20 hover:bg-[#0077b5]/30 text-[#0077b5] text-sm rounded-lg transition-colors"
      >
        <Linkedin size={14} />
        LinkedIn
      </a>
    );
  }
  
  if (links.google) {
    items.push(
      <a
        key="google"
        href={links.google}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors"
      >
        <Search size={14} />
        Google
      </a>
    );
  }
  
  if (links.contact) {
    items.push(
      <a
        key="contact"
        href={links.contact}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-coral/20 hover:bg-coral/30 text-coral text-sm rounded-lg transition-colors"
      >
        <Mail size={14} />
        Contact
      </a>
    );
  }
  
  return <div className="flex flex-wrap gap-2">{items}</div>;
}

// Lender Card Component
function LenderCard({ lender }) {
  const quickLinks = typeof lender.quick_links === 'string' 
    ? JSON.parse(lender.quick_links || '{}') 
    : lender.quick_links || {};
  
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5 hover:border-coral/50 transition-all hover:shadow-lg hover:shadow-coral/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-background-tertiary rounded-xl flex items-center justify-center">
            <Landmark size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{lender.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <LenderTypeBadge type={lender.lender_type} />
              {lender.province && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={10} />
                  {lender.province}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <Star size={16} fill="currentColor" />
          <span className="text-sm font-medium">4.5</span>
        </div>
      </div>
      
      {/* Asset Classes */}
      <AssetClassBadge specialization={lender.asset_specializations} />
      
      {/* Domain */}
      {lender.domain && (
        <p className="text-xs text-gray-500 mt-2 truncate">
          {lender.domain}
        </p>
      )}
      
      {/* Action Links */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
        <PrimaryLinks links={quickLinks} />
        <div className="flex-1" />
        <QuickLinksMenu links={quickLinks} />
      </div>
    </div>
  );
}

// Stats Card
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// Main Component
export default function LenderMatcherView() {
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, by_type: {}, by_specialization: {} });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAssetClass, setFilterAssetClass] = useState('');
  const [filterOptions, setFilterOptions] = useState({ types: [], specializations: [] });
  
  // Fetch filter options
  useEffect(() => {
    fetch(`${API_URL}/api/lenders/filter-options`)
      .then(res => res.json())
      .then(data => setFilterOptions(data))
      .catch(console.error);
  }, []);
  
  // Fetch stats
  useEffect(() => {
    fetch(`${API_URL}/api/lenders/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);
  
  // Fetch lenders
  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (searchQuery) params.append('search', searchQuery);
    if (filterType) params.append('lender_type', filterType);
    if (filterAssetClass) params.append('asset_specialization', filterAssetClass);
    
    fetch(`${API_URL}/api/lenders?${params}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch lenders');
        return res.json();
      })
      .then(data => {
        setLenders(data.lenders);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, limit, searchQuery, filterType, filterAssetClass]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterAssetClass('');
    setPage(1);
  };
  
  const totalPages = Math.ceil(total / limit);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background-secondary/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Landmark size={28} className="text-green-400" />
              Lender Matcher
            </h1>
            <p className="text-gray-400 mt-1">
              {stats.total.toLocaleString()} lenders available for financing
            </p>
          </div>
          <button 
            onClick={() => window.open('http://localhost:8000/api/lenders/export', '_blank')}
            className="px-4 py-2 bg-coral/20 hover:bg-coral/30 text-coral rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FileText size={18} />
            Export CSV
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="Total Lenders" 
            value={stats.total.toLocaleString()} 
            icon={Landmark} 
            color="bg-green-500/20 text-green-400"
          />
          <StatCard 
            label="Banks" 
            value={(stats.by_type?.Bank || 0).toLocaleString()} 
            icon={Building2} 
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard 
            label="Insurance" 
            value={(stats.by_type?.Insurance || 0).toLocaleString()} 
            icon={Star} 
            color="bg-purple-500/20 text-purple-400"
          />
          <StatCard 
            label="Private Lenders" 
            value={(stats.by_type?.['Private Lender'] || 0).toLocaleString()} 
            icon={Globe} 
            color="bg-amber-500/20 text-amber-400"
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b border-border bg-background-secondary/30">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search lenders by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background-tertiary border border-border rounded-lg text-white placeholder-gray-500 focus:border-coral focus:outline-none"
            />
          </div>
          
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-background-tertiary border border-border rounded-lg text-white focus:border-coral focus:outline-none"
          >
            <option value="">All Types</option>
            {filterOptions.types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Asset Class Filter */}
          <select
            value={filterAssetClass}
            onChange={(e) => { setFilterAssetClass(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-background-tertiary border border-border rounded-lg text-white focus:border-coral focus:outline-none"
          >
            <option value="">All Asset Classes</option>
            {filterOptions.specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          
          {/* Search Button */}
          <button
            type="submit"
            className="px-6 py-2 bg-coral hover:bg-coral/90 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
          
          {/* Clear Filters */}
          {(searchQuery || filterType || filterAssetClass) && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p>Loading lenders...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <p>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-coral/20 text-coral rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Results Count & Pagination */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">
                Showing {lenders.length} of {total.toLocaleString()} lenders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 bg-background-tertiary border border-border rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 bg-background-tertiary border border-border rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            
            {/* Lender Grid */}
            {lenders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lenders.map(lender => (
                  <LenderCard key={lender.id} lender={lender} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Landmark size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No lenders found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
            
            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="px-3 py-2 bg-background-tertiary border border-border rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-50"
                >
                  First
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-coral text-white'
                          : 'bg-background-tertiary border border-border text-gray-400 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 bg-background-tertiary border border-border rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
