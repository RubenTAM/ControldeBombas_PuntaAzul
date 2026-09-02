import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'puntaazul-broker-connections-v1'
const CONNECTION_TIMEOUT = 15_000

function loadConnections() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function createClientId() {
  const random = globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 10)
    || Math.random().toString(16).slice(2, 12)
  return `puntaazul_${random}`
}

export function brokerUrl(config) {
  const protocol = config.tls ? 'wss' : 'ws'
  const host = config.host.trim().replace(/^wss?:\/\//i, '').replace(/\/+$/, '')
  const formattedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
  const path = `/${(config.path || 'mqtt').replace(/^\/+/, '')}`
  return `${protocol}://${formattedHost}:${config.port}${path}`
}

export function useBrokerConnections() {
  const [connections, setConnections] = useState(loadConnections)
  const [status, setStatus] = useState('disconnected')
  const [statusMessage, setStatusMessage] = useState('Sin conexión activa')
  const [activeConnection, setActiveConnection] = useState(null)
  const clientRef = useRef(null)
  const attemptRef = useRef(0)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  }, [connections])

  useEffect(() => () => clientRef.current?.end(true), [])

  const disconnect = useCallback(() => {
    attemptRef.current += 1
    clientRef.current?.end(true)
    clientRef.current = null
    setStatus('disconnected')
    setStatusMessage('Conexión cerrada')
    setActiveConnection(null)
  }, [])

  const removeConnection = useCallback((id) => {
    setConnections((current) => current.filter((connection) => connection.id !== id))
  }, [])

  const connect = useCallback(async (config) => {
    const attempt = ++attemptRef.current
    clientRef.current?.end(true)
    setStatus('connecting')
    setStatusMessage('Esperando confirmación del broker…')

    let mqtt
    try {
      mqtt = (await import('mqtt')).default
    } catch {
      if (attemptRef.current !== attempt) return
      setStatus('error')
      setStatusMessage('No se pudo cargar el cliente MQTT.')
      return
    }
    if (attemptRef.current !== attempt) return

    const url = brokerUrl(config)
    const client = mqtt.connect(url, {
      clientId: config.clientId,
      username: config.username || undefined,
      password: config.password || undefined,
      clean: true,
      protocolVersion: 4,
      reconnectPeriod: 0,
      connectTimeout: CONNECTION_TIMEOUT,
      keepalive: 30,
    })
    clientRef.current = client

    const timeout = window.setTimeout(() => {
      if (attemptRef.current !== attempt) return
      client.end(true)
      clientRef.current = null
      setStatus('error')
      setStatusMessage('El broker no confirmó la conexión en 15 segundos.')
    }, CONNECTION_TIMEOUT)

    client.once('connect', (connack) => {
      if (attemptRef.current !== attempt) return
      window.clearTimeout(timeout)
      const saved = {
        id: config.id || globalThis.crypto?.randomUUID?.() || `broker-${Date.now()}`,
        name: config.name.trim(),
        host: config.host.trim(),
        port: Number(config.port),
        path: config.path || '/mqtt',
        tls: Boolean(config.tls),
        clientId: config.clientId,
        username: config.username || '',
        connectedAt: new Date().toISOString(),
      }
      setConnections((current) => [...current.filter((item) => item.id !== saved.id), saved])
      setActiveConnection(saved)
      setStatus('connected')
      setStatusMessage(connack.sessionPresent ? 'Conectado · sesión recuperada' : 'Conectado · sesión nueva')
    })

    client.once('error', (error) => {
      if (attemptRef.current !== attempt) return
      window.clearTimeout(timeout)
      client.end(true)
      clientRef.current = null
      setStatus('error')
      setStatusMessage(error?.message || 'El broker rechazó la conexión.')
    })

    client.on('close', () => {
      if (attemptRef.current !== attempt || clientRef.current !== client) return
      window.clearTimeout(timeout)
      clientRef.current = null
      setStatus((current) => {
        if (current === 'connecting' || current === 'error') return current
        setStatusMessage('El broker cerró la conexión')
        setActiveConnection(null)
        return 'disconnected'
      })
    })
  }, [])

  return {
    connections,
    status,
    statusMessage,
    activeConnection,
    connect,
    disconnect,
    removeConnection,
  }
}
