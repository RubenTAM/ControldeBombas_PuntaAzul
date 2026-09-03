import { useId, useMemo, useRef, useState } from 'react'

const RANGES = [
  { key: '6h', label: '6 h' },
  { key: '24h', label: '24 h' },
  { key: '7d', label: '7 días' },
]

const VB_W = 820
const VB_H = 250
const PAD_L = 48
const PAD_R = 18
const PAD_T = 16
const PAD_B = 34
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B

function buildWeekSeries(endTime) {
  const points = 84
  const spanMs = 7 * 24 * 3_600_000
  return Array.from({ length: points }, (_, i) => {
    const t = endTime - spanMs + (i / (points - 1)) * spanMs
    const hourFraction = ((t / 3_600_000) % 24) / 24
    const level = Math.max(18, Math.min(92, 66 + Math.sin((hourFraction - 0.15) * Math.PI * 2) * 15 + Math.sin(i * 0.35) * 4))
    return { t, level: Math.round(level * 10) / 10 }
  })
}

export default function LevelHistoryChart({ telemetry, config, editMode, onConfigChange }) {
  const { history, thresholds, limits, now, level } = telemetry
  const eyebrow = config?.eyebrow ?? 'Tendencia de proceso'
  const title = config?.title ?? 'Histórico de nivel'
  const subtitle = config?.subtitle ?? 'Tanque principal · evolución, límites y ventana de control'
  const [range, setRange] = useState('24h')
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)
  const uid = useId().replace(/:/g, '')
  const fillId = `levelFill-${uid}`
  const strokeId = `levelStroke-${uid}`
  const weekSeries = useMemo(() => buildWeekSeries(now), []) // eslint-disable-line react-hooks/exhaustive-deps

  const data = useMemo(() => {
    if (range === '7d') return weekSeries
    if (range === '6h') {
      const live = history.filter((p) => p.t >= now - 6 * 3_600_000)
      return live.length >= 2 ? live : history.slice(-36)
    }
    return history
  }, [range, history, weekSeries, now])

  const chart = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', points: [], minT: 0, maxT: 1 }
    const minT = data[0].t
    const maxT = data[data.length - 1].t
    const xFor = (t) => PAD_L + ((t - minT) / (maxT - minT || 1)) * PLOT_W
    const yFor = (value) => PAD_T + (1 - value / 100) * PLOT_H
    const points = data.map((d) => ({ ...d, x: xFor(d.t), y: yFor(d.level) }))
    const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const areaPath = `${linePath} L${points.at(-1).x.toFixed(1)},${PAD_T + PLOT_H} L${points[0].x.toFixed(1)},${PAD_T + PLOT_H} Z`
    return { linePath, areaPath, points, minT, maxT }
  }, [data])

  const yFor = (value) => PAD_T + (1 - value / 100) * PLOT_H
  const hover = hoverIdx !== null ? chart.points[hoverIdx] : null
  const fmtTime = (t, axis = false) => new Date(t).toLocaleString('es-MX', {
    day: range === '7d' ? '2-digit' : undefined,
    month: range === '7d' ? 'short' : undefined,
    hour: '2-digit',
    minute: axis && range === '7d' ? undefined : '2-digit',
  })

  const handleMove = (e) => {
    if (!chart.points.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VB_W
    let nearest = 0
    let best = Infinity
    chart.points.forEach((point, i) => {
      const distance = Math.abs(point.x - relX)
      if (distance < best) {
        best = distance
        nearest = i
      }
    })
    setHoverIdx(nearest)
  }

  const status = level >= limits.hh ? ['Nivel alto-alto', 'critical'] : level <= limits.ll ? ['Nivel bajo-bajo', 'critical'] : level >= thresholds.stop ? ['Nivel de paro alcanzado', 'warning'] : level <= thresholds.start ? ['Nivel de arranque', 'warning'] : ['Nivel en rango estable', 'good']
  const statusClass = status[1] === 'critical' ? 'bg-status-criticalBg text-status-critical' : status[1] === 'warning' ? 'bg-status-warningBg text-status-warning' : 'bg-status-goodBg text-status-good'

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0" onMouseDown={editMode ? (e) => e.stopPropagation() : undefined}>
          {editMode ? (
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={eyebrow}
                  onChange={(e) => onConfigChange({ eyebrow: e.target.value })}
                  className="w-40 border-0 bg-transparent p-0 text-[9px] font-bold uppercase tracking-[0.18em] text-live-600 outline-none"
                  aria-label="Etiqueta"
                />
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClass}`}>{status[0]}</span>
              </div>
              <input
                value={title}
                onChange={(e) => onConfigChange({ title: e.target.value })}
                className="mt-0.5 w-full border-0 bg-transparent p-0 text-lg font-bold text-navy-900 outline-none"
                aria-label="Título"
              />
              <input
                value={subtitle}
                onChange={(e) => onConfigChange({ subtitle: e.target.value })}
                className="w-full border-0 bg-transparent p-0 text-[11px] text-ink-400 outline-none"
                aria-label="Subtítulo"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-live-600">{eyebrow}</p>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClass}`}>{status[0]}</span>
              </div>
              <h2 className="mt-0.5 text-lg font-bold text-navy-900">{title}</h2>
              <p className="text-[11px] text-ink-400">{subtitle}</p>
            </>
          )}
        </div>
        <div className="flex shrink-0 rounded-xl bg-navy-50 p-1">
          {RANGES.map((item) => (
            <button key={item.key} onClick={() => setRange(item.key)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors ${range === item.key ? 'bg-white text-navy-700 shadow-sm' : 'text-ink-400 hover:text-navy-600'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 rounded-xl border border-ink-100 bg-gradient-to-b from-white to-navy-50/35 p-1">
        <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-full w-full touch-none" preserveAspectRatio="xMidYMid meet" onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0fb3cc" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#2a78d6" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id={strokeId} x1={PAD_L} y1="0" x2={VB_W - PAD_R} y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2a78d6" />
              <stop offset="100%" stopColor="#0fb3cc" />
            </linearGradient>
          </defs>

          <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={yFor(limits.hh) - PAD_T} fill="#fbe2e2" opacity="0.55" />
          <rect x={PAD_L} y={yFor(thresholds.stop)} width={PLOT_W} height={yFor(thresholds.start) - yFor(thresholds.stop)} fill="#e7f7e6" opacity="0.38" />
          <rect x={PAD_L} y={yFor(limits.ll)} width={PLOT_W} height={PAD_T + PLOT_H - yFor(limits.ll)} fill="#fbe2e2" opacity="0.55" />

          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line x1={PAD_L} x2={VB_W - PAD_R} y1={yFor(tick)} y2={yFor(tick)} stroke="#dfe4ef" strokeWidth="1" />
              <text x={PAD_L - 9} y={yFor(tick) + 3} textAnchor="end" className="fill-ink-300 font-mono text-[9px]">{tick}%</text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const x = PAD_L + PLOT_W * fraction
            const t = chart.minT + (chart.maxT - chart.minT) * fraction
            return (
              <g key={fraction}>
                <line x1={x} x2={x} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="#eef1f6" strokeWidth="1" />
                <text x={x} y={VB_H - 10} textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'} className="fill-ink-300 text-[9px]">{fmtTime(t, true)}</text>
              </g>
            )
          })}

          <line x1={PAD_L} x2={VB_W - PAD_R} y1={yFor(thresholds.stop)} y2={yFor(thresholds.stop)} stroke="#0891a8" strokeDasharray="5 4" strokeWidth="1.3" />
          <line x1={PAD_L} x2={VB_W - PAD_R} y1={yFor(thresholds.start)} y2={yFor(thresholds.start)} stroke="#324879" strokeDasharray="5 4" strokeWidth="1.3" />
          {chart.areaPath && <path d={chart.areaPath} fill={`url(#${fillId})`} />}
          {chart.linePath && <path d={chart.linePath} fill="none" stroke={`url(#${strokeId})`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}

          {hover && (
            <g>
              <line x1={hover.x} x2={hover.x} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="#8493c2" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={hover.x} cy={hover.y} r="5" fill="#fff" stroke="#0fb3cc" strokeWidth="3" />
            </g>
          )}
        </svg>

        {hover && (
          <div className="pointer-events-none absolute top-2 rounded-xl border border-ink-100 bg-white px-3 py-2 shadow-pop" style={{ left: `${Math.min(Math.max((hover.x / VB_W) * 100, 12), 88)}%`, transform: 'translateX(-50%)' }}>
            <p className="font-mono text-sm font-bold text-navy-800">{hover.level.toFixed(1)}%</p>
            <p className="text-[9px] text-ink-400">{fmtTime(hover.t)}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-[9px] text-ink-400">
        <Legend color="#0fb3cc" label="Nivel del tanque" />
        <Legend color="#324879" label={`Arranque ${thresholds.start}%`} dashed />
        <Legend color="#0891a8" label={`Paro ${thresholds.stop}%`} dashed />
        <span className="ml-auto">Actualización en tiempo real</span>
      </div>
    </section>
  )
}

function Legend({ color, label, dashed }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : undefined }} />
      {label}
    </span>
  )
}
