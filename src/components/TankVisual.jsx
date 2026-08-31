// Cylindrical tank rendered in SVG: animated liquid fill with a scrolling
// wave surface. Sized entirely by its container (h-full w-full + viewBox)
// so it can be made bigger/smaller from the canvas resize handle — the %
// readout and the "Tanque principal" label both live inside the SVG
// itself for the same reason, instead of HTML text that would eat fixed,
// non-scaling layout height (which used to throw off the outlet port's
// pixel position — see registry.js).
//
// Threshold/limit markers (HH/PARO/ARR/LL) are deliberately left out for
// now — just the tank + the level — per the simplified look requested.
// An outlet flange at the bottom is the anchor point for connecting pipe
// widgets (rectas, codos, tes) from the canvas palette; it's drawn BEFORE
// the tank shell so the vessel's own rounded bottom cap naturally
// occludes its top edge, reading as a stub built into the tank rather
// than one glued on top of it, plus a soft drop-shadow for depth.
//
// This component fills its container edge-to-edge (no padding) — the
// card look (white rounded background + shadow) is drawn here, on the
// component's own root div, rather than by the generic WidgetShell card,
// because the canvas registers this widget as `bare` precisely so the
// outlet port's fx/fy fraction lands on the real pixel position of the
// flange instead of inside someone else's padding.

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

export default function TankVisual({ level, volume, capacity }) {
  const liquidY = pctToY(level)
  const clipId = 'tank-body-clip'
  const cx = VB_W / 2

  return (
    <div className="h-full w-full rounded-2xl border border-ink-100 bg-white shadow-card">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
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
          <linearGradient id="outletStub" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c8598" />
            <stop offset="25%" stopColor="#f2f4f8" />
            <stop offset="50%" stopColor="#aab2c2" />
            <stop offset="75%" stopColor="#6c7488" />
            <stop offset="100%" stopColor="#8b93a6" />
          </linearGradient>
          <linearGradient id="outletFlange" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5c6478" />
            <stop offset="50%" stopColor="#9aa2b4" />
            <stop offset="100%" stopColor="#454c5e" />
          </linearGradient>
          <filter id="outletShadow" x="-60%" y="-40%" width="220%" height="220%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#0b1220" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* outlet flange — drawn BEFORE the tank shell so the vessel's own
            rounded bottom cap occludes the top of the stub, making it
            read as built into the tank rather than stuck on underneath.
            Same 16-unit tube diameter / 24-unit flange span as every pipe
            piece (see registry.js), flush with the flange's own bottom
            edge (y = BOTTOM_Y + 26) so the tank's port lines up exactly
            with the first attached piece, no gap or overlap. */}
        <g filter="url(#outletShadow)">
          <rect x={cx - 8} y={BOTTOM_Y - 10} width={16} height={30} fill="url(#outletStub)" />
          <rect x={cx - 12} y={BOTTOM_Y + 20} width={24} height={6} rx={1.5} fill="url(#outletFlange)" />
          <circle cx={cx - 8} cy={BOTTOM_Y + 23} r={1.3} fill="#2b303c" />
          <circle cx={cx + 8} cy={BOTTOM_Y + 23} r={1.3} fill="#2b303c" />
        </g>

        {/* tank shell — its own rounded bottom cap sits on top of the
            stub above, covering the top ~10px of it */}
        <path d={bodyClip} fill="#f5f7fc" />
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={liquidY} width={VB_W} height={VB_H} fill="url(#liquidGradient)" />
          <g style={{ transform: `translateY(${liquidY - WAVE_AMP * 4}px)` }}>
            <path d={wavePath} fill="url(#liquidGradient)" className="animate-wave" />
          </g>
          <rect x={0} y={TOP_Y} width={VB_W} height={BODY_H} fill="url(#tankSheen)" />
        </g>

        {/* outline on top so the fill (and the shell's edge over the
            stub) sits underneath a crisp rim line */}
        <path d={bodyOutline} fill="none" stroke="#c7ccdb" strokeWidth={2} />
        <ellipse cx={cx} cy={TOP_Y} rx={RX} ry={RY} fill="none" stroke="#c7ccdb" strokeWidth={2} />

        {/* label + % + volume readout, all drawn in the SVG so they scale
            with the tank and never consume layout height outside it */}
        <text
          x={cx}
          y={20}
          textAnchor="middle"
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          fill="#8a93ab"
        >
          Tanque principal
        </text>
        <text x={cx} y={148} textAnchor="middle" className="font-mono text-[34px] font-bold" fill="#0b1220">
          {level.toFixed(0)}%
        </text>
        <text x={cx} y={170} textAnchor="middle" className="font-mono text-[12px] font-medium" fill="#324879">
          {volume.toFixed(1)} / {capacity.toFixed(1)} m³
        </text>
      </svg>
    </div>
  )
}
