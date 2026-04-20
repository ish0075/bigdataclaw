import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Rocket, 
  MapPin, 
  Building2, 
  DollarSign, 
  Maximize2, 
  Map, 
  Search, 
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  FileText,
  Mic,
  Paperclip,
  Square,
  X
} from 'lucide-react'
import PropertyChat from '../components/Property/PropertyChat'

const PropertyResearch = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'manual'
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    postalCode: '',
    assetClass: 'Industrial',
    price: '',
    size: '',
    region: 'Niagara',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [missionStatus, setMissionStatus] = useState(null)
  
  const handleFormUpdate = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }
  
  const handleStopMission = () => {
    if (missionStatus) {
      setMissionStatus({ ...missionStatus, status: 'aborted' })
      setIsSubmitting(false)
      // Reset after a moment
      setTimeout(() => {
        setMissionStatus(null)
      }, 1000)
    }
  }
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    
    // Validate required fields
    if (!formData.address || !formData.city || !formData.price) {
      alert('Please fill in the required fields: Address, City, and Price')
      setActiveTab('manual')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setMissionStatus({
      id: 'M-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      phase: 1,
      status: 'running',
    })
    
    setIsSubmitting(false)
  }
  
  const phases = [
    { id: 1, name: 'Transaction Scout', icon: '🎯', status: 'completed' },
    { id: 2, name: 'Hot Money ID', icon: '🔥', status: missionStatus ? 'active' : 'pending' },
    { id: 3, name: 'Portfolio Match', icon: '💼', status: 'pending' },
    { id: 4, name: 'Agent Finder', icon: '👤', status: 'pending' },
    { id: 5, name: 'Lender Match', icon: '🏦', status: 'pending' },
  ]
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-bg-input transition-colors text-text-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Research Mission</h1>
          <p className="text-text-secondary mt-1">
            Chat, upload documents, or fill the form manually
          </p>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-bg-input w-fit">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'chat' 
              ? 'bg-accent-red text-white' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI Chat & Upload
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'manual' 
              ? 'bg-accent-red text-white' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Manual Form
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chat or Form */}
        <div className="space-y-6">
          {activeTab === 'chat' ? (
            <PropertyChat 
              onFormUpdate={handleFormUpdate}
              formData={formData}
              onSubmit={handleSubmit}
              missionStatus={missionStatus}
              onStop={handleStopMission}
            />
          ) : (
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent-red" />
                Property Input
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Street Address *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input-field w-full pr-10"
                        placeholder="1500 Michael Drive, Welland"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        required
                      />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      className="input-field w-full"
                      placeholder="Welland"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      className="input-field w-full"
                      placeholder="L3C 5W3"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Asset Class *
                    </label>
                    <div className="relative">
                      <select
                        className="input-field w-full appearance-none"
                        value={formData.assetClass}
                        onChange={(e) => setFormData({...formData, assetClass: e.target.value})}
                      >
                        <option>Industrial</option>
                        <option>Retail</option>
                        <option>Office</option>
                        <option>Multi-Family</option>
                        <option>Agricultural</option>
                        <option>Land</option>
                      </select>
                      <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Region *
                    </label>
                    <div className="relative">
                      <select
                        className="input-field w-full appearance-none"
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                      >
                        <option>Niagara</option>
                        <option>Toronto</option>
                        <option>Hamilton</option>
                        <option>GTA</option>
                        <option>Southwestern Ontario</option>
                      </select>
                      <Map className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Price ($) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="input-field w-full pl-8"
                        placeholder="5000000"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        required
                      />
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Size (SF)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="input-field w-full"
                        placeholder="80000"
                        value={formData.size}
                        onChange={(e) => setFormData({...formData, size: e.target.value})}
                      />
                      <Maximize2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                </div>
                
                {/* File Upload Section */}
                <div className="p-4 rounded-xl bg-bg-input border border-border-subtle">
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    <Paperclip className="w-4 h-4 inline mr-2" />
                    Attach Documents (Optional)
                  </label>
                  
                  <div className="space-y-3">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (files.length > 0) {
                          // Show uploaded files
                          const fileNames = files.map(f => f.name).join(', ')
                          alert(`Files selected: ${fileNames}\n\nThese will be included with your research mission.`)
                        }
                      }}
                      className="block w-full text-sm text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-accent-red file:text-white
                        hover:file:bg-accent-red/90
                        cursor-pointer"
                    />
                    
                    <p className="text-xs text-text-muted">
                      Supported: PDF, Word, Images (PNG, JPG), TXT • Max 10MB per file
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {missionStatus ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleStopMission}
                      className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-accent-red text-accent-red hover:bg-accent-red/10"
                    >
                      <Square className="w-5 h-5" />
                      <span>Stop Mission</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>View Progress</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Launching Mission...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        <span>Launch Mission</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          )}
          
          {/* Mission Progress */}
          {missionStatus && (
            <div className="card p-6 animate-slide-up">
              <h3 className="text-lg font-semibold mb-5">Mission Progress</h3>
              
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-border-subtle">
                  <div 
                    className="h-full bg-accent-blue transition-all duration-500"
                    style={{ width: `${((missionStatus.phase - 1) / (phases.length - 1)) * 100}%` }}
                  />
                </div>
                
                {/* Phase Nodes */}
                <div className="relative flex justify-between">
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex flex-col items-center">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-lg
                        border-2 transition-all duration-300 z-10 bg-bg-card
                        ${phase.status === 'completed' ? 'border-accent-green text-accent-green' : ''}
                        ${phase.status === 'active' ? 'border-accent-yellow text-accent-yellow animate-pulse' : ''}
                        ${phase.status === 'pending' ? 'border-border-subtle text-text-muted' : ''}
                      `}>
                        {phase.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{phase.icon}</span>
                        )}
                      </div>
                      <span className={`
                        text-xs mt-2 text-center max-w-[80px]
                        ${phase.status === 'active' ? 'text-accent-yellow font-medium' : 'text-text-secondary'}
                      `}>
                        {phase.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Current Status */}
              <div className="mt-6 p-4 rounded-xl bg-accent-yellow/5 border border-accent-yellow/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-yellow/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-accent-yellow" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {phases.find(p => p.status === 'active')?.name || 'Processing'} is running...
                    </p>
                    <p className="text-sm text-text-secondary">
                      Analyzing recent transactions in {formData.city || 'target market'}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Live Form Preview */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-blue" />
              Form Preview
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-input">
                <p className="text-xs text-text-muted mb-1">Address</p>
                <p className="font-medium text-text-primary">
                  {formData.address || <span className="text-text-muted italic">Not provided</span>}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-bg-input">
                  <p className="text-xs text-text-muted mb-1">City</p>
                  <p className="font-medium text-text-primary">{formData.city || '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-input">
                  <p className="text-xs text-text-muted mb-1">Region</p>
                  <p className="font-medium text-text-primary">{formData.region}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-bg-input">
                  <p className="text-xs text-text-muted mb-1">Asset Class</p>
                  <p className="font-medium text-text-primary">{formData.assetClass}</p>
                </div>
                <div className="p-4 rounded-xl bg-bg-input">
                  <p className="text-xs text-text-muted mb-1">Price</p>
                  <p className="font-medium text-text-primary">
                    {formData.price ? `$${parseInt(formData.price).toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-bg-input">
                <p className="text-xs text-text-muted mb-1">Size</p>
                <p className="font-medium text-text-primary">
                  {formData.size ? `${parseInt(formData.size).toLocaleString()} SF` : '-'}
                </p>
              </div>
              
              {/* Quick Launch Button */}
              {formData.address && formData.city && formData.price && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || missionStatus}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 animate-pulse"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Mission Now
                </button>
              )}
            </div>
          </div>
          
          {/* Research Config */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Research Configuration</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-bg-input cursor-pointer hover:bg-bg-card transition-colors">
                <input type="radio" name="depth" className="text-accent-red" />
                <div>
                  <p className="font-medium text-sm">Quick</p>
                  <p className="text-xs text-text-muted">Top 5 matches • 1-2 min</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 cursor-pointer">
                <input type="radio" name="depth" defaultChecked className="text-accent-red" />
                <div>
                  <p className="font-medium text-sm text-accent-red">Standard</p>
                  <p className="text-xs text-text-muted">Top 10 matches • 3-5 min</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-lg bg-bg-input cursor-pointer hover:bg-bg-card transition-colors">
                <input type="radio" name="depth" className="text-accent-red" />
                <div>
                  <p className="font-medium text-sm">Deep</p>
                  <p className="text-xs text-text-muted">Top 25 matches • 8-10 min</p>
                </div>
              </label>
            </div>
          </div>
          
          {/* Tips */}
          <div className="card p-5 bg-accent-blue/5 border-accent-blue/20">
            <h3 className="font-semibold text-accent-blue mb-2">💡 Tips</h3>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>• Upload an Offering Memorandum to auto-fill</li>
              <li>• Use voice control for hands-free input</li>
              <li>• Chat with me naturally about the property</li>
              <li>• Include photos for better analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyResearch
