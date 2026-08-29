import { IconAlertTriangle, IconInfo, IconCheck } from '../icons.jsx'

const SEVERITY = {
  critical: { label: 'CRÍTICA', text: 'text-status-critical', bg: 'bg-status-criticalBg', icon: IconAlertTriangle },
  serious: { label: 'FALLA', text: 'text-status-serious', bg: 'bg-status-seriousBg', icon: IconAlertTriangle },
  warning: { label: 'AVISO', text: 'text-status-warning', bg: 'bg-status-warningBg', icon: IconInfo },
}

function timeAgo(ts, now) {
  const s = Math.max(1, Math.round((now - ts) / 1000))
  if (s < 60) return `hace ${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  return `hace ${h} h`
}

// Se deja vacío a propósito por ahora — sin alarmas simuladas en pantalla,
// hasta que definamos el set final. La lógica de telemetría sigue intacta
// para cuando se vuelva a conectar.
export default function AlarmsPanel({ telemetry: _telemetry }) {
  const alarms = []
  const activeAlarms = []
  const acknowledgeAlarm = () => {}
  const acknowledgeAll = () => {}
  const now = Date.now()

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Alarmas activas</h2>
          <p className="text-xs text-ink-400">{activeAlarms.length} sin reconocer</p>
        </div>
        {activeAlarms.length > 0 && (
          <button
            onClick={acknowledgeAll}
            className="rounded-lg border border-ink-100 px-2.5 py-1.5 text-xs font-semibold text-ink-500 hover:border-navy-300 hover:text-navy-600"
          >
            Reconocer todas
          </button>
        )}
      </div>

      <div className="scroll-thin -mx-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1">
        {alarms.length === 0 && <p className="py-8 text-center text-sm text-ink-300">Sin eventos registrados.</p>}
        {alarms.slice(0, 12).map((a) => {
          const cfg = SEVERITY[a.severity] ?? SEVERITY.warning
          const Icon = cfg.icon
          return (
            <div
              key={a.id}
              className={[
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-opacity animate-rise',
                a.acknowledged ? 'border-ink-100 opacity-55' : 'border-ink-100',
              ].join(' ')}
            >
              <div className={['mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', cfg.bg].join(' ')}>
                <Icon className={['h-3.5 w-3.5', cfg.text].join(' ')} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={['text-[10px] font-bold tracking-wide', cfg.text].join(' ')}>{cfg.label}</span>
                  <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-semibold text-navy-500">{a.tag}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-ink-900">{a.message}</p>
                <p className="text-[11px] text-ink-400">{timeAgo(a.time, now)}</p>
              </div>
              {!a.acknowledged && (
                <button
                  onClick={() => acknowledgeAlarm(a.id)}
                  title="Reconocer"
                  className="shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-status-goodBg hover:text-status-good"
                >
                  <IconCheck className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
