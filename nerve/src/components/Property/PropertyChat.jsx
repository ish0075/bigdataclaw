import React, { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  FileText, 
  Image as ImageIcon, 
  X, 
  File,
  Loader2,
  Bot,
  User,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Square
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const PropertyChat = ({ onFormUpdate, formData, onSubmit, missionStatus, onStop }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      content: "Hi! I'm your property research assistant powered by Kimi AI. I can help you fill out this form by chatting, uploading documents, or using voice. What property would you like to research today?",
      timestamp: new Date(),
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech recognition with better error handling
  useEffect(() => {
    const initSpeechRecognition = async () => {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser')
        return
      }

      try {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop()) // Stop the stream after permission check
        
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

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
          
          // Update input text with interim results for visual feedback
          if (interimTranscript) {
            setInputText(interimTranscript)
          }
          
          // Only send when final
          if (finalTranscript) {
            setInputText(finalTranscript)
            setTimeout(() => handleSendMessage(finalTranscript), 300)
          }
        }

        recognitionRef.current.onstart = () => {
          setIsListening(true)
          setError(null)
          console.log('🎙️ Voice recognition started')
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          console.log('🎙️ Voice recognition ended')
        }

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          let errorMsg = 'Voice input error'
          switch(event.error) {
            case 'no-speech':
              errorMsg = 'No speech detected. Please try again.'
              break
            case 'audio-capture':
              errorMsg = 'No microphone found. Please check your audio settings.'
              break
            case 'not-allowed':
              errorMsg = 'Microphone access denied. Please allow microphone permissions.'
              break
            case 'network':
              errorMsg = 'Network error. Please check your connection.'
              break
            case 'aborted':
              errorMsg = 'Voice input was cancelled.'
              break
            default:
              errorMsg = `Voice error: ${event.error}`
          }
          
          addMessage('bot', `🎙️ ${errorMsg}`, { isError: true })
        }
        
        console.log('✅ Speech recognition initialized successfully')
      } catch (err) {
        console.error('Microphone permission error:', err)
        addMessage('bot', '🎙️ Please allow microphone access to use voice input. Click the microphone icon and allow permissions when prompted.', { isError: true })
      }
    }

    initSpeechRecognition()
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleVoice = async () => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addMessage('bot', '🎙️ Voice control is not supported in your browser. Please use Chrome, Edge, or Safari.', { isError: true })
      return
    }

    // If recognition not initialized, try to initialize it
    if (!recognitionRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        // Set up event handlers
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
          
          if (interimTranscript) {
            setInputText(interimTranscript)
          }
          
          if (finalTranscript) {
            setInputText(finalTranscript)
            setTimeout(() => handleSendMessage(finalTranscript), 300)
          }
        }

        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)
        recognitionRef.current.onerror = (event) => {
          setIsListening(false)
          console.error('Speech error:', event.error)
        }
      } catch (err) {
        console.error('Failed to get microphone permission:', err)
        addMessage('bot', '🎙️ Microphone access is required for voice input. Please click the microphone button and allow access when your browser prompts you.', { isError: true })
        return
      }
    }

    // Toggle listening state
    if (isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting recognition:', err)
        addMessage('bot', '🎙️ Could not start voice recognition. Please try refreshing the page.', { isError: true })
      }
    }
  }

  const addMessage = (type, content, metadata = {}) => {
    const newMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      ...metadata
    }
    setMessages(prev => [...prev, newMessage])
  }

  const callKimiAPI = async (message) => {
    // Call the backend Kimi API
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_history: messages
          .filter(m => m.type === 'user' || m.type === 'bot')
          .slice(-6) // Last 6 messages for context
          .map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `API error: ${response.status}`)
    }

    return await response.json()
  }

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return
    setError(null)

    const userMessage = text.trim()
    setInputText('')
    addMessage('user', userMessage)
    setIsLoading(true)

    try {
      // Call Kimi API through backend
      const result = await callKimiAPI(userMessage)

      // Add AI response
      addMessage('bot', result.response)

      // Update form with extracted data
      if (result.extractedData && Object.keys(result.extractedData).length > 0) {
        // Filter out null values
        const validData = Object.fromEntries(
          Object.entries(result.extractedData).filter(([_, v]) => v !== null)
        )
        if (Object.keys(validData).length > 0) {
          onFormUpdate(validData)
        }
      }

      // Handle actions
      if (result.action === 'submit') {
        onSubmit()
      }

    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message)
      addMessage('bot', `Sorry, I encountered an error: ${err.message}. Please try again or switch to manual form entry.`, { isError: true })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return
    setError(null)

    for (const file of files) {
      const fileData = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      }

      setUploadedFiles(prev => [...prev, fileData])
      addMessage('user', `📎 Uploaded: ${file.name}`, { file: fileData })

      setIsLoading(true)

      try {
        // Read file content
        let content = ''
        
        if (file.type.startsWith('image/')) {
          // For images, we can't easily extract text without OCR
          // In production, you'd send to vision API
          content = `[Image: ${file.name} - Property photo uploaded]`
        } else {
          // For text-based files
          content = await file.text()
        }

        // Call document processing API
        const response = await fetch(`${API_BASE_URL}/api/chat/document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_content: content.slice(0, 8000), // Limit size
            file_type: file.name.split('.').pop().toLowerCase()
          })
        })

        if (response.ok) {
          const result = await response.json()
          
          if (result.error) {
            addMessage('bot', `I processed "${file.name}" but couldn't extract structured data. You can tell me the details in chat.`, { isError: true })
          } else {
            // Filter out null values
            const validData = Object.fromEntries(
              Object.entries(result).filter(([k, v]) => v !== null && k !== 'error' && k !== 'raw')
            )
            
            if (Object.keys(validData).length > 0) {
              onFormUpdate(validData)
              
              const extracted = Object.entries(validData)
                .map(([k, v]) => {
                  if (k === 'price') return `💰 Price: $${v.toLocaleString()}`
                  if (k === 'size') return `📐 Size: ${v.toLocaleString()} SF`
                  if (k === 'address') return `📍 Address: ${v}`
                  if (k === 'city') return `🏙️ City: ${v}`
                  if (k === 'assetClass') return `🏢 Type: ${v}`
                  if (k === 'region') return `🗺️ Region: ${v}`
                  return `${k}: ${v}`
                })
                .join('\n')
              
              addMessage('bot', `📄 I analyzed "${file.name}" and extracted:\n\n${extracted}\n\nThe form has been updated with these details!`)
            } else {
              addMessage('bot', `📄 I received "${file.name}". Please tell me the property details in chat and I'll fill out the form.`)
            }
          }
        } else {
          throw new Error('Document processing failed')
        }

      } catch (err) {
        console.error('File processing error:', err)
        addMessage('bot', `📄 File "${file.name}" uploaded. I'll include it with your research mission. Please tell me the key details (address, price, type) in chat.`, { isError: true })
      } finally {
        setIsLoading(false)
      }
    }

    // Reset file input
    event.target.value = ''
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-accent-red" />
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon className="w-4 h-4 text-accent-green" />
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return <FileText className="w-4 h-4 text-accent-blue" />
    return <File className="w-4 h-4 text-text-muted" />
  }

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-red to-accent-yellow flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Kimi AI Assistant</h3>
            <p className="text-xs text-text-secondary">Powered by Moonshot AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-xs text-accent-red">
              <AlertCircle className="w-4 h-4" />
              <span>Connection error</span>
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <button
              onClick={() => setShowFilePreview(!showFilePreview)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              {uploadedFiles.length}
            </button>
          )}
        </div>
      </div>

      {/* File Preview Panel */}
      {showFilePreview && uploadedFiles.length > 0 && (
        <div className="p-3 bg-bg-input border-b border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Attached Files</span>
            <button
              onClick={() => setShowFilePreview(false)}
              className="p-1 rounded hover:bg-bg-card text-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-card">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{file.name}</p>
                    <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 rounded hover:bg-accent-red/20 text-text-muted hover:text-accent-red"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-accent-blue/20' 
                : message.isError 
                  ? 'bg-accent-red/20' 
                  : 'bg-gradient-to-br from-accent-red to-accent-yellow'
            }`}>
              {message.type === 'user' ? (
                <User className="w-4 h-4 text-accent-blue" />
              ) : message.isError ? (
                <AlertCircle className="w-4 h-4 text-accent-red" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`max-w-[80%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-2xl whitespace-pre-wrap ${
                message.type === 'user'
                  ? 'bg-accent-blue text-white rounded-br-md'
                  : message.isError
                    ? 'bg-accent-red/10 text-text-primary border border-accent-red/20 rounded-bl-md'
                    : 'bg-bg-input text-text-primary rounded-bl-md'
              }`}>
                {message.content}
              </div>
              <span className="text-xs text-text-muted mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-red to-accent-yellow flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-bg-input p-3 rounded-2xl rounded-bl-md flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent-red" />
              <span className="text-sm text-text-secondary">Kimi is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border-subtle">
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-input text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Upload PDF, Images, Docs
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Text Input or Stop Button */}
        {missionStatus ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onStop}
              className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2 border-accent-red text-accent-red hover:bg-accent-red/10"
            >
              <Square className="w-5 h-5" />
              <span>Stop Mission</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`p-3 rounded-xl transition-all ${
                isListening
                  ? 'bg-accent-red text-white animate-pulse'
                  : 'bg-bg-input text-text-secondary hover:text-text-primary'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? 'Listening... speak now' : 'Ask Kimi about your property...'}
                className="w-full input-field pr-12"
                disabled={isLoading}
              />
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-card text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-xl bg-accent-red text-white hover:bg-accent-red/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Voice Hint */}
        {isListening && !missionStatus && (
          <p className="text-xs text-accent-red mt-2 text-center animate-pulse">
            🎙️ Listening... Speak clearly about your property
          </p>
        )}
      </div>
    </div>
  )
}

export default PropertyChat
