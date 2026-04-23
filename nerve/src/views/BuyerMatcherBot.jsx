import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Target, Users, Building2, MapPin, DollarSign, 
  Filter, Star, Mail, Phone, Calendar, ArrowRight, 
  CheckCircle, XCircle, RefreshCw, Download, Sparkles,
  BarChart3, TrendingUp, Home, Bed, Bath, Car
} from 'lucide-react';

// API Base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'https://13f0-142-189-188-192.ngrok-free.app') + '/api';

const BuyerMatcherBot = () => {
  // State
  const [buyers, setBuyers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, buyers, matches, analytics

  // Filters
  const [buyerSearch, setBuyerSearch] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);

  // Mock data for demo
  const mockBuyers = [
    { id: 1, name: 'John & Sarah Thompson', email: 'thompson.family@email.com', phone: '416-555-0123', budget: 1200000, cities: ['Toronto', 'Markham'], type: 'Detached', beds: 4, baths: 3, status: 'active', urgency: 'high', notes: 'Growing family, need backyard' },
    { id: 2, name: 'Michael Chen', email: 'mchen.investor@email.com', phone: '647-555-0456', budget: 800000, cities: ['Mississauga', 'Brampton'], type: 'Condo', beds: 2, baths: 2, status: 'active', urgency: 'medium', notes: 'Investment property, prefer pre-construction' },
    { id: 3, name: 'Robert & Lisa Williams', email: 'williams.rl@email.com', phone: '905-555-0789', budget: 2500000, cities: ['Oakville', 'Burlington'], type: 'Detached', beds: 5, baths: 4, status: 'active', urgency: 'high', notes: 'Luxury home, pool preferred' },
    { id: 4, name: 'Amanda Foster', email: 'afoster.prof@email.com', phone: '416-555-0321', budget: 650000, cities: ['Toronto'], type: 'Condo', beds: 1, baths: 1, status: 'paused', urgency: 'low', notes: 'First-time buyer, downtown only' },
    { id: 5, name: 'David Park', email: 'dpark.re@email.com', phone: '647-555-0654', budget: 1500000, cities: ['North York', 'Scarborough'], type: 'Semi-Detached', beds: 3, baths: 2, status: 'active', urgency: 'medium', notes: 'Close to good schools' },
  ];

  const mockProperties = [
    { id: 101, address: '123 Main St', city: 'Toronto', price: 1150000, type: 'Detached', beds: 4, baths: 3, sqft: 2400, lot: 4500, daysOnMarket: 5, status: 'active', image: '🏠' },
    { id: 102, address: '456 Elm Ave', city: 'Markham', price: 1280000, type: 'Detached', beds: 4, baths: 3, sqft: 2600, lot: 5000, daysOnMarket: 12, status: 'active', image: '🏡' },
    { id: 103, address: '789 Oak Dr', city: 'Mississauga', price: 750000, type: 'Condo', beds: 2, baths: 2, sqft: 1100, lot: 0, daysOnMarket: 3, status: 'active', image: '🏢' },
    { id: 104, address: '321 Pine Cres', city: 'Oakville', price: 2650000, type: 'Detached', beds: 5, baths: 4, sqft: 4200, lot: 8000, daysOnMarket: 18, status: 'active', pool: true, image: '🏰' },
    { id: 105, address: '654 Maple Rd', city: 'Burlington', price: 1350000, type: 'Semi-Detached', beds: 3, baths: 3, sqft: 1900, lot: 3500, daysOnMarket: 7, status: 'active', image: '🏘️' },
  ];

  // Calculate matches
  useEffect(() => {
    const calculatedMatches = [];
    
    mockBuyers.filter(b => b.status === 'active').forEach(buyer => {
      mockProperties.forEach(property => {
        // Calculate match score (0-100)
        let score = 0;
        let factors = [];

        // Budget match (40%)
        const budgetDiff = buyer.budget - property.price;
        if (budgetDiff >= 0) {
          score += 40;
          factors.push('Within budget');
        } else if (budgetDiff > -buyer.budget * 0.1) {
          score += 25;
          factors.push('Slightly over budget');
        }

        // Location match (25%)
        if (buyer.cities.includes(property.city)) {
          score += 25;
          factors.push(`In ${property.city}`);
        }

        // Property type match (15%)
        if (buyer.type === property.type) {
          score += 15;
          factors.push(`Matches ${property.type} preference`);
        }

        // Bedroom match (10%)
        if (property.beds >= buyer.beds) {
          score += 10;
          factors.push(`${property.beds} beds (needs ${buyer.beds})`);
        }

        // Bathroom match (10%)
        if (property.baths >= buyer.baths) {
          score += 10;
          factors.push(`${property.baths} baths (needs ${buyer.baths})`);
        }

        if (score >= 50) {
          calculatedMatches.push({
            id: `${buyer.id}-${property.id}`,
            buyer,
            property,
            score,
            factors,
            status: 'pending'
          });
        }
      });
    });

    // Sort by score descending
    calculatedMatches.sort((a, b) => b.score - a.score);
    setMatches(calculatedMatches);
    setBuyers(mockBuyers);
    setProperties(mockProperties);
  }, []);

  // Filter matches
  const filteredMatches = useMemo(() => {
    let result = matches;
    
    if (buyerSearch) {
      const searchLower = buyerSearch.toLowerCase();
      result = result.filter(m => 
        m.buyer.name.toLowerCase().includes(searchLower) ||
        m.property.city.toLowerCase().includes(searchLower) ||
        m.property.address.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedBuyer) {
      result = result.filter(m => m.buyer.id === selectedBuyer.id);
    }
    
    return result;
  }, [matches, buyerSearch, selectedBuyer]);

  // Stats
  const stats = useMemo(() => ({
    totalBuyers: buyers.length,
    activeBuyers: buyers.filter(b => b.status === 'active').length,
    totalProperties: properties.length,
    totalMatches: matches.length,
    highConfidenceMatches: matches.filter(m => m.score >= 80).length,
    avgMatchScore: matches.length ? Math.round(matches.reduce((a, b) => a + b.score, 0) / matches.length) : 0
  }), [buyers, properties, matches]);

  const sendMatchToBuyer = (match) => {
    // Simulate sending
    alert(`📧 Match sent to ${match.buyer.name}!

Property: ${match.property.address}
Price: $${match.property.price.toLocaleString()}
Match Score: ${match.score}%

The buyer will receive an email with property details and your contact information.`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center text-3xl">
            🔍
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Buyer Matcher Bot</h1>
            <p className="text-text-secondary">Scout • AI-powered buyer-property matching</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Matches
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Run Matching Algorithm
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-teal-400">{stats.totalBuyers}</p>
          <p className="text-xs text-text-secondary mt-1">Total Buyers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.activeBuyers}</p>
          <p className="text-xs text-text-secondary mt-1">Active Buyers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{stats.totalProperties}</p>
          <p className="text-xs text-text-secondary mt-1">Properties</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.totalMatches}</p>
          <p className="text-xs text-text-secondary mt-1">Total Matches</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{stats.highConfidenceMatches}</p>
          <p className="text-xs text-text-secondary mt-1">High Confidence</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-cyan-400">{stats.avgMatchScore}%</p>
          <p className="text-xs text-text-secondary mt-1">Avg Match Score</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Buyers & Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search buyers or properties..."
                value={buyerSearch}
                onChange={(e) => setBuyerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          {/* Active Buyers List */}
          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Active Buyers ({buyers.filter(b => b.status === 'active').length})
              </h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto">
              {buyers.filter(b => b.status === 'active').map(buyer => (
                <button
                  key={buyer.id}
                  onClick={() => setSelectedBuyer(selectedBuyer?.id === buyer.id ? null : buyer)}
                  className={`w-full p-3 text-left transition-colors ${
                    selectedBuyer?.id === buyer.id ? 'bg-teal-500/10' : 'hover:bg-bg-input'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary text-sm">{buyer.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      buyer.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
                      buyer.urgency === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {buyer.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Budget: ${(buyer.budget/1000000).toFixed(1)}M</p>
                  <p className="text-xs text-text-muted">{buyer.cities.join(', ')} • {buyer.type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Matching Criteria */}
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Match Criteria
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Min Match Score</span>
                <span className="text-text-primary">50%</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Budget Flexibility</span>
                <span className="text-text-primary">±10%</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Location Priority</span>
                <span className="text-text-primary">High</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Property Type Match</span>
                <span className="text-text-primary">Required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Matches */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-400" />
                {selectedBuyer ? `Matches for ${selectedBuyer.name}` : `All Matches (${filteredMatches.length})`}
              </h3>
              {selectedBuyer && (
                <button 
                  onClick={() => setSelectedBuyer(null)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  Clear Filter
                </button>
              )}
            </div>
            
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {filteredMatches.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Target className="w-12 h-12 mx-auto mb-3 text-text-muted" />
                  <p>No matches found</p>
                  <p className="text-sm mt-1">Try adjusting your search criteria</p>
                </div>
              ) : (
                filteredMatches.slice(0, 20).map(match => (
                  <div key={match.id} className="p-4 hover:bg-bg-input/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Match Score */}
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                        match.score >= 80 ? 'bg-green-500/20 text-green-400' :
                        match.score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        <span className="text-xl font-bold">{match.score}</span>
                        <span className="text-[10px]">MATCH</span>
                      </div>

                      {/* Match Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-text-primary">{match.property.address}</p>
                            <p className="text-sm text-text-secondary">{match.property.city} • {match.property.type}</p>
                            <p className="text-lg font-bold text-teal-400 mt-1">
                              ${match.property.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-text-primary">{match.buyer.name}</p>
                            <p className="text-sm text-text-secondary">Budget: ${(match.buyer.budget/1000000).toFixed(1)}M</p>
                          </div>
                        </div>

                        {/* Match Factors */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {match.factors.map((factor, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-teal-500/10 text-teal-400 rounded-full">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              {factor}
                            </span>
                          ))}
                        </div>

                        {/* Property Specs */}
                        <div className="flex gap-4 mt-3 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Bed className="w-4 h-4" /> {match.property.beds}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-4 h-4" /> {match.property.baths}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" /> {match.property.sqft.toLocaleString()} sqft
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {match.property.daysOnMarket} days
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => sendMatchToBuyer(match)}
                            className="btn-primary text-sm flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Send to Buyer
                          </button>
                          <button className="btn-secondary text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Call Buyer
                          </button>
                          <button className="btn-secondary text-sm flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            View Property
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerMatcherBot;
