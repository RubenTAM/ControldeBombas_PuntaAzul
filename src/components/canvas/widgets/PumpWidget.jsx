// Pump card, wired into the pipe network: a short flanged inlet stub is
// drawn at the bottom-center of the card so a Te or a curve dropped from
// the palette can attach to it with the same "+" pipe-chain builder the
// tank's outlet already uses. Same 16-unit stub / 24-unit flange
// proportions as every other pipe piece and the tank's own outlet, so it
// reads as part of the same system.
//
// A second, discharge flange sits on the card's own right edge at the
// pump volute outlet (see PumpSideFlange + registry.js's port 1) — added
// purely as an extra attach point; it doesn't touch the bottom/suction
// flange's markup, sizing, or port math at all, so nothing already
// connected there moves. It's drawn as an absolutely-positioned overlay
// whose OUTWARD tip (the flange plate) sits flush with the widget's own
// right edge (fx:1, unchanged box width — growing the box instead would
// shift the bottom flange's fx:0.5 relative to the card).
//
// The tricky part: PumpCard itself is a fixed 142px card (see
// PumpCard.jsx's `w-[142px]`) centered in a box that's normally wider
// (166px by default, more once a chain-attach scales it up — see
// scaleOfSource) — so there's a real, variable GAP between the card's
// own visible edge and the box edge the port math is anchored to. A
// fixed-length stub (sized only off `scale`, the way every other pipe
// fitting here works) would either float away from the card with a
// visible seam (too short) or bury itself inside the card (too long) —
// exactly "la brida del lado queda flotando... tiene que estar pegada a
// la card". So PumpSideFlange's stub is stretchy: it's handed the real
// pixel gap (computed from the `width` prop below) and draws itself long
// enough to always touch the card, while its flange-plate end stays a
// fixed size and stays anchored to the true fx:1 tip either way.
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
// apart instead of a blind "connected or not". Used independently for
// each of the pump's two ports (bottom vs. side), via connectedTypes[0]
// and connectedTypes[1] respectively.

// Must match the pump's defaultSize.h in registry.js — a piece attached
// onto an EXISTING (possibly bigger) pipe via the "+" chain builder is
// created scaled up from its own defaultSize (see DashboardCanvas's
// scaleOfSource), and that scaling isn't blocked by resizeAxis: 'none'
// (that only blocks the user's own manual drag-resize afterwards). So a
// pump attached from an already-scaled-up run DOES arrive taller than
// 212 — this is how the flange below picks that scale back up instead
// of staying a fixed, now-mismatched 16px next to a bigger tube.
const DEFAULT_HEIGHT = 212

// PumpCard's own fixed width (see PumpCard.jsx's `w-[142px]`) — the pump
// widget's box is slightly wider than this (166px default, see
// registry.js), and PumpCard sits centered in it, so this is the number
// PumpSideFlange's stretchy stub is measured against below.
const CARD_WIDTH = 142

// The discharge leaves the pump volute, not the middle of the information
// card. At the default 212px widget height this lands 38px below the old
// center port and exactly on the outlet drawn inside PumpCard.
const SIDE_PORT_FRACTION = 144 / DEFAULT_HEIGHT

// piece types that always draw their own flange regardless of connection
// state (see PipeTeeWidget/PipeTeeUpWidget/PipeElbowWidget) — the pump
// yields to these instead of doubling up; a plain straight pipe isn't
// in this set on purpose, since IT hides its own end-flange when
// connected, leaving the pump's as the only one at that joint.
const ALWAYS_FLANGE_TYPES = new Set(['pipe-elbow', 'pipe-tee', 'pipe-tee-up'])

function PumpFlange({ scale, hidePlate }) {
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
      {/* The suction pipe always occupies the full reserved height. This
          keeps the card fixed when a connected elbow/Te supplies the
          joint's flange plate. */}
      <rect x="16" y="0" width="16" height="30" fill={`url(#${gradId})`} />
      <line x1="24" y1="0" x2="24" y2="30" stroke="#1d8ff2" strokeWidth="8" />
      {/* path runs bottom-to-top (collar end -> pump end), matching the
          Te-up branch's own water path direction (also bottom-to-top,
          see PipeTeeUpWidget's "M36,23 L36,0") — the same
          "animate-dashFlow" keyframe on two paths pointing opposite ways
          reads as flow reversing right at the seam, which is exactly the
          "va sentido contrario" bug: this stub is the continuation of
          that branch, so it has to run the same direction. */}
      <line
        x1="24"
        y1="30"
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
      {!hidePlate && (
        <>
          <rect x="12" y="20" width="24" height="6" rx="1" fill={`url(#${gradId})`} />
          <circle cx="16" cy="23" r="1.3" fill="#2b303c" />
          <circle cx="32" cy="23" r="1.3" fill="#2b303c" />
        </>
      )}
    </svg>
  )
}

