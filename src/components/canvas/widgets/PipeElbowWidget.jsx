// 90° pipe elbow, polished-metal look — enters from the top edge, exits
// from the right edge, each opening capped with a flange + bolts. Rotate
// it (0/90/180/270, or free with Alt) to point the bend any way.
export default function PipeElbowWidget() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="elbowV" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="20%" stopColor="#f2f4f8" />
          <stop offset="45%" stopColor="#aab2c2" />
          <stop offset="70%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="elbowH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c8598" />
          <stop offset="20%" stopColor="#f2f4f8" />
          <stop offset="45%" stopColor="#aab2c2" />
          <stop offset="70%" stopColor="#6c7488" />
          <stop offset="100%" stopColor="#8b93a6" />
        </linearGradient>
        <linearGradient id="elbowFlange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5c6478" />
          <stop offset="50%" stopColor="#9aa2b4" />
          <stop offset="100%" stopColor="#454c5e" />
        </linearGradient>
      </defs>

      <rect x="20" y="5" width="16" height="31" fill="url(#elbowV)" />
      <rect x="20" y="20" width="35" height="16" fill="url(#elbowH)" />

      {/* top flange */}
      <rect x="17" y="0" width="22" height="5" rx="1.5" fill="url(#elbowFlange)" />
      <circle cx="21" cy="2.5" r="1.2" fill="#2b303c" />
      <circle cx="35" cy="2.5" r="1.2" fill="#2b303c" />

      {/* right flange */}
      <rect x="55" y="17" width="5" height="22" rx="1.5" fill="url(#elbowFlange)" />
      <circle cx="57.5" cy="21" r="1.2" fill="#2b303c" />
      <circle cx="57.5" cy="35" r="1.2" fill="#2b303c" />
    </svg>
  )
}
