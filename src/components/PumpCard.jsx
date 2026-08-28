import { IconPump, IconCrown, IconAlertTriangle } from '../icons.jsx'

export default function PumpCard({ pump, isLead, controlMode, onToggle, side = 'left' }) {
  const running = pump.running
  return (
    <div
      className={[
        'relative flex w-[168px] flex-col items-center gap-3 rounded-2xl border bg-white px-4 py-4 shadow-card transition-all',
        running ? 'border-live-400/40' : 'border-ink-100',
      ].join(' ')}
    >
      {isLead && (
        <span className="absolute -top-2.5 flex items-center gap-1 rounded-full bg-navy-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          <IconCrown className="h-2.5 w-2.5" /> Líder
        </span>
      )}

      <div className="relative flex h-14 w-14 items-center justify-center">
        {running && (
          <span className="absolute inset-0 rounded-full bg-live-400/40 animate-pulseRing" />
        )}
        <div
          className={[
            'relative flex h-14 w-14 items-center justify-center rounded-full ring-1 transition-colors',
            pump.fault
              ? 'bg-status-criticalBg ring-status-critical/30'
              : running
              ? 'bg-live-500 ring-live-400/40'
              : 'bg-navy-50 ring-ink-100',
          ].join(' ')}
        >
          <IconPump className={['h-6 w-6', pump.fault ? 'text-status-critical' : running ? 'text-white' : 'text-ink-300'].join(' ')} />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-ink-900">{pump.label}</p>
        <p
          className={[
            'mt-0.5 text-xs font-bold tracking-wide',
            pump.fault ? 'text-status-critical' : running ? 'text-status-good' : 'text-ink-400',
          ].join(' ')}
        >
          {pump.fault ? 'FALLA' : running ? 'EN MARCHA' : 'DETENIDA'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy-500">
        {controlMode}
      </div>

      <div className="w-full rounded-lg bg-navy-50/60 px-3 py-2 text-center">
        <p className="font-mono text-base font-bold tabular-nums text-navy-700">{pump.hours.toFixed(1)}h</p>
        <p className="text-[10px] text-ink-400">Horas de operación</p>
      </div>

      {controlMode === 'MANUAL' && (
        <button
          onClick={() => onToggle(pump.id, !running)}
          className={[
            'w-full rounded-lg py-1.5 text-xs font-bold transition-colors',
            running ? 'bg-status-criticalBg text-status-critical hover:bg-status-critical/20' : 'bg-status-goodBg text-status-good hover:bg-status-good/20',
          ].join(' ')}
        >
          {running ? 'Detener' : 'Arrancar'}
        </button>
      )}

      {pump.fault && (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-status-critical">
          <IconAlertTriangle className="h-3 w-3" /> Requiere atención
        </div>
      )}
    </div>
  )
}
