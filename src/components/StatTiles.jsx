import { IconDroplet, IconTank, IconArrowUpRight, IconArrowDownRight } from '../icons.jsx'

function Tile({ label, value, unit, icon: Icon, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}14` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="font-mono text-lg font-bold tabular-nums text-ink-900">
          {value}
          {unit && <span className="ml-1 text-xs font-semibold text-ink-400">{unit}</span>}
        </p>
      </div>
    </div>
  )
}

export default function StatTiles({ telemetry }) {
  const { level, volume, capacity, thresholds } = telemetry
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Tile label="Nivel actual" value={level.toFixed(0)} unit="%" icon={IconDroplet} accent="#0fb3cc" />
      <Tile label="Volumen actual" value={volume.toFixed(1)} unit={`/ ${capacity} m³`} icon={IconTank} accent="#324879" />
      <Tile label="Nivel de arranque" value={thresholds.start} unit="%" icon={IconArrowUpRight} accent="#0ca30c" />
      <Tile label="Nivel de paro" value={thresholds.stop} unit="%" icon={IconArrowDownRight} accent="#c47f00" />
    </div>
  )
}
