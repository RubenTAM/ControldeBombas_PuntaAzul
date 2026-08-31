// Straight pipe run — polished-metal look. The two end flanges are drawn
// in their own small fixed-pixel-width SVGs (flex layout, not stretched),
// and only the middle tube segment grows to fill the rest — so making the
// pipe longer stretches nothing but empty tube (whose banding is uniform
// along its length anyway) and the flanges always stay the same crisp
// bolted end-cap, never ballooning out as the piece gets longer.
const flangeGradient = (
  <linearGradient id="pipeFlange" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stopColor="#5c6478" />
    <stop offset="50%" stopColor="#9aa2b4" />
    <stop offset="100%" stopColor="#454c5e" />
  </linearGradient>
)

function Flange() {
  return (
    <svg viewBox="0 0 6 24" className="h-full w-[6px] shrink-0 overflow-visible">
      <defs>{flangeGradient}</defs>
      <rect x="0" y="0" width="6" height="24" rx="1.5" fill="url(#pipeFlange)" />
      <circle cx="3" cy="6" r="1.3" fill="#2b303c" />
      <circle cx="3" cy="18" r="1.3" fill="#2b303c" />
    </svg>
  )
}

export default function PipeStraightWidget() {
  return (
    <div className="flex h-full w-full items-stretch overflow-visible">
      <Flange />

      {/* tube: same 16-unit diameter / 24-tall viewBox as every other pipe
          piece, stretched horizontally only — the vertical banding never
          varies along x, so any length reads as one continuous tube */}
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-full flex-1 overflow-visible">
        <defs>
          <linearGradient id="pipeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c8598" />
            <stop offset="18%" stopColor="#f2f4f8" />
            <stop offset="42%" stopColor="#aab2c2" />
            <stop offset="58%" stopColor="#6c7488" />
            <stop offset="80%" stopColor="#aab2c2" />
            <stop offset="100%" stopColor="#7c8598" />
          </linearGradient>
        </defs>
        <rect x="0" y="4" width="100" height="16" fill="url(#pipeBody)" />
      </svg>

      <Flange />
    </div>
  )
}
