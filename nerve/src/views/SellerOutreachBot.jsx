import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MessageSquare, Phone, Mail, Calendar, Target, 
  TrendingUp, CheckCircle, Clock, AlertCircle, Send, 
  Sparkles, RefreshCw, Filter, Search, Star, MapPin,
  Building2, DollarSign, BarChart3, PieChart, Zap,
  ThumbsUp, ThumbsDown, MessageCircle, MoreHorizontal
} from 'lucide-react';

const SellerOutreachBot = () => {
  // State
  const [prospects, setProspects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('prospects'); // prospects, campaigns, analytics
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Mock data
  const mockProspects = [
    { 
      id: 1, 
      name: 'Robert Chen', 
      address: '45 Highland Ave', 
      city: 'Toronto',
      estimatedValue: 1450000,
      lastContact: '2024-03-15',
      status: 'warm',
      source: 'Expired Listing',
      motivation: 'High',
      notes: 'Previously listed for 6 months, wants to try again',
      phone: '416-555-0123',
      email: 'robert.chen@email.com',
      touchpoints: 3,
      nextFollowUp: '2024-04-05'
    },
    { 
      id: 2, 
      name: 'The Williams Family', 
      address: '128 Lakeshore Blvd', 
      city: 'Oakville',
      estimatedValue: 2800000,
      lastContact: '2024-03-28',
      status: 'hot',
      source: 'FSBO',
      motivation: 'Very High',
      notes: 'Divorce situation, needs quick sale',
      phone: '905-555-0456',
      email: 'williams.family@email.com',
      touchpoints: 5,
      nextFollowUp: '2024-04-02'
    },
    { 
      id: 3, 
      name: 'Sarah Mitchell', 
      address: '789 Queen St W', 
      city: 'Toronto',
      estimatedValue: 890000,
      lastContact: '2024-03-20',
      status: 'cold',
      source: 'Geo-Farm',
      motivation: 'Medium',
      notes: 'Thinking of upsizing in 6-12 months',
      phone: '647-555-0789',
      email: 'sarah.m@email.com',
      touchpoints: 1,
      nextFollowUp: '2024-04-15'
    },
    { 
      id: 4, 
      name: 'David Park', 
      address: '234 Main St', 
      city: 'Markham',
      estimatedValue: 1150000,
      lastContact: '2024-03-25',
      status: 'warm',
      source: 'Referral',
      motivation: 'High',
      notes: 'Referred by past client, ready to list',
      phone: '905-555-0321',
      email: 'dpark@email.com',
      touchpoints: 2,
      nextFollowUp: '2024-04-03'
    },
    { 
      id: 5, 
      name: 'Jennifer Lopez', 
      address: '567 King St E', 
      city: 'Toronto',
      estimatedValue: 1250000,
      lastContact: '2024-03-10',
      status: 'cold',
      source: 'Open House',
      motivation: 'Low',
      notes: 'Met at open house, just browsing',
      phone: '416-555-0654',
      email: 'jlopez@email.com',
      touchpoints: 1,
      nextFollowUp: '2024-05-01'
    },
  ];

  const mockCampaigns = [
    {
      id: 1,
      name: 'Spring Seller Blitz',
      status: 'active',
      type: 'Multi-touch',
      prospects: 45,
      contacted: 38,
      responses: 12,
      listings: 3,
      startDate: '2024-03-01',
      endDate: '2024-04-30'
    },
    {
      id: 2,
      name: 'Expired Listing Revival',
      status: 'active',
      type: 'Phone Campaign',
      prospects: 28,
      contacted: 25,
      responses: 8,
      listings: 2,
      startDate: '2024-03-15',
      endDate: '2024-04-15'
    },
    {
      id: 3,
      name: 'Geo-Farm Q1',
      status: 'completed',
      type: 'Direct Mail',
      prospects: 120,
      contacted: 120,
      responses: 15,
      listings: 4,
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    }
  ];

  useEffect(() => {
    setProspects(mockProspects);
    setCampaigns(mockCampaigns);
  }, []);

  // Filter prospects
  const filteredProspects = useMemo(() => {
    let result = prospects;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.address.toLowerCase().includes(searchLower) ||
        p.city.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    
    if (sourceFilter !== 'all') {
      result = result.filter(p => p.source === sourceFilter);
    }
    
    return result;
  }, [prospects, searchQuery, statusFilter, sourceFilter]);

  // Stats
  const stats = useMemo(() => ({
    totalProspects: prospects.length,
    hot: prospects.filter(p => p.status === 'hot').length,
    warm: prospects.filter(p => p.status === 'warm').length,
    cold: prospects.filter(p => p.status === 'cold').length,
    totalValue: prospects.reduce((a, b) => a + b.estimatedValue, 0),
    avgTouchpoints: prospects.length ? (prospects.reduce((a, b) => a + b.touchpoints, 0) / prospects.length).toFixed(1) : 0,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalListings: campaigns.reduce((a, b) => a + b.listings, 0)
  }), [prospects, campaigns]);

  const generateMessage = (prospect) => {
    const templates = {
      'Expired Listing': `Hi ${prospect.name.split(' ')[0]}, I noticed your listing at ${prospect.address} recently expired. I'd love to share why it didn't sell and my strategy to get it sold quickly at the right price. Can we chat for 5 minutes?`,
      'FSBO': `Hi ${prospect.name.split(' ')[0]}, I saw you're selling ${prospect.address} yourself. I work with FSBOs who want professional exposure while saving on commission. Worth a conversation?`,
      'Geo-Farm': `Hi ${prospect.name.split(' ')[0]}, I'm the local real estate specialist in ${prospect.city}. I just sold a home near ${prospect.address} and thought you might be curious about your home's current value.`,
      'Referral': `Hi ${prospect.name.split(' ')[0]}, [Mutual Contact] suggested I reach out. They spoke highly of you and thought I could help with your real estate needs.`,
      'Open House': `Hi ${prospect.name.split(' ')[0]}, great meeting you at the open house! I wanted to follow up and see if you had any questions about the market or your own home's value.`
    };
    
    return templates[prospect.source] || `Hi ${prospect.name.split(' ')[0]}, I'm reaching out about your property at ${prospect.address}.`;
  };

  const openMessageModal = (prospect) => {
    setSelectedProspect(prospect);
    setMessageText(generateMessage(prospect));
    setShowMessageModal(true);
  };

  const sendMessage = () => {
    alert(`✅ Message sent to ${selectedProspect.name}!

"${messageText}"

Follow-up scheduled for: ${selectedProspect.nextFollowUp}`);
    setShowMessageModal(false);
    setMessageText('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center text-3xl">
            🤝
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Seller Outreach Bot</h1>
            <p className="text-text-secondary">Ambassador • Proactive seller engagement & nurturing</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={`btn-secondary flex items-center gap-2 ${activeTab === 'campaigns' ? 'ring-2 ring-rose-500' : ''}`}
          >
            <Target className="w-4 h-4" />
            Campaigns
          </button>
          <button 
            onClick={() => openMessageModal(mockProspects[0])}
            className="btn-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Start Outreach
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-text-primary">{stats.totalProspects}</p>
          <p className="text-xs text-text-secondary mt-1">Prospects</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.hot}</p>
          <p className="text-xs text-text-secondary mt-1">Hot</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{stats.warm}</p>
          <p className="text-xs text-text-secondary mt-1">Warm</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.cold}</p>
          <p className="text-xs text-text-secondary mt-1">Cold</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-400">${(stats.totalValue/1000000).toFixed(1)}M</p>
          <p className="text-xs text-text-secondary mt-1">Pipeline Value</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{stats.avgTouchpoints}</p>
          <p className="text-xs text-text-secondary mt-1">Avg Touches</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{stats.activeCampaigns}</p>
          <p className="text-xs text-text-secondary mt-1">Active Campaigns</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-rose-400">{stats.totalListings}</p>
          <p className="text-xs text-text-secondary mt-1">Listings Won</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Filters & Quick Actions */}
        <div className="space-y-4">
          {/* Search */}
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h3>
            <div>
              <label className="text-xs text-text-secondary">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">🌤️ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary">Source</label>
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm"
              >
                <option value="all">All Sources</option>
                <option value="Expired Listing">Expired Listing</option>
                <option value="FSBO">FSBO</option>
                <option value="Geo-Farm">Geo-Farm</option>
                <option value="Referral">Referral</option>
                <option value="Open House">Open House</option>
              </select>
            </div>
          </div>

          {/* AI Insights */}
          <div className="card p-4">
            <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              AI Insights
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-text-secondary">
                <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
                <span>2 prospects show high motivation - prioritize today</span>
              </div>
              <div className="flex items-start gap-2 text-text-secondary">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5" />
                <span>3 follow-ups overdue</span>
              </div>
              <div className="flex items-start gap-2 text-text-secondary">
                <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                <span>Best time to call: 10am-12pm, 5pm-7pm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Prospects List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                Prospects ({filteredProspects.length})
              </h3>
              <div className="flex gap-2">
                <button className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-border-subtle max-h-[600px] overflow-y-auto">
              {filteredProspects.map(prospect => (
                <div key={prospect.id} className="p-4 hover:bg-bg-input/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-text-primary">{prospect.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          prospect.status === 'hot' ? 'bg-red-500/20 text-red-400' :
                          prospect.status === 'warm' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {prospect.status.toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-bg-input text-text-secondary rounded-full">
                          {prospect.source}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {prospect.address}, {prospect.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Est. ${(prospect.estimatedValue/1000000).toFixed(1)}M
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          Motivation: {prospect.motivation}
                        </span>
                      </div>

                      <p className="text-sm text-text-muted mt-2">{prospect.notes}</p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {prospect.touchpoints} touchpoints
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Next: {prospect.nextFollowUp}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last: {prospect.lastContact}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => openMessageModal(prospect)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                      <button className="btn-secondary text-sm flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Call
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg">
            <div className="p-4 border-b border-border-subtle">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                Message to {selectedProspect.name}
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-bg-input p-3 rounded-lg text-sm">
                <p className="text-text-secondary">To: {selectedProspect.phone} / {selectedProspect.email}</p>
                <p className="text-text-secondary">Property: {selectedProspect.address}</p>
              </div>
              
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                className="w-full p-3 bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm resize-none"
              />
              
              <div className="flex gap-2">
                <button className="text-xs px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full hover:bg-rose-500/20">
                  Regenerate with AI
                </button>
                <button className="text-xs px-3 py-1 bg-bg-input text-text-secondary rounded-full hover:bg-border-subtle">
                  Save Template
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle flex gap-2">
              <button 
                onClick={sendMessage}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              <button 
                onClick={() => setShowMessageModal(false)}
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

export default SellerOutreachBot;
