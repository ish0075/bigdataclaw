import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Gemma4Widget from '../components/Gemma4/Gemma4Widget';
import { useChatStream } from '../hooks/useChatStream';
import { 
  MessageSquare, 
  Bot, 
  BarChart3, 
  Mic,
  Send,
  Search,
  Image as ImageIcon,
  Activity,
  FileText,
  Download,
  Home,
  Users,
  Building2,
  DollarSign,
  MapPin,
  TrendingUp,
  Settings,
  HelpCircle,
  ChevronRight,
  X,
  Minimize2,
  Maximize2,
  PanelLeft,
  Sparkles,
  Rocket,
  Target,
  Briefcase,
  Landmark,
  UserCircle,
  Zap,
  Globe,
  Database,
  LayoutGrid,
  Plus,
  Code,
  Hammer
} from 'lucide-react';

// V3 is a command center dashboard - navigation goes to standard routes

// Navigation Sections with items
const NAV_SECTIONS = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { 
        id: 'mission-control', 
        icon: Home, 
        label: 'Mission Control',
        description: 'Command center with live agent visualization',
        helpText: 'This is your command center for finding money and closing deals. Track recent sellers with cash, find buyers for your properties, and get instant answers from 193K records.',
        actions: ['Deploy agents', 'View hot money', 'Chat with AI', 'Track missions'],
        route: '/v3'
      },
      { 
        id: 'buyers', 
        icon: Users, 
        label: 'Buyer Matcher',
        description: 'Match properties with 18,496 qualified buyers',
        helpText: 'Find the perfect buyers for any property. Search by location, asset class, deal size, and buyer criteria. AI analyzes all 18,496 buyers in our database.',
        actions: ['Search buyers', 'Filter by criteria', 'Export matches', 'Contact buyers'],
        route: '/buyers'
      },
      { 
        id: 'lenders', 
        icon: Landmark, 
        label: 'Lender Matcher',
        description: 'Find financing from 5,113 lenders',
        helpText: 'Match your deal with the right lenders. Filter by land, construction, commercial, or residential specialization. View rates, LTV, and contact info.',
        actions: ['Find land lenders', 'Construction financing', 'Commercial loans', 'Compare rates'],
        route: '/lenders'
      },
      { 
        id: 'hot-money', 
        icon: DollarSign, 
        label: 'Who has the money',
        description: 'Track $458M in active capital',
        helpText: 'Monitor high-value entities with recent liquidity events. Track sellers who just received cash and are ready to buy. Get instant alerts on new hot money.',
        actions: ['View hot leads', 'Set alerts', 'Track capital', 'Match with deals'],
        route: '/hotmoney'
      },
      { 
        id: 'agents', 
        icon: Bot, 
        label: 'Agent Fleet',
        badge: 'AI',
        description: 'Deploy and manage 20+ AI agents',
        helpText: 'Your AI workforce. Deploy agents for research, matching, outreach, and analysis. Each agent works 24/7 and reports back with findings.',
        actions: ['Deploy agents', 'View status', 'Configure tasks', 'Review reports'],
        route: '/agents'
      },
      { 
        id: 'voice-agent', 
        icon: Mic, 
        label: 'Voice Agent',
        badge: 'NEW',
        badgeColor: 'cyan',
        description: 'Talk to your Obsidian vault',
        helpText: 'Use voice to query your knowledge base. Semantic search across your vault with AI-generated spoken answers.',
        actions: ['Voice search', 'Semantic query', 'Graph view', 'Index vault'],
        route: '/voice-agent'
      },
      { 
        id: 'properties', 
        icon: Building2, 
        label: 'Properties',
        description: '25,237 transaction database',
        helpText: 'Search our database of 25,237 commercial real estate transactions. Analyze comps, track market trends, and find opportunities.',
        actions: ['Search properties', 'View comps', 'Analyze trends', 'Upload property'],
        route: '/research'
      },
    ]
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    items: [
      { 
        id: 'recruiters', 
        icon: UserCircle, 
        label: 'EXP Agent Recruiter',
        badge: '96K',
        badgeColor: 'blue',
        description: '96,265 agent database',
        helpText: 'Access our database of 96,265 real estate professionals. Find agents by location, brokerage, specialty, and performance.',
        actions: ['Search agents', 'Filter by city', 'View brokerages', 'Export contacts'],
        route: '/exp-agent-recruiter'
      },
      { 
        id: 'commercial-recruiters', 
        icon: Briefcase, 
        label: 'Commercial Agents',
        badge: '6.7K',
        badgeColor: 'blue',
        description: '6,700 commercial specialists',
        helpText: 'Find commercial real estate agents specializing in industrial, retail, office, and multifamily properties.',
        actions: ['Search commercial agents', 'Filter by specialty', 'View territories', 'Export contacts'],
        route: '/commercial-agent-recruiter'
      },
      { 
        id: 'brokerages', 
        icon: Building2, 
        label: 'Brokerages',
        description: 'Firm directory and rankings',
        helpText: 'Browse real estate brokerages, view agent counts, territories, and market share data.',
        actions: ['Search brokerages', 'View rankings', 'Compare firms', 'Export data'],
        route: '/brokerages'
      },
      { 
        id: 'builders', 
        icon: Hammer, 
        label: 'Builders',
        description: '4,149 construction companies',
        helpText: 'Search Ontario builders by city, region, and type. Production, custom, condo, and commercial developers.',
        actions: ['Search builders', 'Filter by region', 'View projects', 'Export contacts'],
        route: '/builders'
      },
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { 
        id: 'pipeline', 
        icon: TrendingUp, 
        label: 'Deal Pipeline',
        description: 'Track deals from start to close',
        helpText: 'Manage your active deals through every stage. From initial contact to closing, track progress, tasks, and deadlines.',
        actions: ['View pipeline', 'Add deal', 'Update status', 'Generate reports'],
        route: '/pipeline'
      },
      { 
        id: 'map', 
        icon: MapPin, 
        label: 'Map View',
        description: 'Geographic deal visualization',
        helpText: 'See all properties, buyers, and deals on an interactive map. Filter by region, asset class, and deal size.',
        actions: ['View map', 'Filter layers', 'Search area', 'Export map'],
        route: '/map'
      },
      { 
        id: 'vault', 
        icon: Database, 
        label: 'Obsidian Vault',
        description: 'Knowledge base integration',
        helpText: 'Access your Obsidian vault directly. Search notes, create new pages, and sync intelligence between systems.',
        actions: ['Search vault', 'Create note', 'Sync data', 'View reports'],
        route: '/vault'
      },
      { 
        id: 'ai-builder', 
        icon: Code, 
        label: 'AI Builder',
        badge: 'CODE',
        badgeColor: 'green',
        description: 'Build custom AI agents',
        helpText: 'Create custom AI agents with specific skills, knowledge bases, and workflows. Deploy them to automate tasks.',
        actions: ['Create agent', 'Configure skills', 'Deploy', 'Monitor'],
        route: '/ai-builder'
      },
    ]
  },
];

