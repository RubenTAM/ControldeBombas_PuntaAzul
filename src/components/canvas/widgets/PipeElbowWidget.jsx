// 90° pipe elbow, polished-metal look — a genuine smooth curve (a single
// stroked arc as the centerline, not two overlapping rectangles), entering
// from the top edge and exiting from the right edge, each opening capped
// with a flange + bolts.
//
// Same 16-unit tube diameter as the straight and tee pieces (stroke-width
// 16 on a 72x72, 1:1-scaled viewBox — no vertical squish here either,
// since this widget never resizes off-square) so every piece reads as the
// same pipe when chained together. Rotate it (0/90/180/270, or free with
// Alt) to point the bend any way.
export default function PipeElbowWidget() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="elbowBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="25%" stopColor="#f2f4f8" />
          <stop offset="50%" stopColor="#aab2c2" />
          <stop offset="75%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="elbowFlange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c6478" />
          <stop offset="50%" stopColor="#9aa2b4" />
          <stop offset="100%" stopColor="#454c5e" />
        </linearGradient>
      </defs>

      {/* single smooth quarter-bend centerline, stroked to the same 16px
          tube diameter as every other pipe piece */}
      <path
        d="M28 0 L28 24 A24 24 0 0 0 52 48 L72 48"
        fill="none"
        stroke="url(#elbowBody)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* top flange (flush with the top edge — this is where the entry
          port sits) */}
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
