// Pump card, wired into the pipe network: a short flanged inlet stub is
// drawn at the bottom-center of the card so a Te or a curve dropped from
// the palette can attach to it with the same "+" pipe-chain builder the
// tank's outlet already uses. Same 16-unit stub / 24-unit flange
// proportions as every other pipe piece and the tank's own outlet, so it
// reads as part of the same system.
//
// `bare: true` in the registry (see registry.js) — this component draws
// its OWN card chrome instead of WidgetShell's (which would otherwise
// double up with PumpCard's own border/shadow), and fills its box at a
// FIXED height (resizeAxis: 'none' in the registry) so the flange's port
// fraction always lands on the same real pixel position. The card sits
// at the BOTTOM of the box (justify-end) so its own content height —
// which grows a little with a fault row or the manual start/stop button
// — never shifts where the flange itself sits; only the empty headroom
// above the card changes.
import { useId } from 'react'
import PumpCard from '../../PumpCard.jsx'
import { WATER_COLOR, MetalStops } from './PipeStraightWidget.jsx'

// A Te/curve always draws its OWN flange, connected or not (see
// PipeTeeWidget/PipeElbowWidget) — so a pump sitting directly under one
// of those has to yield its own flange instead of stacking a second
// plate right on top of it. A straight pipe does the opposite (it hides
// its OWN end-flange once connected), so a pump feeding a straight run
// still has to show its own — this set is what tells the two cases
// apart instead of a blind "connected or not".

// Must match the pump's defaultSize.h in registry.js — a piece attached
// onto an EXISTING (possibly bigger) pipe via the "+" chain builder is
// created scaled up from its own defaultSize (see DashboardCanvas's
// scaleOfSource), and that scaling isn't blocked by resizeAxis: 'none'
// (that only blocks the user's own manual drag-resize afterwards). So a
// pump attached from an already-scaled-up run DOES arrive taller than
// 212 — this is how the flange below picks that scale back up instead
// of staying a fixed, now-mismatched 16px next to a bigger tube.
const DEFAULT_HEIGHT = 212

// piece types that always draw their own flange regardless of connection
// state (see PipeTeeWidget/PipeTeeUpWidget/PipeElbowWidget) — the pump
// yields to these instead of doubling up; a plain straight pipe isn't
// in this set on purpose, since IT hides its own end-flange when
// connected, leaving the pump's as the only one at that joint.
const ALWAYS_FLANGE_TYPES = new Set(['pipe-elbow', 'pipe-tee', 'pipe-tee-up'])

function PumpFlange({ scale }) {
  const uid = useId()
  const gradId = `pumpFlange-${uid}`
  const w = Math.round(48 * scale)
  const h = Math.round(30 * scale)
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 48 30"
      className="shrink-0 overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.3))' }}
    >
      <defs>
        {/* shading runs across the stub's own width (its visible
            "diameter"), same convention as the tank's outlet flange */}
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="16" y1="0" x2="32" y2="0">
          <MetalStops />
        </linearGradient>
      </defs>
      {/* short inlet stub, same 16-unit diameter as every pipe piece */}
      <rect x="16" y="0" width="16" height="14" fill={`url(#${gradId})`} />
      {/* path runs bottom-to-top (collar end -> pump end), matching the
          Te-up branch's own water path direction (also bottom-to-top,
          see PipeTeeUpWidget's "M36,23 L36,0") — the same
          "animate-dashFlow" keyframe on two paths pointing opposite ways
          reads as flow reversing right at the seam, which is exactly the
          "va sentido contrario" bug: this stub is the continuation of
          that branch, so it has to run the same direction. */}
      <line
        x1="24"
        y1="18"
        x2="24"
        y2="0"
        stroke={WATER_COLOR}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="16 16"
        className="animate-dashFlow"
      />
      {/* flange plate — same 24-unit span as every other pipe piece,
          always drawn (this is a permanent fitting, not a port state) */}
      <rect x="12" y="20" width="24" height="6" rx="1" fill={`url(#${gradId})`} />
      <circle cx="16" cy="23" r="1.3" fill="#2b303c" />
      <circle cx="32" cy="23" r="1.3" fill="#2b303c" />
    </svg>
  )
}

export default function PumpWidget({ telemetry, config, onConfigChange, editMode, height, connectedTypes }) {
  const pumpId = config.pumpId ?? 'p1'
  const pump = telemetry.pumps[pumpId]
  const scale = height ? height / DEFAULT_HEIGHT : 1
  const hideOwnFlange = ALWAYS_FLANGE_TYPES.has(connectedTypes?.[0])

  return (
    <div className="flex h-full w-full flex-col items-center justify-end">
      {editMode && (
        <select
          value={pumpId}
          onChange={(e) => onConfigChange({ pumpId: e.target.value })}
          className="mb-2 w-full rounded-lg border border-ink-100 bg-navy-50/60 px-2 py-1.5 text-xs font-semibold text-ink-500"
        >
          <option value="p1">Bomba 1</option>
          <option value="p2">Bomba 2</option>
        </select>
      )}
      <PumpCard pump={pump} onToggle={telemetry.setPumpRunning} />
      {/* drawn unless a Te/curve — which always shows its own — is the
          one connected here; a straight pipe hides its OWN end-flange
          instead, so this still shows in that case (bomba -> recta). */}
      {!hideOwnFlange && <PumpFlange scale={scale} />}
    </div>
  )
}
