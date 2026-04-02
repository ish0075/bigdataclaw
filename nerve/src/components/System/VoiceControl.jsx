import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, X } from 'lucide-react'

const VoiceControl = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const recognitionRef = useRef(null)
  
  useEffect(() => {
    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript)
          onTranscript?.(finalTranscript)
        }
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start()
        }
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice control is not supported in your browser')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setShowPanel(false)
    } else {
      setTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
      setShowPanel(true)
    }
  }
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setShowPanel(false)
    setTranscript('')
  }
  
  return (
    <>
      {/* Voice Button */}
      <button
        onClick={toggleListening}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${isListening 
            ? 'bg-accent-red text-white animate-pulse-red' 
            : 'bg-bg-input text-text-secondary hover:text-text-primary'
          }
        `}
        title={isListening ? 'Stop listening' : 'Start voice control'}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">Listening...</span>
          </>
        ) : (
          <>
            <MicOff className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Voice</span>
          </>
        )}
      </button>
      
      {/* Voice Panel */}
      {showPanel && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-slide-up">
          <div className="max-w-2xl mx-auto card p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-red/20 flex items-center justify-center animate-pulse">
                  <Mic className="w-6 h-6 text-accent-red" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Voice Control Active</h3>
                  <p className="text-sm text-text-secondary">
                    Say something like "Find hot money buyers in Welland"
                  </p>
                </div>
              </div>
              <button
                onClick={stopListening}
                className="p-2 rounded-lg hover:bg-bg-input text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Transcript Display */}
            <div className="bg-bg-input rounded-xl p-4 min-h-[80px]">
              {transcript ? (
                <p className="text-text-primary text-lg">{transcript}</p>
              ) : (
                <div className="flex items-center gap-2 text-text-muted">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span>Listening...</span>
                </div>
              )}
            </div>
            
            {/* Voice Commands */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-text-muted">Try:</span>
              {[
                'Find buyers for $5M industrial',
                'Show hot money alerts',
                'Start property research',
                'Open deal pipeline',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTranscript(cmd)
                    onTranscript?.(cmd)
                  }}
                  className="px-2 py-1 rounded bg-bg-card text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VoiceControl
