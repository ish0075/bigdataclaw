import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMissionStore } from '../stores/missionStore'
import { useDealStore } from '../stores/dealStore'
import StatCard from '../components/Common/StatCard'
import { 
  Mic, MicOff, Square, MessageSquare, X, Send, 
  Rocket, Activity, DollarSign, Target, TrendingUp, 
  Flame, Building2, Users, Zap, ChevronRight, Paperclip
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://bigdataclaw.srv1368913.hstgr.cloud'
const TTS_BRIDGE_URL = 'http://127.0.0.1:8766'
const OLLAMA_URL = 'http://127.0.0.1:11434'

const MissionControl = () => {
  const navigate = useNavigate()
  const { stats, hotMoneyLeads, setStats } = useMissionStore()
  const { deals } = useDealStore()
  const newDealsCount = deals.filter(d => d.stage === 'new').length

  // Voice agent state (extracted from JarvisOrb)
  const [mode, setMode] = useState('idle') // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [bridgeAvailable, setBridgeAvailable] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [backendAvailable, setBackendAvailable] = useState(true)
  const [metrics, setMetrics] = useState({
    hotMoney: null,
    opportunities: null,
    distressed: null,
    companies: null,
  })
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const recognitionRef = useRef(null)
  const synth = window.speechSynthesis
  const transcriptEndRef = useRef(null)
  const speakTokenRef = useRef(0)
  const orbTimerRef = useRef(null)
  const fileInputRef = useRef(null)
  const currentTranscriptRef = useRef('')
  const [uploading, setUploading] = useState(false)

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

    const loadVoices = () => {
      const v = synth?.getVoices?.() || []
      setVoices(v)
      const preferred =
        v.find((x) => /en/i.test(x.lang) && /female|aria|jenny|zira|samantha|serena/i.test(x.name)) ||
        v.find((x) => /en/i.test(x.lang)) || v[0]
      if (preferred) setSelectedVoice(preferred)
    }
    loadVoices()
    if (synth?.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices

    checkBridge()
    fetchMetrics()
    initializeStats()

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      stopOrbMotion()
    }
  }, [])

  useEffect(() => {
    if (transcriptEndRef.current) transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, transcript])

  const checkBridge = async () => {
    try {
      const res = await fetch(`${TTS_BRIDGE_URL}/health`, { method: 'GET' })
      if (res.ok) setBridgeAvailable(true)
    } catch {
      setBridgeAvailable(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const [hm, opp, pc] = await Promise.allSettled([
        fetch(`${API_BASE}/api/hotmoney?limit=1&days=90`),
        fetch(`${API_BASE}/api/opportunities?limit=1`),
        fetch(`${API_BASE}/api/paperclip/companies`).catch(() => null),
      ])
      const m = { hotMoney: null, opportunities: null, distressed: null, companies: null }
      if (hm.status === 'fulfilled' && hm.value.ok) {
        const d = await hm.value.json()
        m.hotMoney = Array.isArray(d) ? d.length : (d.total || d.leads?.length || 0)
      }
      if (opp.status === 'fulfilled' && opp.value.ok) {
        const d = await opp.value.json()
        m.opportunities = Array.isArray(d) ? d.length : (d.total || d.opportunities?.length || 0)
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

  const initializeStats = async () => {
    try {
      const [workspacesRes, hotmoneyRes, matcherRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/agents/workspaces`),
        fetch(`${API_BASE}/api/hotmoney/stats`),
        fetch(`${API_BASE}/api/buyer-matcher/all-sources`),
      ])

      let activeMissions = 0
      let hotMoneyAlerts = 0
      let trackedCapital = 0
      let matchesToday = 0

      if (workspacesRes.status === 'fulfilled' && workspacesRes.value.ok) {
        const data = await workspacesRes.value.json()
        activeMissions = Array.isArray(data) ? data.filter(w => w.status === 'active').length : 0
      }

      if (hotmoneyRes.status === 'fulfilled' && hotmoneyRes.value.ok) {
        const data = await hotmoneyRes.value.json()
        hotMoneyAlerts = data.total_leads || 0
        trackedCapital = data.total_capital || 0
      }

      if (matcherRes.status === 'fulfilled' && matcherRes.value.ok) {
        const data = await matcherRes.value.json()
        matchesToday = data.buyers?.length || data.matches?.length || 0
      }

      setStats({ activeMissions, hotMoneyAlerts, trackedCapital, matchesToday })
    } catch (e) {
      console.error('Stats init failed:', e)
    }
  }

  const addMessage = (role, text, meta = null) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.text === text) return prev
      return [...prev, { role, text, time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }), meta }]
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

    if (backendAvailable) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)
        const res = await fetch(`${API_BASE}/api/voice/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: messages.slice(-10) }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        reply = data.response || "I'm not sure how to respond to that."
        actions = data.actions || []
      } catch (e) {
        console.error('Backend voice agent error:', e)
        if (e.name === 'AbortError') {
          reply = "The backend took too long to respond. Try a simpler question like 'Show hot money' or 'Hello'."
        }
      }
    }

    if (!reply) {
      if (isLocalhost) {
        try {
          reply = await ollamaReply(text)
        } catch {
          reply = rulesReply(text)
        }
      } else {
        reply = rulesReply(text)
      }
    }

    addMessage('agent', reply)

    const navMatch = text.toLowerCase().match(/(?:navigate to|go to|open|take me to|show me)\s+(.+)/)
    if (navMatch && !actions.find((a) => a.type === 'navigate')) {
      const dest = navMatch[1].trim()
      const routeMap = {
        'mission control': '/', 'home': '/', 'dashboard': '/',
        'hot money': '/hotmoney', 'opportunities': '/opportunities',
        'paperclip': '/paperclip-dashboard', 'listings': '/listings',
        'buyers': '/buyers', 'agents': '/agents-matcher', 'builders': '/builders',
      }
      const matchedRoute = Object.entries(routeMap).find(([k]) => dest.includes(k))
      if (matchedRoute) actions.push({ type: 'navigate', route: matchedRoute[1] })
    }

    for (const action of actions) {
      if (action.type === 'navigate' && action.route) navigate(action.route)
      if (action.type === 'open_deal' && action.route) navigate(action.route)
      if (action.type === 'show_satellite' && action.address) {
        const q = encodeURIComponent(action.address)
        window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer')
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
      return 'Hello. I am Kimi, your Mission Control Voice Agent. I can help you query deals, check hot money leads, and navigate the dashboard.'
    }
    if (/(introduce yourself|who are you|what are you)/.test(text)) {
      return 'I am Kimi, the Mission Control Voice Agent. I can speak, listen, query your real estate database, and navigate the dashboard on command.'
    }
    if (/(what can you do|help|commands)/.test(text)) {
      return 'You can ask me about hot money leads, distressed deals, navigate to any page, or search for a specific property or buyer.'
    }
    if (/(time)/.test(text)) return 'It is ' + new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) + '.'
    if (/(date|day today|today)/.test(text)) return 'Today is ' + new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '.'
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

    if (bridgeAvailable && isLocalhost) {
      try {
        setMode('speaking')
        startSpeakingMotion()
        const ttsController = new AbortController()
        const ttsTimeoutId = setTimeout(() => ttsController.abort(), 3000)
        const res = await fetch(`${TTS_BRIDGE_URL}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, engine: 'piper', voice_name: 'Piper hfc_female (medium)', language: 'en-US', pitch: 0, rate: 0 }),
          signal: ttsController.signal,
        })
        clearTimeout(ttsTimeoutId)
        if (!res.ok) throw new Error('Bridge error')
        const ms = Math.max(1800, Math.min(12000, text.length * 55))
        setTimeout(() => { if (speakTokenRef.current === token) resetSpeechState() }, ms)
        return
      } catch {
        // fallthrough to browser TTS
      }
    }

    if (!synth) { resetSpeechState(); return }
    try {
      try { synth.resume() } catch {}
      const u = new SpeechSynthesisUtterance(text)
      if (selectedVoice) u.voice = selectedVoice
      else {
        const fallback = synth.getVoices().find((v) => /en/i.test(v.lang))
        if (fallback) u.voice = fallback
      }
      u.lang = selectedVoice?.lang || 'en-US'
      u.pitch = 1; u.rate = 1
      u.onstart = () => { if (speakTokenRef.current === token) { setMode('speaking'); startSpeakingMotion() }}
      u.onend = () => { if (speakTokenRef.current === token) resetSpeechState() }
      u.onerror = () => { if (speakTokenRef.current === token) resetSpeechState() }
      synth.speak(u)
    } catch { resetSpeechState() }
  }

  const stopCurrentSpeech = () => {
    speakTokenRef.current++
    try { synth?.cancel?.() } catch {}
    resetSpeechState()
  }

  const resetSpeechState = () => { setMode('idle'); stopOrbMotion() }

  const startSpeakingMotion = () => {
    stopOrbMotion()
    orbTimerRef.current = setInterval(() => {
      const scale = 1.02 + Math.random() * 0.08
      const tilt = (Math.random() - 0.5) * 8
      const glow = 0.95 + Math.random() * 0.55
      const el = document.getElementById('mission-orb-shell')
      if (el) {
        el.style.setProperty('--orb-scale', scale.toFixed(3))
        el.style.setProperty('--orb-tilt', `${tilt.toFixed(2)}deg`)
        el.style.setProperty('--orb-glow', glow.toFixed(2))
      }
    }, 110)
  }

  const stopOrbMotion = () => {
    if (orbTimerRef.current) { clearInterval(orbTimerRef.current); orbTimerRef.current = null }
    const el = document.getElementById('mission-orb-shell')
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
    try { window.speechSynthesis?.resume?.() } catch {}
    if (mode === 'listening') {
      recognitionRef.current.stop()
      setMode('idle')
    } else {
      stopCurrentSpeech()
      setTranscript('')
      try { recognitionRef.current.start() } catch (e) { console.error('Start recognition failed:', e) }
    }
  }

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    handleUserInput(text)
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/api/agent/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      let msg = `Uploaded **${data.filename}**.`
      if (data.summary) msg += `\n\nSummary:\n${data.summary}`
      else if (data.note) msg += `\n\nNote: ${data.note}`
      else if (data.error) msg += `\n\nError: ${data.error}`
      if (data.image_url) {
        addMessage('user', `[Image: ${data.filename}]`)
        addMessage('agent', msg, { image_url: data.image_url })
      } else {
        addMessage('user', `[File: ${data.filename}]`)
        addMessage('agent', msg)
      }
    } catch (err) {
      addMessage('agent', `Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const orbLabel = mode === 'listening' ? 'Listening…' : mode === 'thinking' ? 'Thinking…' : mode === 'speaking' ? 'Speaking…' : 'Kimi'
  const orbSubLabel = mode === 'idle' ? 'Tap Speak to start' : mode === 'listening' ? 'Say something like "Show hot money"' : mode === 'thinking' ? 'Consulting the intelligence layer' : 'Responding'

  return (
    <div className="min-h-full flex flex-col animate-fade-in">
      {/* Global orb styles */}
      <style>{`
        @keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes orbPulse { 0%, 100% { opacity: 0.6; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); } }
        .mission-orb-aura {
          inset: -8%;
          background: radial-gradient(circle, rgba(65,200,255,0.22) 0%, rgba(33,116,255,0.1) 32%, transparent 65%);
          filter: blur(26px);
          opacity: calc(0.65 * var(--orb-glow, 0.8));
          transform: scale(calc(1.02 * var(--orb-scale, 1)));
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .mission-orb-ring::before, .mission-orb-ring::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: -2px;
          border: 2px solid transparent;
          mix-blend-mode: screen;
        }
        .mission-orb-ring::before {
          border-top-color: rgba(65,200,255,0.95);
          border-left-color: rgba(94,72,255,0.45);
          filter: drop-shadow(0 0 10px rgba(65,200,255,0.8));
          animation: orbSpin 4.6s linear infinite;
        }
        .mission-orb-ring::after {
          inset: 10px;
          border-bottom-color: rgba(83,217,255,0.9);
          border-right-color: rgba(231,93,255,0.55);
          filter: drop-shadow(0 0 12px rgba(94,72,255,0.6));
          animation: orbSpinReverse 6.4s linear infinite;
        }
        .mission-orb-scan {
          animation: orbPulse 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Section — Voice AI */}
      <section className="relative flex-1 min-h-[540px] rounded-3xl overflow-hidden border border-slate-700/40 bg-gradient-to-br from-[#0b1220] via-[#0a1628] to-[#0b1220]">
        {/* Subtle radial glow behind orb */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 h-full flex flex-col lg:flex-row items-center justify-between gap-8 px-8 py-10 lg:py-14">
          {/* Left: Title + Description */}
          <div className="lg:w-1/3 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[11px] font-extrabold tracking-widest uppercase">
              <Zap className="w-3 h-3" />
              AI Voice Agent
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              VOICE AI AGENT with speaking & multi-modal capabilities
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              This is your voice-AI agent specialized in CRE Real Estate. Kimi is a multi-modal agent trained specifically for reading databases, searching the web, analyzing documents, creating proformas, analyzing property details, writing reports, researching market trends, tracking buyers and sellers, calculating NOI.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Voice input uses SpeechRecognition where the browser supports it. Voice output uses the browser's built-in speechSynthesis. Chrome or Edge usually gives the best free support.
            </p>
          </div>

          {/* Center: Orb */}
          <div className="relative flex-1 flex flex-col items-center justify-center">
            <div
              id="mission-orb-shell"
              className="relative w-64 h-64 lg:w-80 lg:h-80"
              style={{
                transform: 'perspective(900px) rotateX(6deg) rotateY(-5deg)',
                '--orb-scale': 1, '--orb-tilt': '0deg', '--orb-glow': 0.8,
              }}
            >
              <div className="mission-orb-aura absolute inset-0 rounded-full" />
              <div
                className="mission-orb-ring absolute inset-0 rounded-full border-[3px] border-cyan-400/15"
                style={{
                  boxShadow: '0 0 36px rgba(65,200,255,0.22), inset 0 0 40px rgba(41,104,255,0.2)',
                  transform: 'scale(var(--orb-scale, 1)) rotate(var(--orb-tilt, 0deg))',
                  transition: 'transform 120ms linear, box-shadow 120ms linear',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: '12%',
                  background: 'radial-gradient(circle at 40% 34%, rgba(90,225,255,0.32), transparent 22%), radial-gradient(circle at 65% 70%, rgba(122,95,255,0.18), transparent 24%), radial-gradient(circle at 50% 50%, rgba(10,40,70,0.95) 0%, rgba(3,12,24,0.98) 58%, rgba(0,0,0,1) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(128,197,255,0.14), inset 0 0 50px rgba(65,200,255,0.1), 0 0 calc(32px + 8px) rgba(65,200,255,0.35)',
                  transform: 'scale(calc(0.98 + (var(--orb-scale, 1) - 1) * 0.55))',
                  transition: 'transform 120ms linear, box-shadow 120ms linear',
                }}
              />
              <div
                className="mission-orb-scan absolute rounded-full"
                style={{
                  inset: '6%',
                  background: 'radial-gradient(circle at 50% 50%, transparent 52%, rgba(75,194,255,0.28) 58%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 65%, rgba(75,194,255,0.18) 67%, transparent 69%)',
                  filter: 'blur(1px)',
                  opacity: 'calc(0.9 * var(--orb-glow, 0.8))',
                }}
              />

              {/* Center text */}
              <div
                onClick={toggleListening}
                className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <span className={`text-4xl lg:text-5xl font-light tracking-wide text-white/95 transition-all duration-300 group-hover:scale-110 ${mode !== 'idle' ? 'scale-110' : ''}`}>
                  {orbLabel}
                </span>
                <span className="mt-2 text-xs lg:text-sm text-cyan-300/80 font-medium tracking-wider uppercase">
                  {orbSubLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="lg:w-1/6 flex flex-col gap-4">
            <button
              onClick={toggleListening}
              className={`group flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                mode === 'listening'
                  ? 'bg-red-500/10 border-red-500/40 text-red-300 animate-pulse'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/60 text-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
                mode === 'listening' ? 'bg-red-500 text-white' : 'bg-cyan-500/10 text-cyan-300 group-hover:bg-cyan-500/20'
              }`}>
                {mode === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <div className="text-left">
                <div className="font-semibold">{mode === 'listening' ? 'Stop' : 'Speak'}</div>
                <div className="text-[11px] text-slate-400">{mode === 'listening' ? 'Listening…' : 'Voice input'}</div>
              </div>
            </button>

            <button
              onClick={stopCurrentSpeech}
              className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-slate-800/40 border-slate-700/50 hover:border-rose-500/40 hover:bg-slate-800/60 text-slate-200 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-300 group-hover:bg-rose-500/20 flex items-center justify-center text-xl">
                <Square className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Stop</div>
                <div className="text-[11px] text-slate-400">Halt speech</div>
              </div>
            </button>

            <button
              onClick={() => setChatOpen(true)}
              className="group flex items-center gap-4 px-5 py-4 rounded-2xl border bg-slate-800/40 border-slate-700/50 hover:border-violet-500/40 hover:bg-slate-800/60 text-slate-200 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-300 group-hover:bg-violet-500/20 flex items-center justify-center text-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Chat</div>
                <div className="text-[11px] text-slate-400">Text with Kimi</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard title="Active Missions" value={stats.activeMissions} trend={{ value: 3, label: 'new', positive: true }} icon={Activity} color="blue" />
        <StatCard title="Hot Money Alerts" value={metrics.hotMoney ?? stats.hotMoneyAlerts} trend={{ value: 8, label: 'new', positive: true }} icon={DollarSign} color="red" />
        <StatCard title="Tracked Capital" value={`$${(stats.trackedCapital / 1e9).toFixed(1)}B`} trend={{ value: 12, label: 'growth', positive: true }} icon={TrendingUp} color="green" />
        <StatCard title="Matches Today" value={stats.matchesToday} trend={{ value: 24, label: 'new', positive: true }} icon={Target} color="yellow" />
      </div>

      {/* Bottom Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        <FeatureCard
          icon={Flame}
          label="Hot Money"
          value={metrics.hotMoney}
          description="Recent cash buyers and distressed signals"
          color="text-cyan-400"
          bg="bg-cyan-500/10"
          border="border-cyan-500/20"
          onClick={() => navigate('/hotmoney')}
        />
        <FeatureCard
          icon={Target}
          label="Opportunities"
          value={metrics.opportunities}
          description="Goldmine deals and flagged reports"
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
          onClick={() => navigate('/opportunities')}
        />
        <FeatureCard
          icon={Building2}
          label="Property Matcher"
          value={newDealsCount || 'Active'}
          description="Match listings to buyers and lenders"
          color="text-violet-400"
          bg="bg-violet-500/10"
          border="border-violet-500/20"
          onClick={() => navigate('/listings')}
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton label="Research Property" description="Start new property analysis" icon="🎯" to="/listings" />
          <QuickActionButton label="View Hot Money" description="See recent seller leads" icon="🔥" to="/hotmoney" />
          <QuickActionButton label="Buyer Matcher" description={`Match buyers to listings`} icon="📊" to="/buyers" />
          <QuickActionButton label="Voice Agent" description="Talk to your vault" icon="🎙️" to="/voice-agent" />
        </div>
      </div>

      {/* Chat Slide-over Panel */}
      {chatOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-[#0d1117]/95 border-l border-slate-700/60 shadow-2xl flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Kimi</div>
                  <div className="text-xs text-slate-400">
                    {backendAvailable ? 'Online • Backend AI' : 'Browser mode'}
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-10">
                  <p className="mb-3">Say or type a command to get started.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Show hot money', 'How many opportunities?', 'Daily briefing', 'Satellite view of 100 Senior Living Blvd', 'Analyze property at 123 Main St'].map((p) => (
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
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-md'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-md'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    {m.meta?.image_url && (
                      <img
                        src={`${API_BASE}${m.meta.image_url}`}
                        alt="Uploaded"
                        className="mt-2 rounded-lg max-w-full border border-slate-600"
                      />
                    )}
                    <div className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-cyan-200' : 'text-slate-500'}`}>{m.time}</div>
                  </div>
                </div>
              ))}
              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-cyan-600/40 text-cyan-100 text-sm italic border border-cyan-500/30">
                    {transcript}
                  </div>
                </div>
              )}
              {mode === 'thinking' && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800 border border-slate-700 text-slate-400 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".txt,.md,.csv,.json,.png,.jpg,.jpeg,.pdf"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || mode === 'thinking'}
                  className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm transition-colors"
                  title="Upload file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder={uploading ? 'Uploading file…' : 'Type a command...'}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || mode === 'thinking' || uploading}
                  className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FeatureCard = ({ icon: Icon, label, value, description, color, bg, border, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative text-left rounded-2xl border ${border} ${bg} hover:bg-opacity-20 transition-all duration-200 p-5 hover:scale-[1.02] hover:shadow-xl`}
  >
    <div className="flex items-start justify-between">
      <div className={`p-2.5 rounded-xl ${bg} ${color} border ${border}`}>
        <Icon className="w-5 h-5" />
      </div>
      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
    </div>
    <div className="mt-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${value === null ? 'text-slate-500' : 'text-white'}`}>{value === null ? '—' : value}</div>
      <div className="text-xs text-slate-500 mt-1">{description}</div>
    </div>
  </button>
)

const QuickActionButton = ({ label, description, icon, to }) => (
  <Link to={to} className="card-hover p-4 flex flex-col items-center text-center gap-2">
    <span className="text-3xl">{icon}</span>
    <span className="font-medium text-text-primary">{label}</span>
    <span className="text-xs text-text-secondary">{description}</span>
  </Link>
)

export default MissionControl
