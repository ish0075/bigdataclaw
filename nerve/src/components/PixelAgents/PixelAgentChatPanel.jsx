import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  Mic,
  StopCircle,
  Sparkles,
} from 'lucide-react'
import { AGENT_QUICK_PROMPTS } from '../../types/pixelAgents'

const PixelAgentChatPanel = ({
  agent,
  messages,
  status,
  isLoading,
  onSendMessage,
  onCancel,
  onClose,
  isMinimized,
  onToggleMinimize,
  chatPersona = 'auto',
  onChangePersona,
  routing,
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickPrompts = agent?.id ? AGENT_QUICK_PROMPTS[agent.id] || [] : []

  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl transition-all hover:scale-105"
        style={{ backgroundColor: agent?.color || '#8b5cf6' }}
      >
        <img
          src={agent?.sprite}
          alt={agent?.name}
          className="w-8 h-8 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
        <span className="text-white font-medium text-sm">{agent?.name}</span>
        {messages.length > 0 && (
          <span className="w-5 h-5 bg-white/20 text-white text-xs rounded-full flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-[420px] max-w-[calc(100vw-2rem)] bg-bg-card border border-border-subtle rounded-2xl shadow-2xl z-50 flex flex-col max-h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${agent?.color}15` }}
          >
            <img
              src={agent?.sprite}
              alt={agent?.name}
              className="w-7 h-7 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{agent?.name}</h3>
            <p className="text-xs text-text-muted">
              {agent?.mode === 'analyst' ? '🔍 Deep Intelligence' : '💬 Guidance'}
            </p>
          </div>
          {/* Persona selector */}
          {onChangePersona && (
            <div className="flex items-center gap-1 ml-2">
              {[
                { key: 'auto', label: 'Auto', icon: '✨' },
                { key: 'concierge', label: 'Guide', icon: '💬' },
                { key: 'analyst', label: 'Analyst', icon: '🔍' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => onChangePersona(p.key)}
                  title={p.key === 'auto' ? 'Auto chooses the best agent for your request' : p.label}
                  className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                    chatPersona === p.key
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                      : 'border-border-subtle text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-bg-input rounded-lg transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-input rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[480px]">
        {/* Routing badge */}
        {routing?.autoRouted && (
          <div className="flex justify-center">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/5 border border-accent-primary/10 text-text-muted">
              Routed to {routing.persona === 'analyst' ? 'Analyst' : 'Concierge'}
              {routing.mode === 'report' ? ' (Report mode)' : routing.mode === 'deep' ? ' (Deep)' : ''}
            </span>
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${agent?.color}15` }}
            >
              <img
                src={agent?.sprite}
                alt={agent?.name}
                className="w-12 h-12 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <h4 className="font-semibold text-text-primary mb-1">
              {agent?.name} is ready
            </h4>
            <p className="text-sm text-text-muted mb-4">
              {agent?.description}
            </p>
            {quickPrompts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(q)}
                    className="px-3 py-1.5 text-xs bg-bg-input hover:bg-bg-card border border-border-subtle rounded-full transition-colors text-text-secondary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-accent-blue/10'
                  : 'bg-bg-input border border-border-subtle'
              }`}
            >
              {msg.role === 'user' ? (
                <span className="text-sm">👤</span>
              ) : (
                <img
                  src={agent?.sprite}
                  alt={agent?.name}
                  className="w-5 h-5 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-accent-blue text-white'
                  : 'bg-bg-input border border-border-subtle'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: agent?.color }} />
              <div className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ backgroundColor: agent?.color }} />
              <div className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ backgroundColor: agent?.color }} />
            </div>
            <span className="text-xs">
              {status === 'streaming' ? `${agent?.name} is responding...` : `${agent?.name} is thinking...`}
            </span>
            {status === 'streaming' && (
              <button
                onClick={onCancel}
                className="text-xs px-2 py-0.5 bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${agent?.name}...`}
            className="flex-1 px-4 py-3 bg-bg-input border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: input.trim() && !isLoading ? agent?.color || '#8b5cf6' : undefined,
            }}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PixelAgentChatPanel
