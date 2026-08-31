// Straight pipe run — polished-metal look (gradient banding + end flanges
// with bolts), purely visual/structural for now (no MQTT binding). Resizes
// along its own length (see registry.js resizeAxis: 'width') and rotates
// freely so it can point in any direction.
export default function PipeStraightWidget() {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
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

      <rect x="9" y="5" width="182" height="30" rx="5" fill="url(#pipeBody)" />

      {[9, 191].map((cx) => (
        <g key={cx}>
          <rect x={cx - 4.5} y={0} width="9" height="40" rx="2" fill="url(#pipeFlange)" />
          <circle cx={cx} cy={9} r="1.4" fill="#2b303c" />
          <circle cx={cx} cy={31} r="1.4" fill="#2b303c" />
        </g>
      ))}
    </svg>
  )
}
