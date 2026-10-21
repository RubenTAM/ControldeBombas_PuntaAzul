import { useEffect, useState } from 'react'

const CONFIRMATION_TIMEOUT_MS = 20_000
const CONFIRMATION_VISIBLE_MS = 5_000

const SETPOINT_META = {
  start: { hint: 'Bombas en AUTO arrancan al llegar aquí', min: 0, max: 100 },
  stop: { hint: 'Bombas en AUTO se detienen al llegar aquí', min: 0, max: 100 },
}

export default function SetpointWidget({ telemetry, config }) {
  const key = config?.key === 'stop' ? 'stop' : 'start'
  const meta = SETPOINT_META[key]
  const value = Number(telemetry.thresholds[key])
  const [draft, setDraft] = useState(Number.isFinite(value) ? String(value) : '')
  const [pending, setPending] = useState(null)
  const [result, setResult] = useState({ type: 'idle', message: '' })
  const [clock, setClock] = useState(Date.now())

  useEffect(() => {
    if (!pending && Number.isFinite(value)) setDraft(String(value))
  }, [value, pending])

  useEffect(() => {
    if (!pending) return undefined
    const interval = window.setInterval(() => setClock(Date.now()), 250)
    const timeout = window.setTimeout(() => {
      setPending((current) => {
        if (!current) return current
        setResult({ type: 'error', message: 'No se recibió confirmación en 20 segundos.' })
        return null
      })
    }, CONFIRMATION_TIMEOUT_MS)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [pending])

  useEffect(() => {
    if (!pending) return
    const isNewFeedback = Number(telemetry.setpointFeedbackAt) >= pending.sentAt
    const matches = Number.isFinite(value) && Math.abs(value - pending.expected) < 0.001
    if (isNewFeedback && matches) {
      setResult({ type: 'success', message: `Confirmado por el PLC: ${value}%` })
      setPending(null)
      setDraft(String(value))
    }
  }, [pending, telemetry.setpointFeedbackAt, value])

  useEffect(() => {
    if (result.type !== 'success') return undefined
    const timeout = window.setTimeout(() => {
      setResult({ type: 'idle', message: '' })
    }, CONFIRMATION_VISIBLE_MS)
    return () => window.clearTimeout(timeout)
  }, [result.type])

  const submit = async (event) => {
    event.preventDefault()
    const numeric = Number(draft)
    if (!Number.isFinite(numeric) || numeric < meta.min || numeric > meta.max) {
      setResult({ type: 'error', message: `Ingresa un valor entre ${meta.min}% y ${meta.max}%.` })
      return
    }
    const sentAt = Date.now()
    setClock(sentAt)
    setPending({ expected: numeric, sentAt, deadline: sentAt + CONFIRMATION_TIMEOUT_MS })
    setResult({ type: 'waiting', message: 'Enviando y esperando confirmación…' })
    try {
      await telemetry.setThreshold(key, numeric)
    } catch (error) {
      setPending(null)
      setResult({ type: 'error', message: error.message || 'No fue posible enviar el valor.' })
    }
  }

  const secondsLeft = pending ? Math.max(0, Math.ceil((pending.deadline - clock) / 1000)) : 0
  const statusClass = result.type === 'success'
    ? 'bg-status-goodBg text-status-good'
    : result.type === 'error'
      ? 'bg-status-criticalBg text-status-critical'
      : 'bg-navy-50 text-navy-500'

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-live-600">{config?.tankLabel}</p>
          <p className="text-xs font-semibold text-ink-500">{key === 'start' ? 'Arranque' : 'Paro'}</p>
        </div>
        <span className="rounded-lg bg-navy-50 px-2 py-1 font-mono text-sm font-bold tabular-nums text-navy-900">
          Actual: {Number.isFinite(value) ? `${value}%` : '—'}
        </span>
      </div>

      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <input
            type="number"
            min={meta.min}
            max={meta.max}
            step="0.1"
            inputMode="decimal"
            value={draft}
            disabled={Boolean(pending)}
            onChange={(event) => {
              setDraft(event.target.value)
              setResult({ type: 'idle', message: '' })
            }}
            className="h-10 w-full rounded-xl border border-ink-100 bg-white pl-3 pr-8 font-mono text-base font-bold text-navy-900 outline-none transition focus:border-live-400 focus:ring-2 focus:ring-live-100 disabled:bg-navy-50 disabled:text-ink-400"
            aria-label={`Nuevo valor de ${key === 'start' ? 'arranque' : 'paro'}`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-400">%</span>
        </label>
        <button
          type="submit"
          disabled={Boolean(pending)}
          className="h-10 shrink-0 rounded-xl bg-navy-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-navy-700 disabled:cursor-wait disabled:bg-navy-300"
        >
          {pending ? `${secondsLeft}s` : 'Enviar'}
        </button>
      </div>

      <div className="flex min-h-5 items-center justify-between gap-2">
        <p className="truncate text-[9px] text-ink-400">{meta.hint}</p>
        {result.message && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClass}`} title={result.message}>
            {result.type === 'waiting' ? `Confirmando · ${secondsLeft}s` : result.type === 'success' ? 'Confirmado' : 'Sin confirmar'}
          </span>
        )}
      </div>
    </form>
  )
}