// Same fitting, transposed 90° for a sideways (east-facing) discharge
// port instead of the downward-facing suction one above. Unlike every
// other pipe fitting in this file, its total length ISN'T just `scale`
// — the flange-plate/bolts end is fixed size (scales normally), but the
// stub before it stretches to `gap` (the real, possibly-scaled pixel gap
// between PumpCard's fixed edge and the box's true right edge — see the
// file-top comment), so the drawn stub always physically touches the
// card no matter how wide that gap is, while the plate itself stays
// pinned to the SVG's own right edge — which the wrapping overlay below
// anchors to fx:1 — so attaching a piece here still lands exactly on the
// flange with zero seam, same as before this fix.
function PumpSideFlange({ gap, scale, hidePlate }) {
  const uid = useId()
  const gradId = `pumpSideFlange-${uid}`
  const plateW = 6 * scale
  const clearance = 4 * scale // small gap between plate and the true tip, same as every other fitting's flange-to-edge margin
  // A literal 90° rotation of the lower 48x30 fitting must be 30x48.
  // Keep that 30px nominal length even though the card-to-widget gap is
  // smaller; the extra overlap sits inside the card outlet and removes
  // the visual seam. Only stretch beyond 30 when an older saved widget
  // has a wider-than-current box.
  const nominalLength = 30 * scale
  const w = Math.round(Math.max(nominalLength, gap + plateW + clearance))
  const h = Math.round(48 * scale)
  const cy = h / 2
  const tubeH = 16 * scale
  const plateX = w - clearance - plateW
  // When an elbow/Te is connected here, IT draws its own plate (see
  // ALWAYS_FLANGE_TYPES below) so ours is skipped to avoid doubling up —
  // but the STUB still has to keep bridging all the way out to the SVG's
  // own right edge (the true fx:1 tip) regardless: that stub is the only
  // thing standing between the card and whatever the OTHER piece draws,
  // and it has zero idea there's a gap to bridge. Skipping the stub
  // whenever the plate is skipped was exactly the bug — "la brida del
  // lado queda flotando" reappeared the instant an elbow/Te sat here,
  // because hiding the plate used to hide the whole fitting, bridge
  // included.
  const stubEnd = hidePlate ? w : plateX
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.3))' }}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1={cy - tubeH / 2} x2="0" y2={cy + tubeH / 2}>
          <MetalStops />
        </linearGradient>
      </defs>
      {/* stretchy discharge stub — touches the card at x:0, and always
          reaches out to stubEnd: the flange plate's own start (plateX)
          normally, or all the way to the SVG's own right edge (w) when
          the plate itself is hidden, so the bridge never stops short */}
      <rect x="0" y={cy - tubeH / 2} width={Math.max(stubEnd, 0)} height={tubeH} fill={`url(#${gradId})`} />
      <line x1="0" y1={cy} x2={Math.max(stubEnd, 0)} y2={cy} stroke="#1d8ff2" strokeWidth={tubeH * 0.5} />
      {/* flow runs outward end -> pump end, same convention as PumpFlange's
          own bottom-to-top line */}
      <line
        x1={Math.max(stubEnd - 2, 2)}
        y1={cy}
        x2="0"
        y2={cy}
        stroke={WATER_COLOR}
        strokeWidth={tubeH * 0.5}
        strokeLinecap="round"
        strokeDasharray="16 16"
        className="animate-dashFlow"
      />
      {/* flange plate — skipped when an elbow/Te sitting right here is
          already drawing its own (see hidePlate above); stays pinned to
          the SVG's own right edge regardless of stub length otherwise */}
      {!hidePlate && (
        <>
          <rect x={plateX} y={cy - 12 * scale} width={plateW} height={24 * scale} rx="1" fill={`url(#${gradId})`} />
          <circle cx={plateX + plateW / 2} cy={cy - 8 * scale} r={1.3 * scale} fill="#2b303c" />
          <circle cx={plateX + plateW / 2} cy={cy + 8 * scale} r={1.3 * scale} fill="#2b303c" />
        </>
      )}
    </svg>
  )
}

export default function PumpWidget({ telemetry, config, onConfigChange, editMode, width, height, connectedTypes }) {
  const pumpId = config.pumpId ?? 'p1'
  const pump = telemetry.pumps[pumpId]
  const scale = height ? height / DEFAULT_HEIGHT : 1
  const hideOwnFlange = ALWAYS_FLANGE_TYPES.has(connectedTypes?.[0])
  // Port 1 (see registry.js) — the new discharge side, checked completely
  // independently of port 0 above so attaching something to one side can
  // never hide/show the other's flange.
  const hideSideFlange = ALWAYS_FLANGE_TYPES.has(connectedTypes?.[1])
  // Real pixel distance from PumpCard's fixed edge to the box's own right
  // edge (see the file-top comment) — falls back to the registry default
  // (166) if `width` isn't passed for some reason, same math either way.
  const sideGap = Math.max(0, ((width ?? 166) - CARD_WIDTH) / 2)

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end">
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
      <PumpCard pump={pump} onToggle={telemetry.setPumpRunning} showPorts />
      {/* drawn unless a Te/curve — which always shows its own — is the
          one connected here; a straight pipe hides its OWN end-flange
          instead, so this still shows in that case (bomba -> recta). */}
      <PumpFlange scale={scale} hidePlate={hideOwnFlange} />
      {/* discharge port — an absolutely-positioned overlay flush with the
          widget's own right edge (fx:1), aligned with the volute outlet
          (fy:144/212) — see the file-top comment for why growing the box
          instead isn't an option: it would shift the bottom port's fx:0.5
          relative to the card, moving every already-connected suction
          joint. PumpSideFlange's own stub bridges the real gap up to that
          edge so it visually touches the card either way — this renders
          UNCONDITIONALLY (only its flange plate is conditional, via
          hidePlate) because the bridge has to stay up even when an
          elbow/Te connected here draws its own plate; hiding the whole
          overlay in that case was what let the connected piece float
          away from the card again. */}
      <div
        className="pointer-events-none absolute right-0 -translate-y-1/2"
        style={{ top: `${SIDE_PORT_FRACTION * 100}%` }}
      >
        <PumpSideFlange gap={sideGap} scale={scale} hidePlate={hideSideFlange} />
      </div>
    </div>
  )
}
