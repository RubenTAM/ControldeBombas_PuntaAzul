// T-fitting, polished-metal look — a straight run left-to-right plus a
// branch down from the center, each of the 3 openings flanged. Rotates
// freely (0/90/180/270 snap, Alt for free) so the branch can point any way.
export default function PipeTeeWidget() {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="teeH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="20%" stopColor="#f2f4f8" />
          <stop offset="45%" stopColor="#aab2c2" />
          <stop offset="70%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="teeV" x1="0" y1="0" x2="1" y2="0">
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

      <rect x="4" y="24" width="56" height="16" fill="url(#teeH)" />
      <rect x="24" y="24" width="16" height="35" fill="url(#teeV)" />

      {/* left flange */}
      <rect x="0" y="21" width="5" height="22" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="2.5" cy="25" r="1.2" fill="#2b303c" />
      <circle cx="2.5" cy="39" r="1.2" fill="#2b303c" />

      {/* right flange */}
      <rect x="59" y="21" width="5" height="22" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="61.5" cy="25" r="1.2" fill="#2b303c" />
      <circle cx="61.5" cy="39" r="1.2" fill="#2b303c" />

      {/* bottom flange */}
      <rect x="21" y="59" width="22" height="5" rx="1.5" fill="url(#teeFlange)" />
      <circle cx="25" cy="61.5" r="1.2" fill="#2b303c" />
      <circle cx="39" cy="61.5" r="1.2" fill="#2b303c" />
    </svg>
  )
}
