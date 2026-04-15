import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, X, MessageSquare, Zap, TrendingUp, Flame, Building2, Users, Target } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud'
const TTS_BRIDGE_URL = 'http://127.0.0.1:8766'
const OLLAMA_URL = 'http://127.0.0.1:11434'

/**
 * JARVIS-Style Voice Agent Orb for Mission Control
 * - Orb visual with idle/listening/speaking states
 * - Chat mode fallback
 * - Backend voice agent via /api/voice/agent
 * - TTS via local Piper bridge or browser speechSynthesis
 */

export default function JarvisOrb() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMissionControl = location.pathname === '/' || location.pathname === '/v2' || location.pathname === '/simple'
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState('idle') // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [bridgeAvailable, setBridgeAvailable] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [metrics, setMetrics] = useState({
    hotMoney: 0,
    opportunities: 0,
    distressed: 0,
    companies: 0,
  })
  const [backendAvailable, setBackendAvailable] = useState(true)
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const recognitionRef = useRef(null)
  const synth = window.speechSynthesis
  const transcriptEndRef = useRef(null)
  const speakTokenRef = useRef(0)
  const orbTimerRef = useRef(null)
  const currentTranscriptRef = useRef('')

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = true
      rec.maxAlternatives = 1

      rec.onstart = () => setMode('listening')
      rec.onend = () => {
        const pending = currentTranscriptRef.current.trim()
        if (pending) {
          currentTranscriptRef.current = ''
          handleUserInput(pending)
        } else {
          setMode((m) => (m === 'listening' ? 'idle' : m))
        }
      }
      rec.onerror = (e) => {
        console.error('STT error:', e.error)
        setMode('idle')
        addMessage('agent', `Listening error: ${e.error}`)
      }
      rec.onresult = (event) => {
        let final = ''
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) final += t
          else interim += t
        }
        const current = final || interim
        setTranscript(current)
        currentTranscriptRef.current = current
        if (final) {
          currentTranscriptRef.current = ''
          handleUserInput(final.trim())
        }
      }
      recognitionRef.current = rec
    }

    // Load browser voices
    const loadVoices = () => {
      const v = synth?.getVoices?.() || []
      setVoices(v)
      const preferred =
        v.find((x) => /en/i.test(x.lang) && /female|aria|jenny|zira|samantha|serena/i.test(x.name)) ||
        v.find((x) => /en/i.test(x.lang)) ||
        v[0]
      if (preferred) setSelectedVoice(preferred)
    }
    loadVoices()
    if (synth?.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices
    }

    // Check local TTS bridge
    checkBridge()

    // Load quick metrics
    fetchMetrics()

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      stopOrbMotion()
    }
  }, [])

  const checkBridge = async () => {
    try {
      const res = await fetch(`${TTS_BRIDGE_URL}/health`, { method: 'GET' })
      if (res.ok) {
        setBridgeAvailable(true)
      }
    } catch {
      setBridgeAvailable(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const [hm, opp, pc] = await Promise.allSettled([
        fetch(`${API_BASE}/api/hotmoney?limit=1&days=90`),
        fetch(`${API_BASE}/api/opportunities/gold?limit=1`),
        fetch(`${API_BASE}/api/paperclip/companies`).catch(() => null),
      ])
      const m = { hotMoney: 0, opportunities: 0, distressed: 0, companies: 0 }
      if (hm.status === 'fulfilled' && hm.value.ok) {
        const d = await hm.value.json()
        m.hotMoney = Array.isArray(d) ? d.length : (d.leads?.length || 0)
      }
      if (opp.status === 'fulfilled' && opp.value.ok) {
        const d = await opp.value.json()
        m.opportunities = d.opportunities?.length || 0
        m.distressed = d.stats?.total_flagged || 0
      }
      if (pc.status === 'fulfilled' && pc.value?.ok) {
        const d = await pc.value.json()
        m.companies = Array.isArray(d) ? d.length : 0
      }
      setMetrics(m)
    } catch (e) {
      console.error('Metrics fetch failed:', e)
    }
  }

  const addMessage = (role, text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === text) return prev
      return [...prev, { role, text, time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) }]
    })
  }

  const handleUserInput = async (text) => {
    if (!text) return
    currentTranscriptRef.current = ''
    addMessage('user', text)
    setTranscript('')
    setMode('thinking')

    let reply = ''
    let actions = []
    let _modelUsed = 'unknown'

    // Try backend first
    if (backendAvailable) {
      try {
        const res = await fetch(`${API_BASE}/api/voice/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: messages.slice(-10) }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        reply = data.response || "I'm not sure how to respond to that."
        actions = data.actions || []
        _modelUsed = data.model_used || 'backend'
      } catch (e) {
        console.error('Backend voice agent error:', e)
        // Don't permanently disable backend; it may be a transient network/CORS hiccup
      }
    }

    // Fallback to local Ollama (localhost only) or browser rules
    if (!reply) {
      if (isLocalhost) {
        try {
          reply = await ollamaReply(text)
          _modelUsed = 'qwen3:latest'
        } catch {
          reply = rulesReply(text)
          _modelUsed = 'browser-rules'
        }
      } else {
        reply = rulesReply(text)
        _modelUsed = 'browser-rules'
      }
    }

    addMessage('agent', reply)

    // Client-side navigation detection if backend didn't send actions
    const navMatch = text.toLowerCase().match(/(?:navigate to|go to|open|take me to|show me)\s+(.+)/)
    if (navMatch && !actions.find((a) => a.type === 'navigate')) {
      const dest = navMatch[1].trim()
      const routeMap = {
        'mission control': '/',
        'home': '/',
        'dashboard': '/',
        'hot money': '/hotmoney',
        'opportunities': '/opportunities',
        'goldmine': '/opportunities',
        'distressed': '/opportunities',
        'paperclip': '/paperclip-dashboard',
        'recruiter': '/exp-agent-recruiter',
        'commercial agents': '/commercial-agent-recruiter',
        'brokerages': '/brokerages',
        'buyer bot': '/buyer-bot',
        'seller bot': '/seller-outreach-bot',
        'property bot': '/property-valuation-bot',
        'vigil': '/vigil',
        'listings': '/listings',
        'buyers': '/buyers',
        'agents': '/agents-matcher',
        'lenders': '/lenders',
        'builders': '/builders',
        'workspaces': '/agent-workspaces',
        'settings': '/settings',
      }
      const matchedRoute = Object.entries(routeMap).find(([k]) => dest.includes(k))
      if (matchedRoute) {
        actions.push({ type: 'navigate', route: matchedRoute[1] })
      }
    }

    for (const action of actions) {
      if (action.type === 'navigate' && action.route) {
        navigate(action.route)
      }
    }

    await speak(reply)
  }

  async function ollamaReply(rawInput) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    const prompt = [
      'You are Mission Control, a concise voice assistant for a real estate intelligence dashboard.',
      'Answer in 2-4 sentences max. Prefer direct spoken-style phrasing.',
      'User request: ' + rawInput
    ].join('\n')
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'qwen3:latest', prompt, stream: false }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error('Ollama error')
    const data = await res.json()
    return (data.response || '').trim()
  }

  function rulesReply(rawInput) {
    const input = rawInput.trim()
    const text = input.toLowerCase()
    if (!input) return 'I did not catch that. Try asking for hot money, opportunities, or navigating to a page.'
    if (/(hello|hi|hey|good morning|good evening)/.test(text)) {
      return 'Hello. I am your Mission Control Voice Agent. I can help you query deals, check hot money leads, and navigate the dashboard.'
    }
    if (/(introduce yourself|who are you|what are you)/.test(text)) {
      return 'I am the Mission Control Voice Agent. I can speak, listen, query your real estate database, and navigate the dashboard on command.'
    }
    if (/(what can you do|help|commands)/.test(text)) {
      return 'You can ask me about hot money leads, distressed deals, navigate to any page, or search for a specific property or buyer.'
    }
    if (/(time)/.test(text)) {
      return 'It is ' + new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) + '.'
    }
    if (/(date|day today|today)/.test(text)) {
      return 'Today is ' + new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '.'
    }
    if (/(stop talking|be quiet|mute)/.test(text)) {
      stopCurrentSpeech()
      return 'Stopping speech output.'
    }
    return 'I heard: ' + input + '. The backend is currently offline, so I am running in browser mode. Try asking me to navigate to a page or ask a simple question.'
  }

  const speak = async (text) => {
    if (!text) return
    const token = ++speakTokenRef.current
    try { synth?.cancel?.() } catch {}
    stopOrbMotion()

    // Try local bridge first
    if (bridgeAvailable) {
      try {
        setMode('speaking')
        startSpeakingMotion()
        const res = await fetch(`${TTS_BRIDGE_URL}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, engine: 'piper', voice_name: 'Piper hfc_female (medium)', language: 'en-US', pitch: 0, rate: 0 }),
        })
        if (!res.ok) throw new Error('Bridge error')
        // Estimate duration
        const ms = Math.max(1800, Math.min(12000, text.length * 55))
        setTimeout(() => {
          if (speakTokenRef.current === token) resetSpeechState()
        }, ms)
        return
      } catch {
        // fallthrough to browser TTS
      }
    }

    // Browser fallback
    if (!synth) {
      resetSpeechState()
      return
    }
    try {
      const u = new SpeechSynthesisUtterance(text)
      if (selectedVoice) u.voice = selectedVoice
      u.lang = selectedVoice?.lang || 'en-US'
      u.pitch = 1
      u.rate = 1
      u.onstart = () => {
        if (speakTokenRef.current !== token) return
        setMode('speaking')
        startSpeakingMotion()
      }
      u.onend = () => {
        if (speakTokenRef.current !== token) return
        resetSpeechState()
      }
      u.onerror = () => {
        if (speakTokenRef.current !== token) return
        resetSpeechState()
      }
      synth.speak(u)
    } catch {
      resetSpeechState()
    }
  }

  const stopCurrentSpeech = () => {
    speakTokenRef.current++
    try {
      synth?.cancel?.()
    } catch {
      // ignore
    }
    resetSpeechState()
  }

  const resetSpeechState = () => {
    setMode('idle')
    stopOrbMotion()
  }

  const startSpeakingMotion = () => {
    stopOrbMotion()
    orbTimerRef.current = setInterval(() => {
      const scale = 1.02 + Math.random() * 0.08
      const tilt = (Math.random() - 0.5) * 8
      const glow = 0.95 + Math.random() * 0.55
      const el = document.getElementById('jarvis-orb-shell')
      if (el) {
        el.style.setProperty('--orb-scale', scale.toFixed(3))
        el.style.setProperty('--orb-tilt', `${tilt.toFixed(2)}deg`)
        el.style.setProperty('--orb-glow', glow.toFixed(2))
      }
    }, 110)
  }

  const stopOrbMotion = () => {
    if (orbTimerRef.current) {
      clearInterval(orbTimerRef.current)
      orbTimerRef.current = null
    }
    const el = document.getElementById('jarvis-orb-shell')
    if (el) {
      el.style.setProperty('--orb-scale', '1')
      el.style.setProperty('--orb-tilt', '0deg')
      el.style.setProperty('--orb-glow', '0.8')
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addMessage('agent', 'Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (mode === 'listening') {
      recognitionRef.current.stop()
      setMode('idle')
    } else {
      stopCurrentSpeech()
      setTranscript('')
      try {
        recognitionRef.current.start()
      } catch (e) {
        console.error('Start recognition failed:', e)
      }
    }
  }

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    handleUserInput(text)
  }

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, transcript])

  const orbLabel = mode === 'listening' ? 'Listening' : mode === 'thinking' ? 'Thinking' : mode === 'speaking' ? 'Speaking' : 'Idle'

  return (
    <>
      {/* Global styles for orb animations */}
      <style>{`
        @keyframes jarvisRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes jarvisRingSpinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes jarvisPulseScan {
          0%, 100% { opacity: 0.62; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .jarvis-orb-aura {
          inset: -8%;
          background: radial-gradient(circle, rgba(65,200,255,0.22) 0%, rgba(33,116,255,0.1) 32%, transparent 65%);
          filter: blur(26px);
          opacity: calc(0.65 * var(--orb-glow, 0.8));
          transform: scale(calc(1.02 * var(--orb-scale, 1)));
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .jarvis-orb-ring::before, .jarvis-orb-ring::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: -2px;
          border: 2px solid transparent;
          mix-blend-mode: screen;
        }
        .jarvis-orb-ring::before {
          border-top-color: rgba(65,200,255,0.95);
          border-left-color: rgba(94,72,255,0.45);
          filter: drop-shadow(0 0 8px rgba(65,200,255,0.8));
          animation: jarvisRingSpin 4.6s linear infinite;
        }
        .jarvis-orb-ring::after {
          inset: 10px;
          border-bottom-color: rgba(83,217,255,0.9);
          border-right-color: rgba(231,93,255,0.55);
          filter: drop-shadow(0 0 10px rgba(94,72,255,0.6));
          animation: jarvisRingSpinReverse 6.4s linear infinite;
        }
        .jarvis-orb-scan {
          animation: jarvisPulseScan 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Orb Button — hidden on Mission Control because voice is embedded in page */}
      {!isMissionControl && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] group"
          aria-label="Open voice agent"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/30 flex items-center justify-center transition-transform group-hover:scale-105">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
        </button>
      )}

      {/* Agent Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/60 bg-slate-900/95 shadow-2xl">
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-extrabold tracking-widest uppercase">
                    AI Voice Agent
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-white tracking-tight">
                    Mission Control Voice
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Ask about deals, hot money, distressed properties, or navigate the dashboard.
                  </p>
                </div>
                <button
                  onClick={() => { setIsOpen(false); stopCurrentSpeech() }}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Left: Orb + Controls */}
              <div className="space-y-5">
                {/* Orb Stage */}
                <div className="relative h-64 rounded-2xl border border-slate-700/40 bg-gradient-to-b from-slate-800/40 to-slate-900/60 flex items-center justify-center overflow-hidden">
                  <div
                    id="jarvis-orb-shell"
                    className="relative w-40 h-40"
                    style={{
                      transform: 'perspective(900px) rotateX(6deg) rotateY(-5deg)',
                      '--orb-scale': 1,
                      '--orb-tilt': '0deg',
                      '--orb-glow': 0.8,
                    }}
                  >
                    <div className="jarvis-orb-aura absolute inset-0 rounded-full" />
                    <div
                      className="jarvis-orb-ring absolute inset-0 rounded-full border-[3px] border-cyan-400/15"
                      style={{
                        boxShadow: '0 0 28px rgba(65,200,255,0.18), inset 0 0 30px rgba(41,104,255,0.18)',
                        transform: 'scale(var(--orb-scale, 1)) rotate(var(--orb-tilt, 0deg))',
                        transition: 'transform 120ms linear, box-shadow 120ms linear',
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: '12%',
                        background: 'radial-gradient(circle at 40% 34%, rgba(90,225,255,0.3), transparent 22%), radial-gradient(circle at 65% 70%, rgba(122,95,255,0.16), transparent 24%), radial-gradient(circle at 50% 50%, rgba(10,40,70,0.95) 0%, rgba(3,12,24,0.98) 58%, rgba(0,0,0,1) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(128,197,255,0.12), inset 0 0 40px rgba(65,200,255,0.08), 0 0 calc(24px + 6px) rgba(65,200,255,0.3)',
                        transform: 'scale(calc(0.98 + (var(--orb-scale, 1) - 1) * 0.55))',
                        transition: 'transform 120ms linear, box-shadow 120ms linear',
                      }}
                    />
                    <div
                      className="jarvis-orb-scan absolute rounded-full"
                      style={{
                        inset: '6%',
                        background: 'radial-gradient(circle at 50% 50%, transparent 52%, rgba(75,194,255,0.26) 58%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 65%, rgba(75,194,255,0.16) 67%, transparent 69%)',
                        filter: 'blur(1px)',
                        opacity: 'calc(0.9 * var(--orb-glow, 0.8))',
                      }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white font-semibold">{orbLabel}</p>
                    <p className="text-slate-400 text-xs">
                      {mode === 'idle' && 'Tap the mic to speak'}
                      {mode === 'listening' && 'Say something like "Show hot money"'}
                      {mode === 'thinking' && 'Consulting the intelligence layer'}
                      {mode === 'speaking' && 'Responding'}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleListening}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                      mode === 'listening'
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                    }`}
                  >
                    {mode === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {mode === 'listening' ? 'Stop Listening' : 'Start Listening'}
                  </button>
                  <button
                    onClick={() => { stopCurrentSpeech() }}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  >
                    Stop
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <Flame className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Hot Money</span>
                    </div>
                    <p className="text-xl font-bold text-white">{metrics.hotMoney}</p>
                    <p className="text-xs text-slate-400">Recent cash buyers</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Opportunities</span>
                    </div>
                    <p className="text-xl font-bold text-white">{metrics.opportunities}</p>
                    <p className="text-xs text-slate-400">Goldmine deals</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Distressed</span>
                    </div>
                    <p className="text-xl font-bold text-white">{metrics.distressed}</p>
                    <p className="text-xs text-slate-400">Flagged reports</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Companies</span>
                    </div>
                    <p className="text-xl font-bold text-white">{metrics.companies}</p>
                    <p className="text-xs text-slate-400">Paperclip orgs</p>
                  </div>
                </div>
              </div>

              {/* Right: Chat Feed */}
              <div className="flex flex-col h-[520px] rounded-2xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/40 bg-slate-800/50">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Conversation</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${
                      backendAvailable
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400'
                    }`}>
                      {backendAvailable ? 'Backend AI' : 'Backend offline'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {isLocalhost && bridgeAvailable ? 'Local voice ready' : voices.length ? 'Browser voice' : 'Text only'}
                    </span>
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8">
                      <p className="mb-2">Say or type a command to get started.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {['Show hot money', 'Distressed deals', 'Navigate to Opportunities', 'Who bought Lime Ridge Mall?', 'Draft referral for 123 Main St'].map((p) => (
                          <button
                            key={p}
                            onClick={() => handleUserInput(p)}
                            className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 text-xs hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-sm ${
                        m.role === 'user'
                          ? 'bg-cyan-500/10 border-cyan-500/20 ml-8'
                          : 'bg-violet-500/10 border-violet-500/20 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${m.role === 'user' ? 'text-cyan-400' : 'text-violet-400'}`}>
                          {m.role}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.time}</span>
                      </div>
                      <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))}
                  {transcript && (
                    <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 ml-8 text-sm text-cyan-100 italic">
                      {transcript}
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-slate-700/40 bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      placeholder="Type a command..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={sendChat}
                      disabled={!chatInput.trim() || mode === 'thinking'}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
