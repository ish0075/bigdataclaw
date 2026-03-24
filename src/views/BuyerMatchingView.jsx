import { useState } from 'react';
import { 
  Users, 
  Target, 
  ArrowRight, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign,
  MapPin,
  Star
} from 'lucide-react';

// Sample Buyer Data
const BUYER_PROFILES = [
  {
    id: 1,
    name: 'Niagara Logistics Inc.',
    type: 'End User',
    budgetMin: 2000000,
    budgetMax: 5000000,
    preferredTypes: ['Industrial', 'Warehouse'],
    preferredSize: '40,000 - 80,000 sq ft',
    preferredZones: ['M1', 'M2'],
    locations: ['Welland', 'St. Catharines'],
    contact: { name: 'John Smith', email: 'john@niagaralogistics.com', phone: '(905) 555-0123' },
    matchScore: 95,
    matchReasons: ['Size match', 'Zone preference', 'Budget fit']
  },
  {
    id: 2,
    name: 'Retail Ventures Group',
    type: 'Investment',
    budgetMin: 1000000,
    budgetMax: 3000000,
    preferredTypes: ['Retail', 'Mixed Use'],
    preferredSize: '10,000 - 20,000 sq ft',
    preferredZones: ['C2', 'C3', 'MU'],
    locations: ['Niagara Falls', 'St. Catharines'],
    contact: { name: 'Sarah Chen', email: 's.chen@retailventures.ca', phone: '(416) 555-0456' },
    matchScore: 82,
    matchReasons: ['Location match', 'Type fit']
  },
  {
    id: 3,
    name: 'Golden Horseshoe REIT',
    type: 'Investment',
    budgetMin: 3000000,
    budgetMax: 10000000,
    preferredTypes: ['Industrial', 'Office', 'Retail'],
    preferredSize: '25,000+ sq ft',
    preferredZones: ['M1', 'M2', 'C2'],
    locations: ['Niagara Region', 'Hamilton'],
    contact: { name: 'Michael Torres', email: 'acquisitions@ghreit.com', phone: '(905) 555-0789' },
    matchScore: 78,
    matchReasons: ['Budget range', 'Multiple zones']
  },
  {
    id: 4,
    name: 'Maple Leaf Distribution',
    type: 'End User',
    budgetMin: 2500000,
    budgetMax: 6000000,
    preferredTypes: ['Warehouse', 'Industrial'],
    preferredSize: '50,000 - 100,000 sq ft',
    preferredZones: ['M2', 'M3'],
    locations: ['Welland', 'Thorold'],
    contact: { name: 'Lisa Park', email: 'l.park@mapleleafdist.ca', phone: '(905) 555-0321' },
    matchScore: 91,
    matchReasons: ['Exact size match', 'Zone M2', 'Power ready']
  },
  {
    id: 5,
    name: 'Commercial Capital Corp',
    type: 'Developer',
    budgetMin: 5000000,
    budgetMax: 20000000,
    preferredTypes: ['Mixed Use', 'Retail', 'Industrial'],
    preferredSize: '1+ acres',
    preferredZones: ['C3', 'MU', 'M1'],
    locations: ['Niagara Region', 'Golden Horseshoe'],
    contact: { name: 'David Williams', email: 'deals@commercialcapital.com', phone: '(416) 555-0654' },
    matchScore: 65,
    matchReasons: ['Development potential']
  }
];

// Match Score Badge
function MatchScoreBadge({ score }) {
  let colorClass = 'bg-gray-500/10 text-gray-400';
  if (score >= 90) colorClass = 'bg-status-active/10 text-status-active';
  else if (score >= 80) colorClass = 'bg-coral/10 text-coral';
  else if (score >= 60) colorClass = 'bg-status-pending/10 text-status-pending';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      <Star size={12} fill="currentColor" />
      {score}% Match
    </div>
  );
}

