// Vertical bar gauge: an alternative, simpler read on the same tank level,
// with colored zones for the HH/LL safety limits and the operator-set
// arranque/paro thresholds — distinct from the cylindrical TankWidget.
export default function LevelBarWidget({ telemetry }) {
  const { level, thresholds, limits } = telemetry
  const clampPct = (v) => Math.max(0, Math.min(100, v))

  const markers = [
    { value: limits.hh, color: '#c22b2b', label: 'HH' },
    { value: thresholds.stop, color: '#0891a8', label: 'PARO' },
    { value: thresholds.start, color: '#324879', label: 'ARR' },
    { value: limits.ll, color: '#c22b2b', label: 'LL' },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-[220px] w-14 overflow-hidden rounded-full bg-navy-50 ring-1 ring-ink-100">
        <div className="absolute inset-x-0 top-0 bg-status-criticalBg" style={{ height: `${100 - limits.hh}%` }} />
        <div className="absolute inset-x-0 bg-status-warningBg" style={{ bottom: `${limits.ll}%`, height: `${limits.hh - limits.ll}%` }} />
        <div className="absolute inset-x-0 bottom-0 bg-status-criticalBg" style={{ height: `${limits.ll}%` }} />
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-full bg-gradient-to-t from-live-600 to-live-400 transition-all"
          style={{ height: `${clampPct(level)}%` }}
        />
        {markers.map((m) => (
          <div key={m.label} className="absolute inset-x-0 h-[2px]" style={{ bottom: `${clampPct(m.value)}%`, backgroundColor: m.color }} />
        ))}
      </div>
      <span className="font-mono text-lg font-bold tabular-nums text-navy-900">{level.toFixed(0)}%</span>
      <p className="text-center text-[10px] leading-relaxed text-ink-400">
        Arranque {thresholds.start}% · Paro {thresholds.stop}%
      </p>
    </div>
  )
}
