export default function ModeSelectWidget({ telemetry, config }) {
  const pumpId = config.pumpId ?? 'p1'
  const pump = telemetry.pumps[pumpId]

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-xs font-semibold text-ink-500">{pump.label} · Modo de operación</p>
      <div className="flex w-full rounded-lg bg-navy-50 p-1">
        {[
          { value: 'AUTO', label: 'Automático' },
          { value: 'MANUAL', label: 'Manual' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => telemetry.setPumpMode(pumpId, opt.value)}
            className={[
              'flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
              pump.mode === opt.value ? 'bg-white text-navy-700 shadow-sm' : 'text-ink-400 hover:text-navy-500',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
