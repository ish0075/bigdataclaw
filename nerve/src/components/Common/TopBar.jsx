import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Settings, Wifi, WifiOff, Database, Menu } from 'lucide-react'
import VoiceControl from '../System/VoiceControl'
import UsageMeter from '../System/UsageMeter'
import PageHelp from './PageHelp'

// Map routes to page documentation keys
const routeToPageName = {
  '/': 'MissionControl',
  '/research': 'PropertyResearch',
  '/pipeline': 'DealPipeline',
  '/agents': 'AgentWorkspace',
  '/hotmoney': 'HotMoneyRadar',
  '/vault': 'ObsidianVault',
  '/listings': 'MyListings',
  '/buyers': 'BuyerMatcher',
  '/buyer-matcher': 'BuyerMatcher',
  '/agents-matcher': 'AgentMatcher',
  '/lenders': 'LenderMatcher',
  '/builders': 'BuilderDirectory',
  '/upload': 'PropertyUpload',
  '/skills': 'SkillsAndAgents',
  '/map': 'MapView',
  '/settings': 'Settings',
  '/exp-agent-recruiter': 'EXAgentRecruiterEnhanced',
  '/commercial-agent-recruiter': 'CommercialAgentRecruiter',
  '/brokerages': 'BrokeragesView',
  '/data-manager': 'DataManager',
  '/opportunities': 'Opportunities',
  '/olena-feature-sheet': 'OlenaFeatureSheet',
  '/canva-editor': 'OlenaFeatureSheet'
}

const TopBar = ({ connected, globalSearch, onMenuClick }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = routeToPageName[location.pathname] || null
  
  const handleVoiceTranscript = (transcript) => {
    // Handle voice commands
    console.log('Voice transcript:', transcript)
    
    // Simple command routing
    const lower = transcript.toLowerCase()
    if (lower.includes('hot money')) {
      navigate('/hotmoney')
    } else if (lower.includes('research') || lower.includes('property')) {
      navigate('/research')
    } else if (lower.includes('deal') || lower.includes('pipeline')) {
      navigate('/pipeline')
    } else if (lower.includes('agent')) {
      navigate('/agents')
    } else if (lower.includes('builder')) {
      navigate('/builders')
    } else if (lower.includes('lender')) {
      navigate('/lenders')
    }
  }
  
  return (
    <header className="h-16 bg-bg-card border-b border-border-subtle flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile Menu + MacOS Traffic Lights + Connection */}
      <div className="flex items-center gap-3 md:gap-4 w-1/4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary hover:text-text-primary md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden md:flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-accent-green" />
              <span className="text-accent-green hidden lg:inline">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-accent-red" />
              <span className="text-accent-red hidden lg:inline">Reconnecting...</span>
            </>
          )}
        </div>
      </div>
      
      {/* Center: Global Search */}
      <div className="flex-1 max-w-2xl mx-2 md:mx-4 min-w-0">
        {globalSearch}
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2 w-1/4 justify-end">
        {/* Page Help Button - Shows for documented pages */}
        {currentPage && <PageHelp pageName={currentPage} />}
        
        <VoiceControl onTranscript={handleVoiceTranscript} />
        
        <UsageMeter compact />
        
        <Link 
          to="/data-manager"
          className="p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary hover:text-text-primary"
          title="Data Manager"
        >
          <Database className="w-5 h-5" />
        </Link>
        
        <button className="p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary hover:text-text-primary">
          <Bell className="w-5 h-5" />
        </button>
        
        <Link 
          to="/settings"
          className="p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary hover:text-text-primary"
        >
          <Settings className="w-5 h-5" />
        </Link>
        
        <Link 
          to="/settings"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary hover:text-text-primary"
        >
          <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-lg">
            🦞
          </div>
        </Link>
      </div>
    </header>
  )
}

export default TopBar
