import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'

const TOKEN_KEY = 'puntaazul-session-v1'

export function useAuth() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setChecking(false)
      return
    }
    let cancelled = false
    setChecking(true)
    apiRequest('/api/auth/me', { token })
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => {
        if (cancelled) return
        window.localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setUser(null)
      })
      .finally(() => !cancelled && setChecking(false))
    return () => { cancelled = true }
  }, [token])

  const login = useCallback(async (username, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    window.localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) await apiRequest('/api/auth/logout', { method: 'POST', token })
    } finally {
      window.localStorage.removeItem(TOKEN_KEY)
      setToken('')
      setUser(null)
    }
  }, [token])

  return { token, user, checking, login, logout }
}
