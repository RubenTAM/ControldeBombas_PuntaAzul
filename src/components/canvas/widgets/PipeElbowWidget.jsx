// 90° pipe elbow — enters from the top edge, exits from the right edge.
// Rotate it (0/90/180/270, or free with Alt) to point the bend any way.
export default function PipeElbowWidget() {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full">
      <rect x="23" y="0" width="14" height="37" fill="#98a1b5" />
      <rect x="23" y="23" width="37" height="14" fill="#98a1b5" />
      <rect x="24.5" y="0" width="3" height="34" fill="#ffffff" fillOpacity="0.35" />
      <rect x="26" y="24.5" width="34" height="3" fill="#ffffff" fillOpacity="0.35" />
    </svg>
  )
}
