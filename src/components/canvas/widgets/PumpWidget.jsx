// Pump card with two continuous equipment connections. Each connection is
// rendered as one SVG from the hydraulic body, across the card boundary,
// to a flange outside the card. The registry ports sit at the far tips so
// the canvas "+" builder attaches the next pipe after the flange.
import { useId } from 'react'
import PumpCard from '../../PumpCard.jsx'
import { MetalStops } from './PipeStraightWidget.jsx'

// Must match the pump's defaultSize.h in registry.js — a piece attached
// onto an EXISTING (possibly bigger) pipe via the "+" chain builder is
// created scaled up from its own defaultSize (see DashboardCanvas's
// scaleOfSource), and that scaling isn't blocked by resizeAxis: 'none'
// (that only blocks the user's own manual drag-resize afterwards). So a
// pump attached from an already-scaled-up run DOES arrive taller than
// 212 — this is how the flange below picks that scale back up instead
// of staying a fixed, now-mismatched 16px next to a bigger tube.
const DEFAULT_HEIGHT = 212

// Fixed card geometry. The connection roots are expressed in the card's
// own coordinate space and the runs stretch from there to the widget ports.
// SIDE_ROOT_X/SIDE_ROOT_Y/BOTTOM_ROOT_Y are tuned by eye to where the pump
// PHOTO's own body/base plate actually sit in PumpCard.jsx's equipment
// art (measured directly off that image) — not to the actual logical
// ports (registry.js's fixed fx/fy fractions, untouched here), which stay
// exactly where every already-placed pump and its connected pipes expect
// them. These roots only decide how much of the connecting tube is drawn
// between the photo and that fixed port, so the pipe reads as growing out
// of the pump body instead of floating next to it.
const CARD_WIDTH = 142
const CARD_HEIGHT = 182
const SIDE_ROOT_X = 106
const SIDE_ROOT_Y = 144
const BOTTOM_ROOT_Y = 167

// The discharge leaves the pump volute, not the middle of the information
// card. At the default 212px widget height this lands 38px below the old
// center port and exactly on the outlet drawn inside PumpCard.
const SIDE_PORT_FRACTION = 144 / DEFAULT_HEIGHT

// One continuous pipe from the pump body to the exterior flange. The
// horizontal and vertical variants share exactly the same 16px tube,
// 8px water core, 24x6 flange and bolt offsets; only the axis changes.
function PumpConnection({ orientation, length, scale }) {
  const uid = useId()
  const gradId = `pumpConnection-${uid}`
  const cross = 48 * scale
  const center = cross / 2
  const tube = 16 * scale
  const water = 8 * scale
  const plateSpan = 24 * scale
  const plateThickness = 6 * scale
  const clearance = 4 * scale
  const plateStart = length - clearance - plateThickness
  const horizontal = orientation === 'horizontal'
  const svgW = horizontal ? length : cross
  const svgH = horizontal ? cross : length

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.3))' }}
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={horizontal ? 0 : center - tube / 2}
          y1={horizontal ? center - tube / 2 : 0}
          x2={horizontal ? 0 : center + tube / 2}
          y2={horizontal ? center + tube / 2 : 0}
        >
          <MetalStops />
        </linearGradient>
      </defs>

      {horizontal ? (
        <>
          <rect x="0" y={center - tube / 2} width={length} height={tube} fill={`url(#${gradId})`} />
          <rect x="0" y={center - water / 2} width={length} height={water} fill="#1d8ff2" />
          <rect x={plateStart} y={center - plateSpan / 2} width={plateThickness} height={plateSpan} rx="1" fill={`url(#${gradId})`} stroke="#4b5568" strokeWidth={scale} />
          <circle cx={plateStart + plateThickness / 2} cy={center - 8 * scale} r={1.5 * scale} fill="#202938" stroke="#d8dee8" strokeWidth={0.4 * scale} />
          <circle cx={plateStart + plateThickness / 2} cy={center + 8 * scale} r={1.5 * scale} fill="#202938" stroke="#d8dee8" strokeWidth={0.4 * scale} />
        </>
      ) : (
        <>
          <rect x={center - tube / 2} y="0" width={tube} height={length} fill={`url(#${gradId})`} />
          <rect x={center - water / 2} y="0" width={water} height={length} fill="#1d8ff2" />
          <rect x={center - plateSpan / 2} y={plateStart} width={plateSpan} height={plateThickness} rx="1" fill={`url(#${gradId})`} stroke="#4b5568" strokeWidth={scale} />
          <circle cx={center - 8 * scale} cy={plateStart + plateThickness / 2} r={1.5 * scale} fill="#202938" stroke="#d8dee8" strokeWidth={0.4 * scale} />
          <circle cx={center + 8 * scale} cy={plateStart + plateThickness / 2} r={1.5 * scale} fill="#202938" stroke="#d8dee8" strokeWidth={0.4 * scale} />
        </>
      )}
    </svg>
  )
}

export default function PumpWidget({ telemetry, config, width, height }) {
  const pumpId = config.pumpId ?? 'p1'
  const pump = telemetry.pumps[pumpId]
  const widgetW = width ?? 166
  const widgetH = height ?? DEFAULT_HEIGHT
  const scale = widgetH / DEFAULT_HEIGHT
  const sidePortY = widgetH * SIDE_PORT_FRACTION
  const cardTop = sidePortY - SIDE_ROOT_Y
  const cardLeft = (widgetW - CARD_WIDTH) / 2
  const sideRootX = cardLeft + SIDE_ROOT_X
  const sideLength = widgetW - sideRootX
  const bottomRootY = cardTop + BOTTOM_ROOT_Y
  const bottomLength = widgetH - bottomRootY

  return (
    <div className="relative h-full w-full overflow-visible">
      <div
        className="absolute"
        style={{ left: cardLeft, top: cardTop, width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        <PumpCard pump={pump} onToggle={telemetry.setPumpRunning} />
      </div>

      {/* These overlays each contain the entire run from the pump body to
          the exterior flange. No card clipping and no stitched SVGs. */}
      <div
        className="pointer-events-none absolute"
        style={{ left: sideRootX, top: sidePortY - 24 * scale }}
      >
        <PumpConnection orientation="horizontal" length={sideLength} scale={scale} />
      </div>
      <div
        className="pointer-events-none absolute"
        style={{ left: widgetW / 2 - 24 * scale, top: bottomRootY }}
      >
        <PumpConnection orientation="vertical" length={bottomLength} scale={scale} />
      </div>
    </div>
  )
}
