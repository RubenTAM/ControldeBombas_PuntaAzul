// Cylindrical tank rendered in SVG: animated liquid fill with a scrolling
// wave surface, plus reference lines for the fixed safety limits (HH/LL)
// and the operator-adjustable control setpoints (arranque/paro).
//
// Sized entirely by its container (h-full w-full + viewBox) so it can be
// made bigger/smaller from the canvas resize handle — the % and volume
// readout live inside the SVG itself for the same reason, instead of an
// absolutely-positioned HTML overlay tuned to one fixed pixel size.

const VB_W = 220
const VB_H = 300
const TOP_Y = 46
const BOTTOM_Y = 258
const BODY_H = BOTTOM_Y - TOP_Y
const RX = 82
const RY = 15
const LEFT_X = (VB_W - RX * 2) / 2
const RIGHT_X = LEFT_X + RX * 2

const pctToY = (pct) => BOTTOM_Y - (pct / 100) * BODY_H

const bodyClip = `M${LEFT_X},${TOP_Y} L${LEFT_X},${BOTTOM_Y} A${RX},${RY} 0 0 0 ${RIGHT_X},${BOTTOM_Y} L${RIGHT_X},${TOP_Y} A${RX},${RY} 0 0 0 ${LEFT_X},${TOP_Y} Z`
const bodyOutline = `M${LEFT_X},${TOP_Y} L${LEFT_X},${BOTTOM_Y} A${RX},${RY} 0 0 0 ${RIGHT_X},${BOTTOM_Y} L${RIGHT_X},${TOP_Y}`

const WAVE_AMP = 5
const wavePath = `M0,${WAVE_AMP} Q ${VB_W / 4},${-WAVE_AMP} ${VB_W / 2},${WAVE_AMP} T ${VB_W},${WAVE_AMP} T ${VB_W * 1.5},${WAVE_AMP} T ${VB_W * 2},${WAVE_AMP} L ${VB_W * 2},${WAVE_AMP * 4} L 0,${WAVE_AMP * 4} Z`

function Marker({ value, y, color, label, dashed = true, align = 'right' }) {
  return (
    <g>
      <line
        x1={LEFT_X - 4}
        x2={RIGHT_X + 4}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1.3}
        strokeDasharray={dashed ? '3 3' : undefined}
        opacity={0.85}
      />
      <text
        x={align === 'right' ? RIGHT_X + 10 : LEFT_X - 10}
        y={y + 3.5}
        textAnchor={align === 'right' ? 'start' : 'end'}
        className="font-mono text-[10.5px] font-semibold"
        fill={color}
      >
        {label}
      </text>
    </g>
  )
}

export default function TankVisual({ level, thresholds, limits, volume, capacity }) {
  const liquidY = pctToY(level)
  const clipId = 'tank-body-clip'

  return (
    <div className="flex h-full w-full flex-col items-center">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="min-h-0 w-full flex-1 overflow-visible" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={clipId}>
            <path d={bodyClip} />
          </clipPath>
          <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5598e7" />
            <stop offset="100%" stopColor="#184f95" />
          </linearGradient>
          <linearGradient id="tankSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* tank shell */}
        <path d={bodyClip} fill="#f5f7fc" />
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={liquidY} width={VB_W} height={VB_H} fill="url(#liquidGradient)" />
          <g style={{ transform: `translateY(${liquidY - WAVE_AMP * 4}px)` }}>
            <path d={wavePath} fill="url(#liquidGradient)" className="animate-wave" />
          </g>
          <rect x={0} y={TOP_Y} width={VB_W} height={BODY_H} fill="url(#tankSheen)" />
        </g>

        {/* threshold reference lines */}
        <Marker value={limits.hh} y={pctToY(limits.hh)} color="#c22b2b" label={`HH ${limits.hh}%`} />
        <Marker value={thresholds.stop} y={pctToY(thresholds.stop)} color="#0891a8" label={`PARO ${thresholds.stop}%`} />
        <Marker value={thresholds.start} y={pctToY(thresholds.start)} color="#324879" label={`ARR. ${thresholds.start}%`} />
        <Marker value={limits.ll} y={pctToY(limits.ll)} color="#c22b2b" label={`LL ${limits.ll}%`} />

        {/* outline on top so fill + markers sit underneath the rim */}
        <path d={bodyOutline} fill="none" stroke="#c7ccdb" strokeWidth={2} />
        <ellipse cx={VB_W / 2} cy={TOP_Y} rx={RX} ry={RY} fill="none" stroke="#c7ccdb" strokeWidth={2} />

        {/* % + volume readout, drawn in the SVG so it scales with the tank */}
        <text x={VB_W / 2} y={148} textAnchor="middle" className="font-mono text-[34px] font-bold" fill="#0b1220">
          {level.toFixed(0)}%
        </text>
        <text x={VB_W / 2} y={170} textAnchor="middle" className="font-mono text-[12px] font-medium" fill="#324879">
          {volume.toFixed(1)} / {capacity.toFixed(1)} m³
        </text>
      </svg>

      <p className="shrink-0 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Tanque principal</p>
    </div>
  )
}
