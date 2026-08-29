function Segmented({ value, options, onChange }) {
  return (
    <div className="flex rounded-lg bg-navy-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={[
            'flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
            value === opt.value ? 'bg-white text-navy-700 shadow-sm' : 'text-ink-400 hover:text-navy-500',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ThresholdSlider({ label, value, onChange, min, max, accent, hint }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-500">{label}</span>
        <span className="rounded-md px-2 py-0.5 font-mono text-xs font-bold tabular-nums" style={{ color: accent, backgroundColor: `${accent}1a` }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="thumb-navy w-full"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${((value - min) / (max - min)) * 100}%, #e4e8f1 ${((value - min) / (max - min)) * 100}%, #e4e8f1 100%)`,
        }}
      />
      {hint && <p className="mt-1 text-[11px] text-ink-400">{hint}</p>}
    </div>
  )
}

export default function ControlPanel({ telemetry }) {
  const { controlMode, setControlMode, thresholds, setThreshold, limits } = telemetry

  return (
    <section className="flex h-full flex-col justify-center gap-6 overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Control automático</h2>
      </div>

      <Segmented
        value={controlMode}
        onChange={setControlMode}
        options={[
          { value: 'AUTO', label: 'Automático' },
          { value: 'MANUAL', label: 'Manual' },
        ]}
      />

      <div className="space-y-5">
        <ThresholdSlider
          label="Arranque (nivel bajo)"
          value={thresholds.start}
          onChange={(v) => setThreshold('start', v)}
          min={limits.ll + 2}
          max={thresholds.stop - 5}
          accent="#324879"
          hint={`Arranca la bomba líder al bajar de ${thresholds.start}%`}
        />
        <ThresholdSlider
          label="Paro (nivel alto)"
          value={thresholds.stop}
          onChange={(v) => setThreshold('stop', v)}
          min={thresholds.start + 5}
          max={limits.hh - 2}
          accent="#0891a8"
          hint={`Detiene las bombas al llegar a ${thresholds.stop}%`}
        />
      </div>
    </section>
  )
}