// Resizable Panel Component
const ResizablePanel = ({ 
  children, 
  width, 
  minWidth = 300, 
  maxWidth = 600,
  onResize,
  side,
  isCollapsed,
  onToggleCollapse,
  title,
  icon: Icon
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e) => {
    if (isCollapsed) return;
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    e.preventDefault();
  }, [width, isCollapsed]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const delta = side === 'left' 
      ? e.clientX - startXRef.current 
      : startXRef.current - e.clientX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + delta));
    onResize(newWidth);
  }, [isResizing, side, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (isCollapsed) {
    return (
      <div 
        className="flex flex-col items-center py-4 bg-bg-card border-r border-border-subtle"
        style={{ width: 64 }}
      >
        <button 
          onClick={onToggleCollapse}
          className="p-2 mb-4 hover:bg-bg-input rounded-lg transition-colors"
          title="Expand"
        >
          <PanelLeft className="w-5 h-5 text-text-secondary" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-bg-card border-r border-border-subtle relative"
      style={{ width: `${width}px`, minWidth: `${minWidth}px` }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-accent-primary" />
          <span className="font-semibold text-text-primary">{title}</span>
        </div>
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-bg-input rounded-lg transition-colors"
          title="Collapse"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent-primary/30 transition-colors z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-border-subtle rounded-full opacity-50" />
      </div>
    </div>
  );
};

// Collapsible Sidebar with Sections and Badges
const Sidebar = ({ activePage, onNavigate, isCollapsed, onToggle }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    recruitment: true,
    tools: true
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getBadgeColor = (color) => {
    switch (color) {
      case 'blue': return 'bg-accent-blue/20 text-accent-blue';
      case 'green': return 'bg-accent-green/20 text-accent-green';
      case 'red': return 'bg-accent-red/20 text-accent-red';
      case 'yellow': return 'bg-accent-yellow/20 text-accent-yellow';
      default: return 'bg-accent-primary/20 text-accent-primary';
    }
  };

  return (
    <div 
      className={`flex flex-col bg-bg-card border-r border-border-subtle transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle">
        {!isCollapsed ? (
          <>
            <img 
              src="/mission-control-logo.png" 
              alt="Mission Control" 
              className="h-12 w-auto object-contain"
            />
            <button 
              onClick={onToggle}
              className="p-1.5 hover:bg-bg-input rounded-lg transition-colors flex-shrink-0"
              title="Collapse"
            >
              <PanelLeft className="w-4 h-4 text-text-secondary" />
            </button>
          </>
        ) : (
          <button 
            onClick={onToggle}
            className="p-1.5 hover:bg-bg-input rounded-lg transition-colors mx-auto"
            title="Expand"
          >
            <PanelLeft className="w-4 h-4 text-text-secondary rotate-180" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-2 overflow-y-auto scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-1">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
              >
                <span>{section.label}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${expandedSections[section.id] ? 'rotate-90' : ''}`} />
              </button>
            )}
            
            {(isCollapsed || expandedSections[section.id]) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 mx-2 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-bg-input text-accent-primary' 
                            : 'hover:bg-bg-input text-text-secondary hover:text-text-primary'
                        } ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : ''}`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-primary' : ''}`} />
                        {!isCollapsed && (
                          <>
                            <span className={`flex-1 text-sm text-left ${isActive ? 'font-medium' : ''}`}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${getBadgeColor(item.badgeColor)}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && hoveredItem === item.id && (
                        <div className="absolute left-full top-0 ml-2 z-50 w-56 bg-bg-card border border-border-subtle rounded-lg shadow-xl p-3 animate-fade-in">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-text-primary text-sm">{item.label}</span>
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${getBadgeColor(item.badgeColor)}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{item.description}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border-subtle space-y-1">
        <button className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-input rounded-lg transition-colors text-text-secondary ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : ''}`}>
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </button>
        <button className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-input rounded-lg transition-colors text-text-secondary ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : ''}`}>
          <HelpCircle className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Help</span>}
        </button>
      </div>
    </div>
  );
};

