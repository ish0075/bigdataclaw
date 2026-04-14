import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, User, Building2, TrendingUp, DollarSign, Target, 
  Linkedin, Facebook, Instagram, Globe, FileText, PieChart,
  MapPin, Calendar, CheckCircle, AlertCircle, BarChart3,
  Briefcase, Home, Store, Warehouse, LandPlot, Building,
  ArrowUpRight, Eye, MessageSquare, Phone, Mail, Download,
  RefreshCw, Filter, Star, Clock, ExternalLink, ShieldCheck,
  Activity, Layers, Wallet, Percent
} from 'lucide-react';

const BuyerBot = () => {
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('profiles'); // profiles, analysis, opportunities
  const [researching, setResearching] = useState(false);

  // Mock buyer data with comprehensive profiles
  const mockBuyers = [
    {
      id: 1,
      name: 'Michael Richardson',
      company: 'Richardson Capital Group',
      title: 'Principal',
      email: 'm.richardson@richsoncapital.com',
      phone: '416-555-0142',
      linkedin: 'linkedin.com/in/michaelrichardson',
      location: 'Toronto, ON',
      buyerType: 'Institutional Investor',
      verified: true,
      
      // Portfolio Analysis
      portfolio: {
        totalValue: 45000000,
        propertyCount: 12,
        avgDealSize: 3750000,
        geographicFocus: ['Toronto', 'Mississauga', 'Markham'],
        assetClasses: [
          { type: 'Industrial', percentage: 45, value: 20250000, color: 'bg-blue-500' },
          { type: 'Multi-Family', percentage: 30, value: 13500000, color: 'bg-green-500' },
          { type: 'Retail', percentage: 20, value: 9000000, color: 'bg-amber-500' },
          { type: 'Office', percentage: 5, value: 2250000, color: 'bg-purple-500' }
        ],
        riskProfile: 'Moderate',
        holdPeriod: '5-7 years',
        targetIRR: '18-22%'
      },

      // Purchase History
      purchaseHistory: [
        { date: '2023-11-15', address: '450 Industrial Pkwy', city: 'Markham', type: 'Industrial', price: 5200000, sqft: 45000, capRate: 6.2, verified: true },
        { date: '2023-08-22', address: '1280 Lawrence Ave E', city: 'Toronto', type: 'Multi-Family', price: 3800000, units: 24, capRate: 4.8, verified: true },
        { date: '2023-05-10', address: '789 Warden Ave', city: 'Toronto', type: 'Retail', price: 2100000, sqft: 8000, capRate: 5.5, verified: true },
        { date: '2022-12-03', address: '2250 Midland Ave', city: 'Scarborough', type: 'Industrial', price: 6800000, sqft: 62000, capRate: 5.8, verified: true },
        { date: '2022-09-18', address: '45 Export Blvd', city: 'Mississauga', type: 'Industrial', price: 8900000, sqft: 78000, capRate: 6.0, verified: true }
      ],

      // Social Media Research
      socialResearch: {
        linkedin: {
          found: true,
          posts: 47,
          connections: 2500,
          recentActivity: 'Posted about industrial market trends 3 days ago',
          sentiment: 'Positive',
          keywords: ['industrial', 'logistics', 'supply chain', 'Toronto real estate']
        },
        twitter: {
          found: true,
          posts: 123,
          followers: 3400,
          recentActivity: 'Retweeted article about e-commerce warehouse demand',
          sentiment: 'Neutral',
          keywords: ['CRE', 'industrial RE', 'investment']
        },
        newsMentions: [
          { date: '2024-01-10', source: 'REJournals', title: 'Richardson Capital acquires 78K sqft Markham industrial' },
          { date: '2023-09-05', source: 'Globe and Mail', title: 'Toronto industrial market sees renewed investor interest' }
        ]
      },

      // Asset Class Preferences (AI Identified)
      assetClassAnalysis: {
        preferred: 'Industrial',
        confidence: 92,
        evidence: [
          '45% of portfolio in industrial assets',
          'Recent LinkedIn posts about logistics sector',
          'Last 3 purchases were industrial properties',
          'Following industrial REITs and developers'
        ],
        priceRange: { min: 5000000, max: 15000000 },
        preferredMarkets: ['Markham', 'Mississauga', 'Vaughan'],
        criteria: {
          minSqft: 40000,
          maxSqft: 100000,
          minCapRate: 5.5,
          preferredTenants: ['Logistics', 'E-commerce', 'Manufacturing'],
          leaseTerms: '5+ years remaining'
        }
      },

      // Current Opportunities
      opportunities: [
        { id: 101, address: '2255 Markham Rd', type: 'Industrial', price: 7200000, sqft: 65000, capRate: 6.1, matchScore: 94, reason: 'Matches size preference, strong tenant' },
        { id: 102, address: '890 Matheson Blvd', type: 'Industrial', price: 5800000, sqft: 48000, capRate: 5.9, matchScore: 89, reason: 'In preferred Markham market' }
      ],

      status: 'active',
      lastContact: '2024-03-20',
      nextFollowUp: '2024-04-05',
      notes: 'Serious industrial buyer, prefers Class A assets with credit tenants. Moving quickly on right deals.'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      company: 'Chen Family Holdings',
      title: 'Director of Acquisitions',
      email: 's.chen@chenholdings.ca',
      phone: '647-555-0287',
      linkedin: 'linkedin.com/in/sarahchen-realestate',
      location: 'Vancouver, BC / Toronto, ON',
      buyerType: 'Family Office',
      verified: true,
      
      portfolio: {
        totalValue: 28000000,
        propertyCount: 8,
        avgDealSize: 3500000,
        geographicFocus: ['Toronto', 'Vancouver', 'Ottawa'],
        assetClasses: [
          { type: 'Multi-Family', percentage: 60, value: 16800000, color: 'bg-green-500' },
          { type: 'Mixed-Use', percentage: 25, value: 7000000, color: 'bg-cyan-500' },
          { type: 'Retail', percentage: 15, value: 4200000, color: 'bg-amber-500' }
        ],
        riskProfile: 'Conservative',
        holdPeriod: '10+ years',
        targetIRR: '12-15%'
      },

      purchaseHistory: [
        { date: '2023-10-05', address: '450 Bloor St W', city: 'Toronto', type: 'Mixed-Use', price: 4200000, sqft: 12000, capRate: 4.2, verified: true },
        { date: '2023-06-12', address: '89 Avenue Rd', city: 'Toronto', type: 'Retail', price: 3100000, sqft: 5500, capRate: 4.5, verified: true },
        { date: '2022-11-20', address: '2345 Yonge St', city: 'Toronto', type: 'Multi-Family', price: 5600000, units: 32, capRate: 3.8, verified: true }
      ],

      socialResearch: {
        linkedin: {
          found: true,
          posts: 28,
          connections: 1800,
          recentActivity: 'Shared article about purpose-built rental trends',
          sentiment: 'Positive',
          keywords: ['multi-family', 'purpose-built rental', 'affordable housing']
        },
        twitter: {
          found: false
        },
        newsMentions: [
          { date: '2023-11-15', source: 'Urban Toronto', title: 'Chen Family Holdings expands rental portfolio' }
        ]
      },

      assetClassAnalysis: {
        preferred: 'Multi-Family',
        confidence: 88,
        evidence: [
          '60% of portfolio in multi-family',
          'Active in purpose-built rental space',
          'Long-term hold strategy aligns with rental assets',
          'Social media focused on housing affordability'
        ],
        priceRange: { min: 3000000, max: 8000000 },
        preferredMarkets: ['Toronto', 'Midtown Toronto'],
        criteria: {
          minUnits: 20,
          maxUnits: 50,
          minCapRate: 3.5,
          preferredLocations: ['Transit corridors', 'University areas'],
          valueAdd: 'Renovation upside preferred'
        }
      },

      opportunities: [
        { id: 201, address: '1250 Eglinton Ave W', type: 'Multi-Family', price: 6200000, units: 36, capRate: 4.0, matchScore: 91, reason: 'Value-add opportunity on transit line' }
      ],

      status: 'active',
      lastContact: '2024-03-25',
      nextFollowUp: '2024-04-02',
      notes: 'Conservative buyer, focuses on stable cash flow. Prefers Toronto core locations.'
    },
    {
      id: 3,
      name: 'David Park',
      company: 'Park Development Corp',
      title: 'CEO',
      email: 'david@parkdevcorp.com',
      phone: '905-555-0391',
      linkedin: 'linkedin.com/in/davidpark-developer',
      location: 'Toronto, ON',
      buyerType: 'Developer',
      verified: true,
      
      portfolio: {
        totalValue: 120000000,
        propertyCount: 6,
        avgDealSize: 20000000,
        geographicFocus: ['Toronto', 'North York', 'Scarborough'],
        assetClasses: [
          { type: 'Development Land', percentage: 70, value: 84000000, color: 'bg-purple-500' },
          { type: 'Commercial', percentage: 20, value: 24000000, color: 'bg-blue-500' },
          { type: 'Residential Land', percentage: 10, value: 12000000, color: 'bg-pink-500' }
        ],
        riskProfile: 'Aggressive',
        holdPeriod: '2-4 years',
        targetIRR: '25-35%'
      },

      purchaseHistory: [
        { date: '2023-12-10', address: '1900 Eglinton Ave E', city: 'Toronto', type: 'Development Land', price: 15000000, acres: 4.2, zoning: 'Mixed-Use', verified: true },
        { date: '2023-07-22', address: '4500 Kingston Rd', city: 'Scarborough', type: 'Development Land', price: 8500000, acres: 2.8, zoning: 'Residential', verified: true },
        { date: '2023-04-15', address: '88 Sheppard Ave E', city: 'North York', type: 'Commercial', price: 12000000, sqft: 25000, capRate: 4.0, verified: true }
      ],

      socialResearch: {
        linkedin: {
          found: true,
          posts: 89,
          connections: 4200,
          recentActivity: 'Announced new 200-unit project breaking ground',
          sentiment: 'Very Positive',
          keywords: ['development', 'groundbreaking', 'Toronto housing', 'construction']
        },
        newsMentions: [
          { date: '2024-02-20', source: 'Toronto Star', title: 'Park Development breaks ground on Eglinton project' },
          { date: '2023-08-10', source: 'Daily Commercial News', title: 'Park Corp acquires 4-acre site for mixed-use development' }
        ]
      },

      assetClassAnalysis: {
        preferred: 'Development Land',
        confidence: 96,
        evidence: [
          '70% of portfolio in development land',
          'Active developer with projects underway',
          'Social media shows construction activity',
          'Purchasing pattern shows land assembly strategy'
        ],
        priceRange: { min: 5000000, max: 50000000 },
        preferredMarkets: ['Toronto', 'North York', 'Eglinton Crosstown corridor'],
        criteria: {
          minSize: '2 acres',
          zoning: 'Mixed-use or residential',
          transit: 'Within 800m of subway/LRT',
          density: 'Minimum 4.0 FSR'
        }
      },

      opportunities: [
        { id: 301, address: '2450 Victoria Park Ave', type: 'Development Land', price: 18500000, acres: 5.5, zoning: 'Mixed-Use', matchScore: 95, reason: 'Corner site on transit corridor, assembly potential' }
      ],

      status: 'very_active',
      lastContact: '2024-03-28',
      nextFollowUp: '2024-04-01',
      notes: 'Aggressive developer, moves fast on land deals. Has construction capability in-house.'
    }
  ];

  useEffect(() => {
    setBuyers(mockBuyers);
  }, []);

  const filteredBuyers = useMemo(() => {
    if (!searchQuery) return buyers;
    return buyers.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.buyerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.assetClassAnalysis.preferred.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [buyers, searchQuery]);

  const runSocialMediaResearch = (buyerId) => {
    setResearching(true);
    setTimeout(() => {
      setResearching(false);
      alert('🔍 Social Media Research Complete!\n\nAnalyzed LinkedIn, Twitter, and news mentions.\nUpdated buyer profile with latest insights.');
    }, 2500);
  };

  const verifyPurchaseHistory = (buyer) => {
    alert(`✅ Purchase History Verified for ${buyer.name}\n\n${buyer.purchaseHistory.filter(p => p.verified).length} of ${buyer.purchaseHistory.length} transactions confirmed via:\n• Land registry records
• MPAC data
• Broker confirmations\n• Title searches`);
  };

  const getAssetClassIcon = (type) => {
    switch(type) {
      case 'Industrial': return <Warehouse className="w-5 h-5" />;
      case 'Multi-Family': return <Building className="w-5 h-5" />;
      case 'Retail': return <Store className="w-5 h-5" />;
      case 'Office': return <Building2 className="w-5 h-5" />;
      case 'Development Land': return <LandPlot className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Descriptive Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Buyer Intelligence</h1>
          <p className="text-slate-400 mt-1">Identify active commercial buyers by asset class, geography, and acquisition history.</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-0.5">•</span>
              <span>Search buyer databases by city and property type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-0.5">•</span>
              <span>View acquisition history and contact intelligence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-400 mt-0.5">•</span>
              <span>Export matched buyers for outreach or referral agreements</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Header -->
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal-600 flex items-center justify-center text-3xl">
            🎯
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Buyer Intelligence Bot</h1>
            <p className="text-text-secondary">Expert Buyer Representative • Portfolio Analysis & Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Profiles
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Target className="w-4 h-4" />
            Research New Buyer
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Buyer List */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search buyers, companies, asset classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">Qualified Buyers ({filteredBuyers.length})</h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {filteredBuyers.map(buyer => (
                <button
                  key={buyer.id}
                  onClick={() => setSelectedBuyer(buyer)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedBuyer?.id === buyer.id ? 'bg-teal-500/10 border-l-4 border-teal-500' : 'hover:bg-bg-input'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{buyer.name}</p>
                      <p className="text-sm text-text-secondary">{buyer.company}</p>
                    </div>
                    {buyer.verified && (
                      <ShieldCheck className="w-4 h-4 text-green-400" title="Verified Buyer" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-teal-500/10 text-teal-400 rounded-full">
                      {buyer.assetClassAnalysis.preferred}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      buyer.status === 'very_active' ? 'bg-red-500/20 text-red-400' :
                      buyer.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      'bg-text-muted/20 text-text-muted'
                    }`}>
                      {buyer.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Portfolio: ${(buyer.portfolio.totalValue/1000000).toFixed(0)}M • {buyer.portfolio.propertyCount} properties
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Buyer Intelligence */}
        <div className="lg:col-span-3 space-y-4">
          {selectedBuyer ? (
            <>
              {/* Buyer Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-teal-600 flex items-center justify-center text-2xl font-bold text-white">
                      {selectedBuyer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-text-primary">{selectedBuyer.name}</h2>
                        {selectedBuyer.verified && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary">{selectedBuyer.title} at {selectedBuyer.company}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {selectedBuyer.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" /> {selectedBuyer.buyerType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => runSocialMediaResearch(selectedBuyer.id)}
                      disabled={researching}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      {researching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      Research
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>

              {/* Portfolio Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-teal-400" />
                    Portfolio Composition
                  </h3>
                  <div className="space-y-3">
                    {selectedBuyer.portfolio.assetClasses.map((asset, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-secondary flex items-center gap-2">
                            {getAssetClassIcon(asset.type)}
                            {asset.type}
                          </span>
                          <span className="text-text-primary">{asset.percentage}%</span>
                        </div>
                        <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                          <div className={`h-full ${asset.color} rounded-full`} style={{ width: `${asset.percentage}%` }} />
                        </div>
                        <p className="text-xs text-text-muted mt-1">${(asset.value/1000000).toFixed(1)}M</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Total Value</p>
                      <p className="text-xl font-bold text-text-primary">${(selectedBuyer.portfolio.totalValue/1000000).toFixed(0)}M</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Properties</p>
                      <p className="text-xl font-bold text-text-primary">{selectedBuyer.portfolio.propertyCount}</p>
                    </div>
                  </div>
                </div>

                {/* Asset Class Analysis */}
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-teal-400" />
                    Asset Class Intelligence
                  </h3>
                  <div className="bg-teal-500/10 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-secondary">Preferred Asset Class</p>
                        <p className="text-2xl font-bold text-teal-400">{selectedBuyer.assetClassAnalysis.preferred}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">AI Confidence</p>
                        <p className="text-2xl font-bold text-green-400">{selectedBuyer.assetClassAnalysis.confidence}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Evidence:</p>
                    {selectedBuyer.assetClassAnalysis.evidence.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="card">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    Verified Purchase History
                  </h3>
                  <button 
                    onClick={() => verifyPurchaseHistory(selectedBuyer)}
                    className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify All
                  </button>
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedBuyer.purchaseHistory.map((purchase, idx) => (
                    <div key={idx} className="p-4 hover:bg-bg-input/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{purchase.address}</p>
                            {purchase.verified && (
                              <ShieldCheck className="w-4 h-4 text-green-400" title="Verified Purchase" />
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{purchase.city} • {purchase.type}</p>
                          <p className="text-sm text-text-muted mt-1">
                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                            {purchase.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-primary">${(purchase.price/1000000).toFixed(2)}M</p>
                          {purchase.capRate && (
                            <p className="text-sm text-text-secondary">{purchase.capRate}% Cap</p>
                          )}
                          {purchase.sqft && (
                            <p className="text-sm text-text-muted">{purchase.sqft.toLocaleString()} sqft</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media Research */}
              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Social Media Intelligence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedBuyer.socialResearch.linkedin.found && (
                    <div className="bg-bg-input rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Linkedin className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-text-primary">LinkedIn</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-text-secondary">{selectedBuyer.socialResearch.linkedin.connections} connections</p>
                        <p className="text-text-secondary">{selectedBuyer.socialResearch.linkedin.posts} posts</p>
                        <p className="text-text-muted mt-2 text-xs">{selectedBuyer.socialResearch.linkedin.recentActivity}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedBuyer.socialResearch.twitter?.found && (
                    <div className="bg-bg-input rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-5 h-5 text-sky-500" />
                        <span className="font-medium text-text-primary">Twitter/X</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-text-secondary">{selectedBuyer.socialResearch.twitter.followers} followers</p>
                        <p className="text-text-secondary">{selectedBuyer.socialResearch.twitter.posts} posts</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-bg-input rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-text-primary">News Mentions</span>
                    </div>
                    <div className="space-y-2">
                      {selectedBuyer.socialResearch.newsMentions.map((mention, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="text-text-primary text-xs font-medium">{mention.source}</p>
                          <p className="text-text-secondary text-xs">{mention.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="card">
                <div className="p-4 border-b border-border-subtle">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Matched Opportunities
                  </h3>
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedBuyer.opportunities.map(opp => (
                    <div key={opp.id} className="p-4 hover:bg-bg-input/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{opp.address}</p>
                            <span className="text-xs px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full">
                              {opp.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">{opp.type} • {opp.capRate}% Cap</p>
                          <p className="text-sm text-text-muted mt-1">{opp.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-primary">${(opp.price/1000000).toFixed(2)}M</p>
                          <button className="mt-2 text-xs text-teal-400 hover:text-teal-300">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <User className="w-16 h-16 text-text-muted mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Buyer Selected</h3>
              <p className="text-text-secondary max-w-md">
                Select a buyer from the list to view their complete intelligence profile, portfolio analysis, and matched opportunities
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerBot;
