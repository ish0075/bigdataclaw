import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Building2, TrendingUp, DollarSign, Target, 
  Linkedin, Facebook, Instagram, Globe, FileText, PieChart,
  MapPin, Calendar, CheckCircle, AlertCircle, BarChart3,
  Briefcase, Home, Store, Warehouse, LandPlot, Building,
  ArrowUpRight, Eye, MessageSquare, Phone, Mail, Download,
  RefreshCw, Filter, Star, Clock, ExternalLink, ShieldCheck,
  Activity, Layers, Wallet, Percent, Tag, Search,
  Zap, TrendingDown, AlertTriangle, Heart, Briefcase as BriefcaseIcon,
  Gavel, TreePine, Waves, Sun, Snowflake, Wind,
  Shield, FileCheck, Scale, Hammer, Ruler
} from 'lucide-react';

const SellerBot = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [researching, setResearching] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, holdings, motivation, strategy

  // Mock seller data with comprehensive intelligence
  const mockSellers = [
    {
      id: 1,
      name: 'Robert Chen',
      entity: 'Chen Holdings Ltd.',
      title: 'Principal',
      email: 'r.chen@chenholdings.ca',
      phone: '416-555-0142',
      linkedin: 'linkedin.com/in/robertchen-realestate',
      location: 'Toronto, ON',
      sellerType: 'Portfolio Investor',
      verified: true,
      
      // Holdings Analysis (What they own)
      holdings: {
        totalValue: 28500000,
        propertyCount: 8,
        totalSqft: 145000,
        geographicFocus: ['Toronto', 'Markham', 'Vaughan'],
        assetClasses: [
          { type: 'Industrial', percentage: 50, value: 14250000, properties: 3, color: 'bg-blue-500' },
          { type: 'Retail', percentage: 30, value: 8550000, properties: 3, color: 'bg-amber-500' },
          { type: 'Office', percentage: 15, value: 4275000, properties: 1, color: 'bg-purple-500' },
          { type: 'Land', percentage: 5, value: 1425000, properties: 1, color: 'bg-green-500' }
        ],
        avgHoldingPeriod: '7.5 years',
        oldestAsset: '2012',
        leverageRatio: '42%',
        annualNOI: 1850000
      },

      // Sale History (Verified past sales)
      saleHistory: [
        { date: '2023-08-15', address: '890 Warden Ave', city: 'Toronto', type: 'Retail', salePrice: 4200000, originalPrice: 3100000, holdYears: 6, gain: 35, buyerType: 'REIT', verified: true },
        { date: '2022-11-20', address: '45 Industrial Pkwy', city: 'Markham', type: 'Industrial', salePrice: 6800000, originalPrice: 5200000, holdYears: 8, gain: 31, buyerType: 'Institutional', verified: true },
        { date: '2021-06-10', address: '2340 Lawrence Ave E', city: 'Scarborough', type: 'Retail', salePrice: 2800000, originalPrice: 1950000, holdYears: 5, gain: 44, buyerType: 'Private Investor', verified: true },
        { date: '2020-03-15', address: '1200 Eglinton Ave E', city: 'Toronto', type: 'Office', salePrice: 5100000, originalPrice: 4300000, holdYears: 7, gain: 19, buyerType: 'Developer', verified: true }
      ],

      // Social Media Research
      socialResearch: {
        linkedin: {
          found: true,
          posts: 34,
          connections: 1800,
          recentActivity: 'Posted about "evaluating portfolio" 2 weeks ago',
          sentiment: 'Neutral-Cautious',
          keywords: ['portfolio optimization', '1031 exchange', 'market timing', 'capital recycling'],
          interests: ['Commercial Real Estate', 'Investment Strategy', 'Wealth Management']
        },
        twitter: {
          found: false
        },
        newsMentions: [
          { date: '2024-01-15', source: 'REJournals', title: 'Chen Holdings sells Warden Ave retail for $4.2M' },
          { date: '2023-11-10', source: 'Globe and Mail', title: 'Toronto investors evaluating exit strategies amid rate uncertainty' }
        ],
        corporateFilings: [
          { date: '2024-02-01', type: 'Annual Return', notes: 'No changes to directors' },
          { date: '2023-12-15', type: 'Property Transfer', notes: 'Sold 890 Warden Ave to RioCan REIT' }
        ]
      },

      // Asset Class Analysis (What they typically sell)
      assetClassAnalysis: {
        preferredExit: 'Retail',
        confidence: 87,
        evidence: [
 '30% of recent sales were retail properties',
          'LinkedIn mentions "optimizing retail exposure"',
          'Sold 2 retail assets in last 18 months',
          'Retail sector showing stress in portfolio',
          'Recent post about "rebalancing to industrial"'
        ],
        typicalHoldPeriod: '5-8 years',
        priceRange: { min: 2500000, max: 8000000 },
        preferredMarkets: ['Toronto', 'Markham', 'North York'],
        buyerTypes: ['REITs', 'Institutional', 'Private Equity']
      },

      // Motivation Analysis (Why they might sell)
      motivationAnalysis: {
        overallScore: 78, // 0-100, higher = more motivated
        category: 'High Motivation',
        factors: [
          { type: 'Portfolio Rebalancing', score: 85, evidence: 'Social media mentions portfolio optimization' },
          { type: 'Market Timing', score: 80, evidence: 'Recent discussions about peak market conditions' },
          { type: '1031 Exchange', score: 75, evidence: 'Previous 1031 exchanges in history, looking to defer gains' },
          { type: 'Debt Maturity', score: 70, evidence: 'Loans originating 2019-2020 coming due' },
          { type: 'Partnership Dispute', score: 45, evidence: 'No public signs, but worth probing' }
        ],
        lifeEvents: [
          { event: 'Approaching Retirement', probability: 'Medium', impact: 'May want to liquidate slowly' },
          { event: 'Estate Planning', probability: 'High', impact: 'Children taking over, may simplify portfolio' }
        ],
        distressSignals: [
          { signal: 'Recent large sale', severity: 'Low', details: 'Sold Warden Ave - strategic, not distressed' },
          { signal: 'Portfolio consolidation talks', severity: 'Medium', details: 'Evaluating which assets to keep' }
        ]
      },

      // Entity & Ownership Structure
      entityAnalysis: {
        structure: 'Holdco with multiple SPVs',
        holdingCompany: 'Chen Holdings Ltd.',
        spvs: [
          { name: 'CH Industrial LP', assets: 3, type: 'Industrial' },
          { name: 'CH Retail Holdings Inc.', assets: 3, type: 'Retail' }
        ],
        beneficialOwners: [
          { name: 'Robert Chen', percentage: 65, role: 'Managing Partner' },
          { name: 'Jennifer Chen', percentage: 25, role: 'Silent Partner' },
          { name: 'Michael Chen', percentage: 10, role: 'Next Generation' }
        ],
        decisionMaker: 'Robert Chen',
        influencers: ['Michael Chen (son, taking larger role)', 'Family wealth advisor'],
        keyRelationships: ['RBC Commercial Banking', 'Goodmans LLP (legal)', 'Cushman & Wakefield (previous broker)']
      },

      // Contact Strategy
      contactStrategy: {
        bestApproach: 'Professional Referral',
        bestTime: 'Tuesday-Thursday, 10am-12pm or 2pm-4pm',
        preferredChannel: 'Email first, then phone',
        talkingPoints: [
          'Market timing for retail assets',
          '1031 exchange opportunities',
          'Portfolio optimization strategies',
          'Industrial sector strength vs retail stress'
        ],
        avoid: [
          'Direct solicitation without context',
          'Weekend calls (family time)',
          'Aggressive pricing pressure'
        ],
        valueProposition: 'Help recycle capital from retail into industrial for better long-term growth',
        relationshipHistory: 'No prior contact with our brokerage'
      },

      // Critical Thinking Insights
      insights: [
        {
          type: 'Opportunity',
          title: '1031 Exchange Window',
          description: 'Recent sale of Warden Ave suggests 45-day identification period may be active. Perfect time to present replacement properties.',
          confidence: 85,
          action: 'Reach out within 10 days with vetted industrial opportunities'
        },
        {
          type: 'Risk',
          title: 'Market Timing Concerns',
          description: 'LinkedIn activity suggests they believe market is at peak. May hold off if they think prices will go higher.',
          confidence: 70,
          action: 'Present data on interest rate impacts, cap rate expansion risk'
        },
        {
          type: 'Strategy',
          title: 'Next Generation Involvement',
          description: 'Michael Chen (son) is taking larger role and may favor tech-enabled, modern industrial assets.',
          confidence: 75,
          action: 'Include Michael in communications, highlight smart building features'
        },
        {
          type: 'Intelligence',
          title: 'Retail Portfolio Stress',
          description: 'Retail assets showing lower NOI growth. Pressure to exit before tenant defaults increase.',
          confidence: 80,
          action: 'Offer portfolio valuation to quantify retail exposure risk'
        }
      ],

      status: 'high_priority',
      lastContact: null,
      nextAction: 'Send market analysis email + request portfolio review call',
      estimatedCommission: 285000, // 1% of average deal size
      notes: 'Prime prospect - motivated, sophisticated, multiple assets. Focus on 1031 exchange timing and portfolio rebalancing.'
    },
    {
      id: 2,
      name: 'Maria Santos',
      entity: 'Santos Family Trust',
      title: 'Trustee',
      email: 'maria@santosfamily.ca',
      phone: '647-555-0287',
      location: 'Mississauga, ON',
      sellerType: 'Family Estate',
      verified: true,
      
      holdings: {
        totalValue: 4200000,
        propertyCount: 2,
        assetClasses: [
          { type: 'Multi-Family', percentage: 100, value: 4200000, properties: 2, color: 'bg-green-500' }
        ],
        avgHoldingPeriod: '22 years',
        inherited: true
      },

      saleHistory: [
        { date: '2019-05-20', address: '45 Dunn St', city: 'Oakville', type: 'Single Family', salePrice: 1850000, originalPrice: 450000, holdYears: 25, gain: 311, inherited: true, verified: true }
      ],

      socialResearch: {
        linkedin: { found: false },
        facebook: {
          found: true,
          posts: 'Private',
          recentActivity: 'Limited public information'
        }
      },

      motivationAnalysis: {
        overallScore: 92,
        category: 'Very High Motivation',
        factors: [
          { type: 'Estate Settlement', score: 95, evidence: 'Property held in family trust, parents deceased' },
          { type: 'Sibling Buyout', score: 90, evidence: '4 siblings with equal shares, disagreement on management' },
          { type: 'Property Management Burden', score: 85, evidence: 'Aging property, tenant issues, Maria lives in BC' },
          { type: 'Tax Planning', score: 80, evidence: 'Capital gains exemption planning for 2024' }
        ],
        lifeEvents: [
          { event: 'Death of Parents (2022)', probability: 'Confirmed', impact: 'Triggered estate settlement process' },
          { event: 'Out of Province Relocation', probability: 'Confirmed', impact: 'Maria lives in Vancouver, hard to manage' }
        ]
      },

      entityAnalysis: {
        structure: 'Family Trust',
        beneficialOwners: [
          { name: 'Maria Santos', percentage: 25 },
          { name: 'Carlos Santos', percentage: 25 },
          { name: 'Elena Santos', percentage: 25 },
          { name: 'David Santos', percentage: 25 }
        ],
        decisionMaker: 'All 4 siblings must agree',
        keyRelationships: ['BMO Trust Services', 'Estate lawyer: Jane Mitchell']
      },

      contactStrategy: {
        bestApproach: 'Empathetic estate specialist',
        talkingPoints: [
          'Stress-free estate settlement',
          'Fair market valuation for all siblings',
          'Quick close to avoid ongoing management headaches',
          'Tax-efficient sale timing'
        ],
        challenges: [
          '4 decision makers = complexity',
          'Emotional attachment to family property',
          'One sibling (Carlos) wants to keep, others want to sell'
        ]
      },

      insights: [
        {
          type: 'Urgency',
          title: 'Estate Settlement Deadline',
          description: 'Trust requires distribution by end of tax year. Pressure mounting.',
          confidence: 90,
          action: 'Position as estate settlement specialist, offer siblings mediation'
        },
        {
          type: 'Challenge',
          title: 'Holdout Sibling',
          description: 'Carlos wants to keep but cant afford buyout. Blocking sale.',
          confidence: 85,
          action: 'Find investor buyer who will offer Carlos retained interest or deferred payment'
        }
      ],

      status: 'very_hot',
      estimatedCommission: 84000,
      notes: 'Estate sale - highly motivated but complex with 4 siblings. Move fast before they list with someone else.'
    }
  ];

  useEffect(() => {
    setSellers(mockSellers);
  }, []);

  const filteredSellers = useMemo(() => {
    if (!searchQuery) return sellers;
    return sellers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sellerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.holdings.assetClasses.some(a => a.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sellers, searchQuery]);

  const runDeepResearch = (sellerId) => {
    setResearching(true);
    setTimeout(() => {
      setResearching(false);
      alert('🔍 Deep Research Complete!\n\nAnalyzed:\n• Corporate registry filings\n• Property ownership records\n• Court records (litigation, divorces, bankruptcies)\n• Social media sentiment\n• Mortgage maturity dates\n• Tax assessment changes\n• Building permit applications\n\nUpdated seller intelligence profile.');
    }, 3000);
  };

  const getAssetClassIcon = (type) => {
    switch(type) {
      case 'Industrial': return <Warehouse className="w-5 h-5" />;
      case 'Multi-Family': return <Building className="w-5 h-5" />;
      case 'Retail': return <Store className="w-5 h-5" />;
      case 'Office': return <Building2 className="w-5 h-5" />;
      case 'Land': return <LandPlot className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
    }
  };

  const getMotivationColor = (score) => {
    if (score >= 80) return 'text-red-400 bg-red-500/10';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10';
    return 'text-green-400 bg-green-500/10';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Descriptive Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Seller Outreach</h1>
          <p className="text-slate-400 mt-1">Find and engage property owners with compelling, data-driven outreach scripts.</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span>Generate personalized seller scripts from property intelligence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span>Access contact quick-links and ownership history</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span>Track outreach status and follow-up reminders</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Header -->
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center text-3xl">
            🏷️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Seller Intelligence Bot</h1>
            <p className="text-text-secondary">Expert Seller Representative • Holdings Analysis & Motivation Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Intelligence
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Research New Seller
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Seller List */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search sellers, entities, asset classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary">Qualified Sellers ({filteredSellers.length})</h3>
            </div>
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {filteredSellers.map(seller => (
                <button
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedSeller?.id === seller.id ? 'bg-rose-500/10 border-l-4 border-rose-500' : 'hover:bg-bg-input'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{seller.name}</p>
                      <p className="text-sm text-text-secondary">{seller.entity}</p>
                    </div>
                    {seller.verified && (
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getMotivationColor(seller.motivationAnalysis.overallScore)}`}>
                      {seller.motivationAnalysis.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Holdings: ${(seller.holdings.totalValue/1000000).toFixed(0)}M • {seller.holdings.propertyCount} properties
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Seller Intelligence */}
        <div className="lg:col-span-3 space-y-4">
          {selectedSeller ? (
            <>
              {/* Seller Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-rose-600 flex items-center justify-center text-2xl font-bold text-white">
                      {selectedSeller.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-text-primary">{selectedSeller.name}</h2>
                        {selectedSeller.verified && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Holdings
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary">{selectedSeller.title} • {selectedSeller.entity}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {selectedSeller.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" /> {selectedSeller.sellerType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => runDeepResearch(selectedSeller.id)}
                      disabled={researching}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      {researching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      Deep Research
                    </button>
                    <button className="btn-primary text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>

              {/* Critical Thinking Insights */}
              <div className="card p-4 border-l-4 border-amber-500">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  AI-Generated Insights & Opportunities
                </h3>
                <div className="space-y-3">
                  {selectedSeller.insights.map((insight, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      insight.type === 'Opportunity' ? 'bg-green-500/5 border border-green-500/20' :
                      insight.type === 'Risk' ? 'bg-red-500/5 border border-red-500/20' :
                      insight.type === 'Urgency' ? 'bg-amber-500/5 border border-amber-500/20' :
                      'bg-blue-500/5 border border-blue-500/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              insight.type === 'Opportunity' ? 'bg-green-500/20 text-green-400' :
                              insight.type === 'Risk' ? 'bg-red-500/20 text-red-400' :
                              insight.type === 'Urgency' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {insight.type}
                            </span>
                            <span className="text-xs text-text-muted">{insight.confidence}% confidence</span>
                          </div>
                          <p className="font-medium text-text-primary mt-1">{insight.title}</p>
                          <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
                          <p className="text-xs text-teal-400 mt-2">💡 Action: {insight.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings & Motivation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Holdings Analysis */}
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-rose-400" />
                    Holdings Analysis
                  </h3>
                  <div className="space-y-3">
                    {selectedSeller.holdings.assetClasses.map((asset, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-secondary flex items-center gap-2">
                            {getAssetClassIcon(asset.type)}
                            {asset.type} ({asset.properties})
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
                      <p className="text-text-muted">Total Holdings</p>
                      <p className="text-xl font-bold text-text-primary">${(selectedSeller.holdings.totalValue/1000000).toFixed(0)}M</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Properties</p>
                      <p className="text-xl font-bold text-text-primary">{selectedSeller.holdings.propertyCount}</p>
                    </div>
                    {selectedSeller.holdings.avgHoldingPeriod && (
                      <div>
                        <p className="text-text-muted">Avg Hold Period</p>
                        <p className="text-lg font-bold text-text-primary">{selectedSeller.holdings.avgHoldingPeriod}</p>
                      </div>
                    )}
                    {selectedSeller.holdings.leverageRatio && (
                      <div>
                        <p className="text-text-muted">Leverage</p>
                        <p className="text-lg font-bold text-text-primary">{selectedSeller.holdings.leverageRatio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Motivation Analysis */}
                <div className="card p-4">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-400" />
                    Motivation Analysis
                  </h3>
                  <div className={`p-4 rounded-lg mb-4 ${getMotivationColor(selectedSeller.motivationAnalysis.overallScore)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-secondary">Motivation Score</p>
                        <p className="text-3xl font-bold">{selectedSeller.motivationAnalysis.overallScore}/100</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">Category</p>
                        <p className="text-xl font-bold">{selectedSeller.motivationAnalysis.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-secondary">Motivation Factors:</p>
                    {selectedSeller.motivationAnalysis.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{factor.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-bg-input rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${factor.score >= 80 ? 'bg-red-500' : factor.score >= 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                              style={{ width: `${factor.score}%` }} 
                            />
                          </div>
                          <span className="text-text-primary w-8">{factor.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sale History */}
              <div className="card">
                <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    Verified Sale History
                  </h3>
                  <span className="text-xs text-text-muted">{selectedSeller.saleHistory.length} transactions</span>
                </div>
                <div className="divide-y divide-border-subtle">
                  {selectedSeller.saleHistory.map((sale, idx) => (
                    <div key={idx} className="p-4 hover:bg-bg-input/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{sale.address}</p>
                            {sale.verified && <ShieldCheck className="w-4 h-4 text-green-400" />}
                          </div>
                          <p className="text-sm text-text-secondary">{sale.city} • {sale.type}</p>
                          <p className="text-sm text-text-muted">
                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                            {sale.date} • Held {sale.holdYears} years
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-text-primary">${(sale.salePrice/1000000).toFixed(2)}M</p>
                          <p className="text-sm text-green-400">+{sale.gain}% gain</p>
                          <p className="text-xs text-text-muted">Buyer: {sale.buyerType}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entity Analysis */}
              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-400" />
                  Entity & Ownership Structure
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-text-muted mb-2">Structure</p>
                    <p className="text-text-primary font-medium">{selectedSeller.entityAnalysis.structure}</p>
                    
                    <p className="text-sm text-text-muted mt-4 mb-2">Beneficial Owners</p>
                    <div className="space-y-1">
                      {selectedSeller.entityAnalysis.beneficialOwners.map((owner, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-text-secondary">{owner.name}</span>
                          <span className="text-text-primary">{owner.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted mb-2">Decision Maker</p>
                    <p className="text-text-primary font-medium">{selectedSeller.entityAnalysis.decisionMaker}</p>
                    
                    {selectedSeller.entityAnalysis.influencers && (
                      <>
                        <p className="text-sm text-text-muted mt-4 mb-2">Key Influencers</p>
                        <ul className="text-sm text-text-secondary space-y-1">
                          {selectedSeller.entityAnalysis.influencers.map((inf, idx) => (
                            <li key={idx}>• {inf}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {selectedSeller.entityAnalysis.keyRelationships && (
                      <>
                        <p className="text-sm text-text-muted mt-4 mb-2">Key Relationships</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSeller.entityAnalysis.keyRelationships.map((rel, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-bg-input text-text-secondary rounded-full">
                              {rel}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Strategy */}
              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-rose-400" />
                  Recommended Contact Strategy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-bg-input p-3 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Best Approach</p>
                    <p className="text-text-primary font-medium">{selectedSeller.contactStrategy.bestApproach}</p>
                  </div>
                  <div className="bg-bg-input p-3 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Best Time</p>
                    <p className="text-text-primary font-medium">{selectedSeller.contactStrategy.bestTime}</p>
                  </div>
                  <div className="bg-bg-input p-3 rounded-lg">
                    <p className="text-xs text-text-muted mb-1">Preferred Channel</p>
                    <p className="text-text-primary font-medium">{selectedSeller.contactStrategy.preferredChannel}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-text-muted mb-2">Key Talking Points:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeller.contactStrategy.talkingPoints.map((point, idx) => (
                      <span key={idx} className="text-sm px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">Value Proposition</p>
                  <p className="text-text-primary text-sm">{selectedSeller.contactStrategy.valueProposition}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
              <Users className="w-16 h-16 text-text-muted mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Seller Selected</h3>
              <p className="text-text-secondary max-w-md">
                Select a seller from the list to view their complete holdings analysis, motivation intelligence, and recommended contact strategy
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerBot;
