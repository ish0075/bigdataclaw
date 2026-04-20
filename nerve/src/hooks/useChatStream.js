import { useState, useRef, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Reusable streaming chat hook.
 * Supports SSE streaming with cancel, status tracking, and action extraction.
 */
export function useChatStream({ apiPath = '/api/openclaw/chat/stream', onError, initialMessages = [], defaultPersona = 'concierge' } = {}) {
  const [messages, setMessages] = useState(initialMessages)
  const [status, setStatus] = useState('idle') // idle | connecting | streaming | error
  const [isLoading, setIsLoading] = useState(false)
  const [persona, setPersona] = useState(defaultPersona)
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
    setMessages(prev => {
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

  const sendMessage = useCallback(async (content, options = {}) => {
    const {
      mode = 'fast',
      conversationHistory = [],
      context = null,
      systemMessage = null
    } = options

    // Cancel any in-flight request
    cancel()
    contentRef.current = ''

    // Add user message immediately
    const userMsg = { role: 'user', content, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setStatus('connecting')

    const history = conversationHistory.map(m => ({ role: m.role, content: m.content }))
    if (systemMessage) {
      history.unshift({ role: 'system', content: systemMessage })
    }

    abortController.current = new AbortController()

    try {
      const baseUrl = API_BASE.replace(/\/$/, '')
      const url = `${baseUrl}${apiPath}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversation_history: history,
          mode,
          persona,
          context
        }),
        signal: abortController.current.signal
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      setStatus('streaming')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantActions = []
      let buffer = ''

      // Add placeholder assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        actions: [],
        timestamp: new Date()
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last line if it's incomplete (no newline at end)
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            if (parsed.token) {
              contentRef.current += parsed.token
              scheduleFlush()
            }
            if (parsed.actions) {
              assistantActions = parsed.actions
            }
          } catch (e) {
            // Ignore parse errors for malformed SSE lines
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data)
              if (parsed.token) {
                contentRef.current += parsed.token
              }
              if (parsed.actions) {
                assistantActions = parsed.actions
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Final flush and finalize message with actions
      flushContent()
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), {
            ...last,
            content: contentRef.current || 'No response received.',
            actions: assistantActions
          }]
        }
        return prev
      })

      setStatus('idle')
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle')
        flushContent()
        // Remove the empty assistant message if cancelled early
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && !last.content) {
            return prev.slice(0, -1)
          }
          return prev
        })
      } else {
        console.error('Chat stream error:', err)
        setStatus('error')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Unable to reach the AI. Please try again.'}`,
          actions: [{ label: 'Retry', action: 'retry', primary: true }],
          timestamp: new Date()
        }])
        if (onError) onError(err)
      }
    } finally {
      setIsLoading(false)
      abortController.current = null
      contentRef.current = ''
    }
  }, [apiPath, cancel, onError, flushContent, scheduleFlush])

  const clearMessages = useCallback(() => {
    setMessages([])
    setStatus('idle')
    setIsLoading(false)
    cancel()
  }, [cancel])

  return {
    messages,
    setMessages,
    status,
    isLoading,
    persona,
    setPersona,
    sendMessage,
    cancel,
    clearMessages
  }
}
