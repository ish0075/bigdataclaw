import React, { useState } from 'react'
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Key,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account')
  const [saved, setSaved] = useState(false)
  
  const [settings, setSettings] = useState({
    // Account
    name: 'Jamie MacKechnie',
    email: 'jamie@bigdataclaw.com',
    company: 'Mission Control',
    
    // Notifications
    emailNotifications: true,
    hotMoneyAlerts: true,
    dealUpdates: true,
    missionComplete: true,
    dailyDigest: false,
    
    // API
    openaiKey: '',
    anthropicKey: '',
    contextKeepUrl: 'http://localhost:3001',
    
    // Vault
    vaultPath: '~/Obsidian Vault/Mission Control',
    autoSync: true,
    syncInterval: 5,
    
    // Display
    theme: 'dark',
    compactMode: false,
    animations: true,
    
    // Usage
    usageLimit: 100,
    currentUsage: 34.50,
  })
  
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  
  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Integrations', icon: Key },
    { id: 'vault', label: 'Obsidian Vault', icon: Database },
    { id: 'display', label: 'Display', icon: Sun },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-accent-red/20 flex items-center justify-center text-3xl">
                🦞
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-lg">{settings.name}</h3>
                <p className="text-text-secondary">{settings.email}</p>
                <p className="text-sm text-text-muted">{settings.company}</p>
              </div>
              <button className="ml-auto btn-secondary py-2 px-4">
                Change Avatar
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Company</label>
                <input
                  type="text"
                  value={settings.company}
                  onChange={(e) => setSettings({...settings, company: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-text-primary mb-4">Email Notifications</h4>
              <div className="space-y-3">
                {[
                  { key: 'emailNotifications', label: 'Enable email notifications' },
                  { key: 'hotMoneyAlerts', label: 'Hot money alerts' },
                  { key: 'dealUpdates', label: 'Deal stage updates' },
                  { key: 'missionComplete', label: 'Mission completion' },
                  { key: 'dailyDigest', label: 'Daily digest' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e) => setSettings({...settings, [key]: e.target.checked})}
                      className="w-5 h-5 rounded border-border-subtle text-accent-red focus:ring-accent-red"
                    />
                    <span className="text-text-secondary">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 'api':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-text-primary font-medium">API Keys are stored locally</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Your API keys are stored securely in your browser's local storage and are never sent to our servers.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({...settings, openaiKey: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">Anthropic API Key</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={settings.anthropicKey}
                  onChange={(e) => setSettings({...settings, anthropicKey: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-text-secondary mb-2">ContextKeep URL</label>
                <input
                  type="url"
                  value={settings.contextKeepUrl}
                  onChange={(e) => setSettings({...settings, contextKeepUrl: e.target.value})}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        )
        
      case 'vault':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Vault Path</label>
              <input
                type="text"
                value={settings.vaultPath}
                onChange={(e) => setSettings({...settings, vaultPath: e.target.value})}
                className="input-field w-full"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg-input">
              <div>
                <p className="text-text-primary font-medium">Auto Sync</p>
                <p className="text-sm text-text-secondary">Automatically sync changes to Obsidian</p>
              </div>
              <button
                onClick={() => setSettings({...settings, autoSync: !settings.autoSync})}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.autoSync ? 'bg-accent-green' : 'bg-bg-card'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  settings.autoSync ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
            
            {settings.autoSync && (
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Sync Interval (minutes)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.syncInterval}
                    onChange={(e) => setSettings({...settings, syncInterval: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-text-primary font-medium w-12">{settings.syncInterval}m</span>
                </div>
              </div>
            )}
          </div>
        )
        
      case 'display':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-text-secondary mb-4">Theme</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSettings({...settings, theme: 'dark'})}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    settings.theme === 'dark' 
                      ? 'border-accent-red bg-accent-red/5' 
                      : 'border-border-subtle hover:border-text-muted'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setSettings({...settings, theme: 'light'})}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    settings.theme === 'light' 
                      ? 'border-accent-red bg-accent-red/5' 
                      : 'border-border-subtle hover:border-text-muted'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Light</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-secondary">Compact Mode</span>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => setSettings({...settings, compactMode: e.target.checked})}
                  className="w-5 h-5 rounded border-border-subtle text-accent-red"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-text-secondary">Animations</span>
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => setSettings({...settings, animations: e.target.checked})}
                  className="w-5 h-5 rounded border-border-subtle text-accent-red"
                />
              </label>
            </div>
          </div>
        )
        
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-bg-input">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-muted text-sm">Current Plan</p>
                  <p className="text-xl font-bold text-text-primary">Pro</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent-green/20 text-accent-green text-sm font-medium">
                  Active
                </span>
              </div>
              <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-red rounded-full"
                  style={{ width: `${(settings.currentUsage / settings.usageLimit) * 100}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary mt-2">
                ${settings.currentUsage.toFixed(2)} / ${settings.usageLimit} used this month
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-bg-input text-center">
                <p className="text-2xl font-bold text-text-primary">1,247</p>
                <p className="text-sm text-text-secondary">Notes Created</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-input text-center">
                <p className="text-2xl font-bold text-text-primary">42</p>
                <p className="text-sm text-text-secondary">Missions Run</p>
              </div>
              <div className="p-4 rounded-xl bg-bg-input text-center">
                <p className="text-2xl font-bold text-text-primary">156</p>
                <p className="text-sm text-text-secondary">Hot Money Leads</p>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <nav className="py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-accent-red/10 text-accent-red border-l-2 border-accent-red' 
                      : 'text-text-secondary hover:bg-bg-input'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <button
                onClick={handleSave}
                className={`btn-primary flex items-center gap-2 transition-all ${
                  saved ? 'bg-accent-green' : ''
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
