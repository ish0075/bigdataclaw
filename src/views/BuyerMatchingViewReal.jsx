import { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  ArrowRight, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign,
  MapPin,
  Star,
  Loader2,
  Linkedin,
  Globe,
  User,
  Briefcase,
  Landmark,
  ExternalLink
} from 'lucide-react';

// API Configuration
const API_URL = 'http://localhost:9999';

// Match Score Badge
function MatchScoreBadge({ score }) {
  let colorClass = 'bg-gray-500/10 text-gray-400';
  if (score >= 90) colorClass = 'bg-green-500/10 text-green-400';
  else if (score >= 80) colorClass = 'bg-coral/10 text-coral';
  else if (score >= 60) colorClass = 'bg-yellow-500/10 text-yellow-400';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      <Star size={12} fill="currentColor" />
      {score}% Match
    </div>
  );
}

// Type Icon based on match type
function TypeIcon({ type }) {
  const icons = {
    buyer: <Building2 size={18} className="text-coral" />,
    agent: <User size={18} className="text-blue-400" />,
    lender: <Landmark size={18} className="text-green-400" />
  };
  return icons[type] || <Building2 size={18} className="text-coral" />;
}

// Social Links Component
function SocialLinks({ links }) {
  if (!links || Object.keys(links).length === 0) return null;
  
  return (
    <div className="flex gap-2 mt-2">
      {links.linkedin && (
        <a 
          href={links.linkedin} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 bg-[#0077b5]/20 hover:bg-[#0077b5]/30 text-[#0077b5] rounded transition-colors"
          title="LinkedIn"
        >
          <Linkedin size={14} />
        </a>
      )}
      {links.website && (
        <a 
          href={links.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          title="Website"
        >
          <Globe size={14} />
        </a>
      )}
    </div>
  );
}

// Contact Card Component
function ContactCard({ match, onContact }) {
  const isBuyer = match.type === 'buyer';
  const isAgent = match.type === 'agent';
  
  const typeColors = {
    buyer: 'border-coral/30',
    agent: 'border-blue-400/30',
    lender: 'border-green-400/30'
  };
  
  return (
    <div className={`bg-background-secondary border ${typeColors[match.type] || 'border-border'} rounded-xl p-4 hover:border-coral/50 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background-tertiary rounded-lg flex items-center justify-center">
            <TypeIcon type={match.type} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{match.name}</h3>
            <span className={`text-xs ${isBuyer ? 'text-coral' : isAgent ? 'text-blue-400' : 'text-green-400'}`}>
              {match.type === 'buyer' ? 'Buyer' : match.type === 'agent' ? 'Agent' : 'Lender'}
            </span>
            {match.company && match.company !== match.name && (
              <div className="text-[10px] text-gray-500">{match.company}</div>
            )}
          </div>
        </div>
        <MatchScoreBadge score={match.match_score} />
      </div>
      
      {/* Stats */}
      <div className="space-y-1.5 mb-3">
        {match.total_volume && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={14} className="text-gray-500" />
            <span className="text-gray-300">${match.total_volume}M volume</span>
          </div>
        )}
        {match.transaction_count && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase size={14} className="text-gray-500" />
            <span className="text-gray-300">{match.transaction_count} deals</span>
          </div>
        )}
        {match.typical_deal_size && (
          <div className="flex items-center gap-2 text-sm">
            <Target size={14} className="text-gray-500" />
            <span className="text-gray-300">Deals: {match.typical_deal_size}</span>
          </div>
        )}
        {match.geographic_focus && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-gray-500" />
            <span className="text-gray-300 truncate">{match.geographic_focus?.split(',')[0]}</span>
          </div>
        )}
      </div>
      
      {/* Why They Fit */}
      {match.why_they_fit && (
        <div className="mb-3 p-2 bg-background-tertiary/50 rounded-lg">
          <p className="text-xs text-gray-400 leading-relaxed">{match.why_they_fit}</p>
        </div>
      )}
      
      {/* Contact Info */}
      {match.contact && (
        <div className="mb-3 pt-3 border-t border-border">
          <div className="text-xs text-gray-500 mb-1">Contact:</div>
          <div className="text-sm text-white font-medium">{match.contact.name}</div>
          {match.contact.title && (
            <div className="text-xs text-gray-400">{match.contact.title}</div>
          )}
          {match.contact.email && (
            <a 
              href={`mailto:${match.contact.email}`}
              className="flex items-center gap-1.5 text-xs text-coral hover:text-coral-light mt-1"
            >
              <Mail size={12} />
              {match.contact.email}
            </a>
          )}
          <SocialLinks links={match.social_links} />
        </div>
      )}
      
      {/* Action Button */}
      <div className="pt-3 border-t border-border">
        <button 
          onClick={() => onContact(match)}
          className="w-full py-2 bg-coral/20 hover:bg-coral/30 text-coral text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={14} />
          View Full Profile
        </button>
      </div>
    </div>
  );
}

// Section Header
function SectionHeader({ title, count, icon, color }) {
  const IconComponent = icon;
  const colors = {
    coral: 'text-coral border-coral/30',
    blue: 'text-blue-400 border-blue-400/30',
    green: 'text-green-400 border-green-400/30'
  };
  
  return (
    <div className={`flex items-center justify-between py-3 px-4 bg-background-secondary border ${colors[color]} rounded-lg mb-4`}>
      <div className="flex items-center gap-2">
        <IconComponent size={18} />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <span className="text-sm text-gray-400">{count} matches</span>
    </div>
  );
}

// Main Buyer Matching View with Real API
export default function BuyerMatchingViewReal() {
  const [selectedProperty, setSelectedProperty] = useState('1500 Michael Drive, Welland');
  const [propertyType, setPropertyType] = useState('industrial');
  const [propertyPrice, setPropertyPrice] = useState(5000000);
  const [propertySize, setPropertySize] = useState(80000);
  const [results, setResults] = useState({ buyers: [], agents: [], lenders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, verified: 0, volume: 0 });
  const [activeTab, setActiveTab] = useState('all');

  // Fetch database stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setStats({
        total: data.stats.canonical_entities,
        verified: data.stats.brokers,
        volume: data.total_volume_billions
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFindMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cityFromAddress = selectedProperty.includes(',')
        ? selectedProperty.split(',')[1].trim()
        : selectedProperty;

      const response = await fetch(`${API_URL}/match-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selectedProperty,
          property_type: propertyType,
          price: propertyPrice,
          size_sf: propertySize,
          city: cityFromAddress
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const data = await response.json();
      setResults({
        buyers: data.buyers || [],
        agents: data.agents || [],
        lenders: data.lenders || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (match) => {
    const contactInfo = match.contact ? `
Contact: ${match.contact.name}
Title: ${match.contact.title || 'N/A'}
Email: ${match.contact.email || 'N/A'}
    ` : 'No contact info available';
    
    alert(`${match.type.toUpperCase()}: ${match.name}
${match.company ? `Company: ${match.company}` : ''}
Match Score: ${match.match_score}%

${contactInfo}`);
  };

  const allMatches = [...results.buyers, ...results.agents, ...results.lenders];
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target size={20} className="text-coral" />
          <h1 className="text-2xl font-bold text-white">Comprehensive Matching Report</h1>
        </div>
        <p className="text-gray-500 text-sm">
          AI-powered matching: Buyers, Agents & Lenders from ${stats.volume}B transaction database
        </p>
      </div>
      
      {/* Property Input */}
      <div className="bg-background-secondary border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">Property Details</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <select 
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white"
            >
              <option>1500 Michael Drive, Welland</option>
              <option>450 Industrial Parkway, Hamilton</option>
              <option>2200 Glendale Ave, Niagara Falls</option>
              <option>100 King Street West, Toronto</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select 
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="industrial">Industrial</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="multifamily">Multifamily</option>
              <option value="land">Land</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
            <input 
              type="number"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
              className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white"
              step="100000"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Size (SF)</label>
            <input 
              type="number"
              value={propertySize}
              onChange={(e) => setPropertySize(Number(e.target.value))}
              className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white"
              step="1000"
            />
          </div>
        </div>
        
        <button 
          onClick={handleFindMatches}
          disabled={loading}
          className="w-full py-3 bg-coral hover:bg-coral/80 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing Database...
            </>
          ) : (
            <>
              <Target size={18} />
              Generate Full Report
            </>
          )}
        </button>
        
        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            Error: {error}. Make sure API is running on port 9999.
          </div>
        )}
      </div>
      
      {/* Filter Tabs */}
      {allMatches.length > 0 && (
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: `All (${allMatches.length})` },
            { id: 'buyers', label: `Buyers (${results.buyers.length})` },
            { id: 'agents', label: `Agents (${results.agents.length})` },
            { id: 'lenders', label: `Lenders (${results.lenders.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-coral text-white' 
                  : 'bg-background-secondary text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Results Sections */}
      {allMatches.length > 0 ? (
        <div className="space-y-6">
          {/* Show by category or all */}
          {(activeTab === 'all' || activeTab === 'buyers') && results.buyers.length > 0 && (
            <section>
              <SectionHeader 
                title="Matched Buyers" 
                count={results.buyers.length} 
                icon={Building2}
                color="coral"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.buyers.map(buyer => (
                  <ContactCard 
                    key={`buyer-${buyer.id}`}
                    match={buyer}
                    onContact={handleContact}
                  />
                ))}
              </div>
            </section>
          )}
          
          {(activeTab === 'all' || activeTab === 'agents') && results.agents.length > 0 && (
            <section>
              <SectionHeader 
                title="Matched Agents" 
                count={results.agents.length}
                icon={User}
                color="blue"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.agents.map(agent => (
                  <ContactCard 
                    key={`agent-${agent.id}`}
                    match={agent}
                    onContact={handleContact}
                  />
                ))}
              </div>
            </section>
          )}
          
          {(activeTab === 'all' || activeTab === 'lenders') && results.lenders.length > 0 && (
            <section>
              <SectionHeader 
                title="Matched Lenders" 
                count={results.lenders.length}
                icon={Landmark}
                color="green"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {results.lenders.map(lender => (
                  <ContactCard 
                    key={`lender-${lender.id}`}
                    match={lender}
                    onContact={handleContact}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-12">
          <Users size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">Enter property details and click "Generate Full Report"</p>
          <p className="text-gray-600 text-sm mt-2">
            Matching against {stats.total.toLocaleString()} entities
          </p>
        </div>
      )}
    </div>
  );
}
