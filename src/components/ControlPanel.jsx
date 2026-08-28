import { IconCrown, IconRepeat } from '../icons.jsx'

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
  const {
    controlMode,
    setControlMode,
    thresholds,
    setThreshold,
    leadPump,
    setLeadPump,
    alternation,
    setAlternation,
    limits,
  } = telemetry

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
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

      <div className="h-px bg-ink-100" />

      <div>
        <p className="mb-2 text-xs font-semibold text-ink-500">Bomba líder</p>
        <div className="flex gap-2">
          {['p1', 'p2'].map((id) => (
            <button
              key={id}
              onClick={() => setLeadPump(id)}
              className={[
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition-colors',
                leadPump === id
                  ? 'border-navy-500 bg-navy-50 text-navy-700'
                  : 'border-ink-100 text-ink-400 hover:border-ink-200',
              ].join(' ')}
            >
              <IconCrown className="h-3.5 w-3.5" /> {id === 'p1' ? 'Bomba 1' : 'Bomba 2'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-navy-50/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <IconRepeat className="h-4 w-4 text-navy-500" />
          <div>
            <p className="text-xs font-bold text-ink-700">Alternancia</p>
            <p className="text-[11px] text-ink-400">Turna el arranque entre bombas</p>
          </div>
        </div>
        <button
          onClick={() => setAlternation(!alternation)}
          className={['relative h-6 w-11 rounded-full transition-colors', alternation ? 'bg-status-good' : 'bg-ink-200'].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              alternation ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </section>
  )
}
