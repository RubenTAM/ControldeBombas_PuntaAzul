export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 204) return null
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `Error ${response.status}`)
  return body
}
