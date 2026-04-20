import React, { useState, useCallback } from 'react'
import {
  Scan,
  RefreshCw,
  Grid3X3,
  List,
  Activity,
  Bot,
} from 'lucide-react'
import { usePixelAgents, usePixelAgentChat } from '../hooks/usePixelAgents'
import PixelAgentCard from '../components/PixelAgents/PixelAgentCard'
import PixelAgentChatPanel from '../components/PixelAgents/PixelAgentChatPanel'

const PixelAgents = () => {
  const { agents, loading, error, refreshStatus } = usePixelAgents()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [chatMinimized, setChatMinimized] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [chatPersona, setChatPersona] = useState('auto') // 'auto' | 'concierge' | 'analyst'

  // Chat state for the selected agent
  const {
    messages,
    status,
    isLoading,
    sendMessage: sendChatMessage,
    cancel,
    reset,
    routing,
  } = usePixelAgentChat(selectedAgent?.id)

  const handleSelectAgent = useCallback(
    (agent) => {
      if (selectedAgent?.id === agent.id) {
        // Toggle minimize if already selected
        setChatMinimized((prev) => !prev)
        return
      }
      // Switch to new agent — reset chat
      reset()
      setSelectedAgent(agent)
      setChatMinimized(false)
    },
    [selectedAgent, reset]
  )

  const handleSendMessage = useCallback(
    (content) => {
      if (!selectedAgent) return
      const mode = chatPersona === 'analyst' ? 'deep' : chatPersona === 'concierge' ? 'fast' : 'fast'
      sendChatMessage(content, { persona: chatPersona, mode, autoRoute: chatPersona === 'auto' })
    },
    [selectedAgent, sendChatMessage, chatPersona]
  )

  const handleCloseChat = useCallback(() => {
    setSelectedAgent(null)
    reset()
  }, [reset])

  const onlineCount = agents.filter((a) => a.status === 'online').length
  const busyCount = agents.filter((a) => a.status === 'busy').length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Scan className="w-8 h-8 text-accent-purple" />
            Pixel Agents
          </h1>
          <p className="text-text-muted mt-1">
            Your AI agent fleet — click any agent to chat
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status summary */}
          <div className="flex items-center gap-4 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-text-secondary">{onlineCount} online</span>
            </div>
            {busyCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-sm text-text-secondary">{busyCount} busy</span>
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-bg-card border border-border-subtle rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' ? 'bg-accent-primary/10 text-accent-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={refreshStatus}
            className="p-2 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-primary/30 transition-colors"
            title="Refresh agent status"
          >
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading agent fleet...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4">
          <p className="text-sm text-accent-red">{error}</p>
          <p className="text-xs text-text-muted mt-1">
            Using cached agent definitions. Backend may be unavailable.
          </p>
        </div>
      )}

      {/* Agent Grid */}
      {!loading && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {agents.map((agent) => (
            <PixelAgentCard
              key={agent.id}
              agent={agent}
              onSelect={handleSelectAgent}
              isSelected={selectedAgent?.id === agent.id}
            />
          ))}
        </div>
      )}

      {/* Activity Feed (optional bottom section) */}
      {!loading && (
        <div className="bg-bg-card border border-border-subtle rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-accent-primary" />
            <h3 className="font-semibold text-text-primary">Agent Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-start gap-3 p-3 bg-bg-input rounded-lg border border-border-subtle"
              >
                <img
                  src={agent.sprite}
                  alt={agent.name}
                  className="w-8 h-8 object-contain flex-shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">{agent.name}</p>
                  <p className="text-xs text-text-muted">
                    {agent.capabilities?.slice(0, 3).join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {selectedAgent && (
        <PixelAgentChatPanel
          agent={selectedAgent}
          messages={messages}
          status={status}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onCancel={cancel}
          onClose={handleCloseChat}
          isMinimized={chatMinimized}
          onToggleMinimize={() => setChatMinimized((p) => !p)}
          chatPersona={chatPersona}
          onChangePersona={setChatPersona}
          routing={routing}
        />
      )}
    </div>
  )
}

export default PixelAgents