// Page Help / Context Panel
const PageHelpPanel = ({ pageData, isOpen, onClose, onAskQuestion }) => {
  if (!isOpen || !pageData) return null;

  return (
    <div className="absolute right-4 top-20 w-80 bg-bg-card border border-border-subtle rounded-xl shadow-2xl z-50 animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-accent-primary" />
          <span className="font-semibold text-text-primary">About This Page</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-bg-input rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-2">{pageData.label}</h3>
          <p className="text-sm text-text-secondary">{pageData.helpText}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">What You Can Do:</h4>
          <ul className="space-y-1.5">
            {pageData.actions.map((action, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                <Zap className="w-3.5 h-3.5 text-accent-yellow" />
                {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-border-subtle">
          <p className="text-xs text-text-muted mb-2">
            Need help? Ask OpenClaw:
          </p>
          <button 
            onClick={() => onAskQuestion(`How do I use the ${pageData.label}?`)}
            className="w-full px-3 py-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ask OpenClaw for Help
          </button>
        </div>
      </div>
    </div>
  );
};

// OpenClaw Chat Assistant
const OpenClawAssistant = ({ 
  messages, 
  onSendMessage, 
  isLoading,
  status,
  onCancel,
  persona,
  onPersonaChange,
  isMinimized,
  onToggleMinimize,
  contextualHelp
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = () => {
    setIsRecording(!isRecording);
    // TODO: Implement Web Speech API
    setTimeout(() => {
      setIsRecording(false);
      setInput("Find land buyers in Hamilton");
    }, 2000);
  };

  const quickQuestions = [
    "What can I do on this page?",
    "How do I deploy an agent?",
    "Find buyers for industrial properties",
    "Show me hot money leads",
    "Connect me with land lenders"
  ];

  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 w-14 h-14 bg-accent-primary hover:bg-accent-primary/90 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <Bot className="w-7 h-7 text-white" />
        {messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-red text-white text-xs rounded-full flex items-center justify-center">
            {messages.length - 1}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-bg-card border border-border-subtle rounded-2xl shadow-2xl z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Mission Control Center</h3>
            <p className="text-xs text-text-muted">
              {persona === 'analyst' ? '🔍 Deep Intelligence Mode' : 'Find who has money to buy RIGHT NOW'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPersonaChange(persona === 'concierge' ? 'analyst' : 'concierge')}
            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
              persona === 'analyst'
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'bg-bg-input text-text-muted hover:bg-bg-card'
            }`}
            title="Toggle between Concierge and Analyst"
          >
            {persona === 'analyst' ? 'Analyst' : 'Concierge'}
          </button>
          <button 
            onClick={() => onSendMessage("Help me with this page")}
            className="p-2 hover:bg-bg-input rounded-lg transition-colors"
            title="Get help with current page"
          >
            <HelpCircle className="w-5 h-5 text-text-secondary" />
          </button>
          <button 
            onClick={onToggleMinimize}
            className="p-2 hover:bg-bg-input rounded-lg transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Contextual Help Banner */}
      {contextualHelp && (
        <div className="px-4 py-3 bg-accent-primary/5 border-b border-border-subtle">
          <p className="text-xs text-text-secondary">
            <span className="font-medium text-accent-primary">💡 Tip:</span> {contextualHelp}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-accent-blue/10' : 'bg-accent-primary/10'
            }`}>
              {msg.role === 'user' ? (
                <span className="text-sm">👤</span>
              ) : (
                <Bot className="w-4 h-4 text-accent-primary" />
              )}
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-accent-blue text-white' 
                : 'bg-bg-input border border-border-subtle'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.actions && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.actions.map((action, i) => (
                    <button 
                      key={i}
                      onClick={() => onSendMessage(action)}
                      className="px-3 py-1 text-xs bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce delay-200" />
            </div>
            <span className="text-xs">{status === 'streaming' ? 'Streaming...' : 'Thinking...'}</span>
            {status === 'streaming' && onCancel && (
              <button
                onClick={onCancel}
                className="text-xs px-2 py-0.5 bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length < 3 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(q)}
                className="px-3 py-1.5 text-xs bg-bg-input hover:bg-bg-card border border-border-subtle rounded-full transition-colors text-text-secondary"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleVoice}
            className={`p-3 rounded-xl transition-colors ${
              isRecording 
                ? 'bg-accent-red text-white animate-pulse' 
                : 'bg-bg-input hover:bg-bg-card text-text-secondary'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Ask anything..."}
            className="flex-1 px-4 py-3 bg-bg-input border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
        {isRecording && (
          <p className="text-xs text-accent-red text-center mt-2 animate-pulse">
            🎙️ Say "Hey BigData" to start
          </p>
        )}
      </div>
    </div>
  );
};

// Main Component
const MissionControlV3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState('mission-control');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpPanelOpen, setHelpPanelOpen] = useState(true);
  const [chatMinimized, setChatMinimized] = useState(false);

  // Chat state
  const {
    messages,
    status,
    isLoading,
    persona,
    setPersona,
    sendMessage,
    cancel,
  } = useChatStream({
    apiPath: '/api/openclaw/chat/stream',
    onError: (err) => console.error('Chat error:', err),
    initialMessages: [
      {
        role: 'assistant',
        content: '🎯 **Mission Control Center**\n\nFind who has money to buy RIGHT NOW.\n\nI\'m monitoring $458M in tracked capital from recent sellers. Ask me to:\n• Find hot money (recent sellers with cash)\n• Match buyers to your properties\n• Evaluate deals\n• Search 193K records',
        timestamp: new Date()
      }
    ]
  });
  const [gemma4Open, setGemma4Open] = useState(true);

  // Panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(350);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);

  // Get current page data
  const currentPageData = NAV_SECTIONS
    .flatMap(section => section.items)
    .find(item => item.id === activePage);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    // Navigate to the actual route
    const pageData = NAV_SECTIONS
      .flatMap(section => section.items)
      .find(item => item.id === pageId);
    if (pageData?.route) {
      navigate(pageData.route);
    }
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('buyer') || actionLower.includes('search buyers')) {
      navigate('/buyers');
    } else if (actionLower.includes('lender')) {
      navigate('/lenders');
    } else if (actionLower.includes('hot money')) {
      navigate('/hotmoney');
    } else if (actionLower.includes('agent')) {
      navigate('/agents');
    } else if (actionLower.includes('property')) {
      navigate('/research');
    } else if (actionLower.includes('recruiter') || actionLower.includes('contact')) {
      navigate('/exp-agent-recruiter');
    } else if (actionLower.includes('pipeline') || actionLower.includes('deal')) {
      navigate('/pipeline');
    } else if (actionLower.includes('map')) {
      navigate('/map');
    } else if (actionLower.includes('vault')) {
      navigate('/vault');
    } else {
      handleSendMessage(`Help me ${action}`);
    }
  };

  const handleSendMessage = useCallback(async (content) => {
    await sendMessage(content, {
      mode: persona === 'analyst' ? 'deep' : 'fast',
      conversationHistory: messages,
      context: currentPageData ? { page: currentPageData.id, label: currentPageData.label } : null
    });
  }, [sendMessage, messages, currentPageData]);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        activePage={activePage}
        onNavigate={handleNavigate}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border-subtle bg-bg-card">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">{currentPageData?.label}</h1>
            <p className="text-sm text-text-muted">{currentPageData?.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Help Toggle */}
            <button
              onClick={() => setHelpPanelOpen(!helpPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                helpPanelOpen ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-input text-text-secondary'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Help</span>
            </button>

            {/* Universal Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search everything..."
                className="w-80 pl-10 pr-4 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Three Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Context/Details */}
          <ResizablePanel
            width={leftPanelWidth}
            minWidth={300}
            maxWidth={500}
            onResize={setLeftPanelWidth}
            side="left"
            isCollapsed={false}
            onToggleCollapse={() => {}}
            title="Details"
            icon={LayoutGrid}
          >
            <div className="p-4">
              <div className="card p-4 mb-4">
                <h3 className="font-semibold text-text-primary mb-3">Current Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Active Agents</span>
                    <span className="font-medium text-accent-green">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Database Records</span>
                    <span className="font-medium text-text-primary">193,190</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Who has the money to Buy Right now</span>
                    <span className="font-medium text-accent-yellow">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Tracked Capital</span>
                    <span className="font-medium text-accent-primary">$458M</span>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-text-primary mb-3">Quick Launch</h3>
                <div className="space-y-2">
                  {currentPageData?.actions.map((action, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleQuickAction(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-bg-input hover:bg-bg-card border border-border-subtle rounded-lg transition-colors text-left"
                    >
                      <Zap className="w-4 h-4 text-accent-yellow" />
                      <span className="text-sm text-text-secondary">{action}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* Center Panel - Command Dashboard */}
          <div className="flex-1 flex flex-col min-w-0 bg-bg-primary overflow-y-auto">
            <div className="p-6">
              {/* Welcome Section */}
              <div className="card p-8 text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-accent-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Welcome to Mission Control
                </h2>
                <p className="text-text-muted mb-6 max-w-lg mx-auto">
                  Your command center for CRE intelligence. Access 193,190 records, deploy AI agents, 
                  and close deals faster with data-driven insights.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setChatMinimized(false)}
                    className="btn-primary"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat here
                  </button>
                  <button 
                    onClick={() => navigate('/hotmoney')}
                    className="btn-secondary"
                  >
                    <DollarSign className="w-4 h-4" />
                    Who has money
                  </button>
                </div>
              </div>

              {/* Quick Access Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { id: 'buyers', icon: Users, label: 'Buyer Matcher', desc: '18,496 buyers', color: 'blue' },
                  { id: 'lenders', icon: Landmark, label: 'Lender Matcher', desc: '5,113 lenders', color: 'green' },
                  { id: 'hotmoney', icon: DollarSign, label: 'Who has the money', desc: '$458M to buy now', color: 'yellow' },
                  { id: 'agents', icon: Bot, label: 'Agent Fleet', desc: '12 active', color: 'purple' },
                  { id: 'recruiters', icon: UserCircle, label: 'Recruiters', desc: '96,265 agents', color: 'pink' },
                  { id: 'pipeline', icon: TrendingUp, label: 'Deal Pipeline', desc: 'Track deals', color: 'red' },
                  { id: 'map', icon: MapPin, label: 'Map View', desc: 'Geographic view', color: 'cyan' },
                  { id: 'vault', icon: Database, label: 'Obsidian Vault', desc: 'Knowledge base', color: 'gray' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/${item.id}`)}
                      className="card p-4 text-left hover:border-accent-primary/50 transition-all hover:scale-[1.02] group"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-accent-${item.color}/10 flex items-center justify-center mb-3 group-hover:bg-accent-${item.color}/20 transition-colors`}>
                        <Icon className={`w-5 h-5 text-accent-${item.color}`} />
                      </div>
                      <h3 className="font-semibold text-text-primary text-sm">{item.label}</h3>
                      <p className="text-xs text-text-muted">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Live Agent Activity */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">Live Agent Activity</h3>
                  <span className="px-2 py-1 text-xs bg-accent-green/10 text-accent-green rounded-full">
                    12 Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Buyer Matcher', progress: 75, status: 'active', task: 'Analyzing buyers...' },
                    { name: 'Money Finder', progress: 100, status: 'active', task: 'Finding who has cash...' },
                    { name: 'Lender Matcher', progress: 40, status: 'active', task: 'Scanning lenders...' },
                    { name: 'Property Scout', progress: 0, status: 'idle', task: 'Waiting...' },
                  ].map((agent, idx) => (
                    <div key={idx} className="p-4 bg-bg-input rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-text-primary">{agent.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'active' ? 'bg-accent-green animate-pulse' : 'bg-text-muted'
                        }`} />
                      </div>
                      <p className="text-xs text-text-muted mb-2">{agent.task}</p>
                      <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-primary rounded-full transition-all"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Activity */}
          <ResizablePanel
            width={rightPanelWidth}
            minWidth={300}
            maxWidth={500}
            onResize={setRightPanelWidth}
            side="right"
            isCollapsed={false}
            onToggleCollapse={() => {}}
            title="Activity"
            icon={Activity}
          >
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-accent-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">New Hot Money Lead</p>
                    <p className="text-xs text-text-muted">Ontario Pension Board • $45M</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Agent Completed</p>
                    <p className="text-xs text-text-muted">Buyer Matcher found 12 matches</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-bg-input rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">New Transaction</p>
                    <p className="text-xs text-text-muted">$28M Retail • Burlington</p>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </div>
      </div>

      {/* Page Help Panel */}
      <PageHelpPanel 
        pageData={currentPageData}
        isOpen={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
        onAskQuestion={handleSendMessage}
      />

      {/* OpenClaw Chat */}
      <OpenClawAssistant
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        status={status}
        onCancel={cancel}
        persona={persona}
        onPersonaChange={setPersona}
        isMinimized={chatMinimized}
        onToggleMinimize={() => setChatMinimized(!chatMinimized)}
        contextualHelp={currentPageData?.description}
      />

      {/* Gemma 4 CEO Assistant */}
      <Gemma4Widget 
        isOpen={gemma4Open}
        onToggle={() => setGemma4Open(!gemma4Open)}
      />
    </div>
  );
};

export default MissionControlV3;
