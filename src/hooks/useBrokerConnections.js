import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../lib/api.js'

export function useBrokerConnections(token = '') {
  const [status, setStatus] = useState('connecting')
  const [statusMessage, setStatusMessage] = useState('Conectando al broker…')
  const [topicValues, setTopicValues] = useState({})
  const [topicHistory, setTopicHistory] = useState({})
  const previousRef = useRef({})

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
            next[topic] = [...(next[topic] || []), { t: sample.receivedAt, level: numeric }].slice(-500)
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
