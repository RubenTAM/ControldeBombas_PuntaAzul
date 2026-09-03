// T-fitting, branch pointing down — a straight run left-to-right plus a
// branch down from the center, each of the 3 openings flanged. Same
// 16-unit tube diameter and 72x72 1:1 viewBox as the elbow, and the same
// 24-unit flange span as every other pipe piece, so it lines up cleanly
// whichever opening it's chained from. Rotates freely (0/90/180/270 snap,
// Alt for free) so the branch can point any way.
//
// All three ports (west, east, south) ALWAYS show their bolted flange —
// connected or not. A Te is a discrete fitting in real plumbing: it
// bolts onto whatever it's joined to on every side, unlike a plain
// straight run (which reads as one continuous tube where two lengths
// meet).
//
// Polished-metal shading with gradientUnits="userSpaceOnUse" and
// absolute coordinates shared by every shape on that run — the through
// tube, its two flanges, and (separately) the branch, its root collar,
// and its own flange — so nothing can drift out of sync the way an
// objectBoundingBox gradient would the moment two differently-sized
// shapes share it.
//
// The gradient ids are per-instance (via useId), not fixed strings —
// with more than one Te on the same canvas, a fixed id would be
// duplicated across every instance, and browsers resolve url(#id)
// unpredictably whenever the same id appears more than once in the
// document.
import { useId } from 'react'
import { WATER_COLOR, MetalStops } from './PipeStraightWidget'

export default function PipeTeeWidget({ telemetry, rotation = 0 }) {
  const flowing = Boolean(telemetry?.flowAnimating)
  // See PipeElbowWidget/PipeStraightWidget for the full explanation: each
  // gradient below is authored once, for rotation 0, and needs re-applying
  // that same 180° at the one point (total rotation ≥180°) where rotating
  // the piece would otherwise also flip which side of the tube its
  // gradient samples as "lit" — the pivot is this piece's own center
  // (36,36), same as the elbow's.
  const gradFlip = (((rotation % 360) + 360) % 360) >= 180
  const flipTransform = gradFlip ? 'rotate(180 36 36)' : undefined
  const uid = useId()
  const hId = `teeH-${uid}`
  const vId = `teeV-${uid}`
  return (
    <svg
      viewBox="0 0 72 72"
      className="h-full w-full overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.28))' }}
    >
      <defs>
        {/* through run + its west/east flanges (y24..48, the flanges' own span) */}
        <linearGradient id={hId} gradientUnits="userSpaceOnUse" x1="0" y1="28" x2="0" y2="44" gradientTransform={flipTransform}>
          <MetalStops />
        </linearGradient>
        {/* branch + its root collar + south flange (x24..48, their own span) */}
        <linearGradient id={vId} gradientUnits="userSpaceOnUse" x1="28" y1="0" x2="44" y2="0" gradientTransform={flipTransform}>
          <MetalStops />
        </linearGradient>
      </defs>

      {/* both tubes run full length/height under the flanges — flanges
          are drawn on top at each opening so there is never a gap */}
      <rect x="0" y="28" width="72" height="16" fill={`url(#${hId})`} />
      <rect x="28" y="39" width="16" height="33" fill={`url(#${vId})`} />

      {/* root collar — a bolted base plate right where the branch meets
          the main tube's own outer surface (y=44), same rounded-plate +
          2-bolt look as every flange, so the branch reads as a real
          joint growing out of the run. This one is permanent — it's not
          a port at all, just the neck of the fitting. */}
      <rect x="24" y="39" width="24" height="10" rx="2" fill={`url(#${vId})`} />
      <circle cx="28" cy="44" r="1.3" fill="#2b303c" />
      <circle cx="44" cy="44" r="1.3" fill="#2b303c" />

      {/* "water" — through run plus the south branch. Only drawn at all
          while flowing (no pump running = no blue, empty gray pipe). */}
      {flowing && (
        <path
          d="M0,36 L24,36 M48,36 L72,36 M36,49 L36,72"
          fill="none"
          stroke={WATER_COLOR}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="20 20"
          className="animate-dashFlow"
        />
      )}

      {/* west flange (flush with left edge) — always drawn */}
      <rect x="0" y="24" width="6" height="24" rx="1" fill={`url(#${hId})`} />
      <circle cx="3" cy="28" r="1.3" fill="#2b303c" />
      <circle cx="3" cy="44" r="1.3" fill="#2b303c" />

      {/* east flange (flush with right edge) — always drawn */}
      <rect x="66" y="24" width="6" height="24" rx="1" fill={`url(#${hId})`} />
      <circle cx="69" cy="28" r="1.3" fill="#2b303c" />
      <circle cx="69" cy="44" r="1.3" fill="#2b303c" />

      {/* south flange (flush with bottom edge) — always drawn */}
      <rect x="24" y="66" width="24" height="6" rx="1" fill={`url(#${vId})`} />
      <circle cx="28" cy="69" r="1.3" fill="#2b303c" />
      <circle cx="44" cy="69" r="1.3" fill="#2b303c" />
    </svg>
  )
}
