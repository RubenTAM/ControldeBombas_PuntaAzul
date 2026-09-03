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
import { useId } from 'react'

// The tank always draws its OWN outlet flange now, no matter what's
// attached to it. This used to hide it whenever the connected piece was
// an elbow/Te (which always draws its own flange too — see
// PipeTeeWidget/PipeTeeUpWidget/PipeElbowWidget) to avoid stacking two
// flange plates on top of each other — but in practice that left a
// visibly EMPTY gap in the tank's own card, right where its flange
// belongs, which read as a missing part rather than a clean join. A
// little flange-on-flange overlap right at the joint reads better than
// a blank hole, so `connectedTypes` is no longer consulted here at all
// (kept as a prop only because TankWidget still passes it through).
const wavePath = `M0,${WAVE_AMP} Q ${VB_W / 4},${-WAVE_AMP} ${VB_W / 2},${WAVE_AMP} T ${VB_W},${WAVE_AMP} T ${VB_W * 1.5},${WAVE_AMP} T ${VB_W * 2},${WAVE_AMP} L ${VB_W * 2},${WAVE_AMP * 4} L 0,${WAVE_AMP * 4} Z`

export default function TankVisual({ level, volume, capacity, connectedTypes, label, editMode, onLabelChange, flowing = false }) {
  const liquidY = pctToY(level)
  const uid = useId()
  const clipId = `tank-body-clip-${uid}`
  const liquidGradId = `liquidGradient-${uid}`
  const sheenId = `tankSheen-${uid}`
  const outletId = `outletMetal-${uid}`
  const cx = VB_W / 2
  const displayLabel = label || 'Tanque principal'

  return (
    <div className="relative h-full w-full rounded-2xl border border-ink-100 bg-white shadow-card">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={bodyClip} />
          </clipPath>
          <linearGradient id={liquidGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5598e7" />
            <stop offset="100%" stopColor="#184f95" />
          </linearGradient>
          <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* outlet stub + flange metal shading — userSpaceOnUse with the
              exact x-range the flange itself spans (cx-8..cx+8, its own
              absolute width), so the flange (wider) and the stub
              (narrower) it caps always sample identical colors instead
              of each normalizing the gradient to its own box. */}
          <linearGradient id={outletId} gradientUnits="userSpaceOnUse" x1={cx - 8} y1="0" x2={cx + 8} y2="0">
            <stop offset="0%" stopColor="#8b93a8" />
            <stop offset="15%" stopColor="#f4f6fa" />
            <stop offset="45%" stopColor="#aab2c2" />
            <stop offset="60%" stopColor="#6c7488" />
            <stop offset="85%" stopColor="#aab2c2" />
            <stop offset="100%" stopColor="#7c8598" />
          </linearGradient>
        </defs>

        {/* outlet flange — drawn BEFORE the tank shell so the vessel's own
            rounded bottom cap occludes the top of the stub, making it
            read as built into the tank rather than stuck on underneath.
            Same 16-unit tube diameter / 24-unit flange span as every pipe
            piece (see registry.js), flush with the flange's own bottom
            edge (y = BOTTOM_Y + 26) so the tank's port lines up exactly
            with the first attached piece, no gap or overlap. */}
        <g style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.3))' }}>
          <rect x={cx - 8} y={BOTTOM_Y - 10} width={16} height={30} fill={`url(#${outletId})`} />
          {/* "water" down the outlet stub, same treatment as the canvas
              pipe pieces — stops before the flange so the flange still
              caps it visually. Only animates while `flowing` is true (see
              useTelemetry's flowAnimating: simulation toggle on AND a
              pump actually running) — otherwise it's a static fill. */}
          <line
            x1={cx}
            y1={BOTTOM_Y - 10}
            x2={cx}
            y2={BOTTOM_Y + 18}
            stroke="#3b82f6"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray="20 20"
            className={flowing ? 'animate-dashFlow' : undefined}
          />
          {/* always drawn now — see the comment above connectedTypes */}
          <rect x={cx - 12} y={BOTTOM_Y + 20} width={24} height={6} rx={1} fill={`url(#${outletId})`} />
          <circle cx={cx - 8} cy={BOTTOM_Y + 23} r={1.3} fill="#2b303c" />
          <circle cx={cx + 8} cy={BOTTOM_Y + 23} r={1.3} fill="#2b303c" />
        </g>

        {/* tank shell — its own rounded bottom cap sits on top of the
            stub above, covering the top ~10px of it */}
        <path d={bodyClip} fill="#f5f7fc" />
        <g clipPath={`url(#${clipId})`}>
          <rect x={0} y={liquidY} width={VB_W} height={VB_H} fill={`url(#${liquidGradId})`} />
          <g style={{ transform: `translateY(${liquidY - WAVE_AMP * 4}px)` }}>
            <path d={wavePath} fill={`url(#${liquidGradId})`} className="animate-wave" />
          </g>
          <rect x={0} y={TOP_Y} width={VB_W} height={BODY_H} fill={`url(#${sheenId})`} />
        </g>

        {/* outline on top so the fill (and the shell's edge over the
            stub) sits underneath a crisp rim line */}
        <path d={bodyOutline} fill="none" stroke="#c7ccdb" strokeWidth={2} />
        <ellipse cx={cx} cy={TOP_Y} rx={RX} ry={RY} fill="none" stroke="#c7ccdb" strokeWidth={2} />

        {/* label + % + volume readout, all drawn in the SVG so they scale
            with the tank and never consume layout height outside it. The
            label itself is hidden while its HTML input overlay (below,
            outside the SVG) is showing in edit mode, so there's only ever
            one copy of the text visible at a time. */}
        {!editMode && (
          <text
            x={cx}
            y={20}
            textAnchor="middle"
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            fill="#8a93ab"
          >
            {displayLabel}
          </text>
        )}
        <text x={cx} y={148} textAnchor="middle" className="font-mono text-[34px] font-bold" fill="#0b1220">
          {level.toFixed(0)}%
        </text>
        <text x={cx} y={170} textAnchor="middle" className="font-mono text-[12px] font-medium" fill="#324879">
          {volume.toFixed(1)} / {capacity.toFixed(1)} m³
        </text>
      </svg>

      {editMode && (
        <input
          value={label ?? ''}
          onChange={(e) => onLabelChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="Tanque principal"
          aria-label="Nombre del tanque"
          className="absolute left-1/2 top-1.5 w-[80%] -translate-x-1/2 border-0 bg-transparent p-0 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400 outline-none placeholder:text-navy-300"
        />
      )}
    </div>
  )
}
