import { useMemo, useRef, useState } from 'react'

const RANGES = [
  { key: '6h', label: '6 h' },
  { key: '24h', label: '24 h' },
  { key: '7d', label: '7 días' },
]

const VB_W = 640
const VB_H = 220
const PAD_L = 34
const PAD_R = 12
const PAD_T = 14
const PAD_B = 26
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B

function buildWeekSeries(endTime) {
  const points = 84
  const spanMs = 7 * 24 * 3_600_000
  const out = []
  for (let i = 0; i < points; i++) {
    const t = endTime - spanMs + (i / (points - 1)) * spanMs
    const hourFraction = ((t / 3_600_000) % 24) / 24
    const dayWobble = Math.sin(i * 0.35) * 4
    const level = Math.max(18, Math.min(92, 66 + Math.sin((hourFraction - 0.15) * Math.PI * 2) * 15 + dayWobble))
    out.push({ t, level: Math.round(level * 10) / 10 })
  }
  return out
}

export default function LevelHistoryChart({ telemetry }) {
  const { history, thresholds, limits, now } = telemetry
  const [range, setRange] = useState('24h')
  const [hoverIdx, setHoverIdx] = useState(null)
  const svgRef = useRef(null)

  const weekSeries = useMemo(() => buildWeekSeries(now), []) // eslint-disable-line react-hooks/exhaustive-deps

  const data = useMemo(() => {
    if (range === '7d') return weekSeries
    if (range === '6h') {
      const sixHoursAgo = now - 6 * 3_600_000
      const live = history.filter((p) => p.t >= sixHoursAgo)
      return live.length >= 2 ? live : history.slice(-30)
    }
    return history
  }, [range, history, weekSeries, now])

  const { linePath, areaPath, points, minT, maxT } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', points: [], minT: 0, maxT: 1 }
    const ts = data.map((d) => d.t)
    const minT = Math.min(...ts)
    const maxT = Math.max(...ts)
    const xFor = (t) => PAD_L + ((t - minT) / (maxT - minT || 1)) * PLOT_W
    const yFor = (level) => PAD_T + (1 - level / 100) * PLOT_H
    const pts = data.map((d) => ({ x: xFor(d.t), y: yFor(d.level), ...d }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${PAD_T + PLOT_H} L${pts[0].x.toFixed(1)},${PAD_T + PLOT_H} Z`
    return { linePath: line, areaPath: area, points: pts, minT, maxT }
  }, [data])

  const yFor = (level) => PAD_T + (1 - level / 100) * PLOT_H

  const handleMove = (e) => {
    if (!points.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VB_W
    let nearest = 0
    let best = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setHoverIdx(nearest)
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null
  const fmtTime = (t) =>
    new Date(t).toLocaleString('es-MX', {
      day: range === '7d' ? '2-digit' : undefined,
      month: range === '7d' ? 'short' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ink-500">Nivel del tanque</h2>
          <p className="text-xs text-ink-400">Histórico de nivel vs. tiempo</p>
        </div>
        <div className="flex rounded-lg bg-navy-50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                range === r.key ? 'bg-white text-navy-700 shadow-sm' : 'text-ink-400 hover:text-navy-500',
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full touch-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="levelFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3987e5" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3987e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((g) => (
            <g key={g}>
              <line x1={PAD_L} x2={VB_W - PAD_R} y1={yFor(g)} y2={yFor(g)} stroke="#e4e8f1" strokeWidth={1} />
              <text x={PAD_L - 8} y={yFor(g) + 3} textAnchor="end" className="fill-ink-300 font-mono text-[9px]">
                {g}
              </text>
            </g>
          ))}

          <line
            x1={PAD_L}
            x2={VB_W - PAD_R}
            y1={yFor(thresholds.stop)}
            y2={yFor(thresholds.stop)}
            stroke="#0891a8"
            strokeDasharray="4 3"
            strokeWidth={1.2}
          />
          <line
            x1={PAD_L}
            x2={VB_W - PAD_R}
            y1={yFor(thresholds.start)}
            y2={yFor(thresholds.start)}
            stroke="#324879"
            strokeDasharray="4 3"
            strokeWidth={1.2}
          />

          {areaPath && <path d={areaPath} fill="url(#levelFill)" />}
          {linePath && <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

          {hover && (
            <g>
              <line x1={hover.x} x2={hover.x} y1={PAD_T} y2={PAD_T + PLOT_H} stroke="#98a1b5" strokeWidth={1} strokeDasharray="2 3" />
              <circle cx={hover.x} cy={hover.y} r={4} fill="#ffffff" stroke="#2a78d6" strokeWidth={2.5} />
            </g>
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-xs shadow-pop"
            style={{
              left: `${Math.min(Math.max((hover.x / VB_W) * 100, 12), 88)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-mono font-bold text-navy-700">{hover.level.toFixed(1)}%</p>
            <p className="text-[10px] text-ink-400">{fmtTime(hover.t)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-ink-400">
        <LegendDot color="#2a78d6" label="Nivel de tanque" line />
        <LegendDot color="#324879" label="Arranque" dashed />
        <LegendDot color="#0891a8" label="Paro" dashed />
      </div>
    </section>
  )
}

function LegendDot({ color, label, dashed, line }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-[2px] w-4 rounded-full"
        style={{ backgroundColor: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : undefined }}
      />
      {label}
    </span>
  )
}