// Buyer Card
function BuyerCard({ buyer, onContact }) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 hover:border-coral/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background-tertiary rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-coral" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{buyer.name}</h3>
            <span className="text-xs text-gray-500">{buyer.type}</span>
          </div>
        </div>
        <MatchScoreBadge score={buyer.matchScore} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign size={14} className="text-gray-500" />
          <span className="text-gray-300">
            ${(buyer.budgetMin / 1000000).toFixed(1)}M - ${(buyer.budgetMax / 1000000).toFixed(1)}M
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 size={14} className="text-gray-500" />
          <span className="text-gray-300">{buyer.preferredSize}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={14} className="text-gray-500" />
          <span className="text-gray-300">{buyer.locations.join(', ')}</span>
        </div>
      </div>
      
      {/* Match Reasons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {buyer.matchReasons.map((reason, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-background-tertiary rounded text-xs text-gray-400">
            {reason}
          </span>
        ))}
      </div>
      
      {/* Contact */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {buyer.contact.name}
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-background-tertiary rounded-lg transition-colors" title="Call">
              <Phone size={14} />
            </button>
            <button 
              onClick={() => onContact(buyer)}
              className="p-1.5 text-gray-400 hover:text-coral hover:bg-coral/10 rounded-lg transition-colors"
              title="Email"
            >
              <Mail size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Buyer Matching View
export default function BuyerMatchingView() {
  const [selectedProperty, setSelectedProperty] = useState('1500 Michael Drive');
  const [filterScore, setFilterScore] = useState(0);
  
  const filteredBuyers = BUYER_PROFILES.filter(b => b.matchScore >= filterScore);
  
  const handleContact = (buyer) => {
    const subject = encodeURIComponent(`Property Match: ${selectedProperty}`);
    const body = encodeURIComponent(
      `Hi ${buyer.contact.name},\n\n` +
      `I found a property that matches your investment criteria:\n\n` +
      `Property: ${selectedProperty}\n` +
      `Match Score: ${buyer.matchScore}%\n\n` +
      `Would you like to schedule a viewing?\n\n` +
      `Best regards`
    );
    window.open(`mailto:${buyer.contact.email}?subject=${subject}&body=${body}`);
  };
  
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target size={20} className="text-coral" />
          <h1 className="text-2xl font-bold text-white">Buyer Matching</h1>
        </div>
        <p className="text-gray-500 text-sm">AI-powered buyer matching based on property criteria</p>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Property:</span>
          <select 
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-coral/50"
          >
            <option>1500 Michael Drive, Welland</option>
            <option>2200 Glendale Ave, Niagara Falls</option>
            <option>3500 Industrial Rd, St. Catharines</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Min Score:</span>
          <input 
            type="range"
            min="0"
            max="100"
            value={filterScore}
            onChange={(e) => setFilterScore(parseInt(e.target.value))}
            className="w-32 accent-coral"
          />
          <span className="text-sm text-white font-medium">{filterScore}%</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-background-secondary border border-border rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{filteredBuyers.length}</div>
          <div className="text-xs text-gray-500">Potential Matches</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-xl p-4">
          <div className="text-3xl font-bold text-coral">
            {filteredBuyers.filter(b => b.matchScore >= 90).length}
          </div>
          <div className="text-xs text-gray-500">High Matches (90%+)</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-xl p-4">
          <div className="text-3xl font-bold text-status-active">
            ${(filteredBuyers.reduce((acc, b) => acc + b.budgetMax, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-gray-500">Combined Budget Capacity</div>
        </div>
      </div>
      
      {/* Buyer Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredBuyers.map(buyer => (
          <BuyerCard 
            key={buyer.id} 
            buyer={buyer} 
            onContact={handleContact}
          />
        ))}
      </div>
      
      {filteredBuyers.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No buyers match the current criteria</p>
          <button 
            onClick={() => setFilterScore(0)}
            className="mt-4 text-coral hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
