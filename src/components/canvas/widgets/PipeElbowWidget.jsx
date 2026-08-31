// 90° pipe elbow, polished-metal look — a genuine smooth curve, built from
// three pieces that tile together exactly: a short straight vertical stub,
// a curved bend, and a short straight horizontal stub, each capped with a
// flange + bolts at the two open ends.
//
// The straight stubs use the same banded-gradient look as the straight
// pipe piece — bands running perpendicular to flow (horizontal bands for
// the vertical stub, vertical bands for the horizontal stub). The curved
// bend uses a *radial* gradient centered on the arc's own center with the
// identical color sequence remapped onto its ring, so as the band sweeps
// around the corner it reads as the same wrapped chrome tube, instead of
// one flat gradient smeared diagonally across the curve.
//
// Same 16-unit tube diameter and 72x72 1:1-scaled viewBox as the straight
// and tee pieces, so it lines up with them exactly when chained.
export default function PipeElbowWidget() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full overflow-visible">
      <defs>
        {/* horizontal bands, for the vertical (top) stub */}
        <linearGradient id="elbowStubV" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="18%" stopColor="#f2f4f8" />
          <stop offset="42%" stopColor="#aab2c2" />
          <stop offset="58%" stopColor="#6c7488" />
          <stop offset="80%" stopColor="#aab2c2" />
          <stop offset="100%" stopColor="#7c8598" />
        </linearGradient>
        {/* vertical bands, for the horizontal (right) stub */}
        <linearGradient id="elbowStubH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="18%" stopColor="#f2f4f8" />
          <stop offset="42%" stopColor="#aab2c2" />
          <stop offset="58%" stopColor="#6c7488" />
          <stop offset="80%" stopColor="#aab2c2" />
          <stop offset="100%" stopColor="#7c8598" />
        </linearGradient>
        {/* same stop sequence, remapped onto r=16..32 (offset 0.5..1) so
            the ring only carries banding across the tube's own thickness,
            centered on the bend's arc center (52,24) */}
        <radialGradient id="elbowRing" gradientUnits="userSpaceOnUse" cx="52" cy="24" r="32">
          <stop offset="50%" stopColor="#7c8598" />
          <stop offset="59%" stopColor="#f2f4f8" />
          <stop offset="71%" stopColor="#aab2c2" />
          <stop offset="79%" stopColor="#6c7488" />
          <stop offset="90%" stopColor="#aab2c2" />
          <stop offset="100%" stopColor="#7c8598" />
        </radialGradient>
        <linearGradient id="elbowFlange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c6478" />
          <stop offset="50%" stopColor="#9aa2b4" />
          <stop offset="100%" stopColor="#454c5e" />
        </linearGradient>
      </defs>

      {/* vertical entry stub: (20,0) to (36,24) */}
      <rect x="20" y="0" width="16" height="24" fill="url(#elbowStubV)" />

      {/* the bend itself: a ring segment from angle 180° to 90° around
          center (52,24), radius 24, thickness 16 (r 16..32) — tangent
          exactly where the two straight stubs end, no gap or overlap */}
      <path d="M20,24 A32,32 0 0 0 52,56 L52,40 A16,16 0 0 1 36,24 Z" fill="url(#elbowRing)" />

      {/* horizontal exit stub: (52,40) to (72,56) */}
      <rect x="52" y="40" width="20" height="16" fill="url(#elbowStubH)" />

      {/* top flange (flush with the top edge — the entry port) */}
      <rect x="16" y="0" width="24" height="6" rx="1.5" fill="url(#elbowFlange)" />
      <circle cx="20" cy="3" r="1.3" fill="#2b303c" />
      <circle cx="32" cy="3" r="1.3" fill="#2b303c" />

      {/* right flange (flush with the right edge — the exit port) */}
      <rect x="66" y="36" width="6" height="24" rx="1.5" fill="url(#elbowFlange)" />
      <circle cx="69" cy="40" r="1.3" fill="#2b303c" />
      <circle cx="69" cy="52" r="1.3" fill="#2b303c" />
    </svg>
  )
}
