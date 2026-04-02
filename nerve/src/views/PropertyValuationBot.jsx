import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, TrendingUp, MapPin, Home, DollarSign, BarChart3, 
  PieChart, Download, Search, Filter, Star, AlertCircle,
  CheckCircle, Clock, RefreshCw, FileText, Share2, Printer,
  ArrowUpRight, ArrowDownRight, Minus, Building2, Bed, Bath
} from 'lucide-react';

const PropertyValuationBot = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [showValuationModal, setShowValuationModal] = useState(false);

  // Valuation form state
  const [valuationForm, setValuationForm] = useState({
    address: '',
    city: 'Toronto',
    propertyType: 'Detached',
    beds: 3,
    baths: 2,
    sqft: 2000,
    lotSize: 4000,
    yearBuilt: 2000,
    condition: 'good',
    upgrades: []
  });

  // Mock data
  const mockProperties = [
    {
      id: 1,
      address: '123 Main St',
      city: 'Toronto',
      type: 'Detached',
      beds: 4,
      baths: 3,
      sqft: 2400,
      lotSize: 4500,
      yearBuilt: 2010,
      condition: 'excellent',
      estimatedValue: 1450000,
      valueRange: { low: 1380000, high: 1520000 },
      confidence: 92,
      pricePerSqft: 604,
      lastUpdated: '2024-03-28',
      comps: 12,
      trend: 'up',
      trendPercent: 5.2,
      upgrades: ['Renovated Kitchen', 'Finished Basement', 'New Roof']
    },
    {
      id: 2,
      address: '456 Oak Ave',
      city: 'Mississauga',
      type: 'Semi-Detached',
      beds: 3,
      baths: 2,
      sqft: 1800,
      lotSize: 3000,
      yearBuilt: 2005,
      condition: 'good',
      estimatedValue: 950000,
      valueRange: { low: 900000, high: 1000000 },
      confidence: 88,
      pricePerSqft: 528,
      lastUpdated: '2024-03-25',
      comps: 8,
      trend: 'stable',
      trendPercent: 0.5,
      upgrades: ['Updated Bathrooms']
    },
    {
      id: 3,
      address: '789 Queen St W',
      city: 'Toronto',
      type: 'Condo',
      beds: 2,
      baths: 2,
      sqft: 950,
      yearBuilt: 2015,
      condition: 'excellent',
      estimatedValue: 875000,
      valueRange: { low: 830000, high: 920000 },
      confidence: 85,
      pricePerSqft: 921,
      lastUpdated: '2024-03-27',
      comps: 15,
      trend: 'down',
      trendPercent: -2.1,
      upgrades: ['Designer Finishes', 'Smart Home']
    },
    {
      id: 4,
      address: '321 Lakeshore Blvd',
      city: 'Oakville',
      type: 'Detached',
      beds: 5,
      baths: 4,
      sqft: 3800,
      lotSize: 8000,
      yearBuilt: 2018,
      condition: 'excellent',
      estimatedValue: 2850000,
      valueRange: { low: 2700000, high: 3000000 },
      confidence: 90,
      pricePerSqft: 750,
      lastUpdated: '2024-03-26',
      comps: 6,
      trend: 'up',
      trendPercent: 8.5,
      upgrades: ['Pool', 'Wine Cellar', 'Home Theatre', 'Chef Kitchen']
    },
  ];

  const mockComps = [
    { address: '125 Main St', soldDate: '2024-02-15', price: 1420000, sqft: 2350, daysOnMarket: 8 },
    { address: '127 Main St', soldDate: '2024-01-28', price: 1480000, sqft: 2500, daysOnMarket: 12 },
    { address: '119 Main St', soldDate: '2024-01-10', price: 1395000, sqft: 2300, daysOnMarket: 15 },
    { address: '131 Main St', soldDate: '2023-12-20', price: 1410000, sqft: 2400, daysOnMarket: 22 },
    { address: '115 Main St', soldDate: '2023-12-05', price: 1380000, sqft: 2350, daysOnMarket: 18 },
  ];

  useEffect(() => {
    setProperties(mockProperties);
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchAddress) return properties;
    return properties.filter(p => 
      p.address.toLowerCase().includes(searchAddress.toLowerCase()) ||
      p.city.toLowerCase().includes(searchAddress.toLowerCase())
    );
  }, [properties, searchAddress]);

  const stats = useMemo(() => ({
    totalValuations: properties.length,
    avgConfidence: properties.length ? Math.round(properties.reduce((a, b) => a + b.confidence, 0) / properties.length) : 0,
    avgPricePerSqft: properties.length ? Math.round(properties.reduce((a, b) => a + b.pricePerSqft, 0) / properties.length) : 0,
    totalValue: properties.reduce((a, b) => a + b.estimatedValue, 0),
    trendingUp: properties.filter(p => p.trend === 'up').length,
    trendingDown: properties.filter(p => p.trend === 'down').length
  }), [properties]);

  const runValuation = () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate valuation calculation
      const basePrice = valuationForm.sqft * 550;
      const lotPremium = valuationForm.lotSize > 4000 ? (valuationForm.lotSize - 4000) * 50 : 0;
      const conditionMultiplier = {
        'poor': 0.85,
        'fair': 0.92,
        'good': 1.0,
        'excellent': 1.08
      }[valuationForm.condition];
      
      const estimatedValue = Math.round((basePrice + lotPremium) * conditionMultiplier);
      
      const newProperty = {
        id: Date.now(),
        ...valuationForm,
        estimatedValue,
        valueRange: { low: Math.round(estimatedValue * 0.95), high: Math.round(estimatedValue * 1.05) },
        confidence: 82,
        pricePerSqft: Math.round(estimatedValue / valuationForm.sqft),
        lastUpdated: new Date().toISOString().split('T')[0],
        comps: 8,
        trend: 'stable',
        trendPercent: 0,
        upgrades: valuationForm.upgrades
      };
      
      setProperties([newProperty, ...properties]);
      setSelectedProperty(newProperty);
      setShowValuationModal(false);
      setLoading(false);
    }, 2000);
  };

  const generateReport = (property) => {
    alert(`📄 Valuation Report Generated for ${property.address}\n\n` +
          `Estimated Value: $${property.estimatedValue.toLocaleString()}\n` +
          `Confidence: ${property.confidence}%\n` +
          `Based on ${property.comps} comparable sales\n\n` +
          `Report saved to downloads.`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-3xl">
            💎
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Property Valuation Bot</h1>
            <p className="text-text-secondary">Appraiser • AI-powered property valuations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowValuationModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            New Valuation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-indigo-400">{stats.totalValuations}</p>
          <p className="text-xs text-text-secondary mt-1">Valuations</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.avgConfidence}%</p>
          <p className="text-xs text-text-secondary mt-1">Avg Confidence</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">${stats.avgPricePerSqft}</p>
          <p className="text-xs text-text-secondary mt-1">Avg $/sqft</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">${(stats.totalValue/1000000).toFixed(1)}M</p>
          <p className="text-xs text-text-secondary mt-1">Total Value</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.trendingUp}</p>
          <p className="text-xs text-text-secondary mt-1">Trending Up</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.trendingDown}</p>
          <p className="text-xs text-text-secondary mt-1">Trending Down</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Search & List */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">Recent Valuations</h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[500px] overflow-y-auto">
              {filteredProperties.map(property => (
                <button
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedProperty?.id === property.id ? 'bg-indigo-500/10' : 'hover:bg-bg-input'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{property.address}</p>
                      <p className="text-sm text-text-secondary">{property.city} • {property.type}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      property.trend === 'up' ? 'text-green-400' :
                      property.trend === 'down' ? 'text-red-400' :
                      'text-text-secondary'
                    }`}>
                      {property.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                       property.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> :
                       <Minus className="w-4 h-4" />}
                      {Math.abs(property.trendPercent)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-indigo-400">
                      ${(property.estimatedValue/1000000).toFixed(2)}M
                    </p>
                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                      {property.confidence}% confident
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Valuation Details */}
        <div className="lg:col-span-2">
          {selectedProperty ? (
            <div className="space-y-4">
              {/* Main Valuation Card */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{selectedProperty.address}</h2>
                    <p className="text-text-secondary">{selectedProperty.city}, Ontario</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => generateReport(selectedProperty)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Report
                    </button>
                    <button className="btn-secondary text-sm flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-indigo-400">
                      ${(selectedProperty.estimatedValue/1000000).toFixed(2)}M
                    </p>
                    <p className="text-xs text-text-secondary mt-1">Estimated Value</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-xl font-bold text-text-primary">
                      ${selectedProperty.pricePerSqft}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">Price/sqft</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-xl font-bold text-green-400">{selectedProperty.confidence}%</p>
                    <p className="text-xs text-text-secondary mt-1">Confidence</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-xl font-bold text-text-primary">{selectedProperty.comps}</p>
                    <p className="text-xs text-text-secondary mt-1">Comps Used</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-bg-input rounded-lg">
                  <p className="text-sm text-text-secondary">Value Range (95% confidence)</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-text-primary">${(selectedProperty.valueRange.low/1000000).toFixed(2)}M</span>
                    <div className="flex-1 h-2 bg-border-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%', marginLeft: '20%' }} />
                    </div>
                    <span className="text-text-primary">${(selectedProperty.valueRange.high/1000000).toFixed(2)}M</span>
                  </div>
                </div>
              </div>

              {/* Property Details & Comps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-400" />
                    Property Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Property Type</span>
                      <span className="text-text-primary">{selectedProperty.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Bedrooms</span>
                      <span className="text-text-primary">{selectedProperty.beds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Bathrooms</span>
                      <span className="text-text-primary">{selectedProperty.baths}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Square Footage</span>
                      <span className="text-text-primary">{selectedProperty.sqft.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Lot Size</span>
                      <span className="text-text-primary">{selectedProperty.lotSize.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Year Built</span>
                      <span className="text-text-primary">{selectedProperty.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Condition</span>
                      <span className="text-text-primary capitalize">{selectedProperty.condition}</span>
                    </div>
                  </div>

                  {selectedProperty.upgrades.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-subtle">
                      <p className="text-sm text-text-secondary mb-2">Upgrades & Features</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.upgrades.map((upgrade, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                            <Star className="w-3 h-3 inline mr-1" />
                            {upgrade}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Comparable Sales
                  </h3>
                  <div className="space-y-2">
                    {mockComps.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-bg-input rounded-lg text-sm">
                        <div>
                          <p className="text-text-primary">{comp.address}</p>
                          <p className="text-xs text-text-secondary">Sold {comp.soldDate} • {comp.daysOnMarket} DOM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-primary font-medium">${(comp.price/1000000).toFixed(2)}M</p>
                          <p className="text-xs text-text-secondary">${Math.round(comp.price/comp.sqft)}/sqft</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center p-12 text-center">
              <Calculator className="w-16 h-16 text-text-muted mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Property Selected</h3>
              <p className="text-text-secondary max-w-md">
                Select a property from the list or create a new valuation to see detailed analysis
              </p>
              <button 
                onClick={() => setShowValuationModal(true)}
                className="mt-6 btn-primary"
              >
                Create New Valuation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Valuation Modal */}
      {showValuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                New Property Valuation
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-text-secondary">Property Address</label>
                <input
                  type="text"
                  value={valuationForm.address}
                  onChange={(e) => setValuationForm({...valuationForm, address: e.target.value})}
                  placeholder="123 Main Street"
                  className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary">City</label>
                  <select
                    value={valuationForm.city}
                    onChange={(e) => setValuationForm({...valuationForm, city: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  >
                    <option>Toronto</option>
                    <option>Mississauga</option>
                    <option>Markham</option>
                    <option>Oakville</option>
                    <option>Brampton</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Property Type</label>
                  <select
                    value={valuationForm.propertyType}
                    onChange={(e) => setValuationForm({...valuationForm, propertyType: e.target.value})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  >
                    <option>Detached</option>
                    <option>Semi-Detached</option>
                    <option>Townhouse</option>
                    <option>Condo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary">Bedrooms</label>
                  <input
                    type="number"
                    value={valuationForm.beds}
                    onChange={(e) => setValuationForm({...valuationForm, beds: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Bathrooms</label>
                  <input
                    type="number"
                    value={valuationForm.baths}
                    onChange={(e) => setValuationForm({...valuationForm, baths: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary">Square Footage</label>
                  <input
                    type="number"
                    value={valuationForm.sqft}
                    onChange={(e) => setValuationForm({...valuationForm, sqft: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary">Year Built</label>
                  <input
                    type="number"
                    value={valuationForm.yearBuilt}
                    onChange={(e) => setValuationForm({...valuationForm, yearBuilt: parseInt(e.target.value)})}
                    className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-text-secondary">Condition</label>
                <select
                  value={valuationForm.condition}
                  onChange={(e) => setValuationForm({...valuationForm, condition: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                >
                  <option value="poor">Poor - Needs major repairs</option>
                  <option value="fair">Fair - Some updates needed</option>
                  <option value="good">Good - Move-in ready</option>
                  <option value="excellent">Excellent - Fully updated</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle flex gap-2">
              <button 
                onClick={runValuation}
                disabled={loading || !valuationForm.address}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Run Valuation
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowValuationModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyValuationBot;
