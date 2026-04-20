/**
 * Agent Tracking Database
 * Tracks every interaction with agents across all platforms
 * Prevents duplicate messaging by showing visual history
 */

import { openDB } from 'idb'

const DB_NAME = 'bigdataclaw-agent-tracking'
const DB_VERSION = 1
const STORE_NAME = 'agent-interactions'

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('agentId', 'agentId', { unique: false })
        store.createIndex('platform', 'platform', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Platform types that can be tracked
export const TRACKABLE_PLATFORMS = [
  'facebook', 'facebook-messenger', 'instagram', 'linkedin', 'linkedin-message',
  'whatsapp', 'email', 'phone', 'sms', 'website', 'realtor-ca', 'ratemyagent',
  'google-search', 'livabl', 'twitter', 'youtube', 'tiktok', 'wechat'
]

// Track an interaction
export const trackInteraction = async (agentId, platform, notes = '') => {
  const db = await initDB()
  const interaction = {
    id: `${agentId}-${platform}-${Date.now()}`,
    agentId,
    platform,
    timestamp: new Date().toISOString(),
    notes
  }
  await db.add(STORE_NAME, interaction)
  return interaction
}

// Get all interactions for an agent
export const getAgentInteractions = async (agentId) => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  return all.filter(i => i.agentId === agentId).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  )
}

// Get all interactions grouped by agent
export const getAllInteractions = async () => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  
  // Group by agent
  return all.reduce((acc, interaction) => {
    if (!acc[interaction.agentId]) {
      acc[interaction.agentId] = {}
    }
    // Keep only the most recent interaction per platform
    if (!acc[interaction.agentId][interaction.platform] || 
        new Date(interaction.timestamp) > new Date(acc[interaction.agentId][interaction.platform].timestamp)) {
      acc[interaction.agentId][interaction.platform] = interaction
    }
    return acc
  }, {})
}

// Check if agent has been contacted on specific platform
export const hasInteracted = async (agentId, platform) => {
  const interactions = await getAgentInteractions(agentId)
  return interactions.some(i => i.platform === platform)
}

// Get last interaction date for agent on platform
export const getLastInteraction = async (agentId, platform) => {
  const interactions = await getAgentInteractions(agentId)
  const filtered = interactions.filter(i => i.platform === platform)
  return filtered.length > 0 ? filtered[0] : null
}

// Get interaction summary for agent
export const getAgentSummary = async (agentId) => {
  const interactions = await getAgentInteractions(agentId)
  const platforms = [...new Set(interactions.map(i => i.platform))]
  const lastContact = interactions.length > 0 ? interactions[0].timestamp : null
  const contactCount = interactions.length
  
  return {
    agentId,
    platforms,
    lastContact,
    contactCount,
    interactions
  }
}

// Delete interaction
export const deleteInteraction = async (interactionId) => {
  const db = await initDB()
  await db.delete(STORE_NAME, interactionId)
}

// Clear all interactions for agent
export const clearAgentInteractions = async (agentId) => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  const toDelete = all.filter(i => i.agentId === agentId)
  for (const interaction of toDelete) {
    await db.delete(STORE_NAME, interaction.id)
  }
}

// Get platform icon/color mapping
export const getPlatformStyle = (platform) => {
  const styles = {
    'facebook': { icon: '👤', color: 'bg-blue-600', label: 'Facebook' },
    'facebook-messenger': { icon: '💬', color: 'bg-blue-500', label: 'Messenger' },
    'instagram': { icon: '📷', color: 'bg-pink-500', label: 'Instagram' },
    'linkedin': { icon: '💼', color: 'bg-blue-700', label: 'LinkedIn' },
    'linkedin-message': { icon: '✉️', color: 'bg-blue-600', label: 'LinkedIn Msg' },
    'whatsapp': { icon: '💬', color: 'bg-green-500', label: 'WhatsApp' },
    'email': { icon: '✉️', color: 'bg-blue-500', label: 'Email' },
    'phone': { icon: '📞', color: 'bg-green-600', label: 'Phone' },
    'sms': { icon: '💬', color: 'bg-green-500', label: 'SMS' },
    'website': { icon: '🌐', color: 'bg-purple-500', label: 'Website' },
    'realtor-ca': { icon: '🏠', color: 'bg-red-600', label: 'Realtor.ca' },
    'ratemyagent': { icon: '⭐', color: 'bg-yellow-500', label: 'RateMyAgent' },
    'google-search': { icon: '🔍', color: 'bg-gray-600', label: 'Google' },
    'livabl': { icon: '🏡', color: 'bg-purple-600', label: 'LIVABL' },
    'twitter': { icon: '🐦', color: 'bg-blue-400', label: 'Twitter' },
    'youtube': { icon: '📺', color: 'bg-red-500', label: 'YouTube' },
    'tiktok': { icon: '🎵', color: 'bg-black', label: 'TikTok' },
    'wechat': { icon: '💬', color: 'bg-green-600', label: 'WeChat' }
  }
  return styles[platform] || { icon: '🔗', color: 'bg-gray-500', label: platform }
}

// Export interaction history to CSV
export const exportInteractions = async () => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  
  const headers = ['agentId', 'platform', 'timestamp', 'notes']
  const rows = all.map(i => [i.agentId, i.platform, i.timestamp, i.notes || ''])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Get stats
export const getTrackingStats = async () => {
  const db = await initDB()
  const all = await db.getAll(STORE_NAME)
  
  const uniqueAgents = [...new Set(all.map(i => i.agentId))].length
  const byPlatform = all.reduce((acc, i) => {
    acc[i.platform] = (acc[i.platform] || 0) + 1
    return acc
  }, {})
  
  return {
    totalInteractions: all.length,
    uniqueAgentsContacted: uniqueAgents,
    byPlatform
  }
}
