import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { VoiceDictationPanel, VoiceDictationSettings, useVoiceDictation, requestNotificationPermission } from './VoiceDictation'
import { Mic } from 'lucide-react'

const Layout = ({ children, connected, globalSearch }) => {
  const [showSettings, setShowSettings] = useState(false)
  const [notificationGranted, setNotificationGranted] = useState(false)

  // Handle voice dictation result
  const handleDictationResult = (text, targetElement) => {
    // If there's an active input/textarea, insert text
    if (targetElement && (
      targetElement.tagName === 'INPUT' || 
      targetElement.tagName === 'TEXTAREA'
    )) {
      const start = targetElement.selectionStart
      const end = targetElement.selectionEnd
      const value = targetElement.value
      
      targetElement.value = value.substring(0, start) + text + value.substring(end)
      targetElement.selectionStart = targetElement.selectionEnd = start + text.length
      targetElement.focus()
    }
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('voiceDictation', { 
      detail: { text, targetElement } 
    }))
  }

  const { isListening, transcript, settings, updateSettings, toggleListening } = 
    useVoiceDictation(handleDictationResult)

  // Request notification permission on first load
  useEffect(() => {
    requestNotificationPermission().then(setNotificationGranted)
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar connected={connected} globalSearch={globalSearch} />
        
        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Voice Dictation Indicator */}
      <VoiceDictationPanel 
        isListening={isListening} 
        transcript={transcript}
        onClose={toggleListening}
      />

      {/* Voice Settings Button (bottom left) */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
        title="Voice Dictation Settings"
      >
        <Mic className="w-4 h-4" />
        <span className="text-xs">Ctrl+Shift+{settings.triggerKey.toUpperCase()}</span>
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <VoiceDictationSettings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default Layout
