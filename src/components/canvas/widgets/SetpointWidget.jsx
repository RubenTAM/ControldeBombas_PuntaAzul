// Editable setpoint control for the tank's start/stop thresholds — "nivel
// bajo (arranque)" is `thresholds.start` (any pump in AUTO turns ON when
// the level drops to it), "nivel alto (paro)" is `thresholds.stop` (any
// pump in AUTO turns OFF at it). Both already exist on useTelemetry as a
// single {start, stop} pair — this just gives each one its own placeable
// card, same pattern as ModeSelectWidget picking a pump via config.
const SETPOINT_META = {
  start: {
    label: 'Nivel bajo · Arranque',
    hint: 'Bombas en AUTO arrancan al llegar aquí',
    min: 5,
    max: 70,
  },
  stop: {
    label: 'Nivel alto · Paro',
    hint: 'Bombas en AUTO se detienen al llegar aquí',
    min: 30,
    max: 98,
  },
}

export default function SetpointWidget({ telemetry, config, editMode, onConfigChange }) {
  const key = config?.key === 'stop' ? 'stop' : 'start'
  const meta = SETPOINT_META[key]
  const value = telemetry.thresholds[key]

  return (
    <div className="flex w-full flex-col gap-2.5">
      {editMode && (
        <select
          value={key}
          onChange={(e) => onConfigChange({ key: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full rounded-lg border border-ink-100 bg-navy-50/60 px-2 py-1.5 text-xs font-semibold text-ink-500"
        >
          <option value="start">Nivel bajo (arranque)</option>
          <option value="stop">Nivel alto (paro)</option>
        </select>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink-500">{meta.label}</p>
        <span className="font-mono text-lg font-bold tabular-nums text-navy-900">{value}%</span>
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        value={value}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => telemetry.setThreshold(key, Number(e.target.value))}
        className="w-full accent-navy-600"
      />
      <p className="text-[10px] leading-snug text-ink-400">{meta.hint}</p>
    </div>
  )
}
