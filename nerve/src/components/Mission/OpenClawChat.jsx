import React, { useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Square } from 'lucide-react'
import { useChatStream } from '../../hooks/useChatStream'

export default function OpenClawChat() {
  const {
    messages,
    status,
    isLoading,
    sendMessage,
    cancel,
  } = useChatStream({
    apiPath: '/api/openclaw/chat/stream',
    onError: (err) => console.error('OpenClawChat error:', err),
    initialMessages: [
      {
        role: 'assistant',
        content: "👋 I'm **OpenClaw**, your CRE intelligence assistant.\n\nI can help you find buyers, sellers, lenders, and analyze market data from 193K+ records. What would you like to explore?"
      }
    ]
  })

  const [input, setInput] = React.useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text, {
      mode: 'fast',
      conversationHistory: messages
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    "Find land buyers in Hamilton",
    "Who are the active lenders?",
    "Show me hot money leads"
  ]

  const statusLabel = status === 'streaming' ? 'Streaming...' : status === 'connecting' ? 'Connecting...' : 'Thinking...'

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text-primary">OpenClaw Chat</h3>
          <p className="text-xs text-text-muted">AI-powered CRE intelligence</p>
        </div>
        {status === 'error' && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-accent-red/10 text-accent-red rounded-full">Error</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-[240px] max-h-[320px] pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-accent-blue/10' : 'bg-accent-primary/10'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-accent-blue" />
              ) : (
                <Bot className="w-4 h-4 text-accent-primary" />
              )}
            </div>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-accent-blue text-white'
                : 'bg-bg-input border border-border-subtle text-text-primary'
            }`}>
              <div dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.actions.map((action, i) => (
                    <a
                      key={i}
                      href={action.to || '#'}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        action.primary
                          ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
                          : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
                      }`}
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-text-muted">
            {status === 'streaming' ? (
              <>
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
                <span className="text-xs">{statusLabel}</span>
                <button
                  onClick={cancel}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 bg-accent-red/10 text-accent-red rounded hover:bg-accent-red/20 transition-colors"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{statusLabel}</span>
              </>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length < 3 && !isLoading && (
        <div className="mt-4">
          <p className="text-xs text-text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(q); }}
                className="px-3 py-1.5 text-xs bg-bg-input hover:bg-bg-card border border-border-subtle rounded-full transition-colors text-text-secondary"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask OpenClaw anything..."
            disabled={isLoading && status !== 'streaming'}
            className="flex-1 px-4 py-2.5 bg-bg-input border border-border-subtle rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors disabled:opacity-50"
          />
          {isLoading && status === 'streaming' ? (
            <button
              onClick={cancel}
              className="p-2.5 bg-accent-red hover:bg-accent-red/90 rounded-xl transition-colors"
            >
              <Square className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
