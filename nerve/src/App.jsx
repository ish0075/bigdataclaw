import React from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Layout from './components/Common/Layout'
import MissionControl from './views/MissionControl'
import PropertyResearch from './views/PropertyResearch'
import DealPipeline from './views/DealPipeline'
import AgentWorkspace from './views/AgentWorkspace'
import HotMoneyRadar from './views/HotMoneyRadar'
import ObsidianVault from './views/ObsidianVault'
import MyListings from './views/MyListings'
import BuyerMatcher from './views/BuyerMatcher'
import AgentMatcher from './views/AgentMatcher'
import LenderMatcher from './views/LenderMatcher'
import BuilderDirectory from './views/BuilderDirectory'
import PropertyUpload from './views/PropertyUpload'
import SkillsAndAgents from './views/SkillsAndAgents'
import BotBoardroom from './views/BotBoardroom'
import MapView from './views/MapView'
import Settings from './views/Settings'
import BuyerBot from './views/BuyerBot'
import SellerBot from './views/SellerBot'
import PropertyBot from './views/PropertyBot'
import VigilBot from './views/VigilBot'
import EXAgentRecruiterEnhanced from './views/EXAgentRecruiterEnhanced'
import CommercialAgentRecruiter from './views/CommercialAgentRecruiter'
import BrokeragesView from './views/BrokeragesView'
import AgentWorkspaces from './views/AgentWorkspaces'
import CommanderDashboard from './views/CommanderDashboard'
import BotBuilder from './views/BotBuilder'
import BotSwarmDemo from './views/BotSwarmDemo'
import AIBuilder from './views/AIBuilder'
import AgentMissionControl from './views/AgentMissionControl'
import DataManager from './views/DataManager'
import Opportunities from './views/Opportunities'
import OlenaFeatureSheet from './views/OlenaFeatureSheet'
import CanvaEditor from './components/OlenaFeatureSheet/CanvaEditor'
import GlobalSearch from './components/GlobalSearch'
import PaperclipCompanies from './views/PaperclipCompanies'
import PaperclipCompanyDetail from './views/PaperclipCompanyDetail'
import PaperclipOrgChart from './views/PaperclipOrgChart'
import PaperclipDashboard from './views/PaperclipDashboard'
import PixelAgentsOriginal from './views/PixelAgentsOriginal'
import { useWebSocket } from './hooks/useWebSocket'

function App() {
  // Initialize WebSocket connection
  const { connected } = useWebSocket()
  const navigate = useNavigate()
  
  const handleSearchResult = (result) => {
    // Navigate to the module with search parameter
    if (result?.display?.route) {
      const searchParam = result.display.route.includes('?') ? '&' : '?'
      navigate(`${result.display.route}${searchParam}search=${encodeURIComponent(result.display.title)}`)
    }
  }
  
  return (
    <Layout 
      connected={connected}
      globalSearch={
        <GlobalSearch 
          onResultClick={handleSearchResult}
          placeholder="Search builders, agents, lenders, properties..."
        />
      }
    >
      <Routes>
        <Route path="/" element={<MissionControl />} />
        <Route path="/research" element={<PropertyResearch />} />
        <Route path="/pipeline" element={<DealPipeline />} />
        <Route path="/agents" element={<AgentWorkspace />} />
        <Route path="/hotmoney" element={<HotMoneyRadar />} />
        <Route path="/vault" element={<ObsidianVault />} />
        <Route path="/listings" element={<MyListings />} />
        <Route path="/buyers" element={<BuyerMatcher />} />
        <Route path="/buyer-matcher" element={<BuyerMatcher />} />
        <Route path="/agents-matcher" element={<AgentMatcher />} />
        <Route path="/lenders" element={<LenderMatcher />} />
        <Route path="/builders" element={<BuilderDirectory />} />
        <Route path="/upload" element={<PropertyUpload />} />
        <Route path="/skills" element={<SkillsAndAgents />} />
        <Route path="/bot-boardroom" element={<BotBoardroom />} />
        <Route path="/buyer-bot" element={<BuyerBot />} />
        <Route path="/seller-outreach-bot" element={<SellerBot />} />
        <Route path="/property-valuation-bot" element={<PropertyBot />} />
        <Route path="/vigil" element={<VigilBot />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/exp-agent-recruiter" element={<EXAgentRecruiterEnhanced />} />
        <Route path="/commercial-agent-recruiter" element={<CommercialAgentRecruiter />} />
        <Route path="/brokerages" element={<BrokeragesView />} />
        <Route path="/residential-recruiter" element={<Navigate to="/exp-agent-recruiter" replace />} />
        <Route path="/data-manager" element={<DataManager />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/olena-feature-sheet" element={<OlenaFeatureSheet />} />
        <Route path="/canva-editor" element={<CanvaEditor />} />
        <Route path="/agent-workspaces" element={<AgentWorkspaces />} />
        <Route path="/agent-workspace/:agentId" element={<AgentWorkspace />} />
        <Route path="/commander-dashboard/:commanderId" element={<CommanderDashboard />} />
        <Route path="/bot-builder" element={<BotBuilder />} />
        <Route path="/bot-swarm" element={<BotSwarmDemo />} />
        <Route path="/ai-builder" element={<AIBuilder />} />
        <Route path="/mission-control" element={<AgentMissionControl />} />
        <Route path="/paperclip-companies" element={<PaperclipCompanies />} />
        <Route path="/paperclip-companies/:companyId" element={<PaperclipCompanyDetail />} />
        <Route path="/paperclip-companies/:companyId/org" element={<PaperclipOrgChart />} />
        <Route path="/paperclip-dashboard" element={<PaperclipDashboard />} />
        <Route path="/pixel-agents-original" element={<PixelAgentsOriginal />} />
      </Routes>
    </Layout>
  )
}

export default App
