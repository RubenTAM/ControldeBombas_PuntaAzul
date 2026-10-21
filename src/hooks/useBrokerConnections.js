import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api.js'

const STORED_LEVELS = {
  PATanque_Real_1: 'tanque-superior',
  PACarcamo_Real_5: 'tanque-carcamo',
}

export function useBrokerConnections(token = '') {
  const [status, setStatus] = useState('connecting')
  const [statusMessage, setStatusMessage] = useState('Conectando al broker…')
  const [topicValues, setTopicValues] = useState({})
  const [topicHistory, setTopicHistory] = useState({})
  const previousRef = useRef({})

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    Promise.all(Object.entries(STORED_LEVELS).map(async ([topic, zona]) => {
      const rows = await apiRequest(`/api/historicos?zona=${encodeURIComponent(zona)}&range=7d`, { token })
      return [topic, rows.map((row) => ({ t: new Date(row.ts).getTime(), level: Number(row.nivel_pct) }))]
    })).then((entries) => {
      if (cancelled) return
      setTopicHistory((current) => {
        const next = { ...current }
        entries.forEach(([topic, stored]) => {
          const merged = [...stored, ...(current[topic] || [])]
          const unique = [...new Map(merged.map((sample) => [sample.t, sample])).values()]
          next[topic] = unique.sort((a, b) => a.t - b.t).slice(-10_080)
        })
        return next
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    const refresh = async () => {
      try {
        const data = await apiRequest('/api/telemetry', { token })
        if (cancelled) return
        setStatus(data.broker?.status || 'disconnected')
        setStatusMessage(data.broker?.message || 'Sin conexión')
        const values = data.values || {}
        setTopicValues(values)
        setTopicHistory((current) => {
          const next = { ...current }
          Object.entries(values).forEach(([topic, sample]) => {
            if (previousRef.current[topic]?.receivedAt === sample.receivedAt) return
            const numeric = Number(sample.value)
            if (!Number.isFinite(numeric)) return
            next[topic] = [...(next[topic] || []), { t: sample.receivedAt, level: numeric }].slice(-10_080)
          })
          return next
        })
        previousRef.current = values
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          setStatusMessage(error.message)
        }
      }
    }
    refresh()
    const interval = window.setInterval(refresh, 1000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [token])

  const setSubscriptions = useCallback(() => {}, [])

  const publish = useCallback(async (topic, value) => {
    const cleanTopic = topic?.trim()
    if (!cleanTopic || !token) return false
    await apiRequest('/api/telemetry/write', {
      method: 'POST', token, body: JSON.stringify({ topic: cleanTopic, value }),
    })
    return true
  }, [token])

  return {
    status,
    statusMessage,
    setSubscriptions,
    publish,
    topicValues,
    topicHistory,
  }
}
