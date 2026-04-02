import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp, Lightbulb, Target, Zap, BookOpen } from 'lucide-react';

const pageDocumentation = {
  MissionControl: {
    title: "Mission Control Dashboard",
    description: "Your central command center for monitoring all CRE intelligence activities, active missions, and system performance.",
    whatItDoes: [
      "Displays real-time statistics on hot money alerts, tracked capital, and match scores",
      "Shows active missions and their current status",
      "Monitors agent fleet health and activity",
      "Provides quick access shortcuts to start new research missions"
    ],
    whatYouCanDo: [
      "Launch new property research missions with one click",
      "View trending hot money leads with fresh capital",
      "Track total capital available from recent sellers ($1B+ currently)",
      "Monitor daily match scores and deal opportunities",
      "Access quick actions for common tasks"
    ],
    tips: [
      "Check this dashboard daily for new hot money alerts",
      "Use the 'New Mission' button to start property research",
      "Watch the 'Matches Today' counter for new opportunities",
      "Review active missions to track research progress"
    ]
  },
  
  HotMoneyRadar: {
    title: "Hot Money Radar",
    description: "Track recent property sellers who have fresh capital to reinvest. These are your highest-value leads - they just closed deals and have cash ready to deploy.",
    whatItDoes: [
      "Identifies property sellers from the last 90 days with confirmed capital",
      "Calculates match scores based on property type, location, and investment criteria",
      "Tracks $1.04+ billion in fresh capital across 27+ hot money leads",
      "Shows geographic distribution of capital across Ontario",
      "Filters by property type, cash amount, and location"
    ],
    whatYouCanDo: [
      "View detailed profiles of hot money leads including contact information",
      "Filter by property type (Industrial, Commercial, Residential, etc.)",
      "Filter by cash amount range ($1M - $467M)",
      "Export lead lists for outreach campaigns",
      "Edit lead information and add notes",
      "Pull AI-generated profiles for deeper research",
      "View matching properties for each lead",
      "Save profiles to Obsidian vault"
    ],
    tips: [
      "Focus on leads with match scores 70+ for best conversion",
      "Sort by cash amount to find the biggest opportunities",
      "Export lists weekly for systematic outreach",
      "Add notes after each contact to track conversations",
      "Use 'Pull Profile' for AI research on each entity"
    ]
  },
  
  PropertyResearch: {
    title: "Property Research",
    description: "Launch comprehensive multi-step research missions to analyze properties, find buyers, and identify opportunities.",
    whatItDoes: [
      "Runs 5-phase automated research missions",
      "Phase 1: Transaction Scout - Find recent comparable sales",
      "Phase 2: Portfolio Matching - Match properties to buyer portfolios",
      "Phase 3: Agent Finder - Identify listing agents and brokers",
      "Phase 4: Lender Matching - Find financing sources",
      "Phase 5: Opportunity Analysis - Generate actionable insights"
    ],
    whatYouCanDo: [
      "Enter property address or upload documents for analysis",
      "Use voice input to describe properties naturally",
      "Start research missions with custom parameters",
      "Monitor mission progress in real-time",
      "View research logs and detailed findings",
      "Export results to Obsidian vault",
      "Abort missions if needed",
      "View mission history and results"
    ],
    tips: [
      "Use voice input for faster property descriptions",
      "Upload feature sheets or OM documents for AI analysis",
      "Check mission logs for detailed agent activities",
      "Results auto-sync to Obsidian under 'Properties' folder"
    ]
  },
  
  DealPipeline: {
    title: "Deal Pipeline",
    description: "Visual Kanban board for tracking deals from initial contact through to closing. Manage your entire deal flow in one place.",
    whatItDoes: [
      "Organizes deals into stages: New, Qualified, Offer Made, Due Diligence, Closing",
      "Shows deal value, probability, and expected close dates",
      "Tracks contacts associated with each deal",
      "Calculates pipeline value and weighted forecasts",
      "Syncs with Obsidian vault for deal notes"
    ],
    whatYouCanDo: [
      "Drag and drop deals between pipeline stages",
      "Add new deals with property and buyer information",
      "Edit deal details, value, and probability",
      "View contact information for each deal",
      "Filter deals by stage, value, or date",
      "Export pipeline reports",
      "Add notes and track deal progress",
      "Set expected close dates and follow-up reminders"
    ],
    tips: [
      "Move deals to 'Qualified' only after first conversation",
      "Update probability percentages weekly for accurate forecasting",
      "Add notes after every client interaction",
      "Review pipeline weekly to identify deals needing attention",
      "Use filters to focus on high-value opportunities"
    ]
  },
  
  AgentWorkspace: {
    title: "Agent Workspace",
    description: "Command center for AI agents. Start, stop, monitor, and configure your automated research agents.",
    whatItDoes: [
      "Manages fleet of AI agents for different research tasks",
      "Monitors agent health, status, and activity",
      "Streams real-time logs from running agents",
      "Tracks agent performance and success rates",
      "WebSocket connection for live updates"
    ],
    whatYouCanDo: [
      "Start individual agents or entire agent fleets",
      "Stop or pause running agents",
      "View real-time agent logs and activities",
      "Configure agent parameters and settings",
      "Check agent status (Active, Idle, Error, Offline)",
      "Restart failed agents",
      "View agent performance metrics",
      "Monitor resource usage"
    ],
    tips: [
      "Start with 'Transaction Scout' agent for basic research",
      "Check logs regularly for errors or issues",
      "Restart agents if they show 'Error' status",
      "Use 'Start All' to begin full research fleet",
      "Monitor WebSocket status for connection issues"
    ]
  },
  
  BuyerMatcher: {
    title: "Buyer Matcher",
    description: "Match properties to qualified buyers from your database. Find the perfect buyer for any property.",
    whatItDoes: [
      "Analyzes 5,666+ buyers in the database",
      "Matches buyers based on price range, location, and property type",
      "Calculates match scores for each buyer-property pair",
      "Shows buyer portfolio and investment criteria",
      "Tracks 520+ transactions for pattern analysis"
    ],
    whatYouCanDo: [
      "Search properties to find matching buyers",
      "Filter buyers by price range, location, property type",
      "View detailed buyer profiles and contact info",
      "See buyer's transaction history",
      "Export match reports for outreach",
      "Quick links to research each buyer",
      "View match score explanations"
    ],
    tips: [
      "Sort by match score to find best-fit buyers",
      "Check buyer's recent transaction activity",
      "Export top 10 matches for each property",
      "Use quick links to research buyer background"
    ]
  },
  
  LenderMatcher: {
    title: "Lender Matcher",
    description: "Connect deals with appropriate lenders. Match financing needs to lender specialties.",
    whatItDoes: [
      "Matches deals to lenders based on loan type and amount",
      "Categorizes lenders by specialty (Commercial, Construction, Bridge, etc.)",
      "Shows lender contact information and requirements",
      "Tracks lender relationships and past deals"
    ],
    whatYouCanDo: [
      "Search by loan amount and property type",
      "Filter by lender specialty and location",
      "View lender contact details and requirements",
      "Export lender lists for deal packages",
      "Add new lenders to the database",
      "Quick links to lender websites"
    ],
    tips: [
      "Match lenders early in the deal process",
      "Export lender lists for buyer packages",
      "Update lender information regularly"
    ]
  },
  
  BuilderDirectory: {
    title: "Builder Directory",
    description: "Comprehensive database of construction companies and developers. Find builders for development opportunities.",
    whatItDoes: [
      "Stores 2,368+ construction companies and builders",
      "Categorizes by specialization (Commercial, Residential, Industrial)",
      "Tracks builder capacity and project types",
      "Geographic coverage across Ontario"
    ],
    whatYouCanDo: [
      "Search builders by name, location, or specialty",
      "Filter by construction type and project size",
      "View builder contact information",
      "Export builder lists for opportunities",
      "Add notes about builder relationships",
      "Quick links to builder websites"
    ],
    tips: [
      "Use for development site matching",
      "Export lists for land sale packages",
      "Track builder capacity and availability"
    ]
  },
  
  AgentMatcher: {
    title: "Agent Matcher",
    description: "Match opportunities with commercial and residential agents. Find the right agent for each deal.",
    whatItDoes: [
      "Matches agents to properties based on specialty and location",
      "Tracks agent performance and deal history",
      "Shows agent contact information and brokerages",
      "Analyzes agent transaction patterns"
    ],
    whatYouCanDo: [
      "Search agents by location and specialty",
      "View agent transaction history",
      "Filter by brokerage and experience",
      "Export agent contact lists",
      "Add agents to recruitment pipeline"
    ],
    tips: [
      "Sort by transaction volume for top performers",
      "Check recent activity for active agents",
      "Export for co-brokerage opportunities"
    ]
  },
  
  EXAgentRecruiterEnhanced: {
    title: "Residential Agent Recruiter",
    description: "Recruit top residential real estate agents. Import, track, and manage agent recruitment pipeline.",
    whatItDoes: [
      "Imports agent data from CSV files",
      "Stores 150,000+ agent records",
      "Tracks recruitment status and interactions",
      "Organizes agents by region and brokerage",
      "Syncs with Obsidian for recruitment notes"
    ],
    whatYouCanDo: [
      "Import agent lists from CSV",
      "Filter agents by brokerage, region, or status",
      "View agent contact information",
      "Track recruitment stage (New, Contacted, Interested, Joined)",
      "Add notes and tags to agents",
      "Export selected agents for outreach",
      "View agent statistics and counts",
      "Quick links to agent research"
    ],
    tips: [
      "Import agents in batches of 1000 for best performance",
      "Use tags to categorize agents by specialty",
      "Track status changes in recruitment pipeline",
      "Export 'Interested' agents for follow-up campaigns"
    ]
  },
  
  CommercialAgentRecruiter: {
    title: "Commercial Agent Recruiter",
    description: "Recruit commercial real estate agents and brokers. Build your commercial agent network.",
    whatItDoes: [
      "Manages commercial agent recruitment pipeline",
      "Tracks agent specialties (Industrial, Office, Retail, etc.)",
      "Stores brokerage and contact information",
      "Monitors recruitment progress and status"
    ],
    whatYouCanDo: [
      "Add commercial agents to database",
      "Filter by specialty and brokerage",
      "Track recruitment stages",
      "View agent production history",
      "Export for recruitment campaigns",
      "Add notes and meeting logs"
    ],
    tips: [
      "Focus on agents with $10M+ annual production",
      "Track meetings and follow-ups",
      "Use for brokerage expansion planning"
    ]
  },
  
  BrokeragesView: {
    title: "Brokerages Directory",
    description: "Complete directory of real estate brokerages. Research and analyze brokerage opportunities.",
    whatItDoes: [
      "Stores 5,000+ brokerage records",
      "Organizes by region, size, and type",
      "Tracks agent counts and market presence",
      "Shows brokerage contact information"
    ],
    whatYouCanDo: [
      "Search brokerages by name or location",
      "Filter by size and market area",
      "View agent counts and office locations",
      "Export brokerage lists",
      "Research expansion opportunities",
      "Track competitive landscape"
    ],
    tips: [
      "Use for market analysis and expansion planning",
      "Export top brokerages by agent count",
      "Research before recruitment campaigns"
    ]
  },
  
  ObsidianVault: {
    title: "Obsidian Vault",
    description: "Browse, search, and manage your Obsidian knowledge base. All research exports sync here.",
    whatItDoes: [
      "Connects to your local Obsidian vault",
      "Browses folders and markdown notes",
      "Previews note content without leaving the app",
      "Syncs research exports from all modules",
      "Organizes by folders: Buyers, Properties, Hot Money, etc."
    ],
    whatYouCanDo: [
      "Browse vault folders and subfolders",
      "Preview any markdown note",
      "Search notes by title or content",
      "View sync status for recent exports",
      "Quick links to open notes in Obsidian app",
      "Export data directly to vault folders",
      "View recently updated notes"
    ],
    tips: [
      "Check 'Hot Money' folder for latest lead exports",
      "Use search to find specific deals or buyers",
      "All research missions auto-export here",
      "Sync status shows if vault is connected"
    ]
  },
  
  OlenaFeatureSheet: {
    title: "Olena Feature Sheet",
    description: "Generate professional property marketing materials and feature sheets with Canva integration.",
    whatItDoes: [
      "Creates professional property feature sheets",
      "Integrates with Canva for design editing",
      "Auto-populates property data from database",
      "Generates PDF and image exports",
      "Stores templates for different property types"
    ],
    whatYouCanDo: [
      "Create new feature sheets from property data",
      "Edit designs in Canva editor",
      "Add photos, maps, and property details",
      "Export as PDF for distribution",
      "Save templates for reuse",
      "Generate multiple versions for different audiences"
    ],
    tips: [
      "Use high-quality photos for best results",
      "Include key metrics (cap rate, NOI, etc.)",
      "Export PDFs for email campaigns",
      "Save templates for quick turnaround"
    ]
  },
  
  MyListings: {
    title: "My Listings",
    description: "Manage your property listings. Track listings, marketing activities, and buyer interest.",
    whatItDoes: [
      "Stores all your active and sold listings",
      "Tracks listing status and marketing progress",
      "Shows property details and pricing",
      "Monitors inquiries and showing activity"
    ],
    whatYouCanDo: [
      "Add new property listings",
      "Edit listing details and pricing",
      "Track listing status (Active, Pending, Sold)",
      "Upload photos and documents",
      "View inquiry history",
      "Export listing reports",
      "Sync with marketing campaigns"
    ],
    tips: [
      "Update status immediately when deals progress",
      "Add all property details for better matching",
      "Track showing activity for market feedback"
    ]
  },
  
  Opportunities: {
    title: "Opportunities",
    description: "Track off-market and development opportunities. Manage land, development, and investment deals.",
    whatItDoes: [
      "Manages off-market property opportunities",
      "Tracks development sites and land deals",
      "Monitors opportunity stages and timelines",
      "Analyzes opportunity fit with buyer criteria"
    ],
    whatYouCanDo: [
      "Add new opportunities (land, buildings, portfolios)",
      "Track opportunity stage (Sourced, Qualified, Under LOI, etc.)",
      "Match opportunities to buyer requirements",
      "Add site photos and documents",
      "Calculate development potential",
      "Export opportunity summaries",
      "Track zoning and entitlement status"
    ],
    tips: [
      "Add opportunities as soon as you hear about them",
      "Track zoning status for development sites",
      "Match regularly to buyer databases"
    ]
  },
  
  PropertyUpload: {
    title: "Property Upload",
    description: "Quickly add properties to the system via upload or manual entry. Bulk import capabilities.",
    whatItDoes: [
      "Accepts property data via file upload",
      "Supports CSV and Excel formats",
      "Validates and cleans uploaded data",
      "Auto-extracts property details from documents"
    ],
    whatYouCanDo: [
      "Upload property lists via CSV",
      "Drag and drop files for import",
      "Map CSV columns to database fields",
      "Preview data before importing",
      "Add single properties manually",
      "Edit and validate uploaded properties"
    ],
    tips: [
      "Use template CSV for consistent formatting",
      "Validate addresses before importing",
      "Check preview for data accuracy"
    ]
  },
  
  SkillsAndAgents: {
    title: "Skills & Agents",
    description: "Configure AI agent capabilities and skills. Customize what your agents can do.",
    whatItDoes: [
      "Manages AI agent skill configurations",
      "Enables/disables agent capabilities",
      "Sets agent behavior parameters",
      "Tracks agent performance by skill"
    ],
    whatYouCanDo: [
      "Enable or disable agent skills",
      "Configure skill parameters",
      "View skill usage statistics",
      "Add custom skills",
      "Test agent capabilities",
      "Set skill priorities"
    ],
    tips: [
      "Enable only skills you need for better performance",
      "Test skills before deploying to production",
      "Monitor skill usage to optimize"
    ]
  },
  
  MapView: {
    title: "Map View",
    description: "Visualize properties, leads, and opportunities on an interactive map. Geographic analysis.",
    whatItDoes: [
      "Displays properties on interactive map",
      "Shows hot money leads by location",
      "Visualizes market coverage and clusters",
      "Filters by geographic boundaries"
    ],
    whatYouCanDo: [
      "View properties and leads on map",
      "Filter by area or radius",
      "Click markers for details",
      "Draw custom search areas",
      "Export map views",
      "Analyze geographic patterns"
    ],
    tips: [
      "Use for site selection analysis",
      "Identify geographic clusters of buyers",
      "Visualize market coverage gaps"
    ]
  },
  
  Settings: {
    title: "Settings",
    description: "Configure the application. Set up integrations, preferences, and system options.",
    whatItDoes: [
      "Manages user preferences",
      "Configures integrations (Obsidian, API keys)",
      "Sets up notification preferences",
      "Manages data sources and connections"
    ],
    whatYouCanDo: [
      "Configure Obsidian vault path",
      "Set API keys and credentials",
      "Adjust notification settings",
      "Manage data sync options",
      "Configure default filters",
      "Set up voice control",
      "Manage user profile"
    ],
    tips: [
      "Set Obsidian path first for sync to work",
      "Configure API keys for full functionality",
      "Review settings after updates"
    ]
  },
  
  DataManager: {
    title: "Data Manager",
    description: "Import, export, and manage data. Bulk operations and data cleanup tools.",
    whatItDoes: [
      "Bulk import and export data",
      "Manages database backups",
      "Cleans and validates data",
      "Syncs data between sources"
    ],
    whatYouCanDo: [
      "Import large datasets",
      "Export data for backup",
      "Clean duplicate records",
      "Validate data integrity",
      "Sync with external sources",
      "Manage data retention"
    ],
    tips: [
      "Backup before bulk operations",
      "Validate data after imports",
      "Schedule regular backups"
    ]
  }
};

