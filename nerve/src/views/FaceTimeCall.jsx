import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, MessageSquare, X, PhoneOff, Send,
  Bot, Sparkles, Image as ImageIcon, Film, Music,
  ChevronRight, ChevronLeft
} from 'lucide-react'
import AvatarPlayer from '../components/Avatar/AvatarPlayer'

const API_BASE = import.meta.env.VITE_API_URL || ''

const AGENTS = {
  'openclaw': {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Memory · Orchestration · Media',
    character: 'openclaw-lobster',
    greeting: "Hey, I'm OpenClaw. I remember everything we've done and I can generate images, video, and music while we talk. What's on your mind?",
    accentColor: 'violet',
    gradient: 'from-violet-500 to-fuchsia-500',
    voicePreference: 'male',
  },
  'kimi': {
    id: 'kimi',
    name: 'Kimi Code',
    tagline: 'Code · Build · Deploy',
    character: 'kimi-female',
    greeting: "I'm Kimi Code. I can read your repos, write and edit files, run tests, and deploy. Tell me what you want to build.",
    accentColor: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    voicePreference: 'female',
  },
}

const isSpeechSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function FaceTimeCall() {
  const navigate = useNavigate()
  const [agentId, setAgentId] = useState('openclaw')
  const agent = AGENTS[agentId]

  const [mode, setMode] = useState('idle') // idle | listening | thinking | speaking
  const [chatOpen, setChatOpen] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [transcript, setTranscript] = useState('')
  const [mediaPreview, setMediaPreview] = useState(null) // {type, url, prompt}
  const [connected, setConnected] = useState(false)

  const recognitionRef = useRef(null)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const speakTokenRef = useRef(0)
  const currentTranscriptRef = useRef('')
  const greetedAgentRef = useRef(null)

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Init speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new Rec()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => setMode('listening')
    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      if (final) {
        currentTranscriptRef.current = ''
        setTranscript('')
        handleUserInput(final.trim())
      } else if (interim) {
        currentTranscriptRef.current = interim
        setTranscript(interim)
      }
    }
    rec.onend = () => {
      const pending = currentTranscriptRef.current.trim()
      if (pending) {
        currentTranscriptRef.current = ''
        setTranscript('')
        handleUserInput(pending)
      } else {
        setMode((m) => (m === 'listening' ? 'idle' : m))
      }
    }
    rec.onerror = (e) => {
      console.warn('Speech recognition error:', e.error)
      setMode((m) => (m === 'listening' ? 'idle' : m))
    }
    recognitionRef.current = rec
    return () => {
      try { rec.stop() } catch {}
    }
  }, [agentId])

  // WebSocket connection for real-time backend proxy
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3090/ws'
    if (!wsUrl.includes('localhost') || window.location.hostname === 'localhost') {
      const ws = new WebSocket(wsUrl)
      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data.type === 'media_ready') {
            setMediaPreview({ type: data.media_type, url: data.url, prompt: data.prompt || '' })
          }
        } catch {}
      }
      wsRef.current = ws
      return () => { ws.close() }
    }
  }, [agentId])

  const addMessage = useCallback((role, text, meta = {}) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, text, ...meta }])
  }, [])

  // Init greeting on agent switch (deduplicated with ref)
  useEffect(() => {
    if (greetedAgentRef.current === agentId) return
    greetedAgentRef.current = agentId
    addMessage('agent', agent.greeting, { agentId })
  }, [agentId, agent.greeting, addMessage])

  const speak = async (text) => {
    if (!text) return
    const token = ++speakTokenRef.current
    try { synth?.cancel?.() } catch {}

    const onSpeakFail = () => setMode('idle')

    if (!synth) { onSpeakFail(); return }
    try {
      try { synth.resume() } catch {}
      const u = new SpeechSynthesisUtterance(text)
      const voices = synth.getVoices()
      let preferred
      if (agent.voicePreference === 'female') {
        preferred = voices.find((v) => /en/i.test(v.lang) && (/female|samantha|victoria|karen|moira|tessa/i.test(v.name)))
          || voices.find((v) => /en/i.test(v.lang) && v.name.toLowerCase().includes('google'))
          || voices.find((v) => /en/i.test(v.lang))
      } else {
        preferred = voices.find((v) => /en/i.test(v.lang) && v.name.toLowerCase().includes('google'))
          || voices.find((v) => /en/i.test(v.lang))
      }
      if (preferred) u.voice = preferred
      u.lang = preferred?.lang || 'en-US'
      u.pitch = 1; u.rate = 1.05
      let started = false
      const safetyTimeout = setTimeout(() => {
        if (!started && speakTokenRef.current === token) onSpeakFail()
      }, 2500)
      u.onstart = () => {
        started = true
        clearTimeout(safetyTimeout)
        if (speakTokenRef.current === token) setMode('speaking')
      }
      u.onend = () => {
        clearTimeout(safetyTimeout)
        if (speakTokenRef.current === token) setMode('idle')
      }
      u.onerror = () => {
        clearTimeout(safetyTimeout)
        if (speakTokenRef.current === token) onSpeakFail()
      }
      // word boundaries for more lively avatar (optional hook)
      u.onboundary = () => {
        // could trigger micro-bounce here
      }
      synth.speak(u)
    } catch { onSpeakFail() }
  }

  const stopSpeech = () => {
    speakTokenRef.current++
    try { synth?.cancel?.() } catch {}
    setMode('idle')
  }

  const handleUserInput = async (text) => {
    if (!text) return
    addMessage('user', text)
    setMode('thinking')
    try {
      const controller = new AbortController()
      const fetchTimeout = agent.id === 'kimi' ? 25000 : 12000
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeout)
      const res = await fetch(`${API_BASE}/api/voice/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          persona: agent.id,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = await res.json()
      const reply = data?.response || 'I’m not sure how to respond to that.'
      addMessage('agent', reply, { agentId: agent.id, actions: data?.actions })
      await speak(reply)
      // If backend sent media, show it
      if (data?.media?.url) {
        setMediaPreview({ type: data.media.type, url: data.media.url, prompt: data.media.prompt })
      }
    } catch (e) {
      console.error(e)
      const fallback = `${agent.name} is having trouble connecting. Try again in a moment.`
      addMessage('agent', fallback, { agentId: agent.id })
      setMode('idle')
    }
  }

  const toggleListening = () => {
    if (!isSpeechSupported || !recognitionRef.current) {
      const msg = isIOS
        ? "Voice input isn't supported on iPhone. Type your message below."
        : 'Speech recognition is not supported in this browser. Try Chrome or Edge, or use the chat.'
      addMessage('agent', msg, { agentId: agent.id })
      setChatOpen(true)
      return
    }
    try {
      window.speechSynthesis?.resume?.()
      const dummy = new SpeechSynthesisUtterance('')
      window.speechSynthesis?.speak?.(dummy)
      window.speechSynthesis?.cancel?.()
    } catch {}
    if (mode === 'listening') {
      try { recognitionRef.current.stop() } catch {}
      setMode('idle')
    } else {
      stopSpeech()
      setTranscript('')
      currentTranscriptRef.current = ''
      try { recognitionRef.current.start() } catch (e) { console.error(e) }
    }
  }

  const sendChat = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    handleUserInput(text)
  }

  const switchAgent = (id) => {
    stopSpeech()
    try { recognitionRef.current?.stop() } catch {}
    setMode('idle')
    setAgentId(id)
    addMessage('system', `Switched to ${AGENTS[id].name}`, { agentSwitch: true })
  }

  const stateLabel = {
    idle: agent.tagline,
    listening: 'Listening…',
    thinking: `${agent.name} is thinking…`,
    speaking: `${agent.name} is speaking`,
  }[mode]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Main stage */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950/80 to-transparent">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-sm text-slate-300 border border-slate-700/50 transition-colors"
            >
              ← Back
            </button>
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs text-slate-400 uppercase tracking-wider">{connected ? 'Live' : 'Offline'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full p-1">
            {Object.values(AGENTS).map((a) => (
              <button
                key={a.id}
                onClick={() => switchAgent(a.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  agentId === a.id
                    ? `bg-gradient-to-r ${a.gradient} text-white shadow-lg`
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar stage */}
        <div className="flex-1 flex items-center justify-center relative px-4">
          <AvatarPlayer character={agent.character} state={mode} label={stateLabel} accent={agent.accentColor} />

          {/* Live transcript bubble */}
          {transcript && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 max-w-md px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/50 text-slate-200 text-center backdrop-blur">
              {transcript}
            </div>
          )}

          {/* Media preview overlay */}
          {mediaPreview && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20">
              <div className="relative group">
                <div className="rounded-2xl overflow-hidden border-2 border-slate-700/50 bg-slate-900 shadow-2xl max-w-sm">
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="generated" className="w-full h-auto max-h-64 object-cover" />
                  ) : (
                    <video src={mediaPreview.url} controls className="w-full h-auto max-h-64" />
                  )}
                </div>
                <button
                  onClick={() => setMediaPreview(null)}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="z-20 px-6 pb-8 pt-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
          <div className="max-w-xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={toggleListening}
              className={`h-14 w-14 rounded-full flex items-center justify-center border transition-all ${
                mode === 'listening'
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-slate-800/70 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
              title={mode === 'listening' ? 'Stop listening' : 'Start listening'}
            >
              {mode === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setChatOpen((s) => !s)}
              className={`h-14 px-6 rounded-full flex items-center gap-2 border font-medium transition-all ${
                chatOpen
                  ? 'bg-slate-800/90 border-slate-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center border border-red-400/30 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat sidebar */}
      <div
        className={`${chatOpen ? 'w-96' : 'w-0'} transition-all duration-300 border-l border-slate-800 bg-slate-950/95 backdrop-blur flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{ color: agent.id === 'kimi' ? '#22d3ee' : '#a78bfa' }} />
            <span className="font-semibold">{agent.name}</span>
          </div>
          <button onClick={() => setChatOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-md'
                    : m.role === 'system'
                    ? 'bg-slate-800 text-slate-400 text-xs rounded-md'
                    : `bg-slate-900 border border-slate-700 text-slate-100 rounded-bl-md ${
                        m.agentId === 'kimi' ? 'border-l-cyan-500' : 'border-l-violet-500'
                      }`
                }`}
              >
                {m.text}
                {m.actions && m.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.actions.map((act, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-slate-800 text-[10px] uppercase tracking-wide text-slate-400 border border-slate-700">
                        {act.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {mode === 'thinking' && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder={`Message ${agent.name}…`}
              className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              onClick={sendChat}
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <QuickAction icon={ImageIcon} label="Generate image" onClick={() => handleUserInput('Generate an image for me')} color={agent.id === 'kimi' ? '#22d3ee' : '#a78bfa'} />
            <QuickAction icon={Film} label="Generate video" onClick={() => handleUserInput('Generate a short video')} color={agent.id === 'kimi' ? '#22d3ee' : '#a78bfa'} />
            <QuickAction icon={Music} label="Generate music" onClick={() => handleUserInput('Generate a music track')} color={agent.id === 'kimi' ? '#22d3ee' : '#a78bfa'} />
            <QuickAction icon={Sparkles} label="Brainstorm" onClick={() => handleUserInput('Let\'s brainstorm')} color={agent.id === 'kimi' ? '#22d3ee' : '#a78bfa'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-[11px] text-slate-300 whitespace-nowrap transition-colors"
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      {label}
    </button>
  )
}
