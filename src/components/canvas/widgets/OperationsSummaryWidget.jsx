function Metric({ label, value, detail, tone = 'navy', dot }) {
  const tones = {
    navy: 'bg-navy-50 text-navy-700',
    live: 'bg-live-100 text-live-600',
    good: 'bg-status-goodBg text-status-good',
    warning: 'bg-status-warningBg text-status-warning',
    critical: 'bg-status-criticalBg text-status-critical',
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <span className="relative h-2.5 w-2.5 rounded-full bg-current">
          {dot && <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-35" />}
        </span>
      </span>
      <div className="min-w-0">
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
        <p className="truncate font-mono text-lg font-bold tabular-nums text-navy-900">{value}</p>
        <p className="truncate text-[10px] text-ink-400">{detail}</p>
      </div>
    </div>
  )
}

export default function OperationsSummaryWidget({ telemetry }) {
  const pumps = Object.values(telemetry.pumps)
  const running = pumps.filter((p) => p.running).length
  const faults = pumps.filter((p) => p.fault).length
  const alarms = telemetry.activeAlarms.length
  const levelTone = telemetry.level >= telemetry.limits.hh || telemetry.level <= telemetry.limits.ll ? 'critical' : 'live'

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-live-600">Punta Azul · Telemetría</p>
          <h3 className="text-sm font-bold text-navy-900">Resumen operativo</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${telemetry.connected ? 'bg-status-goodBg text-status-good' : 'bg-status-criticalBg text-status-critical'}`}>
          {telemetry.connected ? 'Sistema en línea' : 'Sin comunicación'}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
        <Metric label="Nivel actual" value={`${telemetry.level.toFixed(1)}%`} detail={`${telemetry.volume.toFixed(1)} / ${telemetry.capacity} m³`} tone={levelTone} dot />
        <Metric label="Bombas activas" value={`${running} / ${pumps.length}`} detail={faults ? `${faults} con falla` : 'Equipos disponibles'} tone={faults ? 'critical' : running ? 'good' : 'navy'} dot={running > 0} />
        <Metric label="Alarmas activas" value={String(alarms)} detail={alarms ? 'Requieren revisión' : 'Sin eventos pendientes'} tone={alarms ? 'warning' : 'good'} />
        <Metric label="Control" value={`${telemetry.thresholds.start}–${telemetry.thresholds.stop}%`} detail="Ventana de operación" tone="navy" />
      </div>
    </section>
  )
}