const PageHelp = ({ pageName, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Keyboard shortcut: Press "?" to toggle help
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle help on "?" key (but not when typing in inputs)
      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable
        );
        
        if (!isTyping) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const doc = pageDocumentation[pageName];
  
  if (!doc) {
    console.warn(`No documentation found for page: ${pageName}`);
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'features', label: 'What It Does', icon: Target },
    { id: 'actions', label: 'What You Can Do', icon: Zap },
    { id: 'tips', label: 'Tips', icon: Lightbulb },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 
                   text-slate-300 hover:text-white transition-all duration-200 
                   border border-slate-700 hover:border-slate-600"
        title="Page Help & Documentation"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Help</span>
      </button>

      {/* Help Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed right-4 top-20 z-50 w-full max-w-xl max-h-[80vh] overflow-hidden
                          bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl
                          animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 
                              flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{doc.title}</h2>
                  <p className="text-sm text-slate-400">Page Documentation</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                               transition-colors border-b-2
                               ${activeTab === tab.id 
                                 ? 'text-blue-400 border-blue-400 bg-blue-500/5' 
                                 : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-140px)] space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-slate-300 leading-relaxed">{doc.description}</p>
                  
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                      Quick Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">What It Does:</span>
                        <p className="text-slate-300 mt-1">{doc.whatItDoes.length} key features</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Actions Available:</span>
                        <p className="text-slate-300 mt-1">{doc.whatYouCanDo.length} actions</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    What This Page Does
                  </h3>
                  <ul className="space-y-3">
                    {doc.whatItDoes.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 
                                      flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-blue-400">{index + 1}</span>
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions Tab */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    What You Can Do
                  </h3>
                  <ul className="space-y-3">
                    {doc.whatYouCanDo.map((action, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 
                                      flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Zap className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips Tab */}
              {activeTab === 'tips' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                    Pro Tips
                  </h3>
                  <ul className="space-y-3">
                    {doc.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 
                                      flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Lightbulb className="w-3 h-3 text-amber-400" />
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 text-center">
              <p className="text-xs text-slate-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">?</kbd> anytime for help
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PageHelp;
export { pageDocumentation };
