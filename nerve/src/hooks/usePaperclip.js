import { useState, useEffect, useCallback } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/paperclip'

export function usePaperclipCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/companies`)
      if (!res.ok) throw new Error('Failed to fetch companies')
      const data = await res.json()
      setCompanies(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return { companies, loading, error, refetch: fetchCompanies }
}

export function usePaperclipCompany(companyId) {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetchCompany() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/companies/${companyId}`)
        if (!res.ok) throw new Error('Failed to fetch company')
        const data = await res.json()
        if (!cancelled) setCompany(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCompany()
    return () => { cancelled = true }
  }, [companyId])

  return { company, loading, error }
}

export function usePaperclipCompanyAgents(companyId) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetchAgents() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/companies/${companyId}/agents`)
        if (!res.ok) throw new Error('Failed to fetch agents')
        const data = await res.json()
        if (!cancelled) setAgents(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAgents()
    return () => { cancelled = true }
  }, [companyId])

  return { agents, loading }
}

export function usePaperclipCompanyIssues(companyId) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetchIssues() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/companies/${companyId}/issues`)
        if (!res.ok) throw new Error('Failed to fetch issues')
        const data = await res.json()
        if (!cancelled) setIssues(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchIssues()
    return () => { cancelled = true }
  }, [companyId])

  return { issues, loading }
}

export function usePaperclipCompanyGoals(companyId) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetchGoals() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/companies/${companyId}/goals`)
        if (!res.ok) throw new Error('Failed to fetch goals')
        const data = await res.json()
        if (!cancelled) setGoals(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchGoals()
    return () => { cancelled = true }
  }, [companyId])

  return { goals, loading }
}

export function usePaperclipCompanyCosts(companyId) {
  const [costs, setCosts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    async function fetchCosts() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/companies/${companyId}/costs`)
        if (!res.ok) throw new Error('Failed to fetch costs')
        const data = await res.json()
        if (!cancelled) setCosts(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCosts()
    return () => { cancelled = true }
  }, [companyId])

  return { costs, loading }
}
