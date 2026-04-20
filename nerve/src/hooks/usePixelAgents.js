import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_PIXEL_AGENTS } from '../types/pixelAgents'

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Hook to load pixel agent definitions from backend.
 * Falls back to DEFAULT_PIXEL_AGENTS if backend is unreachable.
 */
export function usePixelAgents() {
  const [agents, setAgents] = useState(DEFAULT_PIXEL_AGENTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pixel-agents`)
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        if (data.agents && Array.isArray(data.agents)) {
          // Merge backend agents with local sprites/colors if missing
          const merged = data.agents.map((agent) => {
            const local = DEFAULT_PIXEL_AGENTS.find((a) => a.id === agent.id)
            return {
              ...local,
              ...agent,
              sprite: agent.sprite || local?.sprite || '/pablo-assets/characters/char_0.png',
              color: agent.color || local?.color || '#8b5cf6',
            }
          })
          setAgents(merged)
        }
        setError(null)
      } catch (err) {
        // Fallback to defaults — don't break the UI
        setAgents(DEFAULT_PIXEL_AGENTS)
        setError(err.message || 'Failed to load agents')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pixel-agents`)
      if (!res.ok) return
      const data = await res.json()
      if (data.agents) {
        setAgents((prev) =>
          prev.map((agent) => {
            const remote = data.agents.find((a) => a.id === agent.id)
            return remote ? { ...agent, status: remote.status || agent.status } : agent
          })
        )
      }
    } catch {
      // silently fail on background refresh
    }
  }, [])

  return { agents, loading, error, refreshStatus }
}

/**
 * Hook to run a chat session with a specific pixel agent.
 * Reuses the existing /api/openclaw/chat/stream endpoint with the agent's persona.
 */
export function usePixelAgentChat(agentId, options = {}) {
  const [messages, setMessages] = useState(options.initialMessages || [])
  const [status, setStatus] = useState('idle') // idle | connecting | streaming | error
  const [isLoading, setIsLoading] = useState(false)
  const [routing, setRouting] = useState(null) // { persona, mode, autoRouted }
  const abortController = useRef(null)
  const contentRef = useRef('')
  const flushTimer = useRef(null)

  const flushContent = useCallback(() => {
    if (flushTimer.current) {
      clearTimeout(flushTimer.current)
      flushTimer.current = null
    }
    const text = contentRef.current
    if (!text) return
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.content !== text) {
        return [...prev.slice(0, -1), { ...last, content: text }]
      }
      return prev
    })
  }, [])

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) return
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null
      flushContent()
    }, 50)
  }, [flushContent])

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
    if (flushTimer.current) {
      clearTimeout(flushTimer.current)
      flushTimer.current = null
    }
    flushContent()
    setStatus('idle')
    setIsLoading(false)
  }, [flushContent])

  const sendMessage = useCallback(
    async (content, opts = {}) => {
      const { persona = 'auto', mode = 'fast', autoRoute = true } = typeof opts === 'string' ? { persona: opts } : opts
      const userMsg = { role: 'user', content }
      setMessages((prev) => [...prev, userMsg])
      setStatus('connecting')
      setIsLoading(true)
      setRouting(null)
      contentRef.current = ''

      try {
        abortController.current = new AbortController()
        const res = await fetch(`${API_BASE}/api/openclaw/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortController.current.signal,
          body: JSON.stringify({
            message: content,
            conversation_history: messages,
            persona,
            mode,
            auto_route: autoRoute,
          }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        if (!res.body) throw new Error('No response body')

        setStatus('streaming')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            const payload = trimmed.slice(6)
            if (payload === '[DONE]') continue
            try {
              const parsed = JSON.parse(payload)
              if (parsed.meta) {
                setRouting({
                  persona: parsed.meta.persona,
                  mode: parsed.meta.mode,
                  autoRouted: parsed.meta.auto_routed,
                })
                continue
              }
              const chunk = parsed.token || parsed.content || parsed.delta?.content || parsed.text || ''
              if (chunk) {
                contentRef.current += chunk
                scheduleFlush()
              }
            } catch {
              // ignore malformed JSON lines
            }
          }
        }

        flushContent()
        setStatus('idle')
      } catch (err) {
        if (err.name === 'AbortError') {
          setStatus('idle')
        } else {
          setStatus('error')
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Error: ${err.message}` },
          ])
        }
      } finally {
        setIsLoading(false)
        abortController.current = null
      }
    },
    [messages, scheduleFlush, flushContent]
  )

  const reset = useCallback(() => {
    setMessages([])
    setStatus('idle')
    setIsLoading(false)
    contentRef.current = ''
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }, [])

  return { messages, status, isLoading, sendMessage, cancel, reset, routing }
}
