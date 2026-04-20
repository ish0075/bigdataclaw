import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, Square } from 'lucide-react'
import { useChatStream } from '../../hooks/useChatStream'

const formatCash = (amount) => {
  if (!amount) return '$0'
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
  return `$${amount}`
}

const OpenClawChatFloating = ({ dealContext }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const buildContext = () => {
    if (!dealContext) return null
    return {
      entity: dealContext.entity,
      cash_amount: dealContext.cashAmount,
      location: dealContext.location,
      asset_class: dealContext.assetClass || dealContext.propertyType,
      address: dealContext.address || dealContext.property,
      buyer_name: dealContext.buyerEntity || dealContext.buyerName,
      broker_name: dealContext.brokerName,
      lender_name: dealContext.lenderName,
      sale_date: dealContext.saleDate,
      days_ago: dealContext.daysAgo,
      notes: dealContext.notes,
    }
  }

  const {
    messages,
    setMessages,
    status,
    isLoading,
    sendMessage,
    cancel,
  } = useChatStream({
    apiPath: '/api/openclaw/chat/stream',
    onError: (err) => console.error('Floating chat error:', err),
    initialMessages: [
      { role: 'assistant', content: 'Hello! I\'m OpenClaw. Ask me anything about this deal or how to take the next step.' }
    ]
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const dealId = dealContext?.id
  useEffect(() => {
    if (!dealContext) return
    const contextLine = `Current deal: ${dealContext.entity} • ${formatCash(dealContext.cashAmount)} • ${dealContext.location} • ${dealContext.assetClass || dealContext.propertyType || ''}`
    setMessages(prev => {
      const systemIdx = prev.findIndex(m => m.role === 'system')
      if (systemIdx >= 0) {
        const next = [...prev]
        next[systemIdx] = { role: 'system', content: contextLine }
        return next
      }
      return [{ role: 'system', content: contextLine }, ...prev]
    })
  }, [dealId, dealContext, setMessages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text, {
      mode: 'fast',
      conversationHistory: messages,
      context: buildContext()
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const statusLabel = status === 'streaming' ? 'Streaming...' : status === 'connecting' ? 'Connecting...' : 'Thinking...'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <span className="font-semibold text-white">OpenClaw</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Context pill */}
          {dealContext && (
            <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
              <p className="text-xs text-slate-400 truncate">
                Context: <span className="text-indigo-300">{dealContext.entity}</span> • {formatCash(dealContext.cashAmount)}
              </p>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {messages.filter(m => m.role !== 'system').map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
                  {status === 'streaming' ? (
                    <>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="text-sm">{statusLabel}</span>
                      <button
                        onClick={cancel}
                        className="ml-1 p-0.5 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Square className="w-3 h-3 text-slate-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{statusLabel}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-700 bg-slate-900">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask OpenClaw..."
                disabled={isLoading && status !== 'streaming'}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              {isLoading && status === 'streaming' ? (
                <button
                  onClick={cancel}
                  className="p-2 bg-accent-red hover:bg-accent-red/90 rounded-lg text-white transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-full shadow-lg text-white font-medium transition-all"
      >
        <Bot className="w-5 h-5" />
        <span className="hidden sm:inline">Ask OpenClaw</span>
        <MessageSquare className="w-4 h-4 sm:hidden" />
      </button>
    </div>
  )
}

export default OpenClawChatFloating
