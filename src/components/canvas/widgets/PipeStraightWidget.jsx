// Straight pipe run — polished-metal look, but built the way we learned
// the hard way this has to work: every gradient uses gradientUnits=
// "userSpaceOnUse" with the SAME absolute coordinates (0..24, the full
// design height) everywhere it's used — on the flange AND on the tube —
// instead of the SVG default (objectBoundingBox), which normalizes a
// gradient to each shape's OWN box and is what caused every "looks
// glued on" bug earlier in this build. Same absolute coordinate space
// on both shapes = they always sample identical colors at identical
// positions, however differently sized the flange and the tube are.
//
// The gradient's id is per-instance (via useId), not a hardcoded string
// — with several straight pieces chained on one canvas, a fixed id like
// "pipeMetal" would be duplicated across every one of them, and browsers
// resolve url(#id) unpredictably when the same id appears more than once
// in the document (this is exactly why the straight runs still looked
// flat while a single elbow/tee looked fine: only one of each of those
// existed, so their fixed ids never collided).
import { useId } from 'react'

export const PIPE_FILL = '#c9d0de'
export const WATER_COLOR = '#3b82f6'

// tube thickness (16) and flange span (24) out of a 24-tall design — see
// registry.js's comment on the shared pipe-fitting proportions.
const FLANGE_RATIO = 6 / 24

// Chrome-tube shading: highlight near the top, a shadow band past the
// middle, a second highlight, dark at the bottom — reused, byte-for-byte
// identical, by every pipe piece in the set.
export const MetalStops = () => (
  <>
    <stop offset="0%" stopColor="#8b93a8" />
    <stop offset="15%" stopColor="#f4f6fa" />
    <stop offset="45%" stopColor="#aab2c2" />
    <stop offset="60%" stopColor="#6c7488" />
    <stop offset="85%" stopColor="#aab2c2" />
    <stop offset="100%" stopColor="#7c8598" />
  </>
)

function Flange({ heightPx, gradId }) {
  const w = Math.max(3, Math.round(heightPx * FLANGE_RATIO))
  return (
    <svg viewBox="0 0 6 24" width={w} height={heightPx} className="shrink-0 overflow-visible">
      <defs>
        {/* matches the tube's own visible slice (y4..20), not this
            flange's full 0..24 height — with the water line (10 thick,
            centered on y12) covering most of the middle, the gradient's
            0%/100% stops need to sit right at the tube's own edges for
            the dark band to still be visible in the thin strip left
            showing above/below the water, instead of clamped-pad flat
            color spilling in from a 0..24 span that never gets there. */}
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="20">
          <MetalStops />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="6" height="24" rx="1" fill={`url(#${gradId})`} />
      <circle cx="3" cy="6" r="1.3" fill="#2b303c" />
      <circle cx="3" cy="18" r="1.3" fill="#2b303c" />
    </svg>
  )
}

export default function PipeStraightWidget({ height = 24, portsOpen = [true, true] }) {
  const [openStart, openEnd] = portsOpen
  const uid = useId()
  const gradId = `pipeMetal-${uid}`
  return (
    <div
      className="flex h-full w-full items-stretch overflow-visible"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.28))' }}
    >
      {openStart !== false && <Flange heightPx={height} gradId={gradId} />}

      {/* tube: same 16-unit diameter / 24-tall viewBox as every other pipe
          piece, stretched horizontally only. Same gradient id + "0..24"
          coordinate space as the flanges above, so they always match. */}
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-full flex-1 overflow-visible">
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="20">
            <MetalStops />
          </linearGradient>
        </defs>
        <rect x="0" y="4" width="100" height="16" fill={`url(#${gradId})`} />
        {/* animated "water" flowing through the pipe — thick (10 of the
            tube's 16-unit diameter), always animating for now while we
            dial in the look */}
        <line
          x1="0"
          y1="12"
          x2="100"
          y2="12"
          stroke={WATER_COLOR}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="20 20"
          className="animate-dashFlow"
        />
      </svg>

      {openEnd !== false && <Flange heightPx={height} gradId={gradId} />}
    </div>
  )
}
