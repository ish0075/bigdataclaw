import { useState } from 'react';
import logo from './assets/logo.png';
import { 
  MessageSquare, 
  Building2, 
  Users, 
  Upload, 
  Cpu, 
  Map, 
  Settings,
  MoreHorizontal,
  X,
  Minus,
  Maximize2
} from 'lucide-react';
import ChatView from './views/ChatView';
import ListingsView from './views/ListingsView';
import BuyerMatchingView from './views/BuyerMatchingViewReal';
import PropertyUploadView from './views/PropertyUploadView';
import SkillsView from './views/SkillsView';
import MapView from './views/MapView';
import SettingsView from './views/SettingsView';
import LenderMatcherView from './views/LenderMatcherView';

const NAV_ITEMS = [
  { id: 'chat', icon: MessageSquare, label: 'OpenClaw Chat' },
  { id: 'listings', icon: Building2, label: 'My Listings' },
  { id: 'buyers', icon: Users, label: 'Buyer Matching' },
  { id: 'agents', icon: Users, label: 'Agent Matcher' },
  { id: 'lenders', icon: Building2, label: 'Lender Matcher' },
  { id: 'upload', icon: Upload, label: 'Property Upload' },
  { id: 'skills', icon: Cpu, label: 'Skills & Agents' },
  { id: 'map', icon: Map, label: 'Map View' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

// macOS Window Chrome Component
function WindowChrome({ children }) {
  return (
    <div className="h-screen flex flex-col bg-background-primary overflow-hidden">
      {/* macOS Title Bar */}
      <div className="h-8 bg-background-secondary border-b border-border flex items-center px-4 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E] hover:bg-[#FEBC2E]/80 cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-[#28C840] hover:bg-[#28C840]/80 cursor-pointer" />
        </div>
        <div className="flex-1 text-center text-xs text-gray-500 font-medium">
          BigDataClaw
        </div>
        <div className="w-20" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// Left Sidebar Navigation
function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="w-[200px] bg-background-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="BigDataClaw" className="w-[280px] h-auto" />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive 
                  ? 'bg-coral/10 text-coral border-r-2 border-coral' 
                  : 'text-gray-400 hover:text-white hover:bg-background-tertiary'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
          <span>AI Agent Ready</span>
        </div>
      </div>
    </aside>
  );
}

// Agent Matcher View
function AgentMatcherView() {
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-4">Agent Matcher</h1>
      <p className="text-gray-400 mb-4">Find agents who have sold properties like yours.</p>
      <p className="text-coral">Use the Buyer Matching tab to generate a comprehensive report including matched agents.</p>
    </div>
  );
}

// Lender Matcher View now imported from views/LenderMatcherView.jsx

// Main Content Area
function ContentArea({ activeTab, onTabChange }) {
  const views = {
    chat: () => <ChatView onTabChange={onTabChange} />,
    listings: ListingsView,
    buyers: BuyerMatchingView,
    agents: AgentMatcherView,
    lenders: LenderMatcherView,
    upload: PropertyUploadView,
    skills: SkillsView,
    map: MapView,
    settings: SettingsView,
  };
  
  const ViewComponent = views[activeTab] || views.chat;
  
  return (
    <main className="flex-1 bg-background-primary overflow-auto flex flex-col">
      <ViewComponent />
    </main>
  );
}

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('chat');
  
  return (
    <WindowChrome>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <ContentArea activeTab={activeTab} onTabChange={setActiveTab} />
    </WindowChrome>
  );
}

export default App;
