import { useMemo, useState } from 'react'
import {
  IconBroker,
  IconCheck,
  IconInfo,
  IconLock,
  IconRefresh,
  IconTrash,
  IconWifi,
} from '../icons.jsx'
import { brokerUrl, createClientId } from '../hooks/useBrokerConnections.js'

const EMPTY_FORM = {
  id: null,
  name: '',
  host: 'broker.hivemq.com',
  port: 8884,
  path: '/mqtt',
  tls: true,
  clientId: createClientId(),
  username: '',
  password: '',
}

const inputClass = 'h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-live-400 focus:ring-2 focus:ring-live-100 disabled:bg-navy-50 disabled:text-ink-400'

export default function BrokerPage({ broker }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const isConnecting = broker.status === 'connecting'
  const isConnected = broker.status === 'connected'
  const endpoint = useMemo(() => {
    try {
      return brokerUrl(form)
    } catch {
      return ''
    }
  }, [form])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const normalizeHost = () => {
    if (!/^wss?:\/\//i.test(form.host.trim())) return
    try {
      const url = new URL(form.host.trim())
      setForm((current) => ({
        ...current,
        host: url.hostname,
        tls: url.protocol === 'wss:',
        port: Number(url.port) || (url.protocol === 'wss:' ? 443 : 80),
        path: url.pathname && url.pathname !== '/' ? url.pathname : current.path,
      }))
    } catch {
      setFormError('La URL WebSocket no es válida.')
    }
  }

  const toggleTls = () => {
    setForm((current) => {
      const nextTls = !current.tls
      const portPairs = { 8083: 8084, 8084: 8083, 8000: 8884, 8884: 8000 }
      return { ...current, tls: nextTls, port: portPairs[current.port] || current.port }
    })
  }

  const loadConnection = (connection) => {
    setForm({ ...connection, password: '' })
    setFormError('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.host.trim() || !form.clientId.trim()) {
      setFormError('Completa el nombre, host y Client ID.')
      return
    }
    const port = Number(form.port)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setFormError('El puerto debe estar entre 1 y 65535.')
      return
    }
    if (/^mqtts?:\/\//i.test(form.host)) {
      setFormError('Esta app web necesita un endpoint WebSocket. Usa sólo la IP/dominio o una URL ws:// o wss://.')
      return
    }
    setFormError('')
    broker.connect({ ...form, port })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-5 flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-live-600">Integraciones</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">Broker MQTT</h2>
          <p className="mt-1 text-sm text-ink-400">Guarda y comprueba las conexiones que alimentarán la telemetría.</p>
        </div>
        <StatusBadge status={broker.status} message={broker.statusMessage} />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-auto xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-[240px] flex-col rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
          <div className="flex items-center justify-between px-2 py-2">
            <div>
              <p className="text-sm font-bold text-ink-900">Conexiones</p>
              <p className="mt-0.5 text-[11px] text-ink-400">{broker.connections.length} guardadas</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY_FORM, clientId: createClientId() })}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-live-500 text-xl text-white transition hover:bg-live-600"
              title="Nueva conexión"
              aria-label="Nueva conexión"
            >
              +
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            {broker.connections.length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-200 px-4 py-8 text-center">
                <IconBroker className="mx-auto h-6 w-6 text-ink-300" />
                <p className="mt-2 text-xs font-semibold text-ink-500">Aún no hay brokers guardados</p>
              </div>
            )}
            {broker.connections.map((connection) => {
              const active = broker.activeConnection?.id === connection.id
              return (
                <div
                  key={connection.id}
                  className={[
                    'group flex items-center gap-2 rounded-xl border p-2 transition',
                    active ? 'border-live-400 bg-live-100/60' : 'border-transparent hover:border-ink-100 hover:bg-navy-50',
                  ].join(' ')}
                >
                  <button type="button" onClick={() => loadConnection(connection)} className="min-w-0 flex-1 px-1 text-left">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <span className={['h-2 w-2 rounded-full', active ? 'bg-status-good' : 'bg-ink-200'].join(' ')} />
                      <span className="truncate">{connection.name}</span>
                    </span>
                    <span className="mt-1 block truncate pl-4 text-[11px] text-ink-400">{connection.host}:{connection.port}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => broker.removeConnection(connection.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 opacity-0 transition hover:bg-status-criticalBg hover:text-status-critical group-hover:opacity-100 focus:opacity-100"
                    title={`Eliminar ${connection.name}`}
                    aria-label={`Eliminar ${connection.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        <form onSubmit={submit} className="rounded-2xl border border-ink-100 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-7">
            <div>
              <p className="text-sm font-bold text-ink-900">{form.id ? 'Editar conexión' : 'Nueva conexión'}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-400">{endpoint}</p>
            </div>
            <button
              type={isConnected ? 'button' : 'submit'}
              onClick={isConnected ? broker.disconnect : undefined}
              disabled={isConnecting}
              className={[
                'flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-wait',
                isConnected ? 'bg-navy-600 hover:bg-navy-700' : 'bg-live-500 hover:bg-live-600 disabled:bg-live-400',
              ].join(' ')}
            >
              {isConnecting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isConnecting ? 'Conectando…' : isConnected ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          <fieldset disabled={isConnecting || isConnected} className="space-y-6 p-5 sm:p-7">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-500"><IconBroker className="h-4 w-4" /></div>
                <div><h3 className="text-sm font-bold text-ink-900">General</h3><p className="text-xs text-ink-400">Identifica y localiza el broker</p></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Nombre" required hint="Cómo aparecerá guardada esta conexión">
                  <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Planta Punta Azul" autoComplete="off" />
                </Field>
                <Field label="Host" required hint="IP o dominio; no necesita protocolo">
                  <input className={inputClass} value={form.host} onChange={(e) => update('host', e.target.value)} onBlur={normalizeHost} placeholder="192.168.1.50 o broker.hivemq.com" spellCheck="false" autoComplete="off" />
                </Field>
                <Field label="Puerto" required hint="Debe ser el puerto WebSocket del broker">
                  <input className={inputClass} type="number" min="1" max="65535" value={form.port} onChange={(e) => update('port', e.target.value)} />
                </Field>
                <Field label="Ruta WebSocket" hint="La mayoría de brokers usan /mqtt">
                  <input className={inputClass} value={form.path} onChange={(e) => update('path', e.target.value)} placeholder="/mqtt" spellCheck="false" />
                </Field>
              </div>
            </section>

            <div className="h-px bg-ink-100" />

            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-500"><IconLock className="h-4 w-4" /></div>
                <div><h3 className="text-sm font-bold text-ink-900">Cliente y seguridad</h3><p className="text-xs text-ink-400">Credenciales enviadas durante el CONNECT</p></div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Client ID" required hint="Debe ser único para no expulsar a otro cliente">
                  <div className="flex gap-2">
                    <input className={inputClass} value={form.clientId} onChange={(e) => update('clientId', e.target.value)} spellCheck="false" autoComplete="off" />
                    <button type="button" onClick={() => update('clientId', createClientId())} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-100 bg-white text-navy-500 hover:bg-navy-50" title="Generar otro Client ID" aria-label="Generar otro Client ID"><IconRefresh className="h-4 w-4" /></button>
                  </div>
                </Field>
                <div className="flex items-end">
                  <button type="button" role="switch" aria-checked={form.tls} onClick={toggleTls} className="flex h-11 w-full items-center justify-between rounded-xl border border-ink-100 px-3.5 text-left">
                    <span><span className="block text-sm font-semibold text-ink-700">SSL/TLS</span><span className="text-[11px] text-ink-400">{form.tls ? 'Seguro · wss://' : 'Sin cifrado · ws://'}</span></span>
                    <span className={['relative h-6 w-11 rounded-full transition', form.tls ? 'bg-live-500' : 'bg-ink-200'].join(' ')}><span className={['absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition', form.tls ? 'left-6' : 'left-1'].join(' ')} /></span>
                  </button>
                </div>
                <Field label="Usuario" hint="Opcional">
                  <input className={inputClass} value={form.username} onChange={(e) => update('username', e.target.value)} autoComplete="username" />
                </Field>
                <Field label="Contraseña" hint="Opcional · no se guarda en el navegador">
                  <input className={inputClass} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete="current-password" />
                </Field>
              </div>
            </section>

            {(formError || broker.status === 'error') && (
              <div className="flex items-start gap-2 rounded-xl bg-status-criticalBg px-4 py-3 text-sm text-status-critical">
                <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError || broker.statusMessage}</span>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl bg-navy-50 px-4 py-3 text-xs leading-5 text-ink-500">
              <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
              <span>Desde un navegador sólo se puede usar MQTT sobre WebSocket. Los puertos TCP 1883 y 8883 no funcionarán aquí, a menos que el broker también los configure como WebSocket.</span>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-xs font-bold text-ink-500">
        <span>{required && <span className="mr-1 text-status-critical">*</span>}{label}</span>
        {hint && <span className="text-right text-[10px] font-normal text-ink-300">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function StatusBadge({ status, message }) {
  const styles = {
    connected: 'bg-status-goodBg text-status-good',
    connecting: 'bg-live-100 text-live-600',
    error: 'bg-status-criticalBg text-status-critical',
    disconnected: 'bg-navy-100 text-navy-500',
  }
  return (
    <div className={['flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold', styles[status]].join(' ')} title={message}>
      {status === 'connecting' ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" /> : status === 'connected' ? <IconCheck className="h-3.5 w-3.5" /> : <IconWifi className="h-3.5 w-3.5" />}
      {message}
    </div>
  )
}
