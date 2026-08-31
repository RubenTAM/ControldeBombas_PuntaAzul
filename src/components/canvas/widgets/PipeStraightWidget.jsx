// Straight pipe run — polished-metal look (gradient banding + end flanges
// with bolts), purely visual/structural for now (no MQTT binding). Resizes
// along its own length (see registry.js resizeAxis: 'width') and rotates
// freely so it can point in any direction.
//
// Shares the same 16-unit tube diameter and 24-unit flange span as the
// elbow and tee pieces, and the viewBox height matches the widget's fixed
// rendered height exactly (24) so there is no vertical squish — this is
// what keeps every piece the same visible thickness when chained together.
export default function PipeStraightWidget() {
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="pipeBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="18%" stopColor="#f2f4f8" />
          <stop offset="42%" stopColor="#aab2c2" />
          <stop offset="58%" stopColor="#6c7488" />
          <stop offset="80%" stopColor="#aab2c2" />
          <stop offset="100%" stopColor="#7c8598" />
        </linearGradient>
        <linearGradient id="pipeFlange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c6478" />
          <stop offset="50%" stopColor="#9aa2b4" />
          <stop offset="100%" stopColor="#454c5e" />
        </linearGradient>
      </defs>

      {/* tube runs full length; flanges are drawn on top at each end so
          there is never a sub-pixel gap between tube and flange */}
      <rect x="0" y="4" width="100" height="16" fill="url(#pipeBody)" />

      {[0, 94].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width="6" height="24" rx="1.5" fill="url(#pipeFlange)" />
          <circle cx={x + 3} cy={6} r="1.3" fill="#2b303c" />
          <circle cx={x + 3} cy={18} r="1.3" fill="#2b303c" />
        </g>
      ))}
    </svg>
  )
}
