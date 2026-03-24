import { useState } from 'react';
// Map visualization component
import { 
  Map as MapIcon, 
  Layers as LayersIcon,
  Filter,
  Search,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react';

// Sample Map Data
const MAP_PROPERTIES = [
  { id: 1, address: '1500 Michael Drive, Welland', lat: 43.0167, lng: -79.2500, type: 'Industrial', price: 2500000, status: 'Active' },
  { id: 2, address: '2200 Glendale Ave, Niagara Falls', lat: 43.1167, lng: -79.0667, type: 'Retail', price: 1800000, status: 'Active' },
  { id: 3, address: '3500 Industrial Rd, St. Catharines', lat: 43.1667, lng: -79.2333, type: 'Warehouse', price: 4200000, status: 'Pending' },
  { id: 4, address: '1200 Main St, Port Colborne', lat: 42.8833, lng: -79.2500, type: 'Office', price: 950000, status: 'Active' },
  { id: 5, address: '500 Commerce Blvd, Thorold', lat: 43.1167, lng: -79.2000, type: 'Industrial', price: 3100000, status: 'Active' },
  { id: 6, address: '800 Regional Rd, Fort Erie', lat: 42.9000, lng: -78.9667, type: 'Retail', price: 1450000, status: 'Sold' },
  { id: 7, address: '1000 Highway 20, Fonthill', lat: 43.0333, lng: -79.2833, type: 'Industrial', price: 2800000, status: 'Active' },
  { id: 8, address: '400 Lake St, St. Catharines', lat: 43.1667, lng: -79.2333, type: 'Mixed Use', price: 5200000, status: 'Active' },
];

// Property Type Filters
const TYPE_FILTERS = [
  { id: 'all', label: 'All Types', color: '#E8503A' },
  { id: 'Industrial', label: 'Industrial', color: '#22C55E' },
  { id: 'Warehouse', label: 'Warehouse', color: '#3B82F6' },
  { id: 'Retail', label: 'Retail', color: '#F59E0B' },
  { id: 'Office', label: 'Office', color: '#8B5CF6' },
  { id: 'Mixed Use', label: 'Mixed Use', color: '#EC4899' },
];

// Simulated Map Component (since Leaflet needs window object)
function MapVisualization({ properties, activeFilters }) {
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const filteredProperties = properties.filter(p => 
    activeFilters.includes('all') || activeFilters.includes(p.type)
  );
  
  // Niagara Region bounds (approximate)
  const bounds = {
    north: 43.25,
    south: 42.85,
    east: -78.90,
    west: -79.40
  };
  
  const getPosition = (lat, lng) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
    return { x, y };
  };
  
  const getTypeColor = (type) => {
    const colors = {
      'Industrial': '#22C55E',
      'Warehouse': '#3B82F6',
      'Retail': '#F59E0B',
      'Office': '#8B5CF6',
      'Mixed Use': '#EC4899',
    };
    return colors[type] || '#E8503A';
  };
  
  return (
    <div className="relative w-full h-full bg-[#0d1117] rounded-xl overflow-hidden border border-border">
      {/* Simulated Map Background */}
      <div className="absolute inset-0">
        {/* Grid lines for map effect */}
        <svg className="w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#2A2A2A" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Water bodies (Lake Ontario) */}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-[#0a1628] opacity-60" 
             style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)' }} />
        
        {/* Niagara River */}
        <div className="absolute right-0 top-0 w-16 h-full bg-[#0a1628] opacity-40" 
             style={{ clipPath: 'polygon(100% 0, 100% 100%, 30% 100%, 0 0)' }} />
      </div>
      
      {/* Property Markers */}
      {filteredProperties.map(prop => {
        const pos = getPosition(prop.lat, prop.lng);
        return (
          <button
            key={prop.id}
            onClick={() => setSelectedProperty(prop)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125"
              style={{ backgroundColor: getTypeColor(prop.type) }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-background-secondary border border-border rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                <div className="text-xs font-medium text-white">{prop.address}</div>
                <div className="text-xs text-gray-400">${(prop.price / 1000000).toFixed(1)}M • {prop.type}</div>
              </div>
            </div>
          </button>
        );
      })}
      
      {/* Selected Property Panel */}
      {selectedProperty && (
        <div className="absolute bottom-4 right-4 w-72 bg-background-secondary border border-border rounded-xl p-4 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-white text-sm">{selectedProperty.address}</h3>
              <p className="text-xs text-gray-500">{selectedProperty.type}</p>
            </div>
            <button 
              onClick={() => setSelectedProperty(null)}
              className="p-1 text-gray-500 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Price:</span>
              <span className="text-white font-medium">${(selectedProperty.price / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                selectedProperty.status === 'Active' 
                  ? 'bg-status-active/10 text-status-active' 
                  : 'bg-status-pending/10 text-status-pending'
              }`}>
                {selectedProperty.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Coords:</span>
              <span className="text-gray-300 font-mono text-xs">
                {selectedProperty.lat.toFixed(4)}, {selectedProperty.lng.toFixed(4)}
              </span>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-coral text-white rounded-lg text-sm hover:bg-coral-light transition-colors">
            View Details
          </button>
        </div>
      )}
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-background-secondary/90 backdrop-blur border border-border rounded-xl p-3">
        <div className="text-xs font-medium text-white mb-2">Property Types</div>
        <div className="space-y-1.5">
          {TYPE_FILTERS.filter(t => t.id !== 'all').map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              <span className="text-xs text-gray-400">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <button className="w-8 h-8 bg-background-secondary border border-border rounded-lg flex items-center justify-center text-white hover:bg-background-tertiary">
          +
        </button>
        <button className="w-8 h-8 bg-background-secondary border border-border rounded-lg flex items-center justify-center text-white hover:bg-background-tertiary">
          −
        </button>
      </div>
    </div>
  );
}

// Main Map View
export default function MapView() {
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [searchQuery, setSearchQuery] = useState('');
  
  const toggleFilter = (filterId) => {
    if (filterId === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.filter(f => f !== 'all');
      if (activeFilters.includes(filterId)) {
        setActiveFilters(newFilters.filter(f => f !== filterId));
      } else {
        setActiveFilters([...newFilters, filterId]);
      }
    }
  };
  
  const filteredProperties = MAP_PROPERTIES.filter(p => 
    activeFilters.includes('all') || activeFilters.includes(p.type)
  );
  
  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MapIcon size={20} className="text-coral" />
          <h1 className="text-2xl font-bold text-white">Map View</h1>
        </div>
        <p className="text-gray-500 text-sm">GIS visualization of properties in Niagara Region</p>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full bg-background-tertiary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-coral/50"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-sm text-gray-400">Filter:</span>
          {TYPE_FILTERS.map(type => (
            <button
              key={type.id}
              onClick={() => toggleFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeFilters.includes(type.id)
                  ? 'bg-coral/10 border-coral text-coral'
                  : 'bg-background-tertiary border-border text-gray-400 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-1 min-h-0">
        <MapVisualization 
          properties={MAP_PROPERTIES} 
          activeFilters={activeFilters}
        />
      </div>
      
      {/* Stats Bar */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gray-500" />
          <span className="text-sm text-gray-400">
            Showing <span className="text-white font-medium">{filteredProperties.length}</span> properties
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Center:</span>
          <span className="text-sm text-white font-mono">43.0896°N, 79.0849°W</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Zoom:</span>
          <span className="text-sm text-white font-mono">12</span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-600">Tile: CartoDB Dark Matter</span>
        </div>
      </div>
    </div>
  );
}
