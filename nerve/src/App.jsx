import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Common/Layout'
import MissionControl from './views/MissionControl'
import HotMoneyRadar from './views/HotMoneyRadar'
import MyListings from './views/MyListings'
import BuyerMatcher from './views/BuyerMatcher'
import AgentMatcher from './views/AgentMatcher'
import LenderMatcher from './views/LenderMatcher'
import BuilderDirectory from './views/BuilderDirectory'
import Settings from './views/Settings'
import BuyerBot from './views/BuyerBot'
import SellerBot from './views/SellerBot'
import PropertyBot from './views/PropertyBot'
import VigilBot from './views/VigilBot'
import EXAgentRecruiterEnhanced from './views/EXAgentRecruiterEnhanced'
import CommercialAgentRecruiter from './views/CommercialAgentRecruiter'
import BrokeragesView from './views/BrokeragesView'
import AgentWorkspaces from './views/AgentWorkspaces'
import Opportunities from './views/Opportunities'
import GlobalSearch from './components/GlobalSearch'
import PaperclipCompanies from './views/PaperclipCompanies'
import PaperclipCompanyDetail from './views/PaperclipCompanyDetail'
import PaperclipOrgChart from './views/PaperclipOrgChart'
import PaperclipDashboard from './views/PaperclipDashboard'
import MissionControlV3 from './views/MissionControlV3'
import FaceTimeCall from './views/FaceTimeCall'
import { useWebSocket } from './hooks/useWebSocket'

// Hook to detect if we're on V3 route (for hash-based routing)
function useIsV3Route() {
  const [isV3, setIsV3] = useState(false)
  const location = useLocation()
  
  useEffect(() => {
    // Check both pathname (for non-hash routing) and hash (for hash routing)
    const checkV3 = () => {
      const hash = window.location.hash
      const pathname = window.location.pathname
      const isV3Route = pathname === '/v3' || hash === '#/v3' || hash.startsWith('#/v3')
      const isFaceTime = pathname === '/facetime' || hash === '#/facetime' || hash.startsWith('#/facetime')
      setIsV3(isV3Route || isFaceTime)
    }
    
    checkV3()
    
    // Listen for hash changes
    const handleHashChange = () => checkV3()
    window.addEventListener('hashchange', handleHashChange)
    
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [location])
  
  return isV3
}

// Full page routes that don't use the default layout
function FullPageRoutes() {
  const location = useLocation()
  if (location.pathname === '/facetime') {
    return <FaceTimeCall />
  }
  return <MissionControlV3 />
}

function AppRoutes() {
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
    <Layout>
      <Routes>
        <Route path="/" element={<MissionControl />} />
        <Route path="/hotmoney" element={<HotMoneyRadar />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/paperclip-dashboard" element={<PaperclipDashboard />} />
        <Route path="/paperclip-companies" element={<PaperclipCompanies />} />
        <Route path="/paperclip-companies/:companyId" element={<PaperclipCompanyDetail />} />
        <Route path="/paperclip-companies/:companyId/org" element={<PaperclipOrgChart />} />
        <Route path="/exp-agent-recruiter" element={<EXAgentRecruiterEnhanced />} />
        <Route path="/commercial-agent-recruiter" element={<CommercialAgentRecruiter />} />
        <Route path="/brokerages" element={<BrokeragesView />} />
        <Route path="/buyer-bot" element={<BuyerBot />} />
        <Route path="/seller-outreach-bot" element={<SellerBot />} />
        <Route path="/property-valuation-bot" element={<PropertyBot />} />
        <Route path="/vigil" element={<VigilBot />} />
        <Route path="/listings" element={<MyListings />} />
        <Route path="/buyers" element={<BuyerMatcher />} />
        <Route path="/agents-matcher" element={<AgentMatcher />} />
        <Route path="/lenders" element={<LenderMatcher />} />
        <Route path="/builders" element={<BuilderDirectory />} />
        <Route path="/agent-workspaces" element={<AgentWorkspaces />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/marketing/*" element={<Navigate to="/" replace />} />
        <Route path="/v2" element={<MissionControl />} />
        <Route path="/simple" element={<MissionControl />} />
        <Route path="/facetime" element={<FaceTimeCall />} />
      </Routes>
    </Layout>
  )
}

function App() {
  const isV3 = useIsV3Route()
  
  // For V3 route, render without Layout wrapper
  if (isV3) {
    return <FullPageRoutes />
  }
  
  return <AppRoutes />
}

export default App
