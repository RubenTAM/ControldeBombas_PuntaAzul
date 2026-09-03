// 90° pipe elbow — a genuine smooth curve, built from three pieces that
// tile together exactly: a short straight vertical stub, a curved bend,
// and a short straight horizontal stub, each capped with a flange +
// bolts — ALWAYS, at both ends, whether or not that end is actually
// connected to another piece. A Te/elbow is a discrete bolted fitting in
// real plumbing, so unlike a plain straight run (which reads as one
// continuous tube where two lengths are joined), every port on this
// piece shows its own flange plate regardless of connection state.
//
// Polished-metal shading, done the way we now know is safe: every
// gradient here is gradientUnits="userSpaceOnUse" with absolute
// coordinates matching this piece's own 72x72 viewBox — never the SVG
// default (objectBoundingBox), which normalizes independently per shape
// and is what caused the "flange looks glued on" bug earlier in this
// build. The straight stubs use the same banded gradient as the flanges
// that cap them (elbowV for the vertical/top side, elbowH for the
// horizontal/right side), and the curved bend uses a *radial* gradient
// centered on the bend's own arc center with the identical stop sequence
// remapped onto its ring, so the band appears to wrap smoothly around
// the corner instead of smearing diagonally across it. elbowV's
// direction is deliberately reversed (x1=44→x2=28) so its band sequence
// runs the same way as the ring's along their shared seam.
//
// The gradient ids are per-instance (via useId), not fixed strings —
// with more than one elbow on the same canvas, a fixed id would be
// duplicated across every instance, and browsers resolve url(#id)
// unpredictably whenever the same id appears more than once in the
// document.
//
// Same 16-unit tube diameter and 72x72 1:1-scaled viewBox as the straight
// and tee pieces, so it lines up with them exactly when chained.
//
// The horizontal exit's centerline sits at y=36 — dead center of the
// 72-tall box, exactly like the straight pipe's and the tee's own ports
// (both at fy=0.5) — on purpose: an earlier version had it at y=48,
// which meant dropping a fresh elbow next to a fresh tee/straight at the
// same on-screen position put their flow lines 12px apart.
import { useId } from 'react'
import { WATER_COLOR, MetalStops } from './PipeStraightWidget'

export default function PipeElbowWidget({ telemetry }) {
  const flowing = Boolean(telemetry?.flowAnimating)
  const uid = useId()
  const vId = `elbowV-${uid}`
  const hId = `elbowH-${uid}`
  const ringId = `elbowRing-${uid}`
  return (
    <svg
      viewBox="0 0 72 72"
      className="h-full w-full overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.28))' }}
    >
      <defs>
        {/* vertical stub + top flange (x24..48, the flange's own span) —
            reversed direction so it matches the ring's band sequence at
            their shared seam (y=12) */}
        <linearGradient id={vId} gradientUnits="userSpaceOnUse" x1="44" y1="0" x2="28" y2="0">
          <MetalStops />
        </linearGradient>
        {/* horizontal stub + right flange (y24..48, the flange's own span) */}
        <linearGradient id={hId} gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="44">
          <MetalStops />
        </linearGradient>
        {/* same stop sequence, remapped onto r=16..32 (offset 50%..100%)
            so the ring only carries banding across the tube's own
            thickness, centered on the bend's own arc center (60,12) */}
        <radialGradient id={ringId} gradientUnits="userSpaceOnUse" cx="60" cy="12" r="32">
          <stop offset="50%" stopColor="#8b93a8" />
          <stop offset="57%" stopColor="#f4f6fa" />
          <stop offset="72%" stopColor="#aab2c2" />
          <stop offset="80%" stopColor="#6c7488" />
          <stop offset="92%" stopColor="#aab2c2" />
          <stop offset="100%" stopColor="#7c8598" />
        </radialGradient>
      </defs>

      {/* The two centerlines sit on the box's own center axes: top x=36,
          right y=36. That symmetry is preserved under every rotation. */}
      <rect x="28" y="0" width="16" height="12" fill={`url(#${vId})`} />

      {/* the bend itself: a ring segment from angle 180° to 90° around
          center (60,12), radius 24, thickness 16 (r 16..32) — tangent
          exactly where the two straight stubs end, no gap or overlap */}
      <path d="M28,12 A32,32 0 0 0 60,44 L60,28 A16,16 0 0 1 44,12 Z" fill={`url(#${ringId})`} />

      {/* horizontal exit stub: (60,28) to (72,44) — centerline y=36 */}
      <rect x="60" y="28" width="12" height="16" fill={`url(#${hId})`} />

      {/* "water" following the same centerline as the tube — straight down
          the vertical stub, around the bend (radius 24, centered on
          (60,12), the exact midline between the ring's inner and outer
          edges), then straight along the horizontal stub. Only drawn at
          all while flowing (no pump running = no blue, empty gray pipe). */}
      {flowing && (
        <path
          d="M36,0 L36,12 A24,24 0 0 0 60,36 L72,36"
          fill="none"
          stroke={WATER_COLOR}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="20 20"
          className="animate-dashFlow"
        />
      )}

      {/* top flange (flush with the top edge — the entry port) — always
          drawn, connected or not: an elbow is a bolted fitting */}
      <rect x="24" y="0" width="24" height="6" rx="1" fill={`url(#${vId})`} />
      <circle cx="28" cy="3" r="1.3" fill="#2b303c" />
      <circle cx="44" cy="3" r="1.3" fill="#2b303c" />

      {/* right flange (flush with the right edge — the exit port),
          centered on y=36 — always drawn, same reasoning */}
      <rect x="66" y="24" width="6" height="24" rx="1" fill={`url(#${hId})`} />
      <circle cx="69" cy="28" r="1.3" fill="#2b303c" />
      <circle cx="69" cy="44" r="1.3" fill="#2b303c" />
    </svg>
  )
}
