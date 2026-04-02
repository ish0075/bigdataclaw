import { useEffect, useRef, useCallback, useState } from 'react'
import { useMissionStore } from '../stores/missionStore'
import { useAgentStore } from '../stores/agentStore'

export const useWebSocket = () => {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const reconnectTimeout = useRef(null)
  
  const { addMissionLog, updateMissionPhase, completeMission, addHotMoneyLead } = useMissionStore()
  const { addAgentLog, updateAgentStatus, updateAgentStats } = useAgentStore()
  
  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3090/ws'
    
    ws.current = new WebSocket(wsUrl)
    
    ws.current.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
      // Subscribe to channels
      ws.current.send(JSON.stringify({ type: 'subscribe', channels: ['missions', 'agents', 'hotmoney'] }))
    }
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    }
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      // Reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000)
    }
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [])
  
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
    }
  }, [])
  
  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      ws.current?.close()
    }
  }, [connect])
  
  return { connected, sendMessage }
}
