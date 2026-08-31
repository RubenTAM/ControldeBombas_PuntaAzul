// T-fitting, polished-metal look — a straight run left-to-right plus a
// branch down from the center, each of the 3 openings flanged. Same
// 16-unit tube diameter and 72x72 1:1 viewBox as the elbow, and the same
// 24-unit flange span as every other pipe piece, so it lines up cleanly
// whichever opening it's chained from. Rotates freely (0/90/180/270 snap,
// Alt for free) so the branch can point any way.
export default function PipeTeeWidget() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="teeBodyH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="20%" stopColor="#f2f4f8" />
          <stop offset="45%" stopColor="#aab2c2" />
          <stop offset="70%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="teeBodyV" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="20%" stopColor="#f2f4f8" />
          <stop offset="45%" stopColor="#aab2c2" />
          <stop offset="70%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="teeFlange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c6478" />
          <stop offset="50%" stopColor="#9aa2b4" />
          <stop offset="100%" stopColor="#454c5e" />
        </linearGradient>
      </defs>

      {/* both tubes run full length/height under the flanges — flanges
          are drawn on top at each opening so there is never a gap */}
      <rect x="0" y="28" width="72" height="16" fill="url(#teeBodyH)" />
      <rect x="28" y="36" width="16" height="36" fill="url(#teeBodyV)" />

      {/* west flange (flush with left edge) */}
      <rect x="0" y="24" width="6" height="24" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="3" cy="28" r="1.3" fill="#2b303c" />
      <circle cx="3" cy="44" r="1.3" fill="#2b303c" />

      {/* east flange (flush with right edge) */}
      <rect x="66" y="24" width="6" height="24" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="69" cy="28" r="1.3" fill="#2b303c" />
      <circle cx="69" cy="44" r="1.3" fill="#2b303c" />

      {/* south flange (flush with bottom edge) */}
      <rect x="24" y="66" width="24" height="6" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="28" cy="69" r="1.3" fill="#2b303c" />
      <circle cx="44" cy="69" r="1.3" fill="#2b303c" />
    </svg>
  )
}
