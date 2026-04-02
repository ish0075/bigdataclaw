import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Search, MapPin, DollarSign, TrendingUp, TrendingDown,
  Calendar, FileText, Users, BarChart3, PieChart, Activity,
  AlertTriangle, CheckCircle, XCircle, Clock, Shield, Hammer,
  TreePine, Waves, Sun, Wind, AlertCircle, Home, Store,
  Warehouse, LandPlot, Ruler, Zap, Eye, Download, Share2,
  MessageSquare, Phone, Target, Star, Filter, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, Percent, Layers,
  Briefcase, Gavel, Scale, FileCheck, ShieldCheck,
  Thermometer, CloudRain, Snowflake, Anchor, Car,
  Train, Plane, GraduationCap, Hospital, ShoppingBag,
  Trees, Mountain, Waves as WavesIcon, Sun as SunIcon,
  Compass, History, Camera, Scan, Image as ImageIcon
} from 'lucide-react';

const PropertyBot = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [researching, setResearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock property data with comprehensive intelligence
  const mockProperties = [
    {
      id: 1,
      address: '2255 Markham Road',
      city: 'Markham',
      province: 'ON',
      postalCode: 'L3R 5L9',
      propertyType: 'Industrial',
      subtype: 'Distribution Warehouse',
      
      // Basic Details
      details: {
        totalSqft: 78500,
        officeSqft: 3500,
        warehouseSqft: 75000,
        lotSize: 4.2, // acres
        yearBuilt: 2008,
        stories: 1,
        ceilingHeight: '32\' clear',
        dockDoors: 12,
        driveInDoors: 2,
        columnSpacing: '50\' x 50\'',
        floorLoad: '8000 psi',
        sprinklers: 'ESFR',
        hvac: 'Gas-fired unit heaters',
        electrical: '2000A / 600V',
        lighting: 'LED high-bay',
        condition: 'Excellent',
        lastRenovated: 2022
      },

      // Ownership & Title
      ownership: {
        currentOwner: 'Industrial Holdings LP',
        ownedSince: '2015-03-15',
        purchasePrice: 8250000,
        currentValue: 12800000,
        appreciation: 55,
        titleStatus: 'Clear',
        encumbrances: ['Mortgage with RBC - $6.2M', 'No liens'],
        zoning: 'M2 - General Industrial',
        allowedUses: ['Warehouse', 'Distribution', 'Light Manufacturing', 'Assembly'],
        density: '0.45 FAR',
        heightLimit: '15m',
        taxParcel: '12345-0001-LP',
        assessment2024: 11200000,
        propertyTaxes: 134000
      },

      // Financial Analysis
      financials: {
        askingPrice: 12800000,
        pricePerSqft: 163,
        capRate: 5.2,
        noi: 665600,
        grossRent: 742000,
        operatingExpenses: 76400,
        expenseRatio: 10.3,
        vacancyRate: 0,
        leaseType: 'NNN',
        leaseExpiry: '2029-08-31',
        annualEscalation: 2.5,
        tenant: 'LogiCorp Distribution Inc.',
        tenantCredit: 'BBB+',
        remainingTerm: '5.5 years',
        renewalOptions: '2 x 5 years'
      },

      // Location Analysis
      location: {
        latitude: 43.8561,
        longitude: -79.3370,
        transportation: {
          highwayAccess: '2 min to Hwy 407, 5 min to Hwy 404',
          distanceToAirport: '35 min to Pearson International',
          railAccess: 'CP Rail spur 1.5km away',
          portAccess: '45 min to Port of Toronto'
        },
        demographics: {
          population5km: 125000,
          medianIncome: 85000,
          workforce: 45000,
          growthRate: 3.2
        },
        nearbyAmenities: {
          laborPool: 'Excellent - proximity to residential areas',
          services: ['Tim Hortons 0.5km', 'Gas station 1km', 'Banking 2km'],
          competition: ['Similar warehouses within 2km'],
          supplyChain: 'Near major distribution corridors'
        }
      },

      // Market Analysis
      marketAnalysis: {
        submarketVacancy: 3.8,
        marketVacancy: 4.2,
        avgAskingRent: 11.50, // per sqft
        marketTrend: 'Strong',
        absorptionRate: '250K sqft/quarter',
        newSupply: '2 buildings under construction (400K sqft)',
        rentGrowth: 4.5, // annual
        investorDemand: 'Very High',
        capRateCompression: '25 bps in last 12 months'
      },

      // Comparable Sales
      comparableSales: [
        { address: '2270 Markham Rd', date: '2024-01-15', sqft: 68000, price: 10800000, pricePerSqft: 159, capRate: 5.4, distance: 0.8 },
        { address: '1500 Denison St', date: '2023-11-20', sqft: 92000, price: 13800000, pricePerSqft: 150, capRate: 5.6, distance: 2.1 },
        { address: '45 Shields Ct', date: '2023-09-10', sqft: 55000, price: 8250000, pricePerSqft: 150, capRate: 5.3, distance: 1.5 },
        { address: '890 Progress Ave', date: '2023-06-22', sqft: 82000, price: 12300000, pricePerSqft: 150, capRate: 5.5, distance: 3.2 }
      ],

      // Environmental & Risk
      environmental: {
        phase1Date: '2024-01-10',
        phase1Status: 'No issues identified',
        phase2Required: false,
        floodZone: 'Zone X - Minimal risk',
        contaminationHistory: 'None',
        wetlands: 'Not applicable',
        endangeredSpecies: 'Not applicable',
        airQuality: 'Good - meets standards',
        noiseLevel: 'Moderate - near highway'
      },

      // Building Condition Assessment
      condition: {
        overallRating: 'A-',
        roof: { condition: 'Good', year: 2018, remainingLife: '12 years' },
        hvac: { condition: 'Excellent', year: 2022, remainingLife: '18 years' },
        electrical: { condition: 'Good', year: 2015, remainingLife: '15 years' },
        flooring: { condition: 'Excellent', year: 2023, remainingLife: '20 years' },
        exterior: { condition: 'Good', year: 2019, remainingLife: '11 years' },
        parking: { condition: 'Good', spaces: 45 },
        immediateRepairs: 0,
        deferredMaintenance: 125000
      },

      // Development Potential
      development: {
        currentFAR: 0.45,
        maxFAR: 0.6,
        remainingDensity: '45,000 sqft additional',
        heightAllowance: 'Can add mezzanine (15\' additional)',
        siteCoverage: 35,
        parkingRequired: '1.5 per 1000 sqft',
        parkingExisting: 45,
        expansionPotential: 'Can add 25,000 sqft warehouse addition',
        redevelopmentPotential: 'Long-term rezoning to mixed-use possible'
      },

      // Historical Analysis
      history: [
        { year: 2024, event: 'Current listing', price: 12800000, type: 'listing' },
        { year: 2022, event: 'LED lighting upgrade', cost: 85000 },
        { year: 2019, event: 'Roof membrane replacement', cost: 180000 },
        { year: 2015, event: 'Sale to current owner', price: 8250000, type: 'sale' },
        { year: 2013, event: 'Lease renewal - 10 years', rent: 8.50 },
        { year: 2008, event: 'Property built', cost: 6200000 }
      ],

      // AI Insights
      insights: [
        {
          type: 'Opportunity',
          title: 'Below Market Replacement Cost',
          description: 'At $163/sqft, trading well below estimated replacement cost of $280/sqft. New supply constrained by land costs.',
          confidence: 92,
          impact: 'High',
          action: 'Highlight replacement cost premium to buyers'
        },
        {
          type: 'Risk',
          title: 'Single Tenant Concentration',
          description: '100% occupied by one tenant with 5.5 years remaining. Renewal not guaranteed.',
          confidence: 85,
          impact: 'Medium',
          action: 'Get Letter of Intent for renewal or market tenant credit strength'
        },
        {
          type: 'Intelligence',
          title: 'Strong Market Fundamentals',
          description: 'Markham industrial vacancy at 3.8%, well below 10-year average. E-commerce driving demand.',
          confidence: 88,
          impact: 'Positive',
          action: 'Emphasize supply-constrained market fundamentals'
        },
        {
          type: 'Strategy',
          title: 'Value-Add Opportunity',
          description: 'Can add 25,000 sqft expansion on excess land. Current zoning allows.',
          confidence: 80,
          impact: 'Medium',
          action: 'Market as "expand-in-place" opportunity for growing tenant'
        }
      ],

      // Photo Analysis
      photoAnalysis: {
        exteriorCondition: 'Excellent - well maintained',
        landscaping: 'Professional, low maintenance',
        parking: 'Adequate, good condition',
        signage: 'Prominent building signage opportunity',
        loading: '12 docks + 2 drive-ins sufficient for operations',
        security: 'Fenced perimeter, gate access, camera visible'
      },

      status: 'active',
      listingDate: '2024-02-15',
      daysOnMarket: 45,
      listingAgent: 'Cushman & Wakefield',
      showings: 12,
      offers: 0,
      notes: 'Prime industrial asset with credit tenant. Strong market position below replacement cost.'
    },
    {
      id: 2,
      address: '1280 Lawrence Avenue East',
      city: 'Toronto',
      province: 'ON',
      propertyType: 'Multi-Family',
      subtype: 'Apartment Building',
      
      details: {
        totalUnits: 24,
        unitMix: { bachelors: 4, oneBed: 12, twoBed: 8 },
        totalSqft: 18500,
        lotSize: 0.35,
        yearBuilt: 1965,
        stories: 3,
        condition: 'Good - renovated',
        lastRenovated: 2021
      },

      ownership: {
        currentOwner: 'Lawrence Properties Inc.',
        ownedSince: '2018-06-01',
        purchasePrice: 4800000,
        currentValue: 6200000,
        appreciation: 29,
        titleStatus: 'Clear',
        zoning: 'R4 - Residential',
        assessment2024: 5400000,
        propertyTaxes: 68000
      },

      financials: {
        askingPrice: 6200000,
        pricePerUnit: 258333,
        capRate: 4.2,
        noi: 260400,
        grossRent: 312000,
        operatingExpenses: 51600,
        expenseRatio: 16.5,
        vacancyRate: 2,
        avgRentPerUnit: 1083,
        rentGrowthPotential: 15 // below market
      },

      marketAnalysis: {
        submarketVacancy: 2.1,
        avgRentPerSqft: 2.85,
        marketTrend: 'Strong',
        rentGrowth: 5.2
      },

      comparableSales: [
        { address: '1250 Lawrence Ave E', date: '2023-12-10', units: 20, price: 5100000, pricePerUnit: 255000, capRate: 4.3 },
        { address: '1350 Victoria Park', date: '2023-10-15', units: 28, price: 6900000, pricePerUnit: 246000, capRate: 4.4 }
      ],

      condition: {
        overallRating: 'B+',
        roof: { condition: 'Good', year: 2020 },
        hvac: { condition: 'Good', year: 2019 },
        plumbing: { condition: 'Excellent', year: 2021 },
        electrical: { condition: 'Good', year: 2018 },
        windows: { condition: 'Excellent', year: 2021 },
        deferredMaintenance: 75000
      },

      insights: [
        {
          type: 'Opportunity',
          title: 'Value-Add Through Renovations',
          description: 'Units 15% below market rent. Post-renovation rents could increase NOI by 25%.',
          confidence: 90,
          action: 'Present renovation proforma to value-add buyers'
        },
        {
          type: 'Intelligence',
          title: 'Transit-Oriented Location',
          description: '8-min walk to Lawrence East LRT (opening 2024). Will drive rent growth.',
          confidence: 85,
          action: 'Highlight LRT proximity for future rent growth'
        }
      ],

      status: 'active',
      daysOnMarket: 30
    }
  ];

  useEffect(() => {
    setProperties(mockProperties);
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;
    return properties.filter(p => 
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.propertyType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [properties, searchQuery]);

  const runDeepResearch = (propertyId) => {
    setResearching(true);
    setTimeout(() => {
      setResearching(false);
      alert('🔍 Deep Property Research Complete!\n\nAnalyzed:\n• Title history (40 years)\n• Zoning bylaws & amendments\n• Building permits & violations\n• Tax assessment trends\n• Environmental records\n• Comparable sales (36 months)\n• Tenant credit reports\n• Market absorption data\n• Infrastructure developments\n\nUpdated property intelligence report.');
    }, 3000);
  };

  const getPropertyIcon = (type) => {
    switch(type) {
      case 'Industrial': return <Warehouse className="w-6 h-6" />;
      case 'Multi-Family': return <Building2 className="w-6 h-6" />;
      case 'Retail': return <Store className="w-6 h-6" />;
      case 'Office': return <Briefcase className="w-6 h-6" />;
      case 'Land': return <LandPlot className="w-6 h-6" />;
      default: return <Home className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-3xl">
            🔍
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Property Intelligence Bot</h1>
            <p className="text-text-secondary">Deep Property Research • Analysis & Valuation</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Research Property
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Property List */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">Properties ({filteredProperties.length})</h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {filteredProperties.map(property => (
                <button
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedProperty?.id === property.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-bg-input'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      {getPropertyIcon(property.propertyType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{property.address}</p>
                      <p className="text-sm text-text-secondary">{property.city} • {property.propertyType}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full">
                          {property.financials.capRate}% Cap
                        </span>
                        <span className="text-xs text-text-muted">
                          {property.details.totalSqft?.toLocaleString() || property.details.totalUnits + ' units'} 
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Property Intelligence */}
        <div className="lg:col-span-3 space-y-4">
          {selectedProperty ? (
            <>
              {/* Property Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                      {getPropertyIcon(selectedProperty.propertyType)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary">{selectedProperty.address}</h2>
                      <p className="text-text-secondary">{selectedProperty.city}, {selectedProperty.province} • {selectedProperty.subtype}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {selectedProperty.postalCode}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Built {selectedProperty.details.yearBuilt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" /> {selectedProperty.ownership.titleStatus} Title
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => runDeepResearch(selectedProperty.id)}
                      disabled={researching}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      {researching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      Deep Research
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Full Report
                    </button>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-400">${(selectedProperty.financials.askingPrice/1000000).toFixed(1)}M</p>
                    <p className="text-xs text-text-secondary">Asking Price</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-400">{selectedProperty.financials.capRate}%</p>
                    <p className="text-xs text-text-secondary">Cap Rate</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-400">${selectedProperty.financials.pricePerSqft || selectedProperty.financials.pricePerUnit}</p>
                    <p className="text-xs text-text-secondary">Price/{selectedProperty.financials.pricePerSqft ? 'sqft' : 'unit'}</p>
                  </div>
                  <div className="bg-bg-input p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-400">{selectedProperty.daysOnMarket}</p>
                    <p className="text-xs text-text-secondary">Days on Market</p>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  AI Intelligence & Opportunities
                </h3>
                <div className="space-y-3">
                  {selectedProperty.insights.map((insight, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      insight.type === 'Opportunity' ? 'bg-green-500/5 border-green-500/20' :
                      insight.type === 'Risk' ? 'bg-red-500/5 border-red-500/20' :
                      'bg-blue-500/5 border-blue-500/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              insight.type === 'Opportunity' ? 'bg-green-500/20 text-green-400' :
                              insight.type === 'Risk' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {insight.type}
                            </span>
                            <span className="text-xs text-text-muted">{insight.confidence}% confidence</span>
                          </div>
                          <p className="font-medium text-text-primary mt-1">{insight.title}</p>
                          <p className="text-sm text-text-secondary">{insight.description}</p>
                          <p className="text-xs text-teal-400 mt-2">💡 {insight.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financials & Market Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Analysis */}
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-400" />
                    Financial Analysis
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">NOI</span>
                      <span className="text-text-primary font-medium">${selectedProperty.financials.noi.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Gross Rent</span>
                      <span className="text-text-primary">${selectedProperty.financials.grossRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Operating Expenses</span>
                      <span className="text-text-primary">${selectedProperty.financials.operatingExpenses.toLocaleString()} ({selectedProperty.financials.expenseRatio}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Vacancy Rate</span>
                      <span className="text-text-primary">{selectedProperty.financials.vacancyRate}%</span>
                    </div>
                    {selectedProperty.financials.tenant && (
                      <div className="pt-3 border-t border-border-subtle">
                        <p className="text-text-muted mb-2">Tenant Information</p>
                        <p className="text-text-primary">{selectedProperty.financials.tenant}</p>
                        <p className="text-text-secondary">Credit: {selectedProperty.financials.tenantCredit} • Term: {selectedProperty.financials.remainingTerm}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Market Analysis */}
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    Market Analysis
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Submarket Vacancy</span>
                      <span className="text-text-primary">{selectedProperty.marketAnalysis.submarketVacancy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Market Trend</span>
                      <span className="text-green-400">{selectedProperty.marketAnalysis.marketTrend}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Rent Growth (Annual)</span>
                      <span className="text-green-400">+{selectedProperty.marketAnalysis.rentGrowth}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Investor Demand</span>
                      <span className="text-text-primary">{selectedProperty.marketAnalysis.investorDemand}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparable Sales */}
              <div className="card">
                <div className="p-4 border-b border-border-subtle">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Comparable Sales
                  </h3>
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedProperty.comparableSales.map((comp, idx) => (
                    <div key={idx} className="p-4 hover:bg-bg-input/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{comp.address}</p>
                          <p className="text-sm text-text-secondary">Sold {comp.date} • {comp.distance}km away</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-primary">${(comp.price/1000000).toFixed(2)}M</p>
                          <p className="text-sm text-text-secondary">${comp.pricePerSqft || comp.pricePerUnit}/sf</p>
                          <p className="text-xs text-text-muted">{comp.capRate}% Cap</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ownership & Title */}
              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-400" />
                  Ownership & Title
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Current Owner</span>
                      <span className="text-text-primary">{selectedProperty.ownership.currentOwner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Owned Since</span>
                      <span className="text-text-primary">{selectedProperty.ownership.ownedSince}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Original Purchase</span>
                      <span className="text-text-primary">${(selectedProperty.ownership.purchasePrice/1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Appreciation</span>
                      <span className="text-green-400">+{selectedProperty.ownership.appreciation}%</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Zoning</span>
                      <span className="text-text-primary">{selectedProperty.ownership.zoning}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Assessment (2024)</span>
                      <span className="text-text-primary">${(selectedProperty.ownership.assessment2024/1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Property Taxes</span>
                      <span className="text-text-primary">${selectedProperty.ownership.propertyTaxes.toLocaleString()}/yr</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Building Condition */}
              {selectedProperty.condition && (
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-indigo-400" />
                    Building Condition Assessment
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedProperty.condition).filter(([key]) => !['overallRating', 'deferredMaintenance'].includes(key)).map(([system, data]) => (
                      <div key={system} className="bg-bg-input p-3 rounded-lg">
                        <p className="text-xs text-text-muted capitalize">{system}</p>
                        <p className="text-text-primary font-medium">{data.condition}</p>
                        {data.year && <p className="text-xs text-text-secondary">{data.year}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                    <span className="text-text-secondary">Deferred Maintenance</span>
                    <span className="text-amber-400 font-medium">${selectedProperty.condition.deferredMaintenance.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <Building2 className="w-16 h-16 text-text-muted mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Property Selected</h3>
              <p className="text-text-secondary max-w-md">
                Select a property from the list to view comprehensive research including financials, market analysis, and AI-generated insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyBot;
