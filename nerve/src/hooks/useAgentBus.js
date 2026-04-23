import { useCallback, useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import { useOrchestratorStore } from '../stores/orchestratorStore'
import { buildAgentMessage } from '../types/agentBus'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3090'

/**
 * useAgentBus — Structured inter-agent communication hook
 *
 * Wraps the raw WebSocket with typed, structured message semantics.
 * Integrates with orchestratorStore for run tracking.
 *
 * Usage:
 *   const { sendTask, sendResponse, broadcast, plan, run, isConnected } = useAgentBus()
 */
export function useAgentBus() {
  const { connected, sendMessage: wsSend } = useWebSocket()
  const store = useOrchestratorStore()
  const subscribed = useRef(false)

  // ------------------------------------------------------------------
  // Subscribe to bus topics on connect
  // ------------------------------------------------------------------
  useEffect(() => {
    if (connected && !subscribed.current) {
      wsSend({ type: 'subscribe', channels: ['agents', 'orchestrator.completed'] })
      // Also agent-subscribe the coordinator to orchestrator topics
      wsSend({ type: 'agent:subscribe', agentId: 'coordinator', topic: 'orchestrator.completed' })
      wsSend({ type: 'agent:subscribe', agentId: 'user', topic: 'broadcast' })
      subscribed.current = true
    }
    if (!connected) {
      subscribed.current = false
    }
  }, [connected, wsSend])

  // ------------------------------------------------------------------
  // Listen for incoming bus messages via a lightweight window event
  // (useWebSocket fires handleMessage; we patch it below)
  // ------------------------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      const msg = e.detail
      if (!msg) return

      // Log everything
      store.addLog({
        type: msg.type || 'unknown',
        from: msg.from,
        to: msg.to,
        topic: msg.topic,
        priority: msg.priority,
        status: msg.status,
        payload: msg.payload,
        timestamp: msg.timestamp || new Date().toISOString(),
      })

      // Handle orchestrator completion
      if (msg.type === 'status' && msg.topic === 'orchestrator.completed') {
        const p = msg.payload || {}
        if (p.awaitingApproval) {
          store.queueApproval(p.run_id, 0, 'coordinator', p.artifactRef)
        }
        store.completeRun(p.run_id, p.summary)
      }

      // Handle task responses
      if (msg.type === 'response' && msg.payload?.run_id) {
        store.recordStepResult(
          msg.payload.run_id,
          msg.payload.step,
          msg.from,
          msg.payload
        )
      }

      // Handle artifacts
      if (msg.type === 'artifact') {
        store.addArtifact(msg.payload?.run_id, {
          step: msg.payload?.step,
          agent: msg.from,
          ref: msg.artifactRef,
          content: msg.payload?.content,
          requiresApproval: msg.requiresApproval,
        })
      }
    }

    window.addEventListener('agent:bus:message', handler)
    return () => window.removeEventListener('agent:bus:message', handler)
  }, [store])

  // ------------------------------------------------------------------
  // Structured send helpers
  // ------------------------------------------------------------------

  const sendRaw = useCallback(
    (msg) => {
      wsSend({ type: 'agent:send', ...msg })
    },
    [wsSend]
  )

  const sendTask = useCallback(
    (from, to, task, opts = {}) => {
      const msg = buildAgentMessage({
        from,
        to,
        type: 'task',
        payload: {
          task,
          task_type: opts.taskType || 'task',
          step: opts.step,
          run_id: opts.runId,
          expected_output: opts.expectedOutput,
          deal_context: opts.dealContext,
        },
        priority: opts.priority || 'normal',
        status: 'pending',
        correlationId: opts.correlationId,
        conversationId: opts.conversationId,
        taskId: opts.taskId,
        artifactRef: opts.artifactRef,
        requiresApproval: opts.requiresApproval || false,
        dealId: opts.dealId,
      })
      sendRaw(msg)
      return msg
    },
    [sendRaw]
  )

  const sendResponse = useCallback(
    (from, to, payload, opts = {}) => {
      const msg = buildAgentMessage({
        from,
        to,
        type: 'response',
        payload,
        priority: opts.priority || 'normal',
        status: 'completed',
        correlationId: opts.correlationId,
        conversationId: opts.conversationId,
        taskId: opts.taskId,
        artifactRef: opts.artifactRef,
        dealId: opts.dealId,
      })
      sendRaw(msg)
      return msg
    },
    [sendRaw]
  )

  const sendStatus = useCallback(
    (from, payload, opts = {}) => {
      const msg = buildAgentMessage({
        from,
        topic: opts.topic || 'broadcast',
        type: 'status',
        payload,
        priority: opts.priority || 'normal',
        status: payload.status || 'active',
        correlationId: opts.correlationId,
        conversationId: opts.conversationId,
      })
      sendRaw(msg)
      return msg
    },
    [sendRaw]
  )

  const broadcast = useCallback(
    (from, payload, opts = {}) => {
      const msg = buildAgentMessage({
        from,
        topic: opts.topic || 'broadcast',
        type: 'broadcast',
        payload,
        priority: opts.priority || 'normal',
        correlationId: opts.correlationId,
        conversationId: opts.conversationId,
      })
      sendRaw(msg)
      return msg
    },
    [sendRaw]
  )

  // ------------------------------------------------------------------
  // Orchestrator API (REST)
  // ------------------------------------------------------------------

  const plan = useCallback(
    async (goal, context) => {
      store.setPlanning(true)
      try {
        const res = await fetch(`${API_BASE}/api/orchestrate/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, context }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data
      } finally {
        store.setPlanning(false)
      }
    },
    [store]
  )

  const run = useCallback(
    async (goal, context) => {
      store.setExecuting(true)
      try {
        const res = await fetch(`${API_BASE}/api/orchestrate/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, context }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data.runId) {
          store.startRun(data.runId, goal, data.summary)
        }
        return data
      } finally {
        store.setExecuting(false)
      }
    },
    [store]
  )

  const getRunStatus = useCallback(
    async (runId) => {
      const res = await fetch(`${API_BASE}/api/orchestrate/run/${runId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    },
    []
  )

  // ------------------------------------------------------------------
  // Inbox helpers
  // ------------------------------------------------------------------

  const getInbox = useCallback(
    async (agentId, filters = {}) => {
      const params = new URLSearchParams()
      if (filters.unreadOnly) params.set('unread_only', 'true')
      if (filters.status) params.set('status', filters.status)
      if (filters.type) params.set('msg_type', filters.type)
      const res = await fetch(`${API_BASE}/api/agents/inbox/${agentId}?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    },
    []
  )

  const markRead = useCallback(
    async (agentId, messageId) => {
      await fetch(`${API_BASE}/api/agents/inbox/${agentId}/read/${messageId}`, { method: 'POST' })
    },
    []
  )

  return {
    isConnected: connected,
    sendRaw,
    sendTask,
    sendResponse,
    sendStatus,
    broadcast,
    plan,
    run,
    getRunStatus,
    getInbox,
    markRead,
  }
}
