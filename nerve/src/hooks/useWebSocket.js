import { useEffect, useRef, useCallback, useState } from 'react'
import { useMissionStore } from '../stores/missionStore'
import { useAgentStore } from '../stores/agentStore'

/**
 * Stable WebSocket hook with:
 * - Exponential backoff reconnect
 * - Heartbeat ping/pong
 * - Message queue during disconnect
 * - Reconnect state tracking
 */

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000
const HEARTBEAT_INTERVAL_MS = 15000
const HEARTBEAT_TIMEOUT_MS = 5000

export const useWebSocket = () => {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [reconnectCount, setReconnectCount] = useState(0)
  const reconnectTimeout = useRef(null)
  const heartbeatInterval = useRef(null)
  const heartbeatTimeout = useRef(null)
  const messageQueue = useRef([])
  const backoffMs = useRef(RECONNECT_BASE_MS)
  
  const { addMissionLog, updateMissionPhase, completeMission, addHotMoneyLead } = useMissionStore()
  const { addAgentLog, updateAgentStatus, updateAgentStats } = useAgentStore()
  
  const clearTimers = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
      heartbeatInterval.current = null
    }
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current)
      heartbeatTimeout.current = null
    }
  }, [])
  
  const startHeartbeat = useCallback(() => {
    clearTimers()
    heartbeatInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }))
        heartbeatTimeout.current = setTimeout(() => {
          console.log('Heartbeat timeout — closing socket')
          ws.current?.close()
        }, HEARTBEAT_TIMEOUT_MS)
      }
    }, HEARTBEAT_INTERVAL_MS)
  }, [clearTimers])
  
  const flushQueue = useCallback(() => {
    while (messageQueue.current.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
      const msg = messageQueue.current.shift()
      ws.current.send(JSON.stringify(msg))
    }
  }, [])
  
  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3090/ws'

    // Don't try to connect to localhost WebSocket when running on a remote domain
    const isRemote = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    if (isRemote && wsUrl.includes('localhost')) {
      console.log('Skipping localhost WebSocket in production')
      return
    }
    
    // Already connecting or connected
    if (ws.current?.readyState === WebSocket.CONNECTING || ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    clearTimers()
    setConnecting(true)
    
    try {
      ws.current = new WebSocket(wsUrl)
    } catch (err) {
      console.error('WebSocket creation error:', err)
      setConnecting(false)
      scheduleReconnect()
      return
    }

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      setConnecting(false)
      setReconnectCount(0)
      backoffMs.current = RECONNECT_BASE_MS
      
      // Subscribe to channels
      ws.current.send(JSON.stringify({ type: 'subscribe', channels: ['missions', 'agents', 'hotmoney'] }))
      
      // Flush queued messages
      flushQueue()
      
      // Start heartbeat
      startHeartbeat()
    }

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        // Handle heartbeat pong
        if (message.type === 'pong') {
          if (heartbeatTimeout.current) {
            clearTimeout(heartbeatTimeout.current)
            heartbeatTimeout.current = null
          }
          return
        }
        
        handleMessage(message)
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    }

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason)
      setConnected(false)
      setConnecting(false)
      clearTimers()
      scheduleReconnect()
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      // onclose will fire next, which schedules reconnect
    }
  }, [clearTimers, startHeartbeat, flushQueue])
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) return
    
    setReconnectCount(prev => prev + 1)
    const delay = Math.min(backoffMs.current, RECONNECT_MAX_MS)
    backoffMs.current = backoffMs.current * 2
    
    console.log(`Reconnecting in ${delay}ms...`)
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null
      connect()
    }, delay)
  }, [connect])
  
  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'mission:phase:change':
        updateMissionPhase(message.missionId, message.phase, message.progress)
        break
        
      case 'mission:log':
        addMissionLog(message.missionId, message.log)
        break
        
      case 'mission:complete':
        completeMission(message.missionId)
        break
        
      case 'agent:log':
        addAgentLog(message.agentId, message.message, message.level)
        break
        
      case 'agent:status':
        updateAgentStatus(message.agentId, message.status)
        break
        
      case 'agent:stats':
        updateAgentStats(message.agentId, message.stats)
        break
        
      case 'hotmoney:new':
        addHotMoneyLead(message.lead)
        break
        
      case 'hotmoney:update':
        // Handle bulk hot money updates
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }, [addMissionLog, updateMissionPhase, completeMission, addHotMoneyLead, addAgentLog, updateAgentStatus, updateAgentStats])
  
  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      // Queue message for when connection resumes
      messageQueue.current.push(message)
      console.log('WebSocket not open — message queued')
    }
  }, [])
  
  useEffect(() => {
    connect()
    
    return () => {
      clearTimers()
      ws.current?.close()
    }
  }, [connect, clearTimers])
  
  return { 
    connected, 
    connecting,
    reconnectCount,
    sendMessage 
  }

}