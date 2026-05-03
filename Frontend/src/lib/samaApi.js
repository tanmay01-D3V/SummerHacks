const API_BASE = import.meta.env.VITE_SAMA_API_URL || 'http://localhost:4000/api'
const STORAGE_KEY = 'sama.auth.session'
const AUTH_EVENT = 'sama-auth-changed'

const notifyAuthChange = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_EVENT))
}

const request = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`)
  }

  return data
}

export const getStoredAuthSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const setStoredAuthSession = (session) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notifyAuthChange()
}

export const clearStoredAuthSession = () => {
  localStorage.removeItem(STORAGE_KEY)
  notifyAuthChange()
}

export const registerUser = (payload) => request('/auth/register', { method: 'POST', body: payload })

export const loginUser = (payload) => request('/auth/login', { method: 'POST', body: payload })

export const fetchCurrentUser = (token) => request('/auth/me', { token })

export const updateCurrentUser = (token, payload) =>
  request('/auth/me', { method: 'PATCH', token, body: payload })

export const fetchRecords = (token, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  return request(`/records${params.toString() ? `?${params.toString()}` : ''}`, { token })
}

export const fetchHomeSummary = (token) => request('/home/summary', { token })

export const fetchCorrelationAnalytics = (token) => request('/analytics/correlation', { token })

export const fetchProactiveAlert = (token) => request('/predictions/proactive-alert', { token })

export const createRecord = (token, payload) =>
  request('/records', { method: 'POST', token, body: payload })

export const updateRecord = (token, recordId, payload) =>
  request(`/records/${recordId}`, { method: 'PATCH', token, body: payload })

export const deleteRecord = (token, recordId) =>
  request(`/records/${recordId}`, { method: 'DELETE', token })

export const fetchChatHistory = (token) => request('/chat', { token })

export const createChatMessage = (token, payload) =>
  request('/chat', { method: 'POST', token, body: payload })
