/**
 * Bot Builder - Create, Configure, and Deploy AI Agents
 * Visual interface for building bots with skills, tools, and tasks
 */

import React, { useState, useEffect } from 'react';
import { 
  Bot, Plus, Wrench, Brain, Target, Zap, Shield, 
  ChevronRight, Save, Play, Settings, Trash2, Copy,
  CheckCircle, AlertCircle, Sparkles, Code, Layout,
  Cpu, Eye, MessageSquare, Search, Database, Globe,
  FileText, BarChart3, Users, Building2, Flame,
  Handshake, Calculator, Radio, Activity, Layers,
  Box, Puzzle, Hammer, Rocket, RefreshCw, Download,
  Upload, X, ChevronDown, GripVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Bot Templates
const BOT_TEMPLATES = [
  {
    id: 'buyer_intel',
    name: 'Buyer Intelligence Bot',
    icon: Target,
    description: 'Analyzes buyer portfolios, identifies asset preferences, researches purchase history',
    category: 'Intelligence',
    defaultSkills: ['portfolio_analysis', 'asset_identification', 'social_research', 'buyer_profiling'],
    soulmd: {
      purpose: 'Analyze buyer portfolios and identify potential acquirers',
      personality: 'Analytical, thorough, detail-oriented',
      voice: 'Precise and data-driven',
      goals: ['Identify 10 qualified buyers per week'],
      boundaries: ['No direct contact with buyers', 'Use public information only']
    }
  },
  {
    id: 'seller_intel',
    name: 'Seller Intelligence Bot',
    icon: Handshake,
    description: 'Researches property ownership, identifies motivation signals, analyzes entity structures',
    category: 'Intelligence',
    defaultSkills: ['ownership_research', 'motivation_scoring', 'entity_analysis'],
    soulmd: {
      purpose: 'Research property ownership and identify seller motivation',
      personality: 'Investigative, persistent, discreet',
      voice: 'Strategic and insightful',
      goals: ['Identify 20 qualified sellers per week'],
      boundaries: ['Respect privacy laws', 'No unauthorized contact']
    }
  },
  {
    id: 'property_valuation',
    name: 'Property Valuation Bot',
    icon: Calculator,
    description: 'Analyzes comparable sales, assesses building condition, estimates development potential',
    category: 'Intelligence',
    defaultSkills: ['comparable_analysis', 'financial_analysis', 'development_assessment'],
    soulmd: {
      purpose: 'Research and analyze property valuations',
      personality: 'Methodical, accurate, comprehensive',
      voice: 'Objective and thorough',
      goals: ['Complete 50 property analyses per week'],
      boundaries: ['Provide estimates not appraisals']
    }
  },
  {
    id: 'recruiter',
    name: 'Agent Recruiter Bot',
    icon: Users,
    description: 'Identifies, researches, and engages top real estate agents for recruitment',
    category: 'Recruitment',
    defaultSkills: ['agent_research', 'brokerage_analysis', 'outreach_campaigns'],
    soulmd: {
      purpose: 'Identify and engage top real estate agents',
      personality: 'Charismatic, persuasive, organized',
      voice: 'Professional and engaging',
      goals: ['Identify 100 qualified agents per week'],
      boundaries: ['Compliant with recruiting laws']
    }
  },
  {
    id: 'hot_money',
    name: 'Hot Money Tracker',
    icon: Flame,
    description: 'Monitors market for fresh capital, tracks cash buyers, identifies new lenders',
    category: 'Capital',
    defaultSkills: ['transaction_monitoring', 'cash_buyer_detection', 'lender_identification'],
    soulmd: {
      purpose: 'Monitor market for fresh capital and hot money',
      personality: 'Opportunistic, fast, alert',
      voice: 'Urgent and concise',
      goals: ['Identify 15 hot money alerts per week'],
      boundaries: ['Use public records only']
    }
  },
  {
    id: 'lender_matcher',
    name: 'Lender Matcher Bot',
    icon: Building2,
    description: 'Matches properties and deals with appropriate lenders based on criteria',
    category: 'Capital',
    defaultSkills: ['lender_database', 'criteria_matching', 'deal_structuring'],
    soulmd: {
      purpose: 'Match deals with appropriate lenders',
      personality: 'Connector, matchmaker, resourceful',
      voice: 'Helpful and connected',
      goals: ['Match 30 deals per week'],
      boundaries: ['No financial advice']
    }
  },
  {
    id: 'pipeline_manager',
    name: 'Deal Pipeline Manager',
    icon: BarChart3,
    description: 'Tracks deals through pipeline stages, ensures follow-ups, manages documentation',
    category: 'Operations',
    defaultSkills: ['pipeline_tracking', 'task_management', 'follow_up_automation'],
    soulmd: {
      purpose: 'Track and manage deal pipelines',
      personality: 'Organized, detail-oriented, persistent',
      voice: 'Systematic and reliable',
      goals: ['Zero deals lost to inactivity'],
      boundaries: ['No deal terms advice']
    }
  },
  {
    id: 'property_enrichment',
    name: 'Property Enrichment Bot',
    icon: Database,
    description: 'Enriches property data with additional details, photos, zoning info',
    category: 'Operations',
    defaultSkills: ['data_enrichment', 'image_sourcing', 'zoning_research'],
    soulmd: {
      purpose: 'Enrich property data with comprehensive details',
      personality: 'Thorough, research-focused',
      voice: 'Detail-focused',
      goals: ['Enrich 100 properties per week'],
      boundaries: ['Verify sources']
    }
  },
  {
    id: 'vigil_sentinel',
    name: 'Vigil Sentinel',
    icon: Eye,
    description: '24/7 system monitoring, alerts on failures, tracks service health',
    category: 'Monitoring',
    defaultSkills: ['service_monitoring', 'health_checks', 'alert_management'],
    soulmd: {
      purpose: '24/7 monitoring of all systems',
      personality: 'Vigilant, alert, protective',
      voice: 'Alert and concise',
      goals: ['99.9% uptime monitoring'],
      boundaries: ['Monitor only - no changes']
    }
  },
  {
    id: 'custom',
    name: 'Custom Bot',
    icon: Sparkles,
    description: 'Build a completely custom bot from scratch',
    category: 'Custom',
    defaultSkills: [],
    soulmd: {
      purpose: '',
      personality: '',
      voice: '',
      goals: [],
      boundaries: []
    }
  }
];

// Skill Registry
const SKILL_REGISTRY = [
  // Core Skills
  { id: 'search', name: 'Web Search', category: 'Core', icon: Search, description: 'Search the web for information' },
  { id: 'api_call', name: 'API Integration', category: 'Core', icon: Code, description: 'Make API calls to external services' },
  { id: 'data_processing', name: 'Data Processing', category: 'Core', icon: Database, description: 'Process and analyze data' },
  { id: 'file_operations', name: 'File Operations', category: 'Core', icon: FileText, description: 'Read, write, and manage files' },
  
  // Intelligence Skills
  { id: 'portfolio_analysis', name: 'Portfolio Analysis', category: 'Intelligence', icon: BarChart3, description: 'Analyze investment portfolios' },
  { id: 'asset_identification', name: 'Asset Identification', category: 'Intelligence', icon: Target, description: 'Identify asset types and classes' },
  { id: 'social_research', name: 'Social Research', category: 'Intelligence', icon: Users, description: 'Research social media and profiles' },
  { id: 'buyer_profiling', name: 'Buyer Profiling', category: 'Intelligence', icon: UserIcon, description: 'Create detailed buyer profiles' },
  { id: 'ownership_research', name: 'Ownership Research', category: 'Intelligence', icon: Building2, description: 'Research property ownership' },
  { id: 'motivation_scoring', name: 'Motivation Scoring', category: 'Intelligence', icon: Activity, description: 'Score seller motivation levels' },
  { id: 'entity_analysis', name: 'Entity Analysis', category: 'Intelligence', icon: Layers, description: 'Analyze corporate entities' },
  { id: 'comparable_analysis', name: 'Comparable Analysis', category: 'Intelligence', icon: BarChart3, description: 'Analyze comparable properties' },
  { id: 'financial_analysis', name: 'Financial Analysis', category: 'Intelligence', icon: Calculator, description: 'Financial calculations and analysis' },
  { id: 'development_assessment', name: 'Development Assessment', category: 'Intelligence', icon: Hammer, description: 'Assess development potential' },
  
  // Recruitment Skills
  { id: 'agent_research', name: 'Agent Research', category: 'Recruitment', icon: Users, description: 'Research real estate agents' },
  { id: 'brokerage_analysis', name: 'Brokerage Analysis', category: 'Recruitment', icon: Building2, description: 'Analyze brokerage firms' },
  { id: 'outreach_campaigns', name: 'Outreach Campaigns', category: 'Recruitment', icon: MessageSquare, description: 'Manage outreach campaigns' },
  { id: 'exp_identification', name: 'EXP Identification', category: 'Recruitment', icon: Eye, description: 'Identify EXP agents' },
  
  // Capital Skills
  { id: 'transaction_monitoring', name: 'Transaction Monitoring', category: 'Capital', icon: Activity, description: 'Monitor transactions' },
  { id: 'cash_buyer_detection', name: 'Cash Buyer Detection', category: 'Capital', icon: Target, description: 'Detect cash buyers' },
  { id: 'lender_identification', name: 'Lender Identification', category: 'Capital', icon: Building2, description: 'Identify lenders' },
  { id: 'velocity_tracking', name: 'Velocity Tracking', category: 'Capital', icon: Zap, description: 'Track transaction velocity' },
  { id: 'lender_database', name: 'Lender Database', category: 'Capital', icon: Database, description: 'Access lender database' },
  { id: 'criteria_matching', name: 'Criteria Matching', category: 'Capital', icon: Target, description: 'Match criteria to lenders' },
  { id: 'deal_structuring', name: 'Deal Structuring', category: 'Capital', icon: Layers, description: 'Structure deals' },
  { id: 'relationship_mapping', name: 'Relationship Mapping', category: 'Capital', icon: Users, description: 'Map relationships' },
  
  // Operations Skills
  { id: 'pipeline_tracking', name: 'Pipeline Tracking', category: 'Operations', icon: BarChart3, description: 'Track deal pipelines' },
  { id: 'task_management', name: 'Task Management', category: 'Operations', icon: CheckCircle, description: 'Manage tasks' },
  { id: 'document_coordination', name: 'Document Coordination', category: 'Operations', icon: FileText, description: 'Coordinate documents' },
  { id: 'follow_up_automation', name: 'Follow-up Automation', category: 'Operations', icon: RefreshCw, description: 'Automate follow-ups' },
  { id: 'data_enrichment', name: 'Data Enrichment', category: 'Operations', icon: Database, description: 'Enrich data' },
  { id: 'image_sourcing', name: 'Image Sourcing', category: 'Operations', icon: Eye, description: 'Source images' },
  { id: 'zoning_research', name: 'Zoning Research', category: 'Operations', icon: Building2, description: 'Research zoning' },
  { id: 'market_context', name: 'Market Context', category: 'Operations', icon: Globe, description: 'Provide market context' },
  
  // Monitoring Skills
  { id: 'service_monitoring', name: 'Service Monitoring', category: 'Monitoring', icon: Eye, description: 'Monitor services' },
  { id: 'health_checks', name: 'Health Checks', category: 'Monitoring', icon: Activity, description: 'Perform health checks' },
  { id: 'alert_management', name: 'Alert Management', category: 'Monitoring', icon: AlertCircle, description: 'Manage alerts' },
  { id: 'uptime_tracking', name: 'Uptime Tracking', category: 'Monitoring', icon: CheckCircle, description: 'Track uptime' },
  
  // Communication Skills
  { id: 'context_keep_read', name: 'ContextKeep Read', category: 'Memory', icon: Database, description: 'Read from ContextKeep' },
  { id: 'context_keep_write', name: 'ContextKeep Write', category: 'Memory', icon: Database, description: 'Write to ContextKeep' },
  { id: 'chat_commander', name: 'Chat Commander', category: 'Communication', icon: MessageSquare, description: 'Chat with Commander' },
  { id: 'delegate_assistant', name: 'Delegate Assistant', category: 'Delegation', icon: Users, description: 'Delegate to assistants' },
];

function UserIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

// Tool Registry
const TOOL_REGISTRY = [
  { id: 'search_api', name: 'Search API', type: 'external', description: 'Google/Brave search API access' },
  { id: 'linkedin_api', name: 'LinkedIn API', type: 'external', description: 'LinkedIn profile access' },
  { id: 'realtor_api', name: 'Realtor.ca API', type: 'external', description: 'Canadian real estate data' },
  { id: 'land_registry', name: 'Land Registry', type: 'external', description: 'Property ownership records' },
  { id: 'qdrant_search', name: 'Qdrant Vector Search', type: 'internal', description: 'Semantic search' },
  { id: 'sqlite_query', name: 'SQLite Query', type: 'internal', description: 'Database queries' },
  { id: 'telegram_bot', name: 'Telegram Bot', type: 'notification', description: 'Send Telegram messages' },
  { id: 'email_sender', name: 'Email Sender', type: 'notification', description: 'Send emails' },
  { id: 'pdf_generator', name: 'PDF Generator', type: 'document', description: 'Generate PDF reports' },
  { id: 'excel_export', name: 'Excel Export', type: 'document', description: 'Export to Excel' },
  { id: 'obsidian_sync', name: 'Obsidian Sync', type: 'storage', description: 'Sync to Obsidian vault' },
  { id: 'contextkeep_sync', name: 'ContextKeep Sync', type: 'storage', description: 'Sync to ContextKeep' },
];

// Bot Builder Component
const BotBuilder = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('templates'); // templates, configure, skills, tools, review
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [botConfig, setBotConfig] = useState({
    name: '',
    agent_id: '',
    division: 'Intelligence',
    commander_id: 'cmdr_intel',
    description: '',
    soulmd: {
      purpose: '',
      personality: '',
      voice: '',
      goals: [''],
      boundaries: ['']
    },
    skills: [],
    tools: [],
    tasks: []
  });
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState(null);
  
  const divisions = [
    { id: 'Intelligence', commander: 'cmdr_intel', icon: Brain },
    { id: 'Recruitment', commander: 'cmdr_recruit', icon: Users },
    { id: 'Capital', commander: 'cmdr_capital', icon: Zap },
    { id: 'Operations', commander: 'cmdr_ops', icon: Settings },
    { id: 'Monitoring', commander: 'cmdr_vigil', icon: Eye },
    { id: 'Strategy', commander: 'cmdr_strategy', icon: Target }
  ];
  
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setBotConfig({
      ...botConfig,
      name: template.name,
      agent_id: `${template.id}_${Date.now()}`,
      division: template.category,
      description: template.description,
      soulmd: template.soulmd,
      skills: template.defaultSkills || []
    });
    setStep('configure');
  };
  
  const handleSkillToggle = (skillId) => {
    setBotConfig(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
    }));
  };
  
  const handleToolToggle = (toolId) => {
    setBotConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };
  
  const handleBuildBot = async () => {
    setIsBuilding(true);
    
    try {
      // Call API to create bot
      const response = await fetch('${API_BASE}/api/bot-builder/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig)
      });
      
      if (response.ok) {
        const result = await response.json();
        setBuildResult({ success: true, ...result });
        setStep('success');
      } else {
        const error = await response.text();
        setBuildResult({ success: false, error });
      }
    } catch (error) {
      setBuildResult({ success: false, error: error.message });
    } finally {
      setIsBuilding(false);
    }
  };
  
  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Choose a Template</h2>
        <p className="text-text-secondary">Start with a pre-configured bot or build from scratch</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {BOT_TEMPLATES.map(template => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="card p-6 text-left hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-0.5 bg-bg-input rounded-full text-xs text-text-secondary">
                  {template.category}
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{template.name}</h3>
              <p className="text-sm text-text-secondary">{template.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400">
                <span>{template.defaultSkills.length} skills included</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
  
  const renderConfigure = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Configure Bot</h2>
        <button onClick={() => setStep('templates')} className="text-text-secondary hover:text-text-primary">
          ← Back to Templates
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Bot Name</label>
              <input
                type="text"
                value={botConfig.name}
                onChange={(e) => setBotConfig({...botConfig, name: e.target.value})}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                placeholder="e.g., My Custom Buyer Bot"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Bot ID</label>
              <input
                type="text"
                value={botConfig.agent_id}
                onChange={(e) => setBotConfig({...botConfig, agent_id: e.target.value})}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Division</label>
              <select
                value={botConfig.division}
                onChange={(e) => {
                  const div = divisions.find(d => d.id === e.target.value);
                  setBotConfig({
                    ...botConfig,
                    division: e.target.value,
                    commander_id: div?.commander || ''
                  });
                }}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
              >
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Description</label>
              <textarea
                value={botConfig.description}
                onChange={(e) => setBotConfig({...botConfig, description: e.target.value})}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        {/* SoulMD */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            SoulMD (Identity)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Purpose</label>
              <textarea
                value={botConfig.soulmd.purpose}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  soulmd: {...botConfig.soulmd, purpose: e.target.value}
                })}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                rows={2}
                placeholder="What is this bot's primary mission?"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Personality</label>
              <input
                type="text"
                value={botConfig.soulmd.personality}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  soulmd: {...botConfig.soulmd, personality: e.target.value}
                })}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                placeholder="e.g., Analytical, thorough, professional"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase block mb-1">Voice</label>
              <input
                type="text"
                value={botConfig.soulmd.voice}
                onChange={(e) => setBotConfig({
                  ...botConfig,
                  soulmd: {...botConfig.soulmd, voice: e.target.value}
                })}
                className="w-full px-4 py-2 bg-bg-input border border-border-subtle rounded-lg text-text-primary"
                placeholder="e.g., Precise and data-driven"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setStep('skills')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:opacity-90"
        >
          Continue to Skills →
        </button>
      </div>
    </div>
  );
  
  const renderSkills = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Assign Skills</h2>
        <button onClick={() => setStep('configure')} className="text-text-secondary hover:text-text-primary">
          ← Back to Configuration
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {['Core', 'Intelligence', 'Recruitment', 'Capital', 'Operations', 'Monitoring', 'Memory', 'Communication', 'Delegation'].map(category => (
          <div key={category} className="card p-4">
            <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {category}
            </h3>
            <div className="space-y-2">
              {SKILL_REGISTRY.filter(s => s.category === category).map(skill => {
                const isSelected = botConfig.skills.includes(skill.id);
                const Icon = skill.icon;
                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillToggle(skill.id)}
                    className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/20 border border-cyan-500/50' 
                        : 'bg-bg-input border border-transparent hover:border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-text-muted'}`} />
                      <span className={isSelected ? 'text-text-primary' : 'text-text-secondary'}>
                        {skill.name}
                      </span>
                      {isSelected && <CheckCircle className="w-3 h-3 text-cyan-400 ml-auto" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <p className="text-text-secondary">
          {botConfig.skills.length} skills selected
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setStep('configure')}
            className="px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            Back
          </button>
          <button 
            onClick={() => setStep('tools')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:opacity-90"
          >
            Continue to Tools →
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderTools = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Assign Tools</h2>
        <button onClick={() => setStep('skills')} className="text-text-secondary hover:text-text-primary">
          ← Back to Skills
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {['external', 'internal', 'notification', 'document', 'storage'].map(type => (
          <div key={type} className="card p-4">
            <h3 className="font-medium text-text-primary mb-3 capitalize flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-400" />
              {type} Tools
            </h3>
            <div className="space-y-2">
              {TOOL_REGISTRY.filter(t => t.type === type).map(tool => {
                const isSelected = botConfig.tools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolToggle(tool.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'bg-purple-500/20 border border-purple-500/50' 
                        : 'bg-bg-input border border-transparent hover:border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={isSelected ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                        {tool.name}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{tool.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <p className="text-text-secondary">
          {botConfig.tools.length} tools selected
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setStep('skills')}
            className="px-4 py-2 text-text-secondary hover:text-text-primary"
          >
            Back
          </button>
          <button 
            onClick={() => setStep('review')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:opacity-90"
          >
            Review & Build →
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderReview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Review & Build</h2>
        <button onClick={() => setStep('tools')} className="text-text-secondary hover:text-text-primary">
          ← Back to Tools
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-3">Bot Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Name:</span>
                <span className="text-text-primary">{botConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">ID:</span>
                <span className="text-text-primary font-mono">{botConfig.agent_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Division:</span>
                <span className="text-text-primary">{botConfig.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Commander:</span>
                <span className="text-text-primary">{botConfig.commander_id}</span>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-3">SoulMD</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-text-secondary">Purpose:</span>
                <p className="text-text-primary mt-1">{botConfig.soulmd.purpose}</p>
              </div>
              <div>
                <span className="text-text-secondary">Personality:</span>
                <p className="text-text-primary mt-1">{botConfig.soulmd.personality}</p>
              </div>
              <div>
                <span className="text-text-secondary">Voice:</span>
                <p className="text-text-primary mt-1">{botConfig.soulmd.voice}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-3">Skills ({botConfig.skills.length})</h3>
            <div className="flex flex-wrap gap-2">
              {botConfig.skills.map(skillId => {
                const skill = SKILL_REGISTRY.find(s => s.id === skillId);
                return (
                  <span key={skillId} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs">
                    {skill?.name || skillId}
                  </span>
                );
              })}
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-medium text-text-primary mb-3">Tools ({botConfig.tools.length})</h3>
            <div className="flex flex-wrap gap-2">
              {botConfig.tools.map(toolId => {
                const tool = TOOL_REGISTRY.find(t => t.id === toolId);
                return (
                  <span key={toolId} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs">
                    {tool?.name || toolId}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <button 
          onClick={() => setStep('tools')}
          className="px-4 py-2 text-text-secondary hover:text-text-primary"
        >
          Back
        </button>
        <button 
          onClick={handleBuildBot}
          disabled={isBuilding}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isBuilding ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Building Bot...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Build & Deploy Bot
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  const renderSuccess = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-400" />
      </div>
      <h2 className="text-3xl font-bold text-text-primary mb-2">Bot Created Successfully!</h2>
      <p className="text-text-secondary mb-8">
        {botConfig.name} has been deployed and is ready to work
      </p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => navigate(`/agent-workspace/${botConfig.agent_id}`)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-medium hover:opacity-90"
        >
          Go to Bot Workspace
        </button>
        <button 
          onClick={() => {
            setStep('templates');
            setSelectedTemplate(null);
            setBotConfig({
              name: '',
              agent_id: '',
              division: 'Intelligence',
              commander_id: 'cmdr_intel',
              description: '',
              soulmd: { purpose: '', personality: '', voice: '', goals: [''], boundaries: [''] },
              skills: [],
              tools: [],
              tasks: []
            });
          }}
          className="px-6 py-3 bg-bg-input border border-border-subtle rounded-xl font-medium hover:bg-bg-primary"
        >
          Build Another Bot
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Hammer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Bot Builder</h1>
            <p className="text-text-secondary">Create, configure, and deploy AI agents</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mt-6">
            {['templates', 'configure', 'skills', 'tools', 'review'].map((s, idx) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => {
                    if (selectedTemplate || s === 'templates') {
                      const steps = ['templates', 'configure', 'skills', 'tools', 'review'];
                      const currentIdx = steps.indexOf(step);
                      const targetIdx = steps.indexOf(s);
                      if (targetIdx <= currentIdx) {
                        setStep(s);
                      }
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    step === s 
                      ? 'bg-cyan-600 text-white' 
                      : ['templates', 'configure', 'skills', 'tools', 'review'].indexOf(s) < ['templates', 'configure', 'skills', 'tools', 'review'].indexOf(step)
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-bg-input text-text-muted'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
                {idx < 4 && (
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      {step === 'templates' && renderTemplates()}
      {step === 'configure' && renderConfigure()}
      {step === 'skills' && renderSkills()}
      {step === 'tools' && renderTools()}
      {step === 'review' && renderReview()}
      {step === 'success' && renderSuccess()}
    </div>
  );
};

export default BotBuilder;
