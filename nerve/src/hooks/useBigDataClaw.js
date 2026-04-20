import { useState, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const useMission Control = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Property Research API
  const researchProperty = useCallback(async (propertyData) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData)
      })
      
      if (!response.ok) throw new Error('Research failed')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Get Hot Money Leads
  const getHotMoneyLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotmoney?limit=200`)
      if (!response.ok) throw new Error('Failed to fetch hot money leads')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Get Property Matches
  const getPropertyMatches = useCallback(async (propertyId) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/matches/${propertyId}`)
      if (!response.ok) throw new Error('Failed to fetch matches')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Get Buyer Database
  const getBuyers = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await fetch(`${API_BASE_URL}/api/buyers?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch buyers')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Export to Obsidian
  const exportToObsidian = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/obsidian/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Export failed')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Get Usage Stats
  const getUsageStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usage`)
      if (!response.ok) throw new Error('Failed to fetch usage')
      return await response.json()
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])
  
  return {
    loading,
    error,
    researchProperty,
    getHotMoneyLeads,
    getPropertyMatches,
    getBuyers,
    exportToObsidian,
    getUsageStats,
  }
}

export default useMission Control
