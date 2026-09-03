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
const METAL_STOPS = [
  ['0%', '#8b93a8'],
  ['15%', '#f4f6fa'],
  ['45%', '#aab2c2'],
  ['60%', '#6c7488'],
  ['85%', '#aab2c2'],
  ['100%', '#7c8598'],
]

export const MetalStops = ({ reversed = false }) => {
  const colors = METAL_STOPS.map(([, color]) => color)
  if (reversed) colors.reverse()
  return METAL_STOPS.map(([offset], index) => <stop key={offset} offset={offset} stopColor={colors[index]} />)
}

function Flange({ heightPx, widthPx, gradId, shadeFlipped }) {
  return (
    <svg viewBox="0 0 6 24" width={widthPx} height={heightPx} className="min-w-0 shrink-0 overflow-hidden">
      <defs>
        {/* matches the tube's own visible slice (y4..20), not this
            flange's full 0..24 height — with the water line (10 thick,
            centered on y12) covering most of the middle, the gradient's
            0%/100% stops need to sit right at the tube's own edges for
            the dark band to still be visible in the thin strip left
            showing above/below the water, instead of clamped-pad flat
            color spilling in from a 0..24 span that never gets there. */}
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="20">
          <MetalStops reversed={shadeFlipped} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="6" height="24" rx="1" fill={`url(#${gradId})`} />
      <circle cx="3" cy="6" r="1.3" fill="#2b303c" />
      <circle cx="3" cy="18" r="1.3" fill="#2b303c" />
    </svg>
  )
}

export default function PipeStraightWidget({ width = 140, height = 24, portsOpen = [true, true], telemetry, shadeFlip }) {
  const [openStart, openEnd] = portsOpen
  const flowing = Boolean(telemetry?.flowAnimating)
  const shadeFlipped = Boolean(shadeFlip?.flipped)
  // The whole widget rotates in WidgetShell. shadeSync may reverse this
  // complete stop sequence so a run assembled from either direction still
  // presents the same colors at every connected seam.
  const uid = useId()
  const gradId = `pipeMetal-${uid}`
  const visibleFlanges = Number(openStart !== false) + Number(openEnd !== false)
  const naturalFlangeWidth = Math.max(3, Math.round(height * FLANGE_RATIO))
  const flangeWidth = visibleFlanges > 0 ? Math.min(naturalFlangeWidth, width / visibleFlanges) : 0
  return (
    <div
      className="flex h-full w-full items-stretch overflow-hidden"
      style={{ filter: 'drop-shadow(0 1.5px 2px rgba(11,18,32,0.28))' }}
    >
      {openStart !== false && <Flange heightPx={height} widthPx={flangeWidth} gradId={gradId} shadeFlipped={shadeFlipped} />}

      {/* tube: same 16-unit diameter / 24-tall viewBox as every other pipe
          piece, stretched horizontally only. Same gradient id + "0..24"
          coordinate space as the flanges above, so they always match. */}
      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="h-full w-0 min-w-0 flex-1 overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="20">
          <MetalStops reversed={shadeFlipped} />
          </linearGradient>
        </defs>
        <rect x="0" y="4" width="100" height="16" fill={`url(#${gradId})`} />
        {/* "water" through the pipe — only DRAWN AT ALL while flowing is
            true (simulation toggle on AND a pump actually running); with
            no pump running the pipe shows empty/gray metal, no blue, not
            just a still blue line (a still line still read as "there's
            water in here" when there wasn't) */}
        {flowing && (
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
        )}
      </svg>

      {openEnd !== false && <Flange heightPx={height} widthPx={flangeWidth} gradId={gradId} shadeFlipped={shadeFlipped} />}
    </div>
  )
}
