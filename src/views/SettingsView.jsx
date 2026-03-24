import { useState, createElement } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database,
  Save,
  Check
} from 'lucide-react';

// Settings Section Component
function SettingsSection({ title, description, icon, children }) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-background-tertiary rounded-lg">
          {createElement(icon, { size: 18, className: 'text-coral' })}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-coral' : 'bg-background-tertiary'
        }`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </label>
  );
}

// Input Field Component
function SettingsInput({ label, type = 'text', value, onChange, placeholder, description }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-coral/50"
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

// Main Settings View
export default function SettingsView() {
  const [settings, setSettings] = useState({
    // User Profile
    name: 'Jamie De los Santos',
    email: 'jamie@bigdataclaw.ca',
    company: 'BigDataClaw Realty',
    phone: '(905) 555-0199',
    
    // Notifications
    emailNotifications: true,
    browserAlerts: true,
    newListingAlerts: true,
    buyerMatchAlerts: true,
    weeklyReports: true,
    
    // Integration
    openAiKey: '',
    obsidianPath: '/home/jamie/Documents/Obsidian/BigDataClaw',
    browserExecutable: '/usr/bin/google-chrome',
    
    // Display
    darkMode: true,
    compactView: false,
    autoSave: true,
  });
  
  const [saved, setSaved] = useState(false);
  
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={20} className="text-coral" />
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-gray-500 text-sm">Configure your BigDataClaw preferences</p>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            saved 
              ? 'bg-status-active text-white' 
              : 'bg-coral text-white hover:bg-coral-light'
          }`}
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {/* Profile Settings */}
          <SettingsSection 
            title="Profile" 
            description="Your personal information"
            icon={User}
          >
            <SettingsInput 
              label="Full Name"
              value={settings.name}
              onChange={(v) => updateSetting('name', v)}
            />
            <SettingsInput 
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={(v) => updateSetting('email', v)}
            />
            <SettingsInput 
              label="Company"
              value={settings.company}
              onChange={(v) => updateSetting('company', v)}
            />
            <SettingsInput 
              label="Phone"
              value={settings.phone}
              onChange={(v) => updateSetting('phone', v)}
            />
          </SettingsSection>
          
          {/* Notification Settings */}
          <SettingsSection 
            title="Notifications" 
            description="Configure alert preferences"
            icon={Bell}
          >
            <div className="space-y-4">
              <ToggleSwitch 
                label="Email Notifications"
                checked={settings.emailNotifications}
                onChange={(v) => updateSetting('emailNotifications', v)}
              />
              <ToggleSwitch 
                label="Browser Alerts"
                checked={settings.browserAlerts}
                onChange={(v) => updateSetting('browserAlerts', v)}
              />
              <ToggleSwitch 
                label="New Listing Alerts"
                checked={settings.newListingAlerts}
                onChange={(v) => updateSetting('newListingAlerts', v)}
              />
              <ToggleSwitch 
                label="Buyer Match Alerts"
                checked={settings.buyerMatchAlerts}
                onChange={(v) => updateSetting('buyerMatchAlerts', v)}
              />
              <ToggleSwitch 
                label="Weekly Reports"
                checked={settings.weeklyReports}
                onChange={(v) => updateSetting('weeklyReports', v)}
              />
            </div>
          </SettingsSection>
        </div>
        
        {/* Right Column */}
        <div>
          {/* Integration Settings */}
          <SettingsSection 
            title="Integrations" 
            description="Connect external services"
            icon={Database}
          >
            <SettingsInput 
              label="OpenAI API Key"
              type="password"
              value={settings.openAiKey}
              onChange={(v) => updateSetting('openAiKey', v)}
              placeholder="sk-..."
              description="Required for AI chat features"
            />
            <SettingsInput 
              label="Obsidian Vault Path"
              value={settings.obsidianPath}
              onChange={(v) => updateSetting('obsidianPath', v)}
              description="Path to your Obsidian vault for data sync"
            />
            <SettingsInput 
              label="Browser Executable"
              value={settings.browserExecutable}
              onChange={(v) => updateSetting('browserExecutable', v)}
              description="Path to Chrome/Chromium for automation"
            />
          </SettingsSection>
          
          {/* Security Settings */}
          <SettingsSection 
            title="Security" 
            description="Security and access settings"
            icon={Shield}
          >
            <div className="space-y-4">
              <ToggleSwitch 
                label="Dark Mode"
                checked={settings.darkMode}
                onChange={(v) => updateSetting('darkMode', v)}
              />
              <ToggleSwitch 
                label="Compact View"
                checked={settings.compactView}
                onChange={(v) => updateSetting('compactView', v)}
              />
              <ToggleSwitch 
                label="Auto-save"
                checked={settings.autoSave}
                onChange={(v) => updateSetting('autoSave', v)}
              />
            </div>
            <button className="mt-4 w-full py-2.5 border border-border rounded-lg text-sm text-gray-400 hover:text-white hover:border-coral/50 transition-colors">
              Change Password
            </button>
          </SettingsSection>
          
          {/* About */}
          <div className="bg-background-secondary border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🦞</div>
              <div>
                <h3 className="font-semibold text-white">BigDataClaw</h3>
                <p className="text-xs text-gray-500">Version 1.0.0</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="text-gray-300">Commercial</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-300">Niagara, Ontario</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-300">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
